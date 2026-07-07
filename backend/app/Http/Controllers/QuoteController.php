<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\GeneratesDocumentNumber;
use App\Http\Requests\QuoteRequest;
use App\Models\Quote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    use GeneratesDocumentNumber;

    public function index(Request $request): JsonResponse
    {
        $quotes = Quote::with('client')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($quotes);
    }

    public function store(QuoteRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $quote = DB::transaction(function () use ($data, $companyId) {
            $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

            $quote = Quote::create([
                'company_id' => $companyId,
                'client_id' => $data['client_id'],
                'number' => $this->generateNumber(Quote::class, 'DEV', $companyId),
                'status' => 'brouillon',
                'total' => $total,
            ]);

            $quote->quoteItems()->createMany($data['items']);

            return $quote;
        });

        return response()->json($quote->load('quoteItems.product', 'client'), 201);
    }

    public function show(Quote $quote): JsonResponse
    {
        return response()->json($quote->load('quoteItems.product', 'client', 'invoices'));
    }

    public function update(QuoteRequest $request, Quote $quote): JsonResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $quote) {
            if (isset($data['items'])) {
                $total = collect($data['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);
                $quote->quoteItems()->delete();
                $quote->quoteItems()->createMany($data['items']);
                $data['total'] = $total;
            }

            $quote->update(collect($data)->except('items')->toArray());
        });

        return response()->json($quote->fresh()->load('quoteItems.product', 'client'));
    }

    public function destroy(Quote $quote): JsonResponse
    {
        $quote->delete();

        return response()->json(null, 204);
    }
}
