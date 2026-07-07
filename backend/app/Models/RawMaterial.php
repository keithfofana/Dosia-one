<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['company_id', 'name', 'quantity', 'unit', 'unit_cost'])]
class RawMaterial extends Model
{
    use BelongsToCompany, HasFactory;

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function billOfMaterials(): HasMany
    {
        return $this->hasMany(BillOfMaterial::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(RawMaterialMovement::class);
    }
}
