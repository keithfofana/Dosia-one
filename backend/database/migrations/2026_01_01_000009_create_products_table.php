<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Module: Stock - Produits
return new class extends Migration {
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('category_id')->nullable()->constrained('product_categories');
            $table->string('name');
            $table->string('sku')->nullable();
            $table->string('barcode')->nullable();
            $table->string('qrcode')->nullable();
            $table->decimal('purchase_price', 14, 2)->default(0);
            $table->decimal('sale_price', 14, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->integer('alert_threshold')->default(5);
            $table->string('unit')->default('unite');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
