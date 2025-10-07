<?php

namespace App\Services\Product;

use App\Http\Response\Product\ProductOptionResponse;
use App\Models\Product\Repository\ProductRepositoryInterface;
use App\Services\AbstractService;

class GetProductOptionService extends AbstractService
{
    public function __construct(
        private readonly ProductRepositoryInterface $product,
        private readonly ProductOptionResponse $response
    ) {}

    public function execute(array $data): array
    {
        $result = $this->product->getOption();

        return $this->response->execute($result);
    }
}
