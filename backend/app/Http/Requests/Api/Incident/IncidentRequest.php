<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\Incident;

use App\Enums\IncidentCategory;
use App\Enums\IncidentStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $reqOrSometimes = $isUpdate ? 'sometimes' : 'required';

        return [
            'external_id' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('incidents', 'external_id')->ignore($this->route('incident')),
            ],
            'main_category' => [$reqOrSometimes, 'string', Rule::in(IncidentCategory::values())],
            'sub_category' => [$reqOrSometimes, 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'incident_time' => [$reqOrSometimes, 'date'],
            'address' => [$reqOrSometimes, 'string', 'max:255'],
            'latitude' => [$reqOrSometimes, 'numeric', 'between:-90,90'],
            'longitude' => [$reqOrSometimes, 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'string', Rule::in(IncidentStatus::values())],
            'raw_payload' => ['nullable', 'array'],
        ];
    }
}
