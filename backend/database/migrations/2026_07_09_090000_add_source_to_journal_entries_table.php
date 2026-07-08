<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: Comptabilite - distingue les ecritures generees automatiquement
// (facture, salaire, production...) des ecritures manuelles, pour interdire
// leur modification/suppression et preserver l'integrite du grand livre.
return new class extends Migration {
    public function up(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->string('source', 20)->default('manuel')->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
