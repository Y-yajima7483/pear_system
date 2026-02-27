<?php

namespace App\Services\Grade;

use App\Http\Resources\Common\OptionCommonResource;
use App\Models\Grade\Repository\GradeRepositoryInterface;
use App\Services\AbstractService;

class GetGradeOptionService extends AbstractService
{
    public function __construct(
        private readonly GradeRepositoryInterface $grade,
        private readonly OptionCommonResource $response
    ) {}

    public function execute(array $data): array
    {
        $result = $this->grade->getOption();

        return $this->response->execute($result);
    }
}
