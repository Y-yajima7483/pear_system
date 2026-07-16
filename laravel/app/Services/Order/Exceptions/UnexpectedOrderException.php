<?php

namespace App\Services\Order\Exceptions;

final class UnexpectedOrderException extends \RuntimeException
{
    private string $responseMessage;

    private function __construct(string $message, \Throwable $previous)
    {
        $this->responseMessage = $message;
        parent::__construct($message, 0, $previous);
    }

    public function responseMessage(): string
    {
        return $this->responseMessage;
    }

    public static function register(\Throwable $previous): self
    {
        return new self('注文の登録に失敗しました。', $previous);
    }

    public static function update(\Throwable $previous): self
    {
        return new self('注文の更新に失敗しました。', $previous);
    }

    public static function statusUpdate(\Throwable $previous): self
    {
        return new self('ステータスの更新に失敗しました。', $previous);
    }
}
