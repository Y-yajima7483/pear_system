<?php

namespace Database\Seeders;

use App\Models\Order\Order;
use App\Models\OrderItem\OrderItem;
use App\Models\Product\Product;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = Product::all();

        if ($products->isEmpty()) {
            $this->command->error('No products found. Please run ProductSeeder first.');

            return;
        }

        $now = Carbon::now();

        // 今日の注文
        $order1 = Order::create([
            'customer_name' => '山田 太郎',
            'pickup_date' => $now->format('Y-m-d'),
            'status' => 'pending',
            'notes' => '午後に受け取り希望',
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products->random()->id,
            'quantity' => 3,
        ]);

        OrderItem::create([
            'order_id' => $order1->id,
            'product_id' => $products->random()->id,
            'quantity' => 2,
        ]);

        // 明日の注文
        $order2 = Order::create([
            'customer_name' => '鈴木 花子',
            'pickup_date' => $now->copy()->addDay()->format('Y-m-d'),
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order2->id,
            'product_id' => $products->random()->id,
            'quantity' => 5,
        ]);

        // 1週間後の注文
        $order3 = Order::create([
            'customer_name' => '佐藤 次郎',
            'pickup_date' => $now->copy()->addWeek()->format('Y-m-d'),
            'status' => 'pending',
        ]);

        OrderItem::create([
            'order_id' => $order3->id,
            'product_id' => $products->random()->id,
            'quantity' => 1,
        ]);

        // 2週間後の注文
        $order4 = Order::create([
            'customer_name' => '田中 美咲',
            'pickup_date' => $now->copy()->addWeeks(2)->format('Y-m-d'),
            'status' => 'pending',
            'notes' => '贈答用包装希望',
        ]);

        OrderItem::create([
            'order_id' => $order4->id,
            'product_id' => $products->random()->id,
            'quantity' => 10,
        ]);

        OrderItem::create([
            'order_id' => $order4->id,
            'product_id' => $products->random()->id,
            'quantity' => 5,
        ]);

        // 3週間前の注文（過去の注文）
        $order5 = Order::create([
            'customer_name' => '高橋 健一',
            'pickup_date' => $now->copy()->subWeeks(3)->format('Y-m-d'),
            'status' => 'picked_up',
        ]);

        OrderItem::create([
            'order_id' => $order5->id,
            'product_id' => $products->random()->id,
            'quantity' => 2,
        ]);

        $this->command->info('Orders seeded successfully!');
    }
}
