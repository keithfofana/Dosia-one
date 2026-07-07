<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChartOfAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'code' => [$sometimes, 'string', 'max:20'],
            'name' => [$sometimes, 'string', 'max:255'],
            'type' => [$sometimes, 'in:actif,passif,charge,produit,capitaux'],
        ];
    }
}
