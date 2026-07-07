<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EvaluationRequest extends FormRequest
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
            'evaluation_date' => [$sometimes, 'date'],
            'score' => ['nullable', 'integer', 'min:0', 'max:20'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
