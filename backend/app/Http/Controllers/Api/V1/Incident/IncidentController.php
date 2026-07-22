<?php

namespace App\Http\Controllers\Api\V1\Incident;

use App\Http\Requests\Api\V1\Incident\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use App\Services\FcmService;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class IncidentController
{
    public function __construct(protected FcmService $fcmService) {}

    public function index(): AnonymousResourceCollection
    {
        $incidents = Incident::with('users')->latest()->paginate(20);

        return IncidentResource::collection($incidents);
    }

    //TODO: Tu trzeba będzie dodać wywoływanie alarmu
    public function store(IncidentRequest $request): IncidentResource
    {
        $incident = Incident::create($request->validated());

        $fcmMessageId = $this->fcmService->sendIncidentAlert($incident);

        if ($fcmMessageId) {
            Log::info("Powiadomienie wysłane do FCM. ID: " . $fcmMessageId);
        } else {
            Log::error("Błąd wysyłki powiadomienia dla incydentu o ID: " . $incident->id);
        }

        return new IncidentResource($incident);
    }


    public function show(Incident $incident): IncidentResource
    {
        return new IncidentResource($incident->load('users'));
    }

    public function update(IncidentRequest $request, Incident $incident): IncidentResource
    {
        $incident->update($request->validated());

        return new IncidentResource($incident);
    }

    public function destroy(Incident $incident): Response
    {
        $incident->delete();

        return response()->noContent();
    }
}
