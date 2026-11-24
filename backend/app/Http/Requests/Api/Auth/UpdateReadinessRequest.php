<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\Auth;

use App\Enums\ReadinessStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReadinessRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'readiness_status' => ['required', 'string', Rule::in(ReadinessStatus::values())],
        ];
    }
}
