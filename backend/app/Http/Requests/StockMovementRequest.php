<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            // Un ajustement corrige un ecart constate (inventaire physique) :
            // la raison est obligatoire pour tracer pourquoi le stock a ete
            // force a cette valeur. Entree/sortie normales gardent une raison
            // facultative comme avant.
            'reason' => [Rule::requiredIf(fn () => $this->input('type') === 'ajustement'), 'nullable', 'string'],
        ];
    }
}
