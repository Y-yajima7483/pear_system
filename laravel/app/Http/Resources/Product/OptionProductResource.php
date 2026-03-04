<?php

namespace App\Http\Resources\Product;

use App\Http\Resources\AbstractResource;

class OptionProductResource extends AbstractResource
{
    public function execute(array $data): array
    {
        return array_map(function ($item) {
            // SKUからsku_suffixを抽出（例: PEAR-KOSUI-3KL → 3KL）
            $skuParts = explode('-', $item['sku'] ?? '');
            $skuSuffix = end($skuParts) ?: '';

            return [
                'value' => $item['id'],
                'label' => $item['name'],
                'variety' => $item['variety_id'],
                'is_main' => (bool) $item['is_main'],
                'is_shipping' => (bool) $item['is_shipping'],
                'sku_suffix' => $skuSuffix,
            ];
        }, $data);
    }
}
