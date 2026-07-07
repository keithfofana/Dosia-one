<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompanyThroughEmployee;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\WithoutTimestamps;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['employee_id', 'date', 'check_in', 'check_out', 'is_late'])]
#[WithoutTimestamps]
class Attendance extends Model
{
    use BelongsToCompanyThroughEmployee, HasFactory;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_late' => 'boolean',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
