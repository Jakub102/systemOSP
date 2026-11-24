<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Incident extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'incident_time' => 'datetime',
        'latitude' => 'float',
        'longitude' => 'float',
        'raw_payload' => 'array',
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

        $lastExternalId = static::query()
            ->where('main_category', $categoryCode)
            ->whereYear('created_at', $year)
            ->where('external_id', 'like', "{$prefix}%")
            ->lockForUpdate()
            ->orderByDesc('id')
            ->value('external_id');

        $lastNumber = 0;
        if ($lastExternalId && preg_match('/-(\d+)$/', $lastExternalId, $matches)) {
            $lastNumber = (int) $matches[1];
        }

        $nextNumber = $lastNumber + 1;

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
