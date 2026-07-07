<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SalaryRequest extends FormRequest
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
            'amount' => [$sometimes, 'numeric', 'min:0'],
            'period_month' => [$sometimes, 'date'],
            'status' => ['sometimes', 'in:prevu,paye'],
        ];
    }
}
