<?php

namespace App\Enums;

enum GradeTypeEnum: string
{
    case Sales = 'sales';        // 販売対象
    case NonSales = 'non_sales'; // 非販売（ロス・規格外非販売など）

    public function label(): string
    {
        return match ($this) {
            self::Sales    => '販売',
            self::NonSales => '非販売',
        };
    }
}
