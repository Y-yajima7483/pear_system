<?php

namespace App\Http\Response\Common;

use App\Http\Response\AbstractResponse;

class OptionResponse extends AbstractResponse
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
