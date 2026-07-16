<?php

namespace App\Http\Resources\ShipmentRecord;

use App\Enums\GradeScopeEnum;
use App\Http\Resources\AbstractResource;

class GetJaShipmentDataResource extends AbstractResource
{
    /**
     * JA出荷データ取得のレスポンスを整形
     */
    public function execute(array $data): array
    {
        $grades = collect($data['grades'])
            ->filter(fn ($grade) => GradeScopeEnum::from($grade['shipment_scope'])->allowsJa())
            ->map(fn ($grade) => [
                'id' => $grade['id'],
                'name' => $grade['name'],
            ])
            ->values()
            ->toArray();

        return [
            'success' => true,
            'grades' => $grades,
            'entries' => $data['entries'],
        ];
    }
}
