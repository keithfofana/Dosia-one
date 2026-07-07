<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: Production - Nomenclature (BOM)
return new class extends Migration {
    public function up(): void
    {
        Schema::create('bill_of_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained();
            $table->decimal('quantity_used', 14, 2);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_of_materials');
    }
};
