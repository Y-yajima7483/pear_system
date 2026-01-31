<?php

namespace App\Http\Resources;

abstract class AbstractResource
{
    abstract public function execute(array $data): array;
}
