<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(PermissionSeeder::class);

        $company = Company::create([
            'name' => 'Dosia Demo',
            'currency_symbol' => 'FCFA',
        ]);

        User::create([
            'company_id' => $company->id,
            'name' => 'Admin Demo',
            'email' => 'admin@dosia.test',
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);

        $this->call(RoleSeeder::class);
        $this->call(ChartOfAccountSeeder::class);
    }
}
