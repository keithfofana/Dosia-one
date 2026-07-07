<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $modules = ['ventes', 'stock', 'achats', 'crm', 'comptabilite', 'tresorerie', 'rh', 'production', 'documents', 'parametres'];
        $actions = ['view', 'create', 'update', 'delete'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(
                    ['slug' => "{$module}.{$action}"],
                    ['module' => $module, 'action' => $action]
                );
            }
        }
    }
}
