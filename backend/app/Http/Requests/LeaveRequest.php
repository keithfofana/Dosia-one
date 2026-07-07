<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'employee_id' => [$sometimes, 'integer', Rule::exists('employees', 'id')->where('company_id', $this->user()->company_id)],
            'start_date' => [$sometimes, 'date'],
            'end_date' => [$sometimes, 'date', 'after_or_equal:start_date'],
            'status' => ['sometimes', 'in:en_attente,approuve,refuse'],
        ];
    }
}
