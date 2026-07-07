<?php

namespace App\Http\Controllers;

use App\Models\BankAccount;
use App\Models\CashRegister;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use Illuminate\Http\JsonResponse;

class TreasuryController extends Controller
{
    public function forecast(): JsonResponse
    {
        $bankBalance = (float) BankAccount::sum('balance');
        $cashBalance = (float) CashRegister::sum('balance');
        $currentTreasury = $bankBalance + $cashBalance;

        $pendingInvoices = Invoice::whereIn('status', ['due', 'partiel'])->get();
        $expectedInflows = (float) $pendingInvoices->sum(fn ($invoice) => $invoice->total - $invoice->paid_amount);

        $pendingOrders = PurchaseOrder::whereIn('status', ['brouillon', 'envoyee', 'recue_partiel'])->get();
        $expectedOutflows = (float) $pendingOrders->sum('total');

        return response()->json([
            'current_treasury' => [
                'bank' => $bankBalance,
                'cash' => $cashBalance,
                'total' => $currentTreasury,
            ],
            'expected_inflows' => [
                'total' => $expectedInflows,
                'pending_invoices_count' => $pendingInvoices->count(),
            ],
            'expected_outflows' => [
                'total' => $expectedOutflows,
                'pending_orders_count' => $pendingOrders->count(),
            ],
            'projected_balance' => $currentTreasury + $expectedInflows - $expectedOutflows,
        ]);
    }
}
