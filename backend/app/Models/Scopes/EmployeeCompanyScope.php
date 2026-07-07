<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class EmployeeCompanyScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (auth()->check()) {
            $builder->whereHas('employee', function (Builder $query) {
                $query->where('company_id', auth()->user()->company_id);
            });
        }
    }
}
