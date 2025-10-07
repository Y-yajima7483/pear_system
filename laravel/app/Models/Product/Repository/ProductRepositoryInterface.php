<?php

namespace App\Models\Product\Repository;

interface ProductRepositoryInterface
{
    /**
     * SelectBox用の商品オプション一覧を取得
     */
    public function getOption(): array;
}
