<?php

namespace App\Services\ShipmentRecord\Support;

/**
 * 直売商品の等級自動決定ルール（単一ソース）
 *
 * 直売では商品タイプごとに等級が固定されるため、ユーザーは等級を入力しない。
 * SKUサフィックス（PEAR-{品種}-{サフィックス}）から等級IDを導出する。
 * 等級IDは GradeSeeder のマスタ定義に対応する。
 */
class DirectSaleGradeResolver
{
    /** 等級ID: 秀（箱・通常袋） */
    private const GRADE_ID_PREMIUM = 1;

    /** 等級ID: 規格外(販売)（訳あり袋） */
    private const GRADE_ID_OFF_SPEC_SALES = 4;

    /** SKUサフィックス: 訳あり袋 */
    private const SKU_SUFFIX_WAKEARI_BAG = 'WBAG';

    /**
     * 商品SKUから直売時の等級IDを導出する
     */
    public static function resolve(string $sku): int
    {
        $suffix = self::extractSuffix($sku);

        return match ($suffix) {
            self::SKU_SUFFIX_WAKEARI_BAG => self::GRADE_ID_OFF_SPEC_SALES,
            default => self::GRADE_ID_PREMIUM,
        };
    }

    /**
     * SKU（PEAR-{品種}-{サフィックス}）末尾のサフィックスを取り出す
     */
    private static function extractSuffix(string $sku): string
    {
        $parts = explode('-', $sku);

        return end($parts);
    }
}
