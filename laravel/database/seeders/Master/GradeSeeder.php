<?php

namespace Database\Seeders\Master;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GradeSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('grades')->insert([
            ['id' => 1, 'name' => '秀', 'type' => 'sales', 'shipment_scope' => 'both', 'sort_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => '優', 'type' => 'sales', 'shipment_scope' => 'both', 'sort_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => '良', 'type' => 'sales', 'shipment_scope' => 'both', 'sort_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => '規格外(販売)', 'type' => 'sales', 'shipment_scope' => 'direct_only', 'sort_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => '規格外(非販売)', 'type' => 'non_sales', 'shipment_scope' => 'ja_only', 'sort_order' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 6, 'name' => 'ロス', 'type' => 'non_sales', 'shipment_scope' => 'direct_only', 'sort_order' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 7, 'name' => 'プレゼント', 'type' => 'non_sales', 'shipment_scope' => 'direct_only', 'sort_order' => 7, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
