<?php

namespace App\Http\Controllers\Concerns;

trait GeneratesDocumentNumber
{
    protected function generateNumber(string $modelClass, string $prefix, int $companyId): string
    {
        $count = $modelClass::withoutGlobalScopes()->where('company_id', $companyId)->count();

        return sprintf('%s-%s-%06d', $prefix, now()->format('Y'), $count + 1);
    }
}
