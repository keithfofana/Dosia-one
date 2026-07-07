<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        if ($this->isMethod('PUT') || $this->isMethod('PATCH')) {
            return [
                'reason' => ['nullable', 'string'],
                'product_id' => ['prohibited'],
                'type' => ['prohibited'],
                'quantity' => ['prohibited'],
            ];
        }

        return [
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'type' => ['required', 'in:entree,sortie,ajustement'],
            'quantity' => ['required', 'integer', 'min:1'],
            'reason' => ['nullable', 'string'],
        ];
    }
}
