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
        Schema::create('shipment_record_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipment_record_id')->constrained()->cascadeOnDelete()->comment('出荷記録ID');
            $table->foreignId('variety_id')->constrained()->comment('品種ID');
            $table->foreignId('shipment_type_id')->constrained()->comment('出荷区分ID');
            $table->foreignId('grade_id')->constrained()->comment('等級ID');
            $table->unsignedInteger('quantity')->default(0)->comment('個数');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            $table->unique(['shipment_record_id', 'variety_id', 'shipment_type_id', 'grade_id'], 'uq_detail_record_variety_type_grade');
            $table->index('shipment_record_id');
            $table->index('variety_id');
            $table->index('shipment_type_id');
            $table->index('grade_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_record_details');
    }
};
