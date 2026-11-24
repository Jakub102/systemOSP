<?php

declare(strict_types=1);

namespace App\Enums;

enum IncidentStatus: string
{
    case ACTIVE = 'ACTIVE';
    case END = 'END';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
