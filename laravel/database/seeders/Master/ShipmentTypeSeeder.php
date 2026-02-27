<?php

namespace Database\Seeders\Master;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ShipmentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('shipment_types')->insert([
            ['id' => 1, 'name' => '直売', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => 'JA出荷', 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
