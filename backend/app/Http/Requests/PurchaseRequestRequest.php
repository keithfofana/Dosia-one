<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'product_id' => [$sometimes, 'integer', 'exists:products,id'],
            'quantity' => [$sometimes, 'integer', 'min:1'],
            'status' => ['sometimes', 'in:en_attente,validee,refusee'],
        ];
    }
}
