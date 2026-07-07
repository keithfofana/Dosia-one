<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RawMaterialMovementRequest extends FormRequest
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
                'raw_material_id' => ['prohibited'],
                'type' => ['prohibited'],
                'quantity' => ['prohibited'],
            ];
        }

        return [
            'raw_material_id' => ['required', 'integer', Rule::exists('raw_materials', 'id')->where('company_id', $this->user()->company_id)],
            'type' => ['required', 'in:entree,sortie,ajustement'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['nullable', 'string'],
        ];
    }
}
