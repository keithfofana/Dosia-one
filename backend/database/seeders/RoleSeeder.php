<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::first();

        if (! $company) {
            return;
        }

        $this->createForCompany($company);
    }

    /**
     * Cree les roles de base (Gerant : toutes les permissions, Vendeur : permissions
     * limitees) pour une entreprise donnee. Reutilise par le seeder de demo (run())
     * et par AuthController::register() lors de la creation d'une nouvelle entreprise.
     */
    public function createForCompany(Company $company): Role
    {
        $gerant = Role::firstOrCreate(['company_id' => $company->id, 'name' => 'Gérant']);
        $gerant->permissions()->sync(Permission::pluck('id'));

        $vendeurModules = ['ventes', 'stock', 'crm'];
        $vendeur = Role::firstOrCreate(['company_id' => $company->id, 'name' => 'Vendeur']);
        $vendeur->permissions()->sync(Permission::whereIn('module', $vendeurModules)->pluck('id'));

        User::where('company_id', $company->id)
            ->whereNull('role_id')
            ->update(['role_id' => $gerant->id]);

        return $gerant;
    }
}
