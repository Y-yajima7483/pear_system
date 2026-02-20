<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('shipment_records', function (Blueprint $table) {
            $table->id();
            $table->date('record_date')->unique()->comment('記録日');
            $table->unsignedInteger('total_quantity')->default(0)->comment('出荷合計数');
            $table->text('notes')->nullable()->comment('備考');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });

        DB::statement('ALTER TABLE shipment_records ADD COLUMN record_year SMALLINT UNSIGNED GENERATED ALWAYS AS (YEAR(record_date)) STORED COMMENT \'記録年\' AFTER record_date');
        DB::statement('CREATE INDEX idx_shipment_records_year_date ON shipment_records (record_year, record_date)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shipment_records');
    }
};
