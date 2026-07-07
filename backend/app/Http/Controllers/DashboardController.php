<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\CashRegister;
use App\Models\Client;
use App\Models\Contract;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Salary;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $caTotal = (float) Invoice::sum('total');
        $caMois = (float) Invoice::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->sum('total');

        $depenses = (float) PurchaseOrder::sum('total') + (float) Salary::sum('amount');
        $tresorerie = (float) BankAccount::sum('balance') + (float) CashRegister::sum('balance');

        return response()->json([
            'chiffre_affaires' => [
                'total' => $caTotal,
                'mois_courant' => $caMois,
            ],
            'depenses_total' => $depenses,
            'benefice_estime' => $caTotal - $depenses,
            'tresorerie' => $tresorerie,
        ]);
    }

    public function alerts(): JsonResponse
    {
        $lowStock = Product::whereColumn('quantity', '<=', 'alert_threshold')->get(['id', 'name', 'quantity', 'alert_threshold']);

        $overdueInvoices = Invoice::whereIn('status', ['due', 'partiel'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now())
            ->with('client')
            ->get(['id', 'number', 'client_id', 'total', 'paid_amount', 'due_date']);

        $expiringContracts = Contract::whereNotNull('end_date')
            ->whereBetween('end_date', [now(), now()->addDays(30)])
            ->with('employee')
            ->get();

        $upcomingBirthdays = Client::whereNotNull('birthday')
            ->whereRaw("to_char(birthday, 'MM-DD') between to_char(now(), 'MM-DD') and to_char(now() + interval '30 days', 'MM-DD')")
            ->get(['id', 'name', 'birthday']);

        return response()->json([
            'stock_faible' => $lowStock,
            'factures_impayees' => $overdueInvoices,
            'contrats_expirant' => $expiringContracts,
            'anniversaires_clients' => $upcomingBirthdays,
        ]);
    }

    public function realtimeStats(): JsonResponse
    {
        return response()->json([
            'ventes_du_jour' => [
                'count' => Invoice::whereDate('created_at', today())->count(),
                'total' => (float) Invoice::whereDate('created_at', today())->sum('total'),
            ],
            'clients_actifs' => Client::count(),
            'commandes_fournisseur_en_attente' => PurchaseOrder::whereIn('status', ['brouillon', 'envoyee', 'recue_partiel'])->count(),
            'produits_stock_faible' => Product::whereColumn('quantity', '<=', 'alert_threshold')->count(),
        ]);
    }
}
