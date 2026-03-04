<?php

namespace Database\Seeders\Master;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class VarietySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('varieties')->insert([
            ['id' => 1, 'name' => '幸水', 'display_order' => 1, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => '彩玉', 'display_order' => 2, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => '豊水', 'display_order' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'あきづき', 'display_order' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'にっこり', 'display_order' => 5, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
