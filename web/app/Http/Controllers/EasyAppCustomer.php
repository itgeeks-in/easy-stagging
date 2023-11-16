<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;


class EasyAppCustomer extends Controller
{
    public function showData(Request $request)
    {
        // Fetch data from your Laravel application.

        // Example: $data = YourModel::all();

        $allDataContent = $request->all();
        $allDataContent = json_encode($allDataContent);
        $allDataContent = json_decode($allDataContent,true);

        $croninfo = DB::table('easylog')->insert([
            'data' => $allDataContent['shop']
        ]); 
        $croninfo = DB::table('easylog')->insert([
            'data' => $allDataContent['logged_in_customer_id']
        ]); 
        $croninfo = DB::table('easylog')->insert([
            'data' => $allDataContent['path_prefix']
        ]); 
        $croninfo = DB::table('easylog')->insert([
            'data' => $allDataContent['timestamp']
        ]); 
        $croninfo = DB::table('easylog')->insert([
            'data' => $allDataContent['signature']
        ]); 

        if( is_null( $allDataContent['logged_in_customer_id'] ) ){
            return '';
        }else{
            if( isset( $allDataContent['shop'] ) && isset( $allDataContent['signature'] ) ){
    
                $croninfo = DB::table('easylog')->insert([
                    'data' => json_encode($allDataContent)
                ]); 
    
                // Return the data to the Shopify template.
                return view('shopify.template', ['data' => '']);
    
            }else{
    
                return '';
    
            }
        }

    }
}
