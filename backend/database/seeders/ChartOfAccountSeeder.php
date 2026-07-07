<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use App\Models\Company;
use App\Models\TaxRate;
use App\Services\AccountingService;
use Illuminate\Database\Seeder;

/**
 * Plan comptable de base inspiré de SYSCOHADA (classes 1 à 7), adapté à une
 * PME commerciale d'Afrique de l'Ouest francophone. Ce n'est pas le plan
 * SYSCOHADA complet (plusieurs centaines de comptes) mais un sous-ensemble
 * représentatif suffisant pour une petite entreprise.
 */
class ChartOfAccountSeeder extends Seeder
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
     * Seede le plan comptable de base et le taux de TVA par defaut pour une
     * entreprise donnee. Reutilise par le seeder de demo (run()) et par
     * AuthController::register() lors de la creation d'une nouvelle entreprise.
     */
    public function createForCompany(Company $company): void
    {
        $accounts = [
            // Classe 1 - Comptes de capitaux
            ['101000', 'Capital social', 'capitaux'],
            ['106000', 'Réserves', 'capitaux'],
            ['120000', "Résultat de l'exercice", 'capitaux'],
            ['161000', 'Emprunts', 'passif'],

            // Classe 2 - Comptes d'immobilisations
            ['211000', 'Terrains', 'actif'],
            ['213000', 'Bâtiments', 'actif'],
            ['218000', 'Matériel et mobilier', 'actif'],
            ['281000', 'Amortissements des immobilisations', 'passif'],

            // Classe 3 - Comptes de stocks
            [AccountingService::STOCKS, 'Stocks de marchandises', 'actif'],
            ['321000', 'Matières premières', 'actif'],
            ['355000', 'Stocks de produits finis', 'actif'],

            // Classe 4 - Comptes de tiers
            [AccountingService::FOURNISSEURS, 'Fournisseurs', 'passif'],
            [AccountingService::CLIENTS, 'Clients', 'actif'],
            ['421000', 'Personnel, rémunérations dues', 'passif'],
            ['431000', 'Sécurité sociale', 'passif'],
            [AccountingService::TVA_DEDUCTIBLE, 'État, TVA déductible', 'actif'],
            [AccountingService::TVA_COLLECTEE, 'État, TVA collectée', 'passif'],
            ['444000', 'État, impôts sur les bénéfices', 'passif'],

            // Classe 5 - Comptes financiers
            [AccountingService::BANQUE, 'Banques', 'actif'],
            [AccountingService::CAISSE, 'Caisse', 'actif'],
            ['585000', 'Virements de fonds', 'actif'],

            // Classe 6 - Comptes de charges
            ['601000', 'Achats de marchandises', 'charge'],
            ['603000', 'Variation de stocks', 'charge'],
            ['605000', 'Autres achats', 'charge'],
            ['611000', 'Transports', 'charge'],
            ['622000', "Rémunérations d'intermédiaires", 'charge'],
            ['641000', 'Rémunérations du personnel', 'charge'],
            [AccountingService::CHARGES_DIVERSES, 'Charges diverses', 'charge'],
            ['661000', "Charges d'intérêts", 'charge'],
            ['681000', 'Dotations aux amortissements', 'charge'],

            // Classe 7 - Comptes de produits
            [AccountingService::VENTES, 'Ventes de marchandises', 'produit'],
            ['706000', 'Prestations de services', 'produit'],
            ['707000', 'Produits accessoires', 'produit'],
            ['771000', 'Produits financiers', 'produit'],
        ];

        foreach ($accounts as [$code, $name, $type]) {
            ChartOfAccount::withoutGlobalScopes()->firstOrCreate(
                ['company_id' => $company->id, 'code' => $code],
                ['name' => $name, 'type' => $type]
            );
        }

        TaxRate::withoutGlobalScopes()->firstOrCreate(
            ['company_id' => $company->id, 'name' => 'TVA normale'],
            ['rate' => 18]
        );
    }
}
