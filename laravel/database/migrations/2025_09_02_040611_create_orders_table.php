<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name', 191)->comment('お客様名');
            $table->date('pickup_date')->nullable()->comment('受取日');
            $table->unsignedTinyInteger('status')->default(1)->comment('ステータス: 1=pending, 2=picked_up, 3=canceled');
            $table->text('notes')->nullable()->comment('備考');
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            // インデックス
            $table->index('pickup_date', 'idx_orders_pickup_date');
            $table->time('pickup_time')
                ->nullable()
                ->comment('受取時間');
            $table->index('user_id', 'idx_orders_user');
            $table->index('status', 'idx_orders_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
