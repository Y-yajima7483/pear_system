<?php

namespace App\Models\ShipmentType\Repository;

use App\Models\ShipmentType\ShipmentType;

class ShipmentTypeRepository implements ShipmentTypeRepositoryInterface
{
    public function getOption(): array
    {
        return ShipmentType::query()->orderBy('sort_order')->select('id', 'name')->get()->toArray();
    }
}
