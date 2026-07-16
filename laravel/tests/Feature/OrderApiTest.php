<?php

namespace Tests\Feature;

use App\Models\Order\Repository\OrderRepositoryInterface;
use App\Models\Product\Product;
use App\Models\User\User;
use App\Models\Variety\Variety;
use Database\Seeders\Master\GradeSeeder;
use Database\Seeders\Master\ProductSeeder;
use Database\Seeders\Master\ShipmentTypeSeeder;
use Database\Seeders\Master\VarietySeeder;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\UsesMysqlTestDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use UsesMysqlTestDatabase;

    private int $productId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed([
            VarietySeeder::class,
            ProductSeeder::class,
            GradeSeeder::class,
            ShipmentTypeSeeder::class,
        ]);

        $this->productId = Product::query()
            ->where('sku', 'PEAR-KOSUI-3KL')
            ->valueOrFail('id');
    }

    public function test_authenticated_user_can_access_primary_get_endpoints(): void
    {
        Sanctum::actingAs(new User);

        $variety = Variety::create([
            'name' => 'Feature Test Variety',
            'display_order' => 999,
        ]);

        $endpoints = [
            '/api/order?target_date=2026-07-05',
            '/api/prep-board?target_date=2026-07-05',
            '/api/variety_option',
            '/api/product_option',
            '/api/grade_option',
            '/api/shipment-record?year=2026',
            sprintf(
                '/api/shipment-record/ja?variety_id=%d&start_date=2026-07-01&end_date=2026-07-31',
                $variety->id,
            ),
        ];

        foreach ($endpoints as $endpoint) {
            $this->getJson($endpoint)->assertOk();
        }
    }

    public function test_register_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(OrderRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('createOrder')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(OrderRepositoryInterface::class, $repository);

        $response = $this->postJson('/api/order', $this->validOrderPayload())
            ->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '注文の登録に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_update_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(OrderRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('updateOrder')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(OrderRepositoryInterface::class, $repository);

        $response = $this->putJson('/api/order/999', [
            ...$this->validOrderPayload(),
            'status' => 1,
        ])->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => '注文の更新に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_status_update_unexpected_error_returns_generic_500(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(OrderRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('updateOrderStatus')
            ->willThrowException(new \RuntimeException('SQLSTATE secret detail'));
        $this->app->instance(OrderRepositoryInterface::class, $repository);

        $response = $this->patchJson('/api/order/999/status', ['status' => 2])
            ->assertStatus(500)
            ->assertJson([
                'success' => false,
                'message' => 'ステータスの更新に失敗しました。',
            ]);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
    }

    public function test_update_not_found_preserves_business_failure_contract(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(OrderRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('updateOrder')
            ->willThrowException(new ModelNotFoundException);
        $this->app->instance(OrderRepositoryInterface::class, $repository);

        $this->putJson('/api/order/999', [
            ...$this->validOrderPayload(),
            'status' => 1,
        ])->assertOk()
            ->assertJson([
                'success' => false,
                'message' => '指定された注文が見つかりません。',
            ]);
    }

    public function test_status_update_not_found_preserves_business_failure_contract(): void
    {
        $this->actingAsUser();

        $repository = $this->createMock(OrderRepositoryInterface::class);
        $repository->expects($this->once())
            ->method('updateOrderStatus')
            ->willThrowException(new ModelNotFoundException);
        $this->app->instance(OrderRepositoryInterface::class, $repository);

        $this->patchJson('/api/order/999/status', ['status' => 2])
            ->assertOk()
            ->assertJson([
                'success' => false,
                'message' => '指定された注文が見つかりません。',
            ]);
    }

    private function actingAsUser(): void
    {
        Sanctum::actingAs(new User);
    }

    /**
     * @return array<string, mixed>
     */
    private function validOrderPayload(): array
    {
        return [
            'customer_name' => 'Feature Test Customer',
            'items' => [[
                'variety_id' => 1,
                'items' => [[
                    'product_id' => $this->productId,
                    'quantity' => 1,
                ]],
            ]],
        ];
    }
}
