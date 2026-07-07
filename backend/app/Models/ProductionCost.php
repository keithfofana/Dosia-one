<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['production_order_id', 'material_cost', 'labor_cost', 'overhead_cost'])]
class ProductionCost extends Model
{
    use HasFactory;

    protected function casts(): array
    {
        return [
            'material_cost' => 'decimal:2',
            'labor_cost' => 'decimal:2',
            'overhead_cost' => 'decimal:2',
        ];
    }

    public function productionOrder(): BelongsTo
    {
        return $this->belongsTo(ProductionOrder::class);
    }
}
