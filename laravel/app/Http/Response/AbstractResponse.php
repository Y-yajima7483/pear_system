<?php

namespace App\Http\Response;

abstract class AbstractResponse
{
    abstract public function execute(array $data): array;
}
