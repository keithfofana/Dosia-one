<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PaymentRequest extends FormRequest
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
            'amount' => [$sometimes, 'numeric', 'min:0.01'],
            'method' => [$sometimes, 'in:especes,mobile_money,virement,cheque'],
        ];
    }
}
