<?php

namespace App\Models\Grade\Repository;

use App\Models\Grade\Grade;

class GradeRepository implements GradeRepositoryInterface
{
    public function getOption(): array
    {
        return Grade::query()->orderBy('sort_order')->select('id', 'name', 'type')->get()->toArray();
    }
}
