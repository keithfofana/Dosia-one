<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductionOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'product_id' => [$sometimes, 'integer', Rule::exists('products', 'id')->where('company_id', $this->user()->company_id)],
            'quantity_to_produce' => [$sometimes, 'integer', 'min:1'],
            'status' => ['sometimes', 'in:planifie,en_cours,termine'],
            'labor_cost' => ['sometimes', 'numeric', 'min:0'],
            'overhead_cost' => ['sometimes', 'numeric', 'min:0'],
        ];
    }
}
