<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'bank_name' => [$sometimes, 'string', 'max:255'],
            'account_number' => [$sometimes, 'string', 'max:100'],
            'balance' => ['sometimes', 'numeric'],
        ];
    }
}
