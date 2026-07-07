<?php

namespace App\Http\Controllers;

use App\Exports\TrialBalanceExport;
use App\Models\ChartOfAccount;
use App\Models\JournalEntryLine;
use App\Models\TaxRate;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class AccountingController extends Controller
{
    public function ledger(Request $request): JsonResponse
    {
        $query = JournalEntryLine::query()
            ->with('account', 'journalEntry')
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_entry_lines.journal_entry_id')
            ->select('journal_entry_lines.*')
            ->orderBy('journal_entries.entry_date');

        if ($request->filled('account_id')) {
            $query->where('journal_entry_lines.account_id', $request->integer('account_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('journal_entries.entry_date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('journal_entries.entry_date', '<=', $request->date('to'));
        }

        $lines = $query->get();
        $runningBalance = 0;

        $movements = $lines->map(function (JournalEntryLine $line) use (&$runningBalance) {
            $runningBalance += $line->debit - $line->credit;

            return [
                'date' => $line->journalEntry->entry_date,
                'reference' => $line->journalEntry->reference,
                'description' => $line->journalEntry->description,
                'account' => $line->account->code . ' - ' . $line->account->name,
                'debit' => $line->debit,
                'credit' => $line->credit,
                'running_balance' => $runningBalance,
            ];
        });

        return response()->json($movements);
    }

    public function balance(): JsonResponse
    {
        return response()->json($this->computeTrialBalance());
    }

    public function balanceSheet(): JsonResponse
    {
        $balances = $this->computeTrialBalance();

        $byType = collect($balances)->groupBy('type');
        $actif = $byType->get('actif', collect())->sum('balance');
        $passif = $byType->get('passif', collect())->sum('balance');
        $capitaux = $byType->get('capitaux', collect())->sum('balance');

        return response()->json([
            'actif' => [
                'accounts' => $byType->get('actif', collect())->values(),
                'total' => $actif,
            ],
            'passif' => [
                'accounts' => $byType->get('passif', collect())->values(),
                'total' => $passif,
            ],
            'capitaux' => [
                'accounts' => $byType->get('capitaux', collect())->values(),
                'total' => $capitaux,
            ],
            'equilibre' => $actif - ($passif + $capitaux),
        ]);
    }

    public function incomeStatement(): JsonResponse
    {
        $balances = $this->computeTrialBalance();
        $byType = collect($balances)->groupBy('type');

        $produits = $byType->get('produit', collect())->sum('balance');
        $charges = $byType->get('charge', collect())->sum('balance');

        return response()->json([
            'produits' => [
                'accounts' => $byType->get('produit', collect())->values(),
                'total' => $produits,
            ],
            'charges' => [
                'accounts' => $byType->get('charge', collect())->values(),
                'total' => $charges,
            ],
            'resultat_net' => $produits - $charges,
        ]);
    }

    public function vat(): JsonResponse
    {
        $vatAccounts = ChartOfAccount::where('name', 'like', '%tva%')
            ->orWhere('name', 'like', '%TVA%')
            ->get();

        $details = $vatAccounts->map(function (ChartOfAccount $account) {
            $totalDebit = (float) $account->journalEntryLines()->sum('debit');
            $totalCredit = (float) $account->journalEntryLines()->sum('credit');

            return [
                'account' => $account->code . ' - ' . $account->name,
                'debit' => $totalDebit,
                'credit' => $totalCredit,
                'solde' => $totalCredit - $totalDebit,
            ];
        });

        return response()->json([
            'tax_rates' => TaxRate::all(['id', 'name', 'rate']),
            'comptes_tva' => $details,
            'net_a_payer' => $details->sum('solde'),
        ]);
    }

    public function export(string $format): BinaryFileResponse|Response
    {
        abort_unless(in_array($format, ['excel', 'pdf']), 422, 'Format invalide (excel ou pdf attendu).');

        $rows = $this->computeTrialBalance();

        if ($format === 'excel') {
            return Excel::download(new TrialBalanceExport($rows), 'balance-generale.xlsx');
        }

        return Pdf::loadView('exports.trial-balance', ['rows' => $rows])
            ->download('balance-generale.pdf');
    }

    private function computeTrialBalance(): array
    {
        return ChartOfAccount::query()
            ->withSum('journalEntryLines as total_debit', 'debit')
            ->withSum('journalEntryLines as total_credit', 'credit')
            ->orderBy('code')
            ->get()
            ->map(function (ChartOfAccount $account) {
                $debit = (float) ($account->total_debit ?? 0);
                $credit = (float) ($account->total_credit ?? 0);
                $balance = in_array($account->type, ['actif', 'charge'])
                    ? $debit - $credit
                    : $credit - $debit;

                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'total_debit' => $debit,
                    'total_credit' => $credit,
                    'balance' => $balance,
                ];
            })
            ->toArray();
    }
}
