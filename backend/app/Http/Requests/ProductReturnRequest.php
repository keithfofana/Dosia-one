<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProductReturnRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'invoice_id' => [$sometimes, 'integer', 'exists:invoices,id'],
            'product_id' => [$sometimes, 'integer', 'exists:products,id'],
            'quantity' => [$sometimes, 'integer', 'min:1'],
            'reason' => ['nullable', 'string'],
        ];
    }
}
