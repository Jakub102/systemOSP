<?php

declare(strict_types=1);

namespace App\Enums;

enum ReadinessStatus: string
{
    case ACTIVE = 'active';
    case INACTIVE = 'in_active';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
