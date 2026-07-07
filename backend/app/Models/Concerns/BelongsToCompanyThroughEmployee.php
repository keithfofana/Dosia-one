<?php

namespace App\Models\Concerns;

use App\Models\Scopes\EmployeeCompanyScope;

trait BelongsToCompanyThroughEmployee
{
    protected static function bootBelongsToCompanyThroughEmployee(): void
    {
        static::addGlobalScope(new EmployeeCompanyScope);
    }
}
