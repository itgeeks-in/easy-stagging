<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSessionsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->nullable(false)->unique();
            $table->string('shop')->nullable(false);
            $table->boolean('is_online')->nullable(false);
            $table->string('state')->nullable(false);
            $table->boolean('activity')->nullable(true);
            $table->string('pending_charge_id')->nullable(true);
            $table->string('pending_plan_type')->nullable(true);
            $table->string('charge_id')->nullable(true);
            $table->string('plan_type')->nullable(true);
            $table->string('ordertag')->nullable(true);
            $table->string('ordertagvalue')->nullable(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sessions');
    }
}
