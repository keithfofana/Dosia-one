<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class JournalEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sometimes = $this->isMethod('PUT') || $this->isMethod('PATCH') ? 'sometimes' : 'required';

        return [
            'entry_date' => [$sometimes, 'date'],
            'reference' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'lines' => [$sometimes, 'array', 'min:2'],
            'lines.*.account_id' => ['required_with:lines', 'integer', 'exists:chart_of_accounts,id'],
            'lines.*.debit' => ['required_with:lines', 'numeric', 'min:0'],
            'lines.*.credit' => ['required_with:lines', 'numeric', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if (! $this->has('lines')) {
                return;
            }

            $totalDebit = collect($this->input('lines'))->sum('debit');
            $totalCredit = collect($this->input('lines'))->sum('credit');

            if (round($totalDebit, 2) !== round($totalCredit, 2)) {
                $validator->errors()->add('lines', "L'écriture n'est pas équilibrée : débit ({$totalDebit}) ≠ crédit ({$totalCredit}).");
            }

            if ($totalDebit == 0 && $totalCredit == 0) {
                $validator->errors()->add('lines', "L'écriture doit contenir au moins un montant.");
            }
        });
    }
}
