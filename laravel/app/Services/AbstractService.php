<?php

namespace App\Services;

abstract class AbstractService
{
    abstract public function execute(array $data): array;
}
