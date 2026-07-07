<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\NotificationCustom;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockMovement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiController extends Controller
{
    public function salesForecast(): JsonResponse
    {
        $monthlyTotals = Invoice::selectRaw("date_trunc('month', created_at) as month, sum(total) as total")
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $average = $monthlyTotals->avg('total') ?? 0;
        $lastThree = $monthlyTotals->slice(-3)->avg('total') ?? $average;

        return response()->json([
            'historique' => $monthlyTotals,
            'prevision_mois_prochain' => round($lastThree, 2),
            'methode' => 'moyenne mobile des 3 derniers mois',
        ]);
    }

    public function stockForecast(): JsonResponse
    {
        $products = Product::all();

        $forecast = $products->map(function (Product $product) {
            $dailyAverage = StockMovement::where('product_id', $product->id)
                ->where('type', 'sortie')
                ->where('created_at', '>=', now()->subDays(30))
                ->avg('quantity');

            $dailyAverage = $dailyAverage ?: 0;
            $daysRemaining = $dailyAverage > 0 ? round($product->quantity / $dailyAverage, 1) : null;

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'quantity' => $product->quantity,
                'consommation_moyenne_jour' => round($dailyAverage, 2),
                'jours_avant_rupture' => $daysRemaining,
            ];
        })->filter(fn ($p) => $p['jours_avant_rupture'] !== null)
            ->sortBy('jours_avant_rupture')
            ->values();

        return response()->json($forecast);
    }

    public function profitAnalysis(): JsonResponse
    {
        $invoices = Invoice::with('invoiceItems.product')->get();

        $totalRevenue = 0;
        $totalCost = 0;

        foreach ($invoices as $invoice) {
            foreach ($invoice->invoiceItems as $item) {
                $totalRevenue += $item->quantity * $item->unit_price;
                $totalCost += $item->quantity * ($item->product->purchase_price ?? 0);
            }
        }

        $margin = $totalRevenue - $totalCost;
        $marginRate = $totalRevenue > 0 ? round(($margin / $totalRevenue) * 100, 2) : 0;

        return response()->json([
            'chiffre_affaires' => $totalRevenue,
            'cout_marchandises' => $totalCost,
            'marge_brute' => $margin,
            'taux_marge_pct' => $marginRate,
        ]);
    }

    public function anomalies(): JsonResponse
    {
        $anomalies = [];

        $invoiceTotals = Invoice::pluck('total')->map(fn ($v) => (float) $v);
        if ($invoiceTotals->count() >= 3) {
            $mean = $invoiceTotals->avg();
            $variance = $invoiceTotals->sum(fn ($v) => ($v - $mean) ** 2) / $invoiceTotals->count();
            $stdDev = sqrt($variance);

            Invoice::all()->each(function (Invoice $invoice) use (&$anomalies, $mean, $stdDev) {
                if ($stdDev > 0 && abs($invoice->total - $mean) > 2 * $stdDev) {
                    $anomalies[] = [
                        'type' => 'facture_montant_inhabituel',
                        'invoice_id' => $invoice->id,
                        'number' => $invoice->number,
                        'total' => $invoice->total,
                        'moyenne' => round($mean, 2),
                    ];
                }
            });
        }

        $largeMovements = StockMovement::where('created_at', '>=', now()->subDays(30))->get();
        if ($largeMovements->count() >= 3) {
            $mean = $largeMovements->avg('quantity');
            $variance = $largeMovements->sum(fn ($m) => ($m->quantity - $mean) ** 2) / $largeMovements->count();
            $stdDev = sqrt($variance);

            $largeMovements->each(function ($movement) use (&$anomalies, $mean, $stdDev) {
                if ($stdDev > 0 && abs($movement->quantity - $mean) > 2 * $stdDev) {
                    $anomalies[] = [
                        'type' => 'mouvement_stock_inhabituel',
                        'stock_movement_id' => $movement->id,
                        'product_id' => $movement->product_id,
                        'quantity' => $movement->quantity,
                        'moyenne' => round($mean, 2),
                    ];
                }
            });
        }

        return response()->json($anomalies);
    }

    public function purchaseSuggestions(): JsonResponse
    {
        $suggestions = Product::whereColumn('quantity', '<=', 'alert_threshold')
            ->get()
            ->map(fn (Product $product) => [
                'product_id' => $product->id,
                'name' => $product->name,
                'quantity' => $product->quantity,
                'alert_threshold' => $product->alert_threshold,
                'quantite_suggeree' => max($product->alert_threshold * 2 - $product->quantity, $product->alert_threshold),
            ]);

        return response()->json($suggestions);
    }

    public function assistant(Request $request): JsonResponse
    {
        $request->validate(['message' => ['required', 'string']]);

        $context = $this->businessContextSummary();

        return $this->callClaude(
            "Tu es l'assistant IA de Dosia One, un ERP pour PME. Contexte actuel de l'entreprise :\n{$context}",
            $request->string('message')->toString()
        );
    }

    public function generateReport(Request $request): JsonResponse
    {
        $request->validate(['sujet' => ['nullable', 'string']]);

        $context = $this->businessContextSummary();
        $sujet = $request->string('sujet')->toString() ?: 'un rapport de synthèse général de l\'activité';

        return $this->callClaude(
            "Tu es l'assistant IA de Dosia One, un ERP pour PME. Rédige un rapport clair et structuré en français à partir de ces données :\n{$context}",
            "Génère {$sujet}."
        );
    }

    public function notifications(Request $request): JsonResponse
    {
        $notifications = NotificationCustom::latest()->paginate($request->integer('per_page', 20));

        return response()->json($notifications);
    }

    private function businessContextSummary(): string
    {
        $lowStock = Product::whereColumn('quantity', '<=', 'alert_threshold')->count();
        $unpaidInvoices = Invoice::whereIn('status', ['due', 'partiel'])->count();
        $pendingOrders = PurchaseOrder::whereIn('status', ['brouillon', 'envoyee', 'recue_partiel'])->count();
        $revenue = Invoice::sum('total');

        return "- Chiffre d'affaires total: {$revenue}\n"
            . "- Produits en stock faible: {$lowStock}\n"
            . "- Factures impayées ou partielles: {$unpaidInvoices}\n"
            . "- Commandes fournisseurs en attente: {$pendingOrders}";
    }

    private function callClaude(string $system, string $userMessage): JsonResponse
    {
        $apiKey = config('services.anthropic.key');

        if (blank($apiKey)) {
            return response()->json([
                'message' => "Assistant IA non configuré (ANTHROPIC_API_KEY manquant).",
            ], 501);
        }

        $response = Http::withHeaders([
            'x-api-key' => $apiKey,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ])->post('https://api.anthropic.com/v1/messages', [
            'model' => 'claude-opus-4-8',
            'max_tokens' => 1024,
            'system' => $system,
            'messages' => [
                ['role' => 'user', 'content' => $userMessage],
            ],
        ]);

        if ($response->failed()) {
            return response()->json([
                'message' => "Erreur lors de l'appel à l'assistant IA.",
                'error' => $response->json('error.message', $response->body()),
            ], 502);
        }

        $text = collect($response->json('content', []))
            ->firstWhere('type', 'text')['text'] ?? '';

        return response()->json(['response' => $text]);
    }
}
