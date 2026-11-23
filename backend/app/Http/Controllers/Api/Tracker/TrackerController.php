<?php

namespace App\Http\Controllers\Api\Tracker;

use App\Http\Requests\Api\Incident\UpdateLocationRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\IncidentUser;
use Illuminate\Http\JsonResponse;

class TrackerController
{
    private const ARRIVAL_RADIUS_METERS = 100;

    public function __invoke(UpdateLocationRequest $request, Incident $incident): JsonResponse
    {
        return $this->update($request, $incident);
    }

    /**
     * Aktualizuje lokalizację zalogowanego strażaka w tabeli incident_user
     * podczas dojazdu do remizy / zdarzenia.
     */
    public function update(UpdateLocationRequest $request, Incident $incident): JsonResponse
    {
        $account = $request->user()->loadMissing(['user.firehouse']);
        $user = $account?->user;

        if (!$user) {
            return response()->json([
                'message' => 'Nie znaleziono profilu strażaka przypisanego do konta.',
                'should_stop_tracking' => true,
            ], 404);
        }

        if ($incident->status !== 'ACTIVE') {
            return response()->json([
                'message' => 'Zdarzenie zostało już zakończone.',
                'incident_id' => $incident->id,
                'incident_status' => $incident->status,
                'should_stop_tracking' => true,
            ], 200);
        }

        $existingPivot = IncidentUser::where('incident_id', $incident->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingPivot && $existingPivot->attendance_status === 'on_scene') {
            return response()->json([
                'message' => 'Strażak znajduje się już na miejscu w remizie.',
                'incident_id' => $incident->id,
                'user_id' => $user->id,
                'attendance_status' => 'on_scene',
                'confirmed_latitude' => $existingPivot->confirmed_latitude,
                'confirmed_longitude' => $existingPivot->confirmed_longitude,
                'confirmed_at' => $existingPivot->confirmed_at?->toIso8601String(),
                'distance_meters' => 0.0,
                'should_stop_tracking' => true,
            ], 200);
        }

        $validated = $request->validated();
        $userLat = (float) $validated['latitude'];
        $userLng = (float) $validated['longitude'];

        $firehouse = $user->firehouse ?? Firehouse::first();

        if (!$firehouse) {
            return response()->json([
                'message' => 'Brak przypisanej remizy dla użytkownika.',
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
        $confirmedAt = now();

        $incident->users()->syncWithoutDetaching([
            $user->id => [
                'attendance_status' => $attendanceStatus,
                'confirmed_latitude' => $userLat,
                'confirmed_longitude' => $userLng,
                'confirmed_at' => $confirmedAt,
            ],
        ]);

        if ($hasArrived && $user->status !== 'IN ACTION') {
            $user->update(['status' => 'IN ACTION']);
        }

        return response()->json([
            'message' => $hasArrived
                ? 'Dotarto do remizy. Śledzenie lokalizacji zakończone.'
                : 'Zaktualizowano lokalizację strażaka.',
            'incident_id' => $incident->id,
            'user_id' => $user->id,
            'attendance_status' => $attendanceStatus,
            'confirmed_latitude' => $userLat,
            'confirmed_longitude' => $userLng,
            'confirmed_at' => $confirmedAt->toIso8601String(),
            'distance_meters' => round($distanceMeters, 1),
            'should_stop_tracking' => $hasArrived,
        ], 200);
    }

    /**
     * Zwraca dane zdarzenia wraz z aktualną lokalizacją przypisanych strażaków.
     */
    public function show(Incident $incident): IncidentResource
    {
        return new IncidentResource($incident->load(['users.roles', 'users.firehouse']));
    }

    /**
     * Oblicza odległość w metrach między dwoma punktami GPS (wzór Haversine).
     */
    private function calculateDistanceInMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2)
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2))
            * sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
