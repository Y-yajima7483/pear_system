<?php

namespace App\Models\Variety\Repository;

use App\Models\Variety\Variety;

class VarietyRepository implements VarietyRepositoryInterface
{
    public function getOption(): array
    {
        $query = Variety::query();

        return $query->select('id', 'name')->get()->toArray();
    }
}
