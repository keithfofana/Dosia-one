<?php

namespace App\Http\Controllers;

use App\Http\Requests\JournalEntryRequest;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JournalEntryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $entries = JournalEntry::with('journalEntryLines.account')
            ->latest('entry_date')
            ->paginate($request->integer('per_page', 20));

        return response()->json($entries);
    }

    public function store(JournalEntryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $companyId = $request->user()->company_id;

        $entry = DB::transaction(function () use ($data, $companyId) {
            $entry = JournalEntry::create([
                'company_id' => $companyId,
                'entry_date' => $data['entry_date'],
                'reference' => $data['reference'] ?? null,
                'description' => $data['description'] ?? null,
                'source' => 'manuel',
            ]);

            $entry->journalEntryLines()->createMany($data['lines']);

            return $entry;
        });

        return response()->json($entry->load('journalEntryLines.account'), 201);
    }

    public function show(JournalEntry $journalEntry): JsonResponse
    {
        return response()->json($journalEntry->load('journalEntryLines.account'));
    }

    public function update(JournalEntryRequest $request, JournalEntry $journalEntry): JsonResponse
    {
        $this->ensureManual($journalEntry);

        $data = $request->validated();

        DB::transaction(function () use ($data, $journalEntry) {
            if (isset($data['lines'])) {
                $journalEntry->journalEntryLines()->delete();
                $journalEntry->journalEntryLines()->createMany($data['lines']);
            }

            $journalEntry->update(collect($data)->except('lines')->toArray());
        });

        return response()->json($journalEntry->fresh()->load('journalEntryLines.account'));
    }

    public function destroy(JournalEntry $journalEntry): JsonResponse
    {
        $this->ensureManual($journalEntry);

        $journalEntry->delete();

        return response()->json(null, 204);
    }

    private function ensureManual(JournalEntry $journalEntry): void
    {
        if ($journalEntry->source === 'auto') {
            throw ValidationException::withMessages([
                'source' => ["Cette écriture a été générée automatiquement (référence « {$journalEntry->reference} ») et ne peut pas être modifiée ou supprimée manuellement, afin de préserver la cohérence du grand livre."],
            ]);
        }
    }
}
