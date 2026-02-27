<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 開発環境の場合のみSeederを実行
        if (! in_array(config('app.env'), ['local', 'development'])) {
            $this->command->warn('Seeders are only executed in development environment (local or development).');
            $this->command->warn('Current environment: '.config('app.env'));

            return;
        }

        // 依存関係を考慮した順序で実行
        // 1. Variety (品種マスタ)
        // 2. Product (品種に依存)
        // 3. Grade (等級マスタ)
        // 4. ShipmentType (出荷区分マスタ)
        // 5. Order (商品に依存)
        // 6. ShipmentRecord (品種・出荷区分・等級に依存)
        // 7. User
        $this->call([
            \Database\Seeders\Master\VarietySeeder::class,
            \Database\Seeders\Master\ProductSeeder::class,
            \Database\Seeders\Master\GradeSeeder::class,
            \Database\Seeders\Master\ShipmentTypeSeeder::class,
            OrderSeeder::class,
            ShipmentRecordSeeder::class,
            UserSeeder::class,
        ]);

        $this->command->info('All seeders completed successfully!');
    }
}
