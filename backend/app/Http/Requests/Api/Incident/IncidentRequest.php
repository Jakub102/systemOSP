<?php

namespace App\Http\Requests\Api\Incident;

use App\Models\Incident;
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
            'main_category' => [$reqOrSometimes, 'string', Rule::in(Incident::MAIN_CATEGORIES)],
            'sub_category' => [$reqOrSometimes, 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'incident_time' => [$reqOrSometimes, 'date'],
            'address' => [$reqOrSometimes, 'string', 'max:255'],
            'latitude' => [$reqOrSometimes, 'numeric', 'between:-90,90'],
            'longitude' => [$reqOrSometimes, 'numeric', 'between:-180,180'],
            'status' => ['sometimes', 'string', Rule::in(Incident::STATUSES)],
            'raw_payload' => ['nullable', 'array'],
        ];
    }
}
