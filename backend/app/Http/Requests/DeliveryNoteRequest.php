<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DeliveryNoteRequest extends FormRequest
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
            'invoice_id' => ['nullable', 'integer', 'exists:invoices,id'],
            'status' => ['sometimes', 'in:prepare,livre,annule'],
        ];
    }
}
