<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Module: Production - la nomenclature (BOM) devient une recette reutilisable
// par produit (product_id), au lieu d'etre uniquement liee a un ordre de
// fabrication. Les lignes liees a un production_order_id restent l'instantane
// (figé) des quantites reellement consommees par cet ordre precis.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
        });

        DB::statement('ALTER TABLE bill_of_materials ALTER COLUMN production_order_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE bill_of_materials ALTER COLUMN production_order_id SET NOT NULL');

        Schema::table('bill_of_materials', function (Blueprint $table) {
            $table->dropConstrainedForeignId('product_id');
        });
    }
};
