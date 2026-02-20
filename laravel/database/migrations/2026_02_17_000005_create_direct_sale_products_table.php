<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('direct_sale_products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_record_detail_id')->constrained()->cascadeOnDelete()->comment('出荷記録明細ID');
            $table->foreignId('product_id')->constrained()->restrictOnDelete()->comment('商品ID');
            $table->unsignedInteger('fruit_quantity')->default(0)->comment('玉数');
            $table->unsignedInteger('box_quantity')->default(0)->comment('箱/袋数');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['shipment_record_detail_id', 'product_id'], 'uq_direct_sale_detail_product');
            $table->index('shipment_record_detail_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('direct_sale_products');
    }
};
