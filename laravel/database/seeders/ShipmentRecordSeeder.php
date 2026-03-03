<?php

namespace Database\Seeders;

use App\Enums\ShipmentTypeEnum;
use App\Models\ShipmentRecord\ShipmentRecord;
use App\Models\ShipmentRecordDetail\ShipmentRecordDetail;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ShipmentRecordSeeder extends Seeder
{
    // 品種ID
    private const VARIETY_KOUSUI = 1;     // 幸水
    private const VARIETY_SAIGYOKU = 2;   // 彩玉
    private const VARIETY_HOUSUI = 3;     // 豊水
    private const VARIETY_AKIZUKI = 4;    // あきづき
    private const VARIETY_NIKKORI = 5;    // にっこり

    // 等級ID
    private const GRADE_SHU = 1;           // 秀
    private const GRADE_YU = 2;            // 優
    private const GRADE_RYO = 3;           // 良
    private const GRADE_KIKAKUGAI_S = 4;   // 規格外(販売)
    private const GRADE_KIKAKUGAI_NS = 5;  // 規格外(非販売)
    private const GRADE_LOSS = 6;          // ロス
    private const GRADE_PRESENT = 7;       // プレゼント

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 8月: 中旬〜月末（幸水メイン）
        $this->seedAugust();

        // 9月: ほぼ毎日（豊水・彩玉メイン）
        $this->seedSeptember();

        // 10月: 上旬〜中旬（あきづき・にっこりメイン）
        $this->seedOctober();

        $this->command->info('Shipment records seeded successfully!');
    }

    private function seedAugust(): void
    {
        for ($day = 1; $day <= 31; $day++) {
            $date = Carbon::create(2026, 8, $day);
            $details = $this->generateAugustDetails($day);
            $notes = $this->getAugustNotes($day);
            $this->createRecord($date, $details, $notes);
        }
    }

    private function seedSeptember(): void
    {
        for ($day = 1; $day <= 30; $day++) {
            $date = Carbon::create(2026, 9, $day);
            $details = $this->generateSeptemberDetails($day);
            $notes = $this->getSeptemberNotes($day);
            $this->createRecord($date, $details, $notes);
        }
    }

    /**
     * 10月の出荷記録（上旬〜中旬、あきづき・にっこりメイン）
     */
    private function seedOctober(): void
    {
        $dates = [
            1, 2, 3, 5, 6, 7, 8, 9,
            10, 13, 14, 15, 16, 17, 20,
        ];

        foreach ($dates as $day) {
            $date = Carbon::create(2026, 10, $day);
            $details = $this->generateOctoberDetails($day);
            $notes = $this->getOctoberNotes($day);
            $this->createRecord($date, $details, $notes);
        }
    }

    /**
     * 出荷記録と明細を作成
     */
    private function createRecord(Carbon $date, array $details, ?string $notes): void
    {
        $totalQuantity = array_sum(array_column($details, 'quantity'));

        $record = ShipmentRecord::create([
            'record_date' => $date->format('Y-m-d'),
            'total_quantity' => $totalQuantity,
            'notes' => $notes,
        ]);

        foreach ($details as $detail) {
            ShipmentRecordDetail::create([
                'shipment_record_id' => $record->id,
                'variety_id' => $detail['variety_id'],
                'shipment_type_id' => $detail['shipment_type_id'],
                'grade_id' => $detail['grade_id'],
                'quantity' => $detail['quantity'],
            ]);
        }
    }

    private function generateAugustDetails(int $day): array
    {
        $details = [];

        if ($day <= 11) {
            // 8月上旬: 幸水の出荷開始時期（少量）
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(5, 20)];
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(10, 40)];

            if ($day >= 5) {
                $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(5, 20)];
            }

            if ($day % 3 === 0) {
                $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_RYO, 'quantity' => rand(2, 8)];
            }
        } else {
            // 8月中旬〜下旬: 幸水の本格出荷
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(15, 40)];
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(30, 80)];
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(20, 50)];

            // 幸水の良品・規格外（一定確率で追加）
            if ($day % 3 === 0) {
                $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_RYO, 'quantity' => rand(5, 15)];
            }
            if ($day % 4 === 0) {
                $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_KIKAKUGAI_S, 'quantity' => rand(3, 10)];
            }
        }

        // 8月下旬から彩玉も出荷開始
        if ($day >= 25) {
            $details[] = ['variety_id' => self::VARIETY_SAIGYOKU, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(5, 20)];
            $details[] = ['variety_id' => self::VARIETY_SAIGYOKU, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(10, 30)];
        }

        // ロス（たまに発生）
        if ($day % 5 === 0) {
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_LOSS, 'quantity' => rand(1, 5)];
        }

        return $details;
    }

    /**
     * 9月の明細データ生成（豊水・彩玉メイン、幸水残り）
     */
    private function generateSeptemberDetails(int $day): array
    {
        $details = [];

        // 豊水（9月の主力品種）
        $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(20, 50)];
        $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(40, 100)];
        $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(20, 60)];

        // 彩玉
        $details[] = ['variety_id' => self::VARIETY_SAIGYOKU, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(10, 30)];
        $details[] = ['variety_id' => self::VARIETY_SAIGYOKU, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(20, 50)];

        // 9月上旬は幸水の残りも
        if ($day <= 10) {
            $details[] = ['variety_id' => self::VARIETY_KOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(5, 15)];
        }

        // 9月下旬からあきづきも出荷開始
        if ($day >= 20) {
            $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(5, 20)];
            $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(10, 30)];
        }

        // 良品・規格外（一定確率で追加）
        if ($day % 3 === 0) {
            $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_RYO, 'quantity' => rand(5, 20)];
        }
        if ($day % 4 === 0) {
            $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_KIKAKUGAI_S, 'quantity' => rand(3, 12)];
        }

        // プレゼント（月に数回）
        if ($day === 5 || $day === 15 || $day === 25) {
            $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_PRESENT, 'quantity' => rand(2, 8)];
        }

        // ロス
        if ($day % 6 === 0) {
            $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_LOSS, 'quantity' => rand(1, 5)];
        }

        return $details;
    }

    /**
     * 10月の明細データ生成（あきづき・にっこりメイン）
     */
    private function generateOctoberDetails(int $day): array
    {
        $details = [];

        // あきづき（10月の主力品種）
        $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(15, 40)];
        $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(30, 80)];
        $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(15, 40)];

        // にっこり（10月中旬から本格化）
        if ($day >= 8) {
            $details[] = ['variety_id' => self::VARIETY_NIKKORI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(10, 30)];
            $details[] = ['variety_id' => self::VARIETY_NIKKORI, 'shipment_type_id' => ShipmentTypeEnum::JA->value, 'grade_id' => self::GRADE_SHU, 'quantity' => rand(20, 50)];
        }

        // 10月上旬は豊水の残りも
        if ($day <= 7) {
            $details[] = ['variety_id' => self::VARIETY_HOUSUI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_YU, 'quantity' => rand(5, 15)];
        }

        // 良品・規格外
        if ($day % 3 === 0) {
            $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_RYO, 'quantity' => rand(5, 15)];
        }
        if ($day % 5 === 0) {
            $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_KIKAKUGAI_S, 'quantity' => rand(3, 10)];
        }
        if ($day % 4 === 0) {
            $details[] = ['variety_id' => self::VARIETY_NIKKORI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_KIKAKUGAI_NS, 'quantity' => rand(2, 6)];
        }

        // ロス
        if ($day % 7 === 0) {
            $details[] = ['variety_id' => self::VARIETY_AKIZUKI, 'shipment_type_id' => ShipmentTypeEnum::Direct->value, 'grade_id' => self::GRADE_LOSS, 'quantity' => rand(1, 4)];
        }

        return $details;
    }

    /**
     * 8月の備考
     */
    private function getAugustNotes(int $day): ?string
    {
        return match ($day) {
            12 => '幸水の収穫開始',
            16 => '台風接近のため早めに収穫',
            25 => '彩玉の出荷開始',
            31 => '8月最終日、幸水の出荷ピーク過ぎ',
            default => null,
        };
    }

    /**
     * 9月の備考
     */
    private function getSeptemberNotes(int $day): ?string
    {
        return match ($day) {
            1 => '豊水の本格出荷開始',
            10 => '幸水の出荷終了',
            15 => '豊水が出荷ピーク',
            20 => 'あきづきの出荷開始',
            30 => '9月出荷完了',
            default => null,
        };
    }

    /**
     * 10月の備考
     */
    private function getOctoberNotes(int $day): ?string
    {
        return match ($day) {
            1 => '10月出荷開始、あきづきメイン',
            8 => 'にっこりの出荷開始',
            15 => 'あきづきの出荷ピーク',
            20 => '今シーズン最終出荷',
            default => null,
        };
    }
}
