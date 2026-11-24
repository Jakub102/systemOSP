<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Incident extends Model
{
    use HasFactory;

    public const MAIN_CATEGORIES = ['F', 'LT', 'A', 'M', 'FA'];

    public const CATEGORY_LABELS = [
        'F'  => 'Pożar',
        'LT' => 'Miejscowe zagrożenie',
        'A'  => 'Wypadek',
        'M'  => 'Zdarzenie medyczne',
        'FA' => 'Alarm fałszywy',
    ];

    public const STATUSES = ['ACTIVE', 'END'];

    protected $fillable = [
        'external_id',
        'main_category',
        'sub_category',
        'description',
        'incident_time',
        'address',
        'latitude',
        'longitude',
        'status',
        'raw_payload',
        'fcm_message_id',
        'fcm_sent_count',
        'fcm_dispatched_at',
    ];

    protected $casts = [
        'incident_time' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'raw_payload' => 'array',
        'fcm_sent_count' => 'integer',
        'fcm_dispatched_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (Incident $incident): void {
            if (empty($incident->external_id)) {
                $incident->external_id = static::generateNextExternalId($incident->main_category);
            }
        });
    }

    /**
     * Generuje unikalny external_id (np. INC-2026-F-1) odporny na usuwanie rekordów
     * oraz wyścigi (race conditions) dzięki blokadzie pesymistycznej lockForUpdate().
     */
    public static function generateNextExternalId(string $mainCategory): string
    {
        $categoryCode = strtoupper(trim($mainCategory));
        $year = now()->format('Y');
        $prefix = "INC-{$year}-{$categoryCode}-";

        $existingIds = static::query()
            ->where('main_category', $categoryCode)
            ->whereYear('created_at', $year)
            ->where('external_id', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->pluck('external_id');

        $maxNumber = 0;
        foreach ($existingIds as $existingId) {
            if (is_string($existingId) && preg_match('/^'.preg_quote($prefix, '/').'(\d+)$/', $existingId, $matches)) {
                $num = (int) $matches[1];
                if ($num > $maxNumber) {
                    $maxNumber = $num;
                }
            }
        }

        $nextNumber = $maxNumber + 1;

        return "{$prefix}{$nextNumber}";
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->using(IncidentUser::class)
            ->withPivot([
                'attendance_status',
                'confirmed_latitude',
                'confirmed_longitude',
                'confirmed_at',
            ])
            ->withTimestamps();
    }
}
