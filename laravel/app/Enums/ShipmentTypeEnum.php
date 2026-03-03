<?php

namespace App\Enums;

enum ShipmentTypeEnum: int
{
    case Direct = 1;   // 直売
    case JA = 2;       // JA出荷

    public function label(): string
    {
        return match ($this) {
            self::Direct => '直売',
            self::JA     => 'JA出荷',
        };
    }

    /**
     * 直売固有のデータ（direct_sale_items）を持つかどうか
     */
    public function hasDirectSaleItems(): bool
    {
        return $this === self::Direct;
    }
}
