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

                    unset( $allDataContent['signature'] );

                    ksort( $allDataContent );

                    $data = implode('', array_map(
                        function ($value, $key) {
                            return $key . '=' . $value;
                        },
                        $allDataContent,
                        array_keys($allDataContent)
                    ));

                    $calculatedSignature = hash_hmac('sha256', $data, $sharedSecret);

                    if (hash_equals($signature, $calculatedSignature)) {

                        $customerId  = $allDataContent['logged_in_customer_id'];

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
