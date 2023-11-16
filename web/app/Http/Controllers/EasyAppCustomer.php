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

        echo '<pre>';
            print_r($allDataContent);
        echo '</pre>';

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
