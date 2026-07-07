<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BillOfMaterialRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.raw_material_id' => [
                'required',
                'integer',
                Rule::exists('raw_materials', 'id')->where('company_id', $this->user()->company_id),
            ],
            'items.*.quantity_per_unit' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
