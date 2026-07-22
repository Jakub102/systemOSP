<?php

namespace App\Http\Controllers\Api\V1\Incident;

use App\Http\Requests\Api\V1\Incident\IncidentRequest;
use App\Http\Resources\IncidentResource;
use App\Models\Incident;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class IncidentController
{
    public function index(): AnonymousResourceCollection
    {
        $incidents = Incident::with('users')->latest()->paginate(20);

        return IncidentResource::collection($incidents);
    }

    public function store(IncidentRequest $request): IncidentResource
    {
        $incident = Incident::create($request->validated());

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