<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class UpsertDirectSaleResource extends AbstractResource
{
    /**
     * 直売出荷 upsert のレスポンスデータを整形
     */
    public function execute(array $data): array
    {
        $record = $data['record'] ?? null;

        if (! $record) {
            return [
                'success' => false,
                'message' => '直売出荷記録の保存に失敗しました。',
            ];
        }

        return [
            'success' => true,
            'message' => '直売出荷記録を保存しました。',
        ];
    }
}
