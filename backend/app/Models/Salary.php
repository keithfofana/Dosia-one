<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompanyThroughEmployee;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employee_id', 'amount', 'period_month', 'status'])]
class Salary extends Model
{
    use BelongsToCompanyThroughEmployee, HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'period_month' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
