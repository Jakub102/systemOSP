<?php

namespace App\Http\Requests\Api\Invitation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->user?->firehouse_id;
    }

    public function rules(): array
    {
        $inviter = $this->user()?->user;
        $isAdmin = $inviter && $inviter->roles()->where('name', 'admin')->exists();

        // Rola 'system' nigdy nie może zostać nadana przez zaproszenie.
        // Rolę 'admin' może nadać wyłącznie inny administrator.
        $forbiddenRoles = $isAdmin ? ['system'] : ['system', 'admin'];

        return [
            'email' => ['required', 'string', 'email', 'max:255', 'unique:accounts,email'],
            'role_id' => [
                'required',
                'integer',
                Rule::exists('roles', 'id')->where(function ($query) use ($forbiddenRoles) {
                    $query->whereNotIn('name', $forbiddenRoles);
                }),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique' => __('invitation.email_unique'),
            'role_id.exists' => 'Wybrana rola jest nieprawidłowa lub nie posiadasz uprawnień do jej nadania.',
        ];
    }
}
