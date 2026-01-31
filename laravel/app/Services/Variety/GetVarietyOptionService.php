<?php

namespace App\Services\Variety;

use App\Http\Resources\Common\OptionCommonResource;
use App\Models\Variety\Repository\VarietyRepositoryInterface;
use App\Services\AbstractService;

class GetVarietyOptionService extends AbstractService
{
    public function __construct(
        private readonly VarietyRepositoryInterface $variety,
        private readonly OptionCommonResource $response
    ) {}

    public function execute(array $data): array
    {
        $result = $this->variety->getOption();

        return $this->response->execute($result);
    }
}
