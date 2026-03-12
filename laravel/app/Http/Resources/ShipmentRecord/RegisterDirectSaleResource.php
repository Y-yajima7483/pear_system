<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class RegisterDirectSaleResource extends AbstractResource
{
    /**
     * 直売出荷登録のレスポンスデータを整形
     */
    public function execute(array $data): array
    {
        $record = $data['record'] ?? null;

        if (! $record) {
            return [
                'success' => false,
                'message' => '直売出荷記録の登録に失敗しました。',
            ];
        }

        return [
            'success' => true,
            'message' => '直売出荷記録を登録しました。',
        ];
    }
}
