<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
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
        // 3. Order (商品に依存)
        // 4. User
        $this->call([
            \Database\Seeders\Master\VarietySeeder::class,
            \Database\Seeders\Master\ProductSeeder::class,
            OrderSeeder::class,
            UserSeeder::class,
        ]);

        $this->command->info('All seeders completed successfully!');
    }
}
