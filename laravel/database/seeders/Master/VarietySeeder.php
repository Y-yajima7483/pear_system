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
            ['id' => 1, 'name' => '幸水', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'name' => '彩玉', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'name' => '豊水', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'あきづき', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'にっこり', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }
}
