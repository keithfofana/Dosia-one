<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: IA/Systeme - Notifications intelligentes
return new class extends Migration {
    public function up(): void
    {
        Schema::create('notifications_custom', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained();
            $table->enum('type', ['stock_faible', 'facture_impayee', 'paiement_recu', 'rupture_stock', 'contrat_expire', 'anniversaire_client', 'retard_employe']);
            $table->text('message');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications_custom');
    }
};
