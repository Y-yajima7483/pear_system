<?php

namespace App\Services\Product;

use App\Http\Resources\Product\OptionProductResource;
use App\Models\Product\Repository\ProductRepositoryInterface;
use App\Services\AbstractService;

class GetProductOptionService extends AbstractService
{
    public function __construct(
        private readonly ProductRepositoryInterface $product,
        private readonly OptionProductResource $response
    ) {}

    public function execute(array $data): array
    {
        $result = $this->product->getOption();

        return $this->response->execute($result);
    }
}
