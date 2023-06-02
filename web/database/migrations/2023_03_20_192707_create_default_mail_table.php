<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDefaultMailTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('default_mail', function (Blueprint $table) {
            $table->id();
            $table->string('topic')->nullable(true);
            $table->string('from_name')->nullable(true);
            $table->string('from_email')->nullable(true);
            $table->string('subject')->nullable(true);
            $table->longText('mail')->nullable(true);
            $table->dateTime('createdAt')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('default_mail');
    }
}
