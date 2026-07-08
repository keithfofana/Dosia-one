<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\GeneratesDocumentNumber;
use App\Http\Requests\InvoiceRequest;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Quote;
use App\Models\StockMovement;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InvoiceController extends Controller
{
    use GeneratesDocumentNumber;

    public function index(Request $request): JsonResponse
    {
        $invoices = Invoice::with('client')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($invoices);
    }

    public function store(InvoiceRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $invoice = DB::transaction(function () use ($data, $companyId) {
            $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

            $invoice = Invoice::create([
                'company_id' => $companyId,
                'client_id' => $data['client_id'],
                'quote_id' => $data['quote_id'] ?? null,
                'number' => $this->generateNumber(Invoice::class, 'FAC', $companyId),
                'status' => 'due',
                'total' => $total,
                'paid_amount' => 0,
                'due_date' => $data['due_date'] ?? null,
            ]);

            $invoice->invoiceItems()->createMany($data['items']);
            $this->moveStockForItems($data['items'], $invoice, 'sortie', "Vente facture #{$invoice->number}");

            if (! empty($data['quote_id'])) {
                Quote::whereKey($data['quote_id'])->update(['status' => 'converti']);
            }

            app(AccountingService::class)->recordInvoice($invoice);

            return $invoice;
        });

        return response()->json($invoice->load('invoiceItems.product', 'client'), 201);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($invoice->load('invoiceItems.product', 'client', 'payments', 'deliveryNotes'));
    }

    public function update(InvoiceRequest $request, Invoice $invoice): JsonResponse
    {
        $data = $request->validated();

        // Annuler une facture (au lieu de la supprimer) : on remet le stock
        // vendu, on garde la facture comme trace historique. Toute autre
        // modification simultanee des lignes est ignoree dans ce cas.
        if (($data['status'] ?? null) === 'annule' && $invoice->status !== 'annule') {
            DB::transaction(function () use ($invoice) {
                $this->moveStockForItems(
                    $invoice->invoiceItems->map(fn ($item) => ['product_id' => $item->product_id, 'quantity' => $item->quantity])->all(),
                    $invoice,
                    'entree',
                    "Annulation facture #{$invoice->number}"
                );

                $invoice->update(['status' => 'annule']);
            });

            return response()->json($invoice->fresh()->load('invoiceItems.product', 'client'));
        }

        if ($invoice->payments()->exists() && (isset($data['items']) || isset($data['status']))) {
            throw ValidationException::withMessages([
                'items' => ["Cette facture a déjà des paiements enregistrés : ses lignes et son statut ne peuvent plus être modifiés directement. Utilisez l'annulation si nécessaire."],
            ]);
        }

        DB::transaction(function () use ($data, $invoice) {
            if (isset($data['items'])) {
                $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

                $this->moveStockForItems(
                    $invoice->invoiceItems->map(fn ($item) => ['product_id' => $item->product_id, 'quantity' => $item->quantity])->all(),
                    $invoice,
                    'entree',
                    "Annulation lignes facture #{$invoice->number}"
                );

                $invoice->invoiceItems()->delete();
                $invoice->invoiceItems()->createMany($data['items']);
                $this->moveStockForItems($data['items'], $invoice, 'sortie', "Modification facture #{$invoice->number}");

                $data['total'] = $total;
            }

            $invoice->update(collect($data)->except('items')->toArray());
        });

        return response()->json($invoice->fresh()->load('invoiceItems.product', 'client'));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        if ($invoice->status !== 'due' || $invoice->payments()->exists()) {
            throw ValidationException::withMessages([
                'status' => ["Cette facture a déjà des paiements ou n'est plus au statut « due » : elle ne peut pas être supprimée. Annulez-la à la place."],
            ]);
        }

        DB::transaction(function () use ($invoice) {
            $this->moveStockForItems(
                $invoice->invoiceItems->map(fn ($item) => ['product_id' => $item->product_id, 'quantity' => $item->quantity])->all(),
                $invoice,
                'entree',
                "Suppression facture #{$invoice->number}"
            );

            $invoice->delete();
        });

        return response()->json(null, 204);
    }

    private function moveStockForItems(iterable $items, Invoice $invoice, string $type, string $reason): void
    {
        foreach ($items as $item) {
            $item = (array) $item;
            $delta = $type === 'entree' ? $item['quantity'] : -$item['quantity'];

            Product::whereKey($item['product_id'])->increment('quantity', $delta);

            StockMovement::create([
                'company_id' => $invoice->company_id,
                'product_id' => $item['product_id'],
                'type' => $type,
                'quantity' => $item['quantity'],
                'reason' => $reason,
                'user_id' => request()->user()?->id,
            ]);
        }
    }
}
