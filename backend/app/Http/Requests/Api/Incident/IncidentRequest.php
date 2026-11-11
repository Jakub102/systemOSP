<?php

namespace App\Http\Requests\Api\V1\Incident;

use Illuminate\Foundation\Http\FormRequest;

class IncidentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

protected function prepareForValidation(): void
{
    if (!$this->has('external_id') || empty($this->input('external_id'))) {
        $mainCategory = $this->input('main_category');
        $prefixCategory = strtoupper(substr($mainCategory, 0, 1)); 
        $year = now()->format('Y'); 

        $count = \App\Models\Incident::where('main_category', $mainCategory)
            ->whereYear('created_at', $year)
            ->count();
        
        $nextNumber = $count + 1;

        $this->merge([
            'external_id' => "INC-{$year}-{$prefixCategory}-{$nextNumber}"
        ]);
    }
}

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');

        return [
            'external_id' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'main_category' => [$isUpdate ? 'sometimes' : 'required', 'string', 'max:255'],
            'sub_category' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'incident_time' => [$isUpdate ? 'sometimes' : 'required', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'status' => ['nullable', 'string', 'max:50'],
            'raw_payload' => ['nullable', 'array'],
        ];
    }
}