<?php

namespace App\Services;

use App\Models\CashMovement;
use App\Models\ChartOfAccount;
use App\Models\Invoice;
use App\Models\JournalEntry;
use App\Models\Payment;
use App\Models\ProductionCost;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Salary;
use App\Models\TaxRate;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Génère automatiquement les écritures comptables (débit/crédit équilibrés)
 * pour les événements métier existants. Ne bloque jamais l'action métier
 * elle-même si le plan comptable de l'entreprise n'est pas (encore) seedé.
 */
class AccountingService
{
    public const CLIENTS = '411000';
    public const FOURNISSEURS = '401000';
    public const VENTES = '701000';
    public const TVA_COLLECTEE = '445700';
    public const TVA_DEDUCTIBLE = '445660';
    public const BANQUE = '512000';
    public const CAISSE = '571000';
    public const STOCKS = '311000';
    public const CHARGES_DIVERSES = '628000';
    public const REMUNERATIONS_PERSONNEL = '641000';
    public const MATIERES_PREMIERES = '321000';
    public const STOCKS_PRODUITS_FINIS = '355000';

    public function recordInvoice(Invoice $invoice): void
    {
        $clients = $this->account($invoice->company_id, self::CLIENTS);
        $ventes = $this->account($invoice->company_id, self::VENTES);

        if (! $clients || ! $ventes) {
            $this->logMissingAccounts($invoice->company_id, 'facture');

            return;
        }

        $total = (float) $invoice->total;
        $taxRate = TaxRate::withoutGlobalScopes()->where('company_id', $invoice->company_id)->first();
        $tvaCollectee = $taxRate ? $this->account($invoice->company_id, self::TVA_COLLECTEE) : null;

        $lines = [];

        if ($taxRate && $tvaCollectee) {
            $ht = round($total / (1 + ((float) $taxRate->rate / 100)), 2);
            $tva = round($total - $ht, 2);

            $lines[] = ['account_id' => $clients->id, 'debit' => $total, 'credit' => 0];
            $lines[] = ['account_id' => $ventes->id, 'debit' => 0, 'credit' => $ht];
            $lines[] = ['account_id' => $tvaCollectee->id, 'debit' => 0, 'credit' => $tva];
        } else {
            $lines[] = ['account_id' => $clients->id, 'debit' => $total, 'credit' => 0];
            $lines[] = ['account_id' => $ventes->id, 'debit' => 0, 'credit' => $total];
        }

        $this->createEntry(
            $invoice->company_id,
            $invoice->number,
            "Facture {$invoice->number}",
            $lines
        );
    }

    public function recordPayment(Payment $payment): void
    {
        $invoice = $payment->invoice;
        $clients = $this->account($payment->company_id, self::CLIENTS);
        $treasuryCode = $payment->method === 'especes' ? self::CAISSE : self::BANQUE;
        $treasury = $this->account($payment->company_id, $treasuryCode);

        if (! $clients || ! $treasury) {
            $this->logMissingAccounts($payment->company_id, 'paiement');

            return;
        }

        $amount = (float) $payment->amount;

        $this->createEntry(
            $payment->company_id,
            $invoice?->number ?? (string) $payment->invoice_id,
            "Paiement facture {$invoice?->number}",
            [
                ['account_id' => $treasury->id, 'debit' => $amount, 'credit' => 0],
                ['account_id' => $clients->id, 'debit' => 0, 'credit' => $amount],
            ]
        );
    }

    public function recordGoodsReceipt(PurchaseOrder $purchaseOrder, float $totalValue): void
    {
        if ($totalValue <= 0) {
            return;
        }

        $stocks = $this->account($purchaseOrder->company_id, self::STOCKS);
        $fournisseurs = $this->account($purchaseOrder->company_id, self::FOURNISSEURS);

        if (! $stocks || ! $fournisseurs) {
            $this->logMissingAccounts($purchaseOrder->company_id, 'réception marchandise');

            return;
        }

        $this->createEntry(
            $purchaseOrder->company_id,
            $purchaseOrder->number,
            "Réception commande fournisseur {$purchaseOrder->number}",
            [
                ['account_id' => $stocks->id, 'debit' => $totalValue, 'credit' => 0],
                ['account_id' => $fournisseurs->id, 'debit' => 0, 'credit' => $totalValue],
            ]
        );
    }

