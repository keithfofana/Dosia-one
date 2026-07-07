<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class InvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'client_id' => [$sometimes, 'integer', 'exists:clients,id'],
            'quote_id' => ['nullable', 'integer', 'exists:quotes,id'],
            'due_date' => ['nullable', 'date'],
            'status' => ['sometimes', 'in:due,partiel,paye,annule'],
            'items' => [$sometimes, 'array', 'min:1'],
            'items.*.product_id' => ['required_with:items', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required_with:items', 'integer', 'min:1'],
            'items.*.unit_price' => ['required_with:items', 'numeric', 'min:0'],
        ];
    }
}
