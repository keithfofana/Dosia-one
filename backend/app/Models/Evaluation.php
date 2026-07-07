<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompanyThroughEmployee;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employee_id', 'evaluation_date', 'score', 'notes'])]
class Evaluation extends Model
{
    use BelongsToCompanyThroughEmployee, HasFactory;

    protected function casts(): array
    {
        return [
            'evaluation_date' => 'date',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
