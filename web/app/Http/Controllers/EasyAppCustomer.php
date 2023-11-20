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

        if( !empty( $allDataContent ) ){

            if( empty( $allDataContent['logged_in_customer_id'] ) ){
                return response('Unauthorized', 401);
            }else{
                if( isset( $allDataContent['shop'] ) && isset( $allDataContent['signature'] ) ){

                    $sharedSecret = env('SHOPIFY_API_SECRET');

                    $signature = $allDataContent['signature'];

                    unset($allDataContent['signature']);

                    ksort($allDataContent);

                    $sortedParams = http_build_query($allDataContent);

                    $calculatedSignature = hash_hmac('sha256', $sortedParams, $sharedSecret);

                    echo '<pre>';
                        print_r($allDataContent);
                    echo '</pre>';

                    if (hash_equals($signature, $calculatedSignature)) {
        
                        $croninfo = DB::table('easylog')->insert([
                            'data' => json_encode($allDataContent)
                        ]); 
            
                        // Return the data to the Shopify template.
                        return view('shopify.template', ['data' => '']);
                    }else{

                        return response('Unauthorized', 401);

                    }
        
                }else{
        
                    return response('Unauthorized', 401);
        
                }
            }

        }else{
            return response('Unauthorized', 401);
        }

    }
}
