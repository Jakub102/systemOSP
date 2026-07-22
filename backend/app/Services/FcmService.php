<?php

namespace App\Services;

use App\Models\Incident;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Kreait\Firebase\Messaging\AndroidConfig;
use Illuminate\Support\Facades\Log;

class FcmService
{
    public function __construct(protected Messaging $messaging) {}

    public function sendIncidentAlert(Incident $incident): ?string
    {
        $categoryNames = [
            'F' => 'Pożar',
            'LT' => 'Miejscowe zagrożenie',
            'A' => 'Wypadek',
            'M' => 'Zdarzenie medyczne',
        ];

        $categoryName = $categoryNames[$incident->main_category] ?? 'Zdarzenie';

        $title = $incident->sub_category 
            ? "ALARM: {$categoryName} - {$incident->sub_category}" 
            : "ALARM: {$categoryName}";

        $timeFormatted = $incident->incident_time ? $incident->incident_time->format('d.m.Y H:i') : '';
        
        $body = "Adres: {$incident->address}\nCzas: {$timeFormatted}\nOpis: {$incident->description}";

        $dataPayload = [
            'incident_id' => (string) $incident->id,
            'external_id' => (string) $incident->external_id,
            'main_category' => (string) $incident->main_category,
            'category_name' => (string) $categoryName,
            'sub_category' => (string) $incident->sub_category,
            'description' => (string) $incident->description,
            'incident_time' => (string) $timeFormatted,
            'address' => (string) $incident->address,
        ];

        try {
            $androidConfig = AndroidConfig::fromArray([
                'priority' => 'high',
                'notification' => [
                    'sound' => 'alarm_siren',
                    'channel_id' => 'emergency_alarm_channel',
                    'visibility' => 'PUBLIC',
                ],
            ]);

            $message = CloudMessage::new()
                ->withTopic('system-alert')
                ->withNotification(Notification::create($title, $body))
                ->withData($dataPayload)
                ->withAndroidConfig($androidConfig);

            Log::info('FCM Alert Payload Sent to Google:', [
                'topic' => 'system-alert',
                'title' => $title,
                'android_config' => [
                    'priority' => 'high',
                    'channel_id' => 'emergency_alarm_channel',
                    'sound' => 'alarm_siren',
                ],
                'data_payload' => $dataPayload,
            ]);

            $response = $this->messaging->send($message);

            if (is_array($response) && isset($response['name'])) {
                $fcmMessageId = $response['name'];

                Log::info("FCM Success | ID: {$fcmMessageId}");

                return $fcmMessageId;
            }

            return null;

        } catch (\Exception $e) {
            Log::error('Android FCM Send Error: ' . $e->getMessage());
            return null;
        }
    }
}