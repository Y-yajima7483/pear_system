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
            $table->enum('status', ['pending', 'picked_up', 'canceled'])->default('pending');
            $table->text('notes')->nullable()->comment('備考');
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
            // インデックス
            $table->index('pickup_date', 'idx_orders_pickup_date');
            $table->index('status', 'idx_orders_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
