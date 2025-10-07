<?php

namespace App\Http\Response\Product;

use App\Http\Response\AbstractResponse;

class ProductOptionResponse extends AbstractResponse
{
    public function execute(array $data): array
    {
        return array_map(function ($item) {
            return [
                'value' => $item['id'],
                'label' => $item['name'],
                'variety' => $item['variety_id'],
            ];
        }, $data);
    }
}
