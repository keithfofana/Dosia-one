<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';
        $userId = $this->route('user')?->id;

        return [
            'name' => [$sometimes, 'string', 'max:255'],
            'email' => ['nullable', 'email', Rule::unique('users', 'email')->ignore($userId)],
            'phone' => ['nullable', 'string', Rule::unique('users', 'phone')->ignore($userId)],
            'password' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'min:8'],
            'role_id' => ['nullable', 'integer', Rule::exists('roles', 'id')->where('company_id', $this->user()->company_id)],
            'pin_code' => ['nullable', 'string', 'max:10'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
