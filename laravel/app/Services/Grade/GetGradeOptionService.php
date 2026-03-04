<?php

namespace App\Services\Grade;

use App\Models\Grade\Repository\GradeRepositoryInterface;
use App\Services\AbstractService;

class GetGradeOptionService extends AbstractService
{
    public function __construct(
        private readonly GradeRepositoryInterface $grade,
    ) {}

    public function execute(array $data): array
    {
        $result = $this->grade->getOption();

        return array_map(function ($item) {
            return [
                'value' => $item['id'],
                'label' => $item['name'],
                'type' => $item['type'],
                'shipment_scope' => $item['shipment_scope'],
            ];
        }, $result);
    }
}
