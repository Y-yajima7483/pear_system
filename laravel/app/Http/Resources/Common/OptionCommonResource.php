<?php

namespace App\Http\Resources\Common;

use App\Http\Resources\AbstractResource;

class OptionCommonResource extends AbstractResource
{
    public function execute(array $data): array
    {
        return array_map(function ($item) {
            return [
                'value' => $item['id'],
                'label' => $item['name'],
            ];
        }, $data);
    }
}
