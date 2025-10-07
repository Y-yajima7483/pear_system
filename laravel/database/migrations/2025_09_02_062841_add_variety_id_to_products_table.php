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
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('variety_id')
                ->constrained('varieties')
                ->after('name')
                ->comment('品種ID');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // 外部キー制約を先に削除
            $table->dropForeign(['variety_id']);
            // カラムを削除
            $table->dropColumn('variety_id');
        });
    }
};