    public function recordSalaryPayment(Salary $salary): void
    {
        $companyId = $salary->employee->company_id;
        $charges = $this->account($companyId, self::REMUNERATIONS_PERSONNEL);
        $banque = $this->account($companyId, self::BANQUE);

        if (! $charges || ! $banque) {
            $this->logMissingAccounts($companyId, 'salaire payé');

            return;
        }

        $amount = (float) $salary->amount;

        $this->createEntry(
            $companyId,
            "SAL-{$salary->id}",
            "Salaire {$salary->employee->name} - " . Carbon::parse($salary->period_month)->translatedFormat('F Y'),
            [
                ['account_id' => $charges->id, 'debit' => $amount, 'credit' => 0],
                ['account_id' => $banque->id, 'debit' => 0, 'credit' => $amount],
            ]
        );
    }

    public function recordProductionCompletion(ProductionOrder $order, ProductionCost $cost): void
    {
        $companyId = $order->company_id;
        $stockProduits = $this->account($companyId, self::STOCKS_PRODUITS_FINIS);
        $matieresPremieres = $this->account($companyId, self::MATIERES_PREMIERES);

        if (! $stockProduits || ! $matieresPremieres) {
            $this->logMissingAccounts($companyId, 'production terminée');

            return;
        }

        $materialCost = (float) $cost->material_cost;
        $laborCost = (float) $cost->labor_cost;
        $overheadCost = (float) $cost->overhead_cost;

        $credits = [['account_id' => $matieresPremieres->id, 'amount' => $materialCost]];

        if ($laborCost > 0 && $remunerations = $this->account($companyId, self::REMUNERATIONS_PERSONNEL)) {
            $credits[] = ['account_id' => $remunerations->id, 'amount' => $laborCost];
        }

        if ($overheadCost > 0 && $charges = $this->account($companyId, self::CHARGES_DIVERSES)) {
            $credits[] = ['account_id' => $charges->id, 'amount' => $overheadCost];
        }

        $total = array_sum(array_column($credits, 'amount'));

        if ($total <= 0) {
            return;
        }

        $lines = [['account_id' => $stockProduits->id, 'debit' => $total, 'credit' => 0]];

        foreach ($credits as $credit) {
            $lines[] = ['account_id' => $credit['account_id'], 'debit' => 0, 'credit' => $credit['amount']];
        }

        $this->createEntry(
            $companyId,
            "PROD-{$order->id}",
            "Production terminée - ordre #{$order->id}",
            $lines
        );
    }

    public function recordCashWithdrawal(CashMovement $movement): void
    {
        $companyId = $movement->cashRegister->company_id;
        $charges = $this->account($companyId, self::CHARGES_DIVERSES);
        $caisse = $this->account($companyId, self::CAISSE);

        if (! $charges || ! $caisse) {
            $this->logMissingAccounts($companyId, 'décaissement');

            return;
        }

        $amount = (float) $movement->amount;

        $this->createEntry(
            $companyId,
            (string) $movement->id,
            $movement->reason ?: 'Décaissement de caisse',
            [
                ['account_id' => $charges->id, 'debit' => $amount, 'credit' => 0],
                ['account_id' => $caisse->id, 'debit' => 0, 'credit' => $amount],
            ]
        );
    }

    private function account(int $companyId, string $code): ?ChartOfAccount
    {
        return ChartOfAccount::withoutGlobalScopes()
            ->where('company_id', $companyId)
            ->where('code', $code)
            ->first();
    }

    /**
     * @param  array<int, array{account_id: int, debit: float, credit: float}>  $lines
     */
    private function createEntry(int $companyId, string $reference, string $description, array $lines): void
    {
        DB::transaction(function () use ($companyId, $reference, $description, $lines) {
            $entry = JournalEntry::withoutGlobalScopes()->create([
                'company_id' => $companyId,
                'entry_date' => now(),
                'reference' => $reference,
                'description' => $description,
                'source' => 'auto',
            ]);

            $entry->journalEntryLines()->createMany($lines);
        });
    }

    private function logMissingAccounts(int $companyId, string $event): void
    {
        Log::warning("Écriture comptable non générée pour « {$event} » : plan comptable incomplet pour l'entreprise #{$companyId}.");
    }
}
