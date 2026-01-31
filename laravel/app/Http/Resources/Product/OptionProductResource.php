<?php

namespace App\Http\Resources\Product;

use App\Http\Resources\AbstractResource;

class OptionProductResource extends AbstractResource
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
