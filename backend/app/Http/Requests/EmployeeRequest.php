<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'user_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where('company_id', $this->user()->company_id)],
            'name' => [$sometimes, 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:255'],
            'hire_date' => ['nullable', 'date'],
        ];
    }
}
