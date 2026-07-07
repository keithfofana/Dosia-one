<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaymentRequest;
use App\Models\Invoice;
use App\Models\Payment;
use App\Services\AccountingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $payments = Payment::with('invoice')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($payments);
    }

    public function store(PaymentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $payment = DB::transaction(function () use ($data, $request) {
            $payment = Payment::create([
                'company_id' => $request->user()->company_id,
                'invoice_id' => $data['invoice_id'],
                'amount' => $data['amount'],
                'method' => $data['method'],
            ]);

            $invoice = Invoice::findOrFail($data['invoice_id']);
            $invoice->increment('paid_amount', $data['amount']);
            $this->refreshInvoiceStatus($invoice);

            app(AccountingService::class)->recordPayment($payment->load('invoice'));

            return $payment;
        });

        return response()->json($payment->load('invoice'), 201);
    }

    public function show(Payment $payment): JsonResponse
    {
        return response()->json($payment->load('invoice'));
    }

    public function update(PaymentRequest $request, Payment $payment): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $payment) {
            $oldAmount = $payment->amount;
            $newAmount = $data['amount'] ?? $oldAmount;

            $payment->update(collect($data)->only(['amount', 'method'])->toArray());

            $invoice = $payment->invoice;
            $invoice->increment('paid_amount', $newAmount - $oldAmount);
            $this->refreshInvoiceStatus($invoice);
        });

        return response()->json($payment->fresh()->load('invoice'));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        DB::transaction(function () use ($payment) {
            $invoice = $payment->invoice;
            $invoice->decrement('paid_amount', $payment->amount);
            $payment->delete();
            $this->refreshInvoiceStatus($invoice);
        });

        return response()->json(null, 204);
    }

    private function refreshInvoiceStatus(Invoice $invoice): void
    {
        $invoice->refresh();

        if ($invoice->total > 0 && $invoice->paid_amount >= $invoice->total) {
            $status = 'paye';
        } elseif ($invoice->paid_amount > 0) {
            $status = 'partiel';
        } else {
            $status = 'due';
        }

        $invoice->update(['status' => $status]);
    }
}
