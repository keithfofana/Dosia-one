<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: Production - Entrees/sorties de stock des matieres premieres
return new class extends Migration {
    public function up(): void
    {
        Schema::create('raw_material_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('raw_material_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['entree', 'sortie', 'ajustement']);
            $table->decimal('quantity', 14, 2);
            $table->string('reason')->nullable();
            $table->foreignId('user_id')->nullable()->constrained();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('raw_material_movements');
    }
};
