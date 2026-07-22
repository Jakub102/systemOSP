<?php

namespace App\Services;

use App\Models\Incident;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Illuminate\Support\Facades\Log;

class FcmService
{
    public function __construct(protected Messaging $messaging) {}

    public function sendIncidentAlert(Incident $incident): ?string
    {
        $payload = $incident->raw_payload;

        if (!$payload || !isset($payload['notification'])) {
            return null;
        }

        try {
            $message = CloudMessage::new()
                ->withTopic('system-alert')
                ->withNotification(Notification::create(
                    $payload['notification']['title'] ?? 'ALARM OSP',
                    $payload['notification']['body'] ?? $incident->description
                ))
                ->withData($payload['data'] ?? [
                    'incident_id' => (string) $incident->id,
                    'status' => $incident->status,
                ]);

            // Metoda send() zwraca np. ['name' => 'projects/project-id/messages/12345']
            $response = $this->messaging->send($message);

            if (is_array($response) && isset($response['name'])) {
                return $response['name']; // Zwraca pełny identyfikator
                // Jeśli wolisz sam końcowy numer ID, użyj: return basename($response['name']);
            }

            return null;

        } catch (\Exception $e) {
            Log::error('FCM Send Error: ' . $e->getMessage());
            return null;
        }
    }
}
