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
        $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
        $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret
        $data = $request->getContent();
        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));
    
        $ifShopify = hash_equals($hmacHeader, $calculatedHmac);
    
        if (!$ifShopify) {
            Log::warning('Webhook verification failed.');
           return response('Unauthorized', 401);
        }

        $croninfo = DB::table('easylog')->insert([
            'data' => json_encode($data)
        ]);

        // Return the data to the Shopify template.
        return view('shopify.template', ['data' => '']);
    }
}
