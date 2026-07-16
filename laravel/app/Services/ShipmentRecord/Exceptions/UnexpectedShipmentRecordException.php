<?php

namespace App\Services\ShipmentRecord\Exceptions;

final class UnexpectedShipmentRecordException extends \RuntimeException
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

    public static function dailyFetch(\Throwable $previous): self
    {
        return new self('出荷記録詳細の取得に失敗しました。', $previous);
    }

    public static function delete(\Throwable $previous): self
    {
        return new self('出荷記録の削除に失敗しました。', $previous);
    }

    public static function summaryFetch(\Throwable $previous): self
    {
        return new self('出荷サマリーの取得に失敗しました。', $previous);
    }
}
