<?php

namespace App\Http\Controllers;

use App\Http\Requests\DocumentRequest;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $documents = Document::with('uploadedBy')->latest()->paginate($request->integer('per_page', 20));

        return response()->json($documents);
    }

    public function store(DocumentRequest $request): JsonResponse
    {
        $path = $request->file('file')->store('documents');

        $document = Document::create([
            'company_id' => $request->user()->company_id,
            'title' => $request->validated('title'),
            'type' => $request->validated('type'),
            'file_path' => $path,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json($document->load('uploadedBy'), 201);
    }

    public function show(Document $document): JsonResponse
    {
        return response()->json($document->load('uploadedBy'));
    }

    public function update(DocumentRequest $request, Document $document): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('file')) {
            Storage::delete($document->file_path);
            $data['file_path'] = $request->file('file')->store('documents');
        }

        $document->update(collect($data)->except('file')->toArray());

        return response()->json($document->fresh()->load('uploadedBy'));
    }

    public function destroy(Document $document): JsonResponse
    {
        Storage::delete($document->file_path);
        $document->delete();

        return response()->json(null, 204);
    }

    public function download(Document $document): StreamedResponse
    {
        abort_unless(Storage::exists($document->file_path), 404, 'Fichier introuvable sur le disque de stockage.');

        return Storage::download($document->file_path, $document->title);
    }
}
