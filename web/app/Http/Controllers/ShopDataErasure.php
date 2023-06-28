<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ShopDataErasure extends Controller
{
    public function handleWebhook(Request $request){
        // Verify the webhook request
        $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
        $data = $request->getContent();
        $verified = $this->verifyWebhook($data, $hmacHeader);

        if (!$verified) {
            Log::warning('Webhook verification failed.');
           return response('Unauthorized', 401);
        }

        // Process the webhook payload
        $payload = $request->all();

        $shop_domain = $payload['shop_domain'];
        
        $croninfo = DB::table('easywebhook')->insert([
            'shop' => $shop_domain,
            'data' => json_encode($payload),
            'topic' => 'shop/redact'
        ]);

        $shop_name = explode('.', $shop_domain);

        Schema::dropIfExists($shop_name[0].'_billingAttempt');
        Schema::dropIfExists($shop_name[0].'_billingAttemptSuccess');
        Schema::dropIfExists($shop_name[0].'_customer');
        Schema::dropIfExists($shop_name[0].'_customerportal_settings');
        Schema::dropIfExists($shop_name[0].'_notification_template');
        Schema::dropIfExists($shop_name[0].'_sellingplangroup');
        Schema::dropIfExists($shop_name[0].'_subscriptioncontracts');
        Schema::dropIfExists($shop_name[0].'_subscriptioncontracts_history');

        return response('Webhook processed', 200);
        
    }

    private function verifyWebhook($data, $hmacHeader){
        $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret

        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

        return hash_equals($hmacHeader, $calculatedHmac);
    }
}
