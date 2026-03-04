<?php

namespace App\Models\Variety\Repository;

use App\Models\Variety\Variety;

class VarietyRepository implements VarietyRepositoryInterface
{
    public function getOption(): array
    {
        return Variety::query()
            ->orderBy('display_order')
            ->select('id', 'name')
            ->get()
            ->toArray();
    }
}
