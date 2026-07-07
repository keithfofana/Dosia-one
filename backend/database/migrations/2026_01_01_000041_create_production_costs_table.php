<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: Production - Cout de production
return new class extends Migration {
    public function up(): void
    {
        Schema::create('production_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_order_id')->constrained()->cascadeOnDelete();
            $table->decimal('material_cost', 14, 2)->default(0);
            $table->decimal('labor_cost', 14, 2)->default(0);
            $table->decimal('overhead_cost', 14, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('production_costs');
    }
};
