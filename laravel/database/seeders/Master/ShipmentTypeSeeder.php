<?php

namespace Database\Seeders\Master;

use App\Enums\ShipmentTypeEnum;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShipmentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (ShipmentTypeEnum::cases() as $case) {
            DB::table('shipment_types')->updateOrInsert(
                ['id' => $case->value],
                ['name' => $case->label(), 'sort_order' => $case->value, 'created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
