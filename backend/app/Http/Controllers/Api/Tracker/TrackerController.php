<?php

namespace App\Http\Controllers\Api\Tracker;

use App\Http\Requests\Api\Incident\RespondIncidentRequest;
use App\Http\Requests\Api\Incident\UpdateLocationRequest;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\IncidentUser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrackerController
{
    private const ARRIVAL_RADIUS_METERS = 100;

    public function __invoke(UpdateLocationRequest $request, Incident $incident): JsonResponse
    {
        return $this->update($request, $incident);
    }

    /**
     * Zwraca listę aktywnych oraz ostatnich alarmów dla zalogowanego strażaka
     * wraz z jego aktualnym statusem udziału (pending / accepted / rejected / on_scene),
     * aby mógł w razie pomyłki wejść i zmienić decyzję.
     */
    public function myIncidents(Request $request): JsonResponse
    {
        $user = $request->user()?->user;

        if (!$user) {
            return response()->json([
                'message' => 'Nie znaleziono profilu strażaka przypisanego do konta.',
            ], 404);
        }

        $incidents = Incident::query()
            ->where('status', 'ACTIVE')
            ->with(['users' => fn ($query) => $query->where('users.id', $user->id)])
            ->latest('incident_time')
            ->get()
            ->map(function (Incident $incident) {
                $pivot = $incident->users->first()?->pivot;

                return [
                    'id' => $incident->id,
                    'external_id' => $incident->external_id,
                    'main_category' => $incident->main_category,
                    'sub_category' => $incident->sub_category,
                    'description' => $incident->description,
                    'address' => $incident->address,
                    'incident_time' => $incident->incident_time?->toIso8601String(),
                    'status' => $incident->status,
                    'my_attendance_status' => $pivot?->attendance_status ?? 'pending',
                ];
            });

        return response()->json([
            'data' => $incidents,
        ], 200);
    }

    /**
     * Odbiera deklarację udziału w zdarzeniu z aplikacji mobilnej ("accepted" / "rejected" / "on_scene").
     */
    public function respond(RespondIncidentRequest $request, Incident $incident): JsonResponse
    {
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);
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
                'should_stop_tracking' => true,
            ], 200);
        }

        $validated = $request->validated();
        $attendanceStatus = $validated['attendance_status'];
        $confirmedAt = now();

        if ($attendanceStatus === 'rejected') {
            $incident->users()->syncWithoutDetaching([
                $user->id => [
                    'attendance_status' => 'rejected',
                    'confirmed_latitude' => null,
                    'confirmed_longitude' => null,
                    'confirmed_at' => $confirmedAt,
                ],
            ]);

            return response()->json([
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => "{$user->first_name} {$user->last_name}",
                'roles' => $user->roles->pluck('display_name')->values(),
                'attendance_status' => 'rejected',
                'latitude' => null,
                'longitude' => null,
                'should_stop_tracking' => true,
            ], 200);
        }

        $userLat = isset($validated['latitude']) ? (float) $validated['latitude'] : null;
        $userLng = isset($validated['longitude']) ? (float) $validated['longitude'] : null;
        $hasArrived = $attendanceStatus === 'on_scene';

        if ($userLat !== null && $userLng !== null) {
            $firehouse = $user->firehouse ?? Firehouse::first();

            if ($firehouse) {
                $distanceMeters = $this->calculateDistanceInMeters(
                    $userLat,
                    $userLng,
                    (float) $firehouse->latitude,
                    (float) $firehouse->longitude
                );

                if ($distanceMeters <= self::ARRIVAL_RADIUS_METERS) {
                    $hasArrived = true;
                    $attendanceStatus = 'on_scene';
                }
            }
        }

        $incident->users()->syncWithoutDetaching([
            $user->id => [
                'attendance_status' => $attendanceStatus,
                'confirmed_latitude' => $userLat,
                'confirmed_longitude' => $userLng,
                'confirmed_at' => $confirmedAt,
            ],
        ]);

        return response()->json([
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => "{$user->first_name} {$user->last_name}",
            'roles' => $user->roles->pluck('display_name')->values(),
            'attendance_status' => $attendanceStatus,
            'latitude' => $userLat,
            'longitude' => $userLng,
            'should_stop_tracking' => $hasArrived,
        ], 200);
    }

    /**
     * Aktualizuje lokalizację zalogowanego strażaka w tabeli incident_user
     * podczas dojazdu do remizy / zdarzenia.
     */
    public function update(UpdateLocationRequest $request, Incident $incident): JsonResponse
    {
        $account = $request->user()->loadMissing(['user.roles', 'user.firehouse']);
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
                'should_stop_tracking' => true,
            ], 200);
        }

        $existingPivot = IncidentUser::where('incident_id', $incident->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingPivot && $existingPivot->attendance_status === 'on_scene') {
            return response()->json([
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => "{$user->first_name} {$user->last_name}",
                'roles' => $user->roles->pluck('display_name')->values(),
                'attendance_status' => 'on_scene',
                'latitude' => $existingPivot->confirmed_latitude,
                'longitude' => $existingPivot->confirmed_longitude,
                'should_stop_tracking' => true,
            ], 200);
        }

        if ($existingPivot && $existingPivot->attendance_status === 'rejected') {
            return response()->json([
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => "{$user->first_name} {$user->last_name}",
                'roles' => $user->roles->pluck('display_name')->values(),
                'attendance_status' => 'rejected',
                'latitude' => null,
                'longitude' => null,
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

        $incident->users()->syncWithoutDetaching([
            $user->id => [
                'attendance_status' => $attendanceStatus,
                'confirmed_latitude' => $userLat,
                'confirmed_longitude' => $userLng,
                'confirmed_at' => now(),
            ],
        ]);

        return response()->json([
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => "{$user->first_name} {$user->last_name}",
            'roles' => $user->roles->pluck('display_name')->values(),
            'attendance_status' => $attendanceStatus,
            'latitude' => $userLat,
            'longitude' => $userLng,
            'should_stop_tracking' => $hasArrived,
        ], 200);
    }

    /**
     * Zwraca dane zdarzenia (id, external_id, kategorie, adres, współrzędne)
     * oraz listę strażaków, którzy zaakceptowali udział (imię i nazwisko, role, lokalizacja, status).
     */
    public function show(Incident $incident): JsonResponse
    {
        $firefighters = $incident->users()
            ->wherePivotIn('attendance_status', ['accepted', 'on_scene'])
            ->with('roles')
            ->get()
            ->map(fn ($user) => [
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => "{$user->first_name} {$user->last_name}",
                'roles' => $user->roles->pluck('display_name')->values(),
                'attendance_status' => $user->pivot->attendance_status,
                'latitude' => $user->pivot->confirmed_latitude !== null ? (float) $user->pivot->confirmed_latitude : null,
                'longitude' => $user->pivot->confirmed_longitude !== null ? (float) $user->pivot->confirmed_longitude : null,
            ])
            ->values();

        return response()->json([
            'data' => [
                'id' => $incident->id,
                'external_id' => $incident->external_id,
                'main_category' => $incident->main_category,
                'sub_category' => $incident->sub_category,
                'address' => $incident->address,
                'latitude' => $incident->latitude,
                'longitude' => $incident->longitude,
                'users' => $firefighters,
            ],
        ], 200);
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
