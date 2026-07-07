<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TrialBalanceExport implements FromArray, WithHeadings
{
    public function __construct(private array $rows)
    {
    }

    public function array(): array
    {
        return array_map(fn ($row) => [
            $row['code'],
            $row['name'],
            $row['type'],
            $row['total_debit'],
            $row['total_credit'],
            $row['balance'],
        ], $this->rows);
    }

    public function headings(): array
    {
        return ['Code', 'Compte', 'Type', 'Débit', 'Crédit', 'Solde'];
    }
}
