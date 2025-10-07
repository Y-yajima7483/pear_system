<?php

namespace Database\Seeders\Master;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $varieties = [
            ['id' => 1, 'name' => '幸水', 'sku' => 'KOSUI'],
            ['id' => 2, 'name' => '彩玉', 'sku' => 'SAIGYOKU'],
            ['id' => 3, 'name' => '豊水', 'sku' => 'HOSUI'],
            ['id' => 4, 'name' => 'あきづき', 'sku' => 'AKIZUKI'],
            ['id' => 5, 'name' => 'にっこり', 'sku' => 'NIKKORI'],
        ];

        $productTypes = [
            ['name' => '3キロ箱', 'sku_suffix' => '3KL', 'is_shipping' => 1, 'is_active' => 1],
            ['name' => '5キロ箱大玉', 'sku_suffix' => '5KL', 'is_shipping' => 1, 'is_active' => 1],
            ['name' => '10キロ箱大玉', 'sku_suffix' => '10KL', 'is_shipping' => 1, 'is_active' => 1],
            ['name' => '5キロ箱中玉', 'sku_suffix' => '5KM', 'is_shipping' => 1, 'is_active' => 1],
            ['name' => '10キロ箱中玉', 'sku_suffix' => '10KM', 'is_shipping' => 1, 'is_active' => 1],
            ['name' => '袋', 'sku_suffix' => 'BAG', 'is_shipping' => 0, 'is_active' => 1],
            ['name' => '訳あり袋', 'sku_suffix' => 'WBAG', 'is_shipping' => 0, 'is_active' => 1],
        ];

        $products = [];

        foreach ($varieties as $variety) {
            foreach ($productTypes as $type) {
                $products[] = [
                    'variety_id' => $variety['id'],
                    'name' => $type['name'],
                    'sku' => 'PEAR-'.$variety['sku'].'-'.$type['sku_suffix'],
                    'price' => null, // 価格は後ほど手動で入力
                    'is_active' => $type['is_active'],
                    'is_shipping' => $type['is_shipping'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('products')->insert($products);
    }
}
