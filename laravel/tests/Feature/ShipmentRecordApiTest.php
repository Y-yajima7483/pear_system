<?php

namespace Tests\Feature;

use App\Enums\ShipmentTypeEnum;
use App\Models\Product\Product;
use App\Models\ShipmentRecord\Repository\ShipmentRecordRepositoryInterface;
use App\Models\ShipmentRecord\ShipmentRecord;
use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use App\Models\User\User;
use Database\Seeders\Master\GradeSeeder;
use Database\Seeders\Master\ProductSeeder;
use Database\Seeders\Master\ShipmentTypeSeeder;
use Database\Seeders\Master\VarietySeeder;
use Database\Seeders\ShipmentRecordSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\UsesMysqlTestDatabase;
use Tests\Support\TestingEnvironment;
use Tests\TestCase;

class ShipmentRecordApiTest extends TestCase
{
    use UsesMysqlTestDatabase;

    private const DATE = '2026-07-01';

    private const GRADE_SHU = 1;

    private const GRADE_YU = 2;

    private const GRADE_KIKAKUGAI_SALES = 4;

    private const GRADE_KIKAKUGAI_NON_SALES = 5;

    private const GRADE_LOSS = 6;

    private int $kosui3kgProductId;

    private int $kosui5kgProductId;

    private int $kosuiWakeariProductId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            VarietySeeder::class,
            ProductSeeder::class,
            GradeSeeder::class,
            ShipmentTypeSeeder::class,
        ]);

        $this->kosui3kgProductId = Product::query()
            ->where('sku', 'PEAR-KOSUI-3KL')
            ->valueOrFail('id');
        $this->kosui5kgProductId = Product::query()
            ->where('sku', 'PEAR-KOSUI-5KL')
            ->valueOrFail('id');
        $this->kosuiWakeariProductId = Product::query()
            ->where('sku', 'PEAR-KOSUI-WBAG')
            ->valueOrFail('id');
    }

    public function test_fresh_schema_keeps_legacy_columns(): void
    {
        $this->assertEmpty(config('database.connections.mysql.url'));
        $this->assertSame(
            TestingEnvironment::DATABASE,
            DB::connection()->getDatabaseName()
        );
        $this->assertTrue(Schema::hasColumn('products', 'price'));
        $this->assertTrue(Schema::hasColumn('shipment_records', 'total_quantity'));
    }

    public function test_shipment_record_seeder_keeps_grade_five_in_ja_scope(): void
    {
        $this->seed(ShipmentRecordSeeder::class);

        $this->assertDatabaseMissing('shipment_record_details', [
            'shipment_type_id' => ShipmentTypeEnum::Direct->value,
            'grade_id' => self::GRADE_KIKAKUGAI_NON_SALES,
        ]);
        $this->assertDatabaseHas('shipment_record_details', [
            'shipment_type_id' => ShipmentTypeEnum::JA->value,
            'grade_id' => self::GRADE_KIKAKUGAI_NON_SALES,
        ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/shipment-record?year=2026')->assertUnauthorized();
        $this->putJson('/api/shipment-record/direct-sale', [])->assertUnauthorized();
        $this->deleteJson('/api/shipment-record/daily/2026-07-01/1')->assertUnauthorized();
    }

    public function test_direct_sale_upsert_combines_product_and_manual_quantities(): void
    {
        $this->actingAsUser();

        $response = $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'notes' => 'テスト登録',
            'direct_sale_items' => [
                ['product_id' => $this->kosui5kgProductId, 'fruit_quantity' => 10, 'box_quantity' => 2],
                ['product_id' => $this->kosui5kgProductId, 'fruit_quantity' => 8, 'box_quantity' => 3],
                ['product_id' => $this->kosuiWakeariProductId, 'fruit_quantity' => 6, 'box_quantity' => 5],
            ],
            'manual_grade_entries' => [
                ['variety_id' => 1, 'grade_id' => self::GRADE_SHU, 'quantity' => 4],
                ['variety_id' => 1, 'grade_id' => self::GRADE_YU, 'quantity' => 7],
                ['variety_id' => 1, 'grade_id' => self::GRADE_LOSS, 'quantity' => 1],
            ],
        ]);

        $response->assertOk()->assertJson(['success' => true]);

        $record = ShipmentRecord::query()->where('record_date', self::DATE)->firstOrFail();
        $details = $record->details()->with('directSaleProducts')->get();

        $this->assertCount(4, $details);
        $this->assertSame(22, $record->total_quantity);

        $shuDetail = $details->firstWhere('grade_id', self::GRADE_SHU);
        $this->assertNotNull($shuDetail);
        $this->assertSame(9, $shuDetail->quantity);
        $this->assertSame(5, $shuDetail->directSaleProducts->sum('box_quantity'));
        $this->assertCount(2, $shuDetail->directSaleProducts);

        $yuDetail = $details->firstWhere('grade_id', self::GRADE_YU);
        $this->assertNotNull($yuDetail);
        $this->assertSame(7, $yuDetail->quantity);
        $this->assertCount(0, $yuDetail->directSaleProducts);

        $wakeariDetail = $details->firstWhere('grade_id', self::GRADE_KIKAKUGAI_SALES);
        $this->assertNotNull($wakeariDetail);
        $this->assertSame(5, $wakeariDetail->quantity);
    }

    public function test_daily_show_round_trips_product_and_manual_quantities(): void
    {
        $this->actingAsUser();

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [
                ['product_id' => $this->kosui3kgProductId, 'fruit_quantity' => 6, 'box_quantity' => 4],
            ],
            'manual_grade_entries' => [
                ['variety_id' => 1, 'grade_id' => self::GRADE_SHU, 'quantity' => 3],
                ['variety_id' => 2, 'grade_id' => self::GRADE_YU, 'quantity' => 8],
            ],
        ])->assertOk();

        $response = $this->getJson('/api/shipment-record/daily/'.self::DATE)
            ->assertOk()
            ->assertJson(['success' => true]);

        $directShipment = collect($response->json('record.shipments'))
            ->firstWhere('shipment_type_id', ShipmentTypeEnum::Direct->value);
        $this->assertNotNull($directShipment);

        $shuDetail = collect($directShipment['details'])
            ->first(fn (array $detail): bool => $detail['variety_id'] === 1 && $detail['grade_id'] === self::GRADE_SHU);
        $this->assertSame(7, $shuDetail['quantity']);
        $this->assertSame(4, $shuDetail['product_quantity']);
        $this->assertSame(3, $shuDetail['manual_quantity']);

        $manualOnlyDetail = collect($directShipment['details'])
            ->first(fn (array $detail): bool => $detail['variety_id'] === 2 && $detail['grade_id'] === self::GRADE_YU);
        $this->assertSame(8, $manualOnlyDetail['quantity']);
        $this->assertSame(0, $manualOnlyDetail['product_quantity']);
        $this->assertSame(8, $manualOnlyDetail['manual_quantity']);
        $this->assertSame([], $manualOnlyDetail['products']);
    }

    public function test_direct_sale_replacement_preserves_ja_and_notes_semantics(): void
    {
        $this->actingAsUser();

        $record = ShipmentRecord::create([
            'record_date' => self::DATE,
            'total_quantity' => 50,
            'notes' => 'JA共有メモ',
        ]);
        ShipmentRecordDetail::create([
            'shipment_record_id' => $record->id,
            'variety_id' => 1,
            'shipment_type_id' => ShipmentTypeEnum::JA->value,
            'grade_id' => self::GRADE_SHU,
            'quantity' => 50,
        ]);

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [],
            'manual_grade_entries' => [
                ['variety_id' => 1, 'grade_id' => self::GRADE_YU, 'quantity' => 9],
            ],
        ])->assertOk()->assertJson(['success' => true]);

        $this->assertSame('JA共有メモ', $record->fresh()->notes);

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [
                ['product_id' => $this->kosui3kgProductId, 'fruit_quantity' => 6, 'box_quantity' => 2],
            ],
            'manual_grade_entries' => [],
        ])->assertOk()->assertJson(['success' => true]);

        $details = $record->fresh()->details()->get();
        $this->assertCount(1, $details->where('shipment_type_id', ShipmentTypeEnum::Direct->value));
        $this->assertCount(1, $details->where('shipment_type_id', ShipmentTypeEnum::JA->value));
        $this->assertSame(50, $details->firstWhere('shipment_type_id', ShipmentTypeEnum::JA->value)->quantity);
        $this->assertSame('JA共有メモ', $record->fresh()->notes);
        $this->assertSame(52, $record->fresh()->total_quantity);

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'notes' => null,
            'direct_sale_items' => [
                ['product_id' => $this->kosui3kgProductId, 'fruit_quantity' => 6, 'box_quantity' => 2],
            ],
            'manual_grade_entries' => [],
        ])->assertOk();

        $this->assertNull($record->fresh()->notes);
    }

    public function test_direct_sale_requires_a_positive_quantity_and_rejects_ja_only_grade(): void
    {
        $this->actingAsUser();

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [],
            'manual_grade_entries' => [],
        ])->assertUnprocessable()
            ->assertJsonPath(
                'errors.direct_sale_items.0',
                '商品明細または商品外数量を1件以上入力してください。'
            );

        $response = $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [],
            'manual_grade_entries' => [
                ['variety_id' => 1, 'grade_id' => self::GRADE_KIKAKUGAI_NON_SALES, 'quantity' => 2],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['manual_grade_entries.0.grade_id']);

        $this->assertSame(
            '選択された等級は直売では使用できません。',
            $response->json('errors')['manual_grade_entries.0.grade_id'][0]
        );

        $this->assertDatabaseMissing('shipment_records', ['record_date' => self::DATE]);
    }

    public function test_ja_scope_accepts_grade_five_rejects_direct_only_grade_and_get_has_success_flag(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [[
                    'grade_id' => self::GRADE_KIKAKUGAI_NON_SALES,
                    'quantity' => 4,
                ]],
            ]],
        ])->assertOk()->assertJson(['success' => true]);

        $response = $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [[
                    'grade_id' => self::GRADE_LOSS,
                    'quantity' => 2,
                ]],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['entries.0.grades.0.grade_id']);

        $this->assertSame(
            '選択された等級はJA出荷では使用できません。',
            $response->json('errors')['entries.0.grades.0.grade_id'][0]
        );

        $response = $this->getJson(
            '/api/shipment-record/ja?variety_id=1&start_date=2026-07-01&end_date=2026-07-31'
        )->assertOk()->assertJson(['success' => true]);

        $gradeIds = collect($response->json('grades'))->pluck('id');
        $this->assertTrue($gradeIds->contains(self::GRADE_KIKAKUGAI_NON_SALES));
        $this->assertFalse($gradeIds->contains(self::GRADE_KIKAKUGAI_SALES));
        $this->assertFalse($gradeIds->contains(self::GRADE_LOSS));
    }

    public function test_ja_rejects_duplicate_record_dates(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [
                [
                    'record_date' => self::DATE,
                    'grades' => [['grade_id' => self::GRADE_SHU, 'quantity' => 1]],
                ],
                [
                    'record_date' => self::DATE,
                    'grades' => [['grade_id' => self::GRADE_YU, 'quantity' => 2]],
                ],
            ],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['entries.0.record_date', 'entries.1.record_date']);

        $messages = collect($response->json('errors'))->flatten();
        $this->assertTrue($messages->contains('同じ記録日を重複して送信することはできません。'));
    }

    public function test_ja_rejects_non_array_entries_with_422(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => 'invalid',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['entries']);
    }

    public function test_ja_rejects_non_array_entry_with_422(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => ['invalid'],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'entries.0.record_date',
                'entries.0.grades',
            ]);
    }

    public function test_ja_rejects_array_grade_id_with_422(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [[
                    'grade_id' => [self::GRADE_SHU],
                    'quantity' => 1,
                ]],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['entries.0.grades.0.grade_id']);
    }

    public function test_ja_rejects_duplicate_grade_within_one_date(): void
    {
        $this->actingAsUser();

        $response = $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [
                    ['grade_id' => self::GRADE_SHU, 'quantity' => 1],
                    ['grade_id' => self::GRADE_SHU, 'quantity' => 2],
                ],
            ]],
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['entries.0.grades.1.grade_id']);

        $this->assertSame(
            '同じ記録日の等級を重複して送信することはできません。',
            $response->json('errors')['entries.0.grades.1.grade_id'][0]
        );
    }

    public function test_ja_allows_same_grade_on_different_dates(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [
                [
                    'record_date' => '2026-07-01',
                    'grades' => [['grade_id' => self::GRADE_SHU, 'quantity' => 1]],
                ],
                [
                    'record_date' => '2026-07-02',
                    'grades' => [['grade_id' => self::GRADE_SHU, 'quantity' => 2]],
                ],
            ],
        ])->assertOk()->assertJson(['success' => true]);

        $this->assertDatabaseHas('shipment_record_details', [
            'grade_id' => self::GRADE_SHU,
            'quantity' => 1,
        ]);
        $this->assertDatabaseHas('shipment_record_details', [
            'grade_id' => self::GRADE_SHU,
            'quantity' => 2,
        ]);
    }

    public function test_ja_upsert_clears_grade_when_quantity_becomes_zero(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [
                    ['grade_id' => self::GRADE_SHU, 'quantity' => 50],
                    ['grade_id' => self::GRADE_YU, 'quantity' => 30],
                ],
            ]],
        ])->assertOk();

        $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [
                    ['grade_id' => self::GRADE_SHU, 'quantity' => 40],
                    ['grade_id' => self::GRADE_YU, 'quantity' => 0],
                ],
            ]],
        ])->assertOk();

        $record = ShipmentRecord::query()->where('record_date', self::DATE)->firstOrFail();
        $this->assertCount(1, $record->details);
        $this->assertSame(self::GRADE_SHU, $record->details->first()->grade_id);
        $this->assertSame(40, $record->details->first()->quantity);
        $this->assertSame(40, $record->total_quantity);
    }

    public function test_direct_sale_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('upsertDirectSale')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [
                ['product_id' => $this->kosui3kgProductId, 'fruit_quantity' => 6, 'box_quantity' => 1],
            ],
            'manual_grade_entries' => [],
        ])->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '直売出荷記録の保存に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_ja_get_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('getJaShipmentData')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->getJson(
            '/api/shipment-record/ja?variety_id=1&start_date=2026-07-01&end_date=2026-07-31'
        )->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'JA出荷データの取得に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_ja_post_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('upsertJaShipment')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->postJson('/api/shipment-record/ja', [
            'variety_id' => 1,
            'entries' => [[
                'record_date' => self::DATE,
                'grades' => [[
                    'grade_id' => self::GRADE_SHU,
                    'quantity' => 3,
                ]],
            ]],
        ])->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'JA出荷記録の登録に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_daily_missing_record_remains_business_failure_with_http_200(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/shipment-record/daily/'.self::DATE)
            ->assertOk()
            ->assertJson([
                'success' => false,
                'message' => '指定日の出荷記録が見つかりません。',
            ]);
    }

    public function test_delete_missing_record_remains_business_failure_with_http_200(): void
    {
        $this->actingAsUser();

        $this->deleteJson(
            '/api/shipment-record/daily/'.self::DATE.'/'.ShipmentTypeEnum::Direct->value
        )->assertOk()
            ->assertJson([
                'success' => false,
                'message' => '削除対象の出荷記録が見つかりません。',
            ]);
    }

    public function test_daily_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('findDaily')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->getJson('/api/shipment-record/daily/'.self::DATE)
            ->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '出荷記録詳細の取得に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_delete_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('deleteByType')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->deleteJson(
            '/api/shipment-record/daily/'.self::DATE.'/'.ShipmentTypeEnum::Direct->value
        )->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '出荷記録の削除に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_summary_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(ShipmentRecordRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('getSummary')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(ShipmentRecordRepositoryInterface::class, $repository);

        $response = $this->getJson('/api/shipment-record/summary?year=2026')
            ->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '出荷サマリーの取得に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_delete_by_type_updates_total_and_removes_header_when_empty(): void
    {
        $this->actingAsUser();

        $record = ShipmentRecord::create([
            'record_date' => self::DATE,
            'total_quantity' => 20,
        ]);
        foreach ([ShipmentTypeEnum::Direct, ShipmentTypeEnum::JA] as $type) {
            ShipmentRecordDetail::create([
                'shipment_record_id' => $record->id,
                'variety_id' => 1,
                'shipment_type_id' => $type->value,
                'grade_id' => self::GRADE_SHU,
                'quantity' => 10,
            ]);
        }

        $this->deleteJson('/api/shipment-record/daily/'.self::DATE.'/'.ShipmentTypeEnum::Direct->value)
            ->assertOk()
            ->assertJson(['success' => true, 'record_deleted' => false]);

        $this->assertSame(10, $record->fresh()->total_quantity);

        $this->deleteJson('/api/shipment-record/daily/'.self::DATE.'/'.ShipmentTypeEnum::JA->value)
            ->assertOk()
            ->assertJson(['success' => true, 'record_deleted' => true]);

        $this->assertDatabaseMissing('shipment_records', ['record_date' => self::DATE]);
    }

    public function test_summary_calculates_loss_rate_from_manual_non_sales_quantity(): void
    {
        $this->actingAsUser();

        $this->putJson('/api/shipment-record/direct-sale', [
            'record_date' => self::DATE,
            'direct_sale_items' => [
                ['product_id' => $this->kosui3kgProductId, 'fruit_quantity' => 6, 'box_quantity' => 8],
            ],
            'manual_grade_entries' => [
                ['variety_id' => 1, 'grade_id' => self::GRADE_LOSS, 'quantity' => 2],
            ],
        ])->assertOk();

        $this->getJson('/api/shipment-record/summary?year=2026')
            ->assertOk()
            ->assertJsonPath('summary.total_quantity', 10)
            ->assertJsonPath('summary.non_sales_quantity', 2)
            ->assertJsonPath('summary.loss_rate', 0.2);
    }

    private function actingAsUser(): void
    {
        Sanctum::actingAs(new User);
    }
}
