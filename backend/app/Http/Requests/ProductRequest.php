<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'category_id' => ['nullable', 'integer', 'exists:product_categories,id'],
            'name' => [$sometimes, 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:100'],
            'barcode' => ['nullable', 'string', 'max:100'],
            'qrcode' => ['nullable', 'string', 'max:255'],
            'purchase_price' => ['sometimes', 'numeric', 'min:0'],
            'sale_price' => ['sometimes', 'numeric', 'min:0'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'alert_threshold' => ['sometimes', 'integer', 'min:0'],
            'unit' => ['sometimes', 'string', 'max:50'],
        ];
    }
}
