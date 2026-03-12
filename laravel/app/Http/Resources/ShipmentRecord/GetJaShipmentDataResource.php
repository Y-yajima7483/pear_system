<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Http\Resources\AbstractResource;

class GetJaShipmentDataResource extends AbstractResource
{
    /**
     * JA出荷データ取得のレスポンスを整形
     */
    public function execute(array $data): array
    {
        $grades = collect($data['grades'])
            ->filter(fn ($grade) => in_array($grade['shipment_scope'], ['both', 'ja_only']))
            ->map(fn ($grade) => [
                'id' => $grade['id'],
                'name' => $grade['name'],
            ])
            ->values()
            ->toArray();

        return [
            'grades' => $grades,
            'entries' => $data['entries'],
        ];
    }
}
