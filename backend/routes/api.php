<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// ==========================================
// AUTH & SECURITE
// ==========================================
// throttle:6,1 = 6 tentatives / minute / IP, pour limiter le bruteforce sur ces
// endpoints publics (login, creation d'entreprise, code 2FA).
Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:6,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');          // email OU téléphone
Route::post('/auth/2fa/verify', [AuthController::class, 'verifyTwoFactor'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // --- 2FA (gestion par l'utilisateur lui-même, sur son propre compte) ---
    Route::post('/auth/2fa/enable', [\App\Http\Controllers\TwoFactorController::class, 'enable']);
    Route::post('/auth/2fa/confirm', [\App\Http\Controllers\TwoFactorController::class, 'confirm']);
    Route::post('/auth/2fa/disable', [\App\Http\Controllers\TwoFactorController::class, 'disable']);

    // --- Sessions actives / tokens Sanctum (appareils connectés) ---
    Route::get('/auth/sessions', [\App\Http\Controllers\SessionController::class, 'index']);
    Route::delete('/auth/sessions/{token}', [\App\Http\Controllers\SessionController::class, 'destroy']);

    // --- Preferences personnelles (langue, ...) ---
    Route::patch('/profile/locale', [\App\Http\Controllers\ProfileController::class, 'updateLocale']);

    // ==========================================
    // 1. TABLEAU DE BORD
    // ==========================================
    Route::get('/dashboard/summary', [\App\Http\Controllers\DashboardController::class, 'summary']);   // CA, bénéfices, dépenses, trésorerie
    Route::get('/dashboard/alerts', [\App\Http\Controllers\DashboardController::class, 'alerts']);
    Route::get('/dashboard/realtime-stats', [\App\Http\Controllers\DashboardController::class, 'realtimeStats']);

    // ==========================================
    // 2. VENTES
    // ==========================================
    Route::apiResource('quotes', \App\Http\Controllers\QuoteController::class);
    Route::apiResource('invoices', \App\Http\Controllers\InvoiceController::class);
    Route::apiResource('delivery-notes', \App\Http\Controllers\DeliveryNoteController::class);
    Route::apiResource('payments', \App\Http\Controllers\PaymentController::class);
    Route::apiResource('product-returns', \App\Http\Controllers\ProductReturnController::class);

    // ==========================================
    // 3. STOCK
    // ==========================================
    Route::apiResource('products', \App\Http\Controllers\ProductController::class);
    Route::get('/stock-movements/variation', [\App\Http\Controllers\StockMovementController::class, 'variation']);
    Route::apiResource('stock-movements', \App\Http\Controllers\StockMovementController::class);
    Route::apiResource('inventory-counts', \App\Http\Controllers\InventoryCountController::class);
    Route::apiResource('suppliers', \App\Http\Controllers\SupplierController::class);
    Route::post('/products/{product}/barcode', [\App\Http\Controllers\ProductController::class, 'generateBarcode']);
    Route::post('/products/{product}/qrcode', [\App\Http\Controllers\ProductController::class, 'generateQrcode']);

    // ==========================================
    // 4. ACHATS (reserve aux roles ayant la permission achats.view)
    // ==========================================
    Route::middleware('permission:achats.view')->group(function () {
        Route::apiResource('purchase-requests', \App\Http\Controllers\PurchaseRequestController::class);
        Route::apiResource('purchase-orders', \App\Http\Controllers\PurchaseOrderController::class);
        Route::post('/purchase-orders/{purchaseOrder}/receive', [\App\Http\Controllers\PurchaseOrderController::class, 'receive']);
    });

    // ==========================================
    // 5. CRM
    // ==========================================
    Route::apiResource('clients', \App\Http\Controllers\ClientController::class);
    Route::get('/clients/{client}/history', [\App\Http\Controllers\ClientController::class, 'history']);
    Route::post('/clients/{client}/remind/whatsapp', [\App\Http\Controllers\ClientController::class, 'remindWhatsapp']);
    Route::post('/clients/{client}/remind/email', [\App\Http\Controllers\ClientController::class, 'remindEmail']);

    // ==========================================
    // 6. COMPTABILITE (reserve aux roles ayant la permission comptabilite.view)
    // ==========================================
    Route::middleware('permission:comptabilite.view')->group(function () {
        Route::apiResource('chart-of-accounts', \App\Http\Controllers\ChartOfAccountController::class);
        Route::apiResource('journal-entries', \App\Http\Controllers\JournalEntryController::class);
        Route::get('/accounting/ledger', [\App\Http\Controllers\AccountingController::class, 'ledger']);          // Grand livre
        Route::get('/accounting/balance', [\App\Http\Controllers\AccountingController::class, 'balance']);         // Balance
        Route::get('/accounting/balance-sheet', [\App\Http\Controllers\AccountingController::class, 'balanceSheet']);   // Bilan
        Route::get('/accounting/income-statement', [\App\Http\Controllers\AccountingController::class, 'incomeStatement']);// Compte de résultat
        Route::get('/accounting/vat', [\App\Http\Controllers\AccountingController::class, 'vat']);              // TVA
        Route::get('/accounting/export/{format}', [\App\Http\Controllers\AccountingController::class, 'export']); // excel | pdf
    });

    // ==========================================
    // 7. TRESORERIE (reserve aux roles ayant la permission tresorerie.view)
    // ==========================================
    Route::middleware('permission:tresorerie.view')->group(function () {
        Route::apiResource('bank-accounts', \App\Http\Controllers\BankAccountController::class);
        Route::apiResource('cash-registers', \App\Http\Controllers\CashRegisterController::class);
        Route::post('/cash-registers/{cashRegister}/deposit', [\App\Http\Controllers\CashRegisterController::class, 'deposit']);
        Route::post('/cash-registers/{cashRegister}/withdraw', [\App\Http\Controllers\CashRegisterController::class, 'withdraw']);
        Route::get('/treasury/forecast', [\App\Http\Controllers\TreasuryController::class, 'forecast']);
    });

    // ==========================================
    // 8. RESSOURCES HUMAINES (reserve aux roles ayant la permission rh.view)
    // ==========================================
    Route::middleware('permission:rh.view')->group(function () {
        Route::apiResource('employees', \App\Http\Controllers\EmployeeController::class);
        Route::apiResource('salaries', \App\Http\Controllers\SalaryController::class);
        Route::apiResource('attendances', \App\Http\Controllers\AttendanceController::class);
        Route::apiResource('leaves', \App\Http\Controllers\LeaveController::class)->parameters(['leaves' => 'leave']);
        Route::apiResource('contracts', \App\Http\Controllers\ContractController::class);
        Route::apiResource('evaluations', \App\Http\Controllers\EvaluationController::class);
    });

    // ==========================================
    // 9. PRODUCTION (reserve aux roles ayant la permission production.view)
    // ==========================================
    Route::middleware('permission:production.view')->group(function () {
        Route::apiResource('raw-materials', \App\Http\Controllers\RawMaterialController::class);
        Route::apiResource('raw-material-movements', \App\Http\Controllers\RawMaterialMovementController::class);
        Route::apiResource('production-orders', \App\Http\Controllers\ProductionOrderController::class);
        Route::get('/production-orders/{productionOrder}/cost', [\App\Http\Controllers\ProductionOrderController::class, 'cost']);
        Route::get('/products/{product}/bom', [\App\Http\Controllers\BillOfMaterialController::class, 'show']);
        Route::put('/products/{product}/bom', [\App\Http\Controllers\BillOfMaterialController::class, 'update']);
    });

    // ==========================================
    // 10. DOCUMENTS (reserve aux roles ayant la permission documents.view)
    // ==========================================
    Route::middleware('permission:documents.view')->group(function () {
        Route::apiResource('documents', \App\Http\Controllers\DocumentController::class);
        Route::get('/documents/{document}/download', [\App\Http\Controllers\DocumentController::class, 'download']);
    });

    // ==========================================
    // 12. PARAMETRES (reserve aux roles ayant la permission parametres.view)
    // ==========================================
    Route::middleware('permission:parametres.view')->group(function () {
        Route::apiResource('users', \App\Http\Controllers\UserController::class);
        Route::apiResource('roles', \App\Http\Controllers\RoleController::class);
        Route::get('/permissions', [\App\Http\Controllers\PermissionController::class, 'index']);
        Route::get('/settings/activity-log', [\App\Http\Controllers\SettingsController::class, 'activityLog']);
        Route::post('/settings/backup', [\App\Http\Controllers\SettingsController::class, 'backup']);
    });

    // ==========================================
    // 13. IA / INTELLIGENCE
    // ==========================================
    Route::get('/ai/sales-forecast', [\App\Http\Controllers\AiController::class, 'salesForecast']);
    Route::get('/ai/stock-forecast', [\App\Http\Controllers\AiController::class, 'stockForecast']);
    Route::post('/ai/assistant', [\App\Http\Controllers\AiController::class, 'assistant']);
    Route::get('/ai/profit-analysis', [\App\Http\Controllers\AiController::class, 'profitAnalysis']);
    Route::get('/ai/anomalies', [\App\Http\Controllers\AiController::class, 'anomalies']);
    Route::get('/ai/purchase-suggestions', [\App\Http\Controllers\AiController::class, 'purchaseSuggestions']);
    Route::post('/ai/generate-report', [\App\Http\Controllers\AiController::class, 'generateReport']);
    Route::get('/notifications', [\App\Http\Controllers\AiController::class, 'notifications']);
});
