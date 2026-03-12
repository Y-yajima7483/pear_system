<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class RegisterJaShipmentResource extends AbstractResource
{
    /**
     * JA出荷登録のレスポンスデータを整形
     */
    public function execute(array $data): array
    {
        return [
            'success' => true,
            'message' => 'JA出荷記録を登録しました。',
            'updated_dates' => $data['updated_dates'] ?? [],
        ];
    }
}
