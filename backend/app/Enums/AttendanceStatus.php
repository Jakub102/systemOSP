<?php

declare(strict_types=1);

namespace App\Enums;

enum AttendanceStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case REJECTED = 'rejected';
    case ON_SCENE = 'on_scene';

    /**
     * @return list<string>
     */
    public static function respondableValues(): array
    {
        return [
            self::ACCEPTED->value,
            self::REJECTED->value,
            self::ON_SCENE->value,
        ];
    }
}
