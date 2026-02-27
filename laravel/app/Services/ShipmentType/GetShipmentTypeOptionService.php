<?php

namespace App\Services\ShipmentType;

use App\Http\Resources\Common\OptionCommonResource;
use App\Models\ShipmentType\Repository\ShipmentTypeRepositoryInterface;
use App\Services\AbstractService;

class GetShipmentTypeOptionService extends AbstractService
{
    public function __construct(
        private readonly ShipmentTypeRepositoryInterface $shipmentType,
        private readonly OptionCommonResource $response
    ) {}

    public function execute(array $data): array
    {
        $result = $this->shipmentType->getOption();

        return $this->response->execute($result);
    }
}
