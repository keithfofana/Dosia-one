<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SettingsController extends Controller
{
    public function activityLog(Request $request): JsonResponse
    {
        $query = ActivityLog::with('user')->latest();

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->integer('user_id'));
        }

        if ($request->filled('module')) {
            $query->where('module', $request->string('module')->toString());
        }

        return response()->json($query->paginate($request->integer('per_page', 50)));
    }

    public function backup(): JsonResponse|BinaryFileResponse
    {
        $pgDump = $this->findPgDump();

        if (! $pgDump) {
            return response()->json([
                'message' => "pg_dump introuvable sur le serveur : la sauvegarde ne peut pas être générée.",
            ], 501);
        }

        $filename = 'backup-' . now()->format('Y-m-d_His') . '.sql';
        $path = storage_path('app/backups/' . $filename);

        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        $result = Process::env(['PGPASSWORD' => config('database.connections.pgsql.password')])
            ->run([
                $pgDump,
                '--host=' . config('database.connections.pgsql.host'),
                '--port=' . config('database.connections.pgsql.port'),
                '--username=' . config('database.connections.pgsql.username'),
                '--file=' . $path,
                config('database.connections.pgsql.database'),
            ]);

        if (! $result->successful()) {
            return response()->json([
                'message' => 'Échec de la sauvegarde.',
                'error' => $result->errorOutput(),
            ], 500);
        }

        return response()->download($path)->deleteFileAfterSend();
    }

    private function findPgDump(): ?string
    {
        $result = Process::run(stripos(PHP_OS, 'WIN') === 0 ? 'where pg_dump' : 'which pg_dump');

        if (! $result->successful()) {
            return null;
        }

        return trim(explode("\n", $result->output())[0]);
    }
}
