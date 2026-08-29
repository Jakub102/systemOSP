<?php

namespace App\Http\Requests\Api\Invitation;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'unique:accounts,email'],
            'role_id' => ['required', 'exists:roles,id'],
            'firehouse_id' => ['required', 'exists:firehouse,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => __('invitation.email_unique'),
        ];
    }
}