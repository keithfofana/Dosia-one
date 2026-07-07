<?php

namespace App\Models;

use App\Models\Concerns\BelongsToCompany;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['company_id', 'product_id', 'quantity_to_produce', 'status'])]
class ProductionOrder extends Model
{
    use BelongsToCompany, HasFactory;

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function billOfMaterials(): HasMany
    {
        return $this->hasMany(BillOfMaterial::class);
    }

    public function productionCosts(): HasMany
    {
        return $this->hasMany(ProductionCost::class);
    }
}
