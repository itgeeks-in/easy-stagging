<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class WebhookController extends Controller
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

        // Retrieve the event and perform necessary actions based on the event type
        $topic = $payload['topic'];
        switch ($topic) {
            case 'customers/redact':
                $this->handleCustomerRedact($payload);
                break;
            case 'customers/data_request':
                $this->handleCustomerDataRequest($payload);
                break;
            case 'shop/redact':
                $this->handleShopRedact($payload);
                break;
            default:
                // Unsupported event
                Log::warning('Unsupported webhook event: ' . $topic);
                break;
        }
        return response('Webhook processed', 200);
    }

    private function verifyWebhook($data, $hmacHeader){
        $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret

        $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

        return hash_equals($hmacHeader, $calculatedHmac);
    }

    private function handleCustomerRedact($payload){
        // Handle customer redact event
        // Perform necessary actions for GDPR compliance
        // ...
        $shop_domain = $payload['shop_domain'];
        $topic = $payload['topic'];

        $croninfo = DB::table('easywebhook')->insert([
            'shop' => $shop_domain,
            'topic' => $topic
        ]);
    }

    private function handleCustomerDataRequest($payload){
        // Handle customer data request event
        // Perform necessary actions for GDPR compliance
        // ...
        $shop_domain = $payload['shop_domain'];

        $croninfo = DB::table('easywebhook')->insert([
            'shop' => $shop_domain,
            'topic' => $topic
        ]);
    }

    private function handleShopRedact($payload){
        // Handle shop redact event
        // Perform necessary actions for GDPR compliance
        // ...
        $shop_domain = $payload['shop_domain'];

        $croninfo = DB::table('easywebhook')->insert([
            'shop' => $shop_domain,
            'topic' => $topic
        ]);

    }
}
