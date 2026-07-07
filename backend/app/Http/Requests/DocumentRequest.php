<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'title' => [$sometimes, 'string', 'max:255'],
            'type' => [$sometimes, 'in:contrat,facture,rapport,archive,autre'],
            'file' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'file', 'max:20480'],
        ];
    }
}
