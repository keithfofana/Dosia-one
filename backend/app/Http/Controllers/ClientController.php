<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClientRequest;
use App\Models\Client;
use App\Models\ClientInteraction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $clients = Client::latest()->paginate($request->integer('per_page', 20));

        return response()->json($clients);
    }

    public function store(ClientRequest $request): JsonResponse
    {
        $client = Client::create([
            'company_id' => $request->user()->company_id,
            ...$request->validated(),
        ]);

        return response()->json($client, 201);
    }

    public function show(Client $client): JsonResponse
    {
        return response()->json($client->load('clientInteractions', 'quotes', 'invoices'));
    }

    public function update(ClientRequest $request, Client $client): JsonResponse
    {
        $client->update($request->validated());

        return response()->json($client->fresh());
    }

    public function destroy(Client $client): JsonResponse
    {
        $client->delete();

        return response()->json(null, 204);
    }

    public function history(Client $client): JsonResponse
    {
        $timeline = collect()
            ->concat($client->clientInteractions->map(fn ($i) => [
                'type' => 'interaction',
                'channel' => $i->channel,
                'date' => $i->sent_at ?? $i->created_at,
                'data' => $i,
            ]))
            ->concat($client->quotes->map(fn ($q) => [
                'type' => 'quote',
                'date' => $q->created_at,
                'data' => $q,
            ]))
            ->concat($client->invoices->map(fn ($i) => [
                'type' => 'invoice',
                'date' => $i->created_at,
                'data' => $i,
            ]))
            ->sortByDesc('date')
            ->values();

        return response()->json($timeline);
    }

    public function remindWhatsapp(Request $request, Client $client): JsonResponse
    {
        $request->validate(['message' => ['required', 'string']]);

        $interaction = ClientInteraction::create([
            'client_id' => $client->id,
            'channel' => 'whatsapp',
            'message' => $request->string('message')->toString(),
            'sent_at' => now(),
        ]);

        if (blank(config('services.whatsapp.token'))) {
            return response()->json([
                'interaction' => $interaction,
                'dispatched' => false,
                'note' => "WhatsApp Business API non configurée (WHATSAPP_API_TOKEN manquant) : relance enregistrée mais non envoyée.",
            ], 201);
        }

        // TODO: envoi réel via l'API WhatsApp Business une fois les identifiants configurés.
        return response()->json(['interaction' => $interaction, 'dispatched' => false], 201);
    }

    public function remindEmail(Request $request, Client $client): JsonResponse
    {
        $request->validate(['message' => ['required', 'string']]);

        if (blank($client->email)) {
            return response()->json(['message' => "Ce client n'a pas d'adresse email."], 422);
        }

        $interaction = ClientInteraction::create([
            'client_id' => $client->id,
            'channel' => 'email',
            'message' => $request->string('message')->toString(),
            'sent_at' => now(),
        ]);

        // TODO: envoi réel via Mail::send() / SES une fois un Mailable dédié créé.
        return response()->json([
            'interaction' => $interaction,
            'dispatched' => false,
            'note' => 'Relance enregistrée mais non envoyée : aucun Mailable configuré pour le moment.',
        ], 201);
    }
}
