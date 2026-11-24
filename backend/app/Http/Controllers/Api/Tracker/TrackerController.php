<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Tracker;

use App\Enums\AttendanceStatus;
use App\Enums\IncidentStatus;
use App\Http\Requests\Api\Incident\RespondIncidentRequest;
use App\Http\Requests\Api\Incident\UpdateLocationRequest;
use App\Models\Firehouse;
use App\Models\Incident;
use App\Models\IncidentUser;
use App\Models\User;
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
     * Zwraca listę aktywnych alarmów dla zalogowanego strażaka
     * wraz z jego aktualnym statusem udziału (pending / accepted / rejected / on_scene).
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
            ->where('status', IncidentStatus::ACTIVE->value)
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
                    'my_attendance_status' => $pivot?->attendance_status ?? AttendanceStatus::PENDING->value,
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

        if ($incident->status !== IncidentStatus::ACTIVE->value) {
            return response()->json([
                'message' => 'Zdarzenie zostało już zakończone.',
                'should_stop_tracking' => true,
            ], 200);
        }

        $validated = $request->validated();
        $attendanceStatus = AttendanceStatus::from($validated['attendance_status']);
        $confirmedAt = now();

        if ($attendanceStatus === AttendanceStatus::REJECTED) {
            IncidentUser::updateOrCreate(
                ['incident_id' => $incident->id, 'user_id' => $user->id],
                [
                    'attendance_status' => AttendanceStatus::REJECTED->value,
                    'confirmed_latitude' => null,
                    'confirmed_longitude' => null,
                    'confirmed_at' => $confirmedAt,
                ]
            );

            return response()->json(
                $this->formatFirefighterResponse($user, AttendanceStatus::REJECTED->value, null, null, true),
                200
            );
        }

        $userLat = isset($validated['latitude']) ? (float) $validated['latitude'] : null;
        $userLng = isset($validated['longitude']) ? (float) $validated['longitude'] : null;
        $hasArrived = $attendanceStatus === AttendanceStatus::ON_SCENE;

        if ($userLat !== null && $userLng !== null) {
            $firehouse = $user->firehouse ?? Firehouse::first();

            if ($firehouse) {
                $distanceMeters = $firehouse->distanceInMetersTo($userLat, $userLng);

                if ($distanceMeters <= self::ARRIVAL_RADIUS_METERS) {
                    $hasArrived = true;
                    $attendanceStatus = AttendanceStatus::ON_SCENE;
                }
            }
        }

        IncidentUser::updateOrCreate(
            ['incident_id' => $incident->id, 'user_id' => $user->id],
            [
                'attendance_status' => $attendanceStatus->value,
                'confirmed_latitude' => $userLat,
                'confirmed_longitude' => $userLng,
                'confirmed_at' => $confirmedAt,
            ]
        );

        return response()->json(
            $this->formatFirefighterResponse($user, $attendanceStatus->value, $userLat, $userLng, $hasArrived),
            200
        );
    }

    /**
     * Aktualizuje lokalizację zalogowanego strażaka w tabeli incident_user
     * podczas dojazdu do remizy. Wymaga wcześniejszej deklaracji udziału ("accepted").
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

        if ($incident->status !== IncidentStatus::ACTIVE->value) {
            return response()->json([
                'message' => 'Zdarzenie zostało już zakończone.',
                'should_stop_tracking' => true,
            ], 200);
        }

        $existingPivot = IncidentUser::where('incident_id', $incident->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$existingPivot || $existingPivot->attendance_status === AttendanceStatus::PENDING->value) {
            return response()->json([
                'message' => 'Najpierw zadeklaruj udział w zdarzeniu, aby uruchomić śledzenie lokalizacji.',
                'should_stop_tracking' => true,
            ], 409);
        }

        if ($existingPivot->attendance_status === AttendanceStatus::ON_SCENE->value) {
            return response()->json(
                $this->formatFirefighterResponse(
                    $user,
                    AttendanceStatus::ON_SCENE->value,
                    $existingPivot->confirmed_latitude,
                    $existingPivot->confirmed_longitude,
                    true
                ),
                200
            );
        }

        if ($existingPivot->attendance_status === AttendanceStatus::REJECTED->value) {
            return response()->json(
                $this->formatFirefighterResponse($user, AttendanceStatus::REJECTED->value, null, null, true),
                200
            );
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

        $distanceMeters = $firehouse->distanceInMetersTo($userLat, $userLng);
        $hasArrived = $distanceMeters <= self::ARRIVAL_RADIUS_METERS;
        $attendanceStatus = $hasArrived ? AttendanceStatus::ON_SCENE : AttendanceStatus::ACCEPTED;

        $existingPivot->update([
            'attendance_status' => $attendanceStatus->value,
            'confirmed_latitude' => $userLat,
            'confirmed_longitude' => $userLng,
            'confirmed_at' => now(),
        ]);

        return response()->json(
            $this->formatFirefighterResponse($user, $attendanceStatus->value, $userLat, $userLng, $hasArrived),
            200
        );
    }

    /**
     * Zwraca dane zdarzenia (id, external_id, kategorie, adres, współrzędne)
     * oraz listę strażaków, którzy zaakceptowali udział (imię i nazwisko, role, lokalizacja, status).
     */
    public function show(Incident $incident): JsonResponse
    {
        $firefighters = $incident->users()
            ->wherePivotIn('attendance_status', [
                AttendanceStatus::ACCEPTED->value,
                AttendanceStatus::ON_SCENE->value,
            ])
            ->with('roles')
            ->get()
            ->map(fn (User $user) => [
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

    private function formatFirefighterResponse(
        User $user,
        string $attendanceStatus,
        ?float $latitude,
        ?float $longitude,
        bool $shouldStopTracking
    ): array {
        return [
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'full_name' => "{$user->first_name} {$user->last_name}",
            'roles' => $user->roles->pluck('display_name')->values(),
            'attendance_status' => $attendanceStatus,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'should_stop_tracking' => $shouldStopTracking,
        ];
    }
}
