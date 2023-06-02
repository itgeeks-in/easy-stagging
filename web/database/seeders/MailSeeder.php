<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $mails = [
            ['mail'=>$order,'$topic'=>'order'],
            ['mail'=>$skip,'$topic'=>'skip'],
            ['mail'=>$status,'$topic'=>'status']
        ];
        foreach($mails as $mail){
            DB::table('default_mail')->insert([
                'topic' => $mail['topic'],
                'mail' => $mail['mail'],
            ]);
        }
    }
}
