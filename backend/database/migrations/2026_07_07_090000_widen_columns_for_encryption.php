<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Securite avancee - les colonnes qui passent au cast Eloquent `encrypted`
// doivent accueillir un texte chiffre bien plus long que la valeur en clair
// (IV + MAC + valeur, base64). VARCHAR(255) est insuffisant, on passe en TEXT.
return new class extends Migration {
    public function up(): void
    {
        DB::statement('ALTER TABLE clients ALTER COLUMN phone TYPE text');
        DB::statement('ALTER TABLE suppliers ALTER COLUMN phone TYPE text');
        DB::statement('ALTER TABLE bank_accounts ALTER COLUMN account_number TYPE text');
        DB::statement('ALTER TABLE users ALTER COLUMN two_factor_secret TYPE text');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE clients ALTER COLUMN phone TYPE varchar(255)');
        DB::statement('ALTER TABLE suppliers ALTER COLUMN phone TYPE varchar(255)');
        DB::statement('ALTER TABLE bank_accounts ALTER COLUMN account_number TYPE varchar(255)');
        DB::statement('ALTER TABLE users ALTER COLUMN two_factor_secret TYPE varchar(255)');
    }
};
