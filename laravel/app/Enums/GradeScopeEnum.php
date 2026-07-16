<?php

namespace App\Enums;

enum GradeScopeEnum: string
{
    case Both = 'both';               // 直売・JA両方で使用可
    case DirectOnly = 'direct_only';  // 直売のみ
    case JaOnly = 'ja_only';          // JA出荷のみ

    /**
     * 直売で使用可能な等級かどうか
     */
    public function allowsDirect(): bool
    {
        return $this !== self::JaOnly;
    }

    /**
     * JA出荷で使用可能な等級かどうか
     */
    public function allowsJa(): bool
    {
        return $this !== self::DirectOnly;
    }
}
