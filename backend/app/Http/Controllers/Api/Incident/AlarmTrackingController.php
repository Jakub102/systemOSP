<?php

namespace App\Http\Controllers\Api\Incident;

use App\Http\Requests\Api\Incident\AlarmTrackingRequest;
use App\Models\Firehouse;
use App\Models\Incident;
use Illuminate\Http\JsonResponse;

class AlarmTrackingController
{
    private const ARRIVAL_RADIUS_METERS = 100;

    public function __invoke(AlarmTrackingRequest $request, Incident $incident): JsonResponse
    {
        $user = $request->user()->loadMissing('user.firehouse')->user;

        if (!$user) {
            return response()->json([
                'message' => 'Nie znaleziono profilu strażaka przypisanego do konta.',
                'should_stop_tracking' => true,
            ], 404);
        }

        if ($incident->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Zdarzenie zostało już zakończone.',
                'status' => $incident->status,
                'should_stop_tracking' => true,
            ], 200);
        }

        $existingPivot = $incident->users()
            ->where('user_id', $user->id)
            ->first()?->pivot;

        if ($existingPivot && $existingPivot->attendance_status === 'on_scene') {
            return response()->json([
                'message' => 'Strażak dotarł już do remizy.',
                'attendance_status' => 'on_scene',
                'distance_meters' => 0,
                'should_stop_tracking' => true,
            ], 200);
        }

        $validated = $request->validated();
        $userLat = (float) $validated['latitude'];
        $userLng = (float) $validated['longitude'];

        $firehouse = $user->firehouse ?? Firehouse::first();

        if (!$firehouse) {
            return response()->json([
                'message' => 'Brak zdefiniowanej lokalizacji remizy.',
                'should_stop_tracking' => true,
            ], 422);
        }

        $distanceMeters = $this->calculateDistanceInMeters(
            $userLat,
            $userLng,
            (float) $firehouse->latitude,
            (float) $firehouse->longitude
        );

        $hasArrived = $distanceMeters <= self::ARRIVAL_RADIUS_METERS;
        $attendanceStatus = $hasArrived ? 'on_scene' : 'accepted';

        $incident->users()->syncWithoutDetaching([
            $user->id => [
                'attendance_status' => $attendanceStatus,
                'confirmed_latitude' => $userLat,
                'confirmed_longitude' => $userLng,
                'confirmed_at' => now(),
            ],
        ]);

        if ($hasArrived && $user->status !== 'IN ACTION') {
            $user->update(['status' => 'IN ACTION']);
        }

        return response()->json([
            'message' => $hasArrived
                ? 'Dotarto do remizy. Śledzenie zakończone.'
                : 'Zaktualizowano lokalizację w drodze do remizy.',
            'incident_id' => $incident->id,
            'attendance_status' => $attendanceStatus,
            'distance_meters' => round($distanceMeters, 1),
            'should_stop_tracking' => $hasArrived,
        ], 200);
    }

    /**
     * Oblicza odległość w linii prostej (w metrach) między dwoma punktami GPS (wzór Haversine).
     */
    private function calculateDistanceInMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // Promień Ziemi w metrach

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
