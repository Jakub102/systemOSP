<?php

declare(strict_types=1);

namespace App\Enums;

enum IncidentCategory: string
{
    case FIRE = 'F';
    case LOCAL_THREAT = 'LT';
    case ACCIDENT = 'A';
    case MEDICAL = 'M';
    case FALSE_ALARM = 'FA';

    public function label(): string
    {
        return match ($this) {
            self::FIRE => 'Pożar',
            self::LOCAL_THREAT => 'Miejscowe zagrożenie',
            self::ACCIDENT => 'Wypadek',
            self::MEDICAL => 'Zdarzenie medyczne',
            self::FALSE_ALARM => 'Alarm fałszywy',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
