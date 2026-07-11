<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Określa, czy użytkownik ma uprawnienia do wykonania tego żądania.
     */
    public function authorize(): bool
    {
        // Każdy (nawet niezalogowany) musi mieć możliwość wysłania formularza logowania
        return true; 
    }

    /**
     * Reguły walidacji dla żądania logowania.
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['required', 'string']
        ];
    }

}