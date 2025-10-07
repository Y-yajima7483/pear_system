<?php

namespace App\Models\Product\Repository;

use App\Models\Product\Product;

class ProductRepository implements ProductRepositoryInterface
{
    /**
     * SelectBox用の商品オプション一覧を取得
     */
    public function getOption(): array
    {
        return Product::active()
            ->orderBy('name')
            ->get(['id', 'name', 'variety_id'])
            ->toArray();
    }
}
