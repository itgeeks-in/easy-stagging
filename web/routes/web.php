<?php

use App\Exceptions\ShopifyProductCreatorException;
use App\Lib\AuthRedirection;
use App\Lib\EnsureBilling;
use App\Lib\ProductCreator;
use App\Models\Session;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Shopify\Auth\OAuth;
use Shopify\Auth\Session as AuthSession;
use Shopify\Clients\HttpHeaders;
use Shopify\Clients\Rest;
use Shopify\Clients\Graphql;
use Shopify\Context;
use Shopify\Exception\InvalidWebhookException;
use Shopify\Utils;
use Shopify\Webhooks\Registry;
use Shopify\Webhooks\Topics;
use Illuminate\Support\Facades\DB;
use PhpParser\Node\Stmt\TryCatch;
use Shopify\Rest\Admin2023_04\RecurringApplicationCharge;
use Shopify\Rest\Admin2023_04\Theme;
use Shopify\Rest\Admin2023_04\Asset;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Shopify\Rest\Admin2023_04\Customer;
use Illuminate\Support\Facades\Mail;
use App\Mail\OrderMail;
use App\Mail\SubStatusMail;
use App\Mail\SkipSubMail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Doctrine\DBAL\Query;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::fallback(function (Request $request) {
    if (Context::$IS_EMBEDDED_APP &&  $request->query("embedded", false) === "1") {
        if (env('APP_ENV') === 'production') {
            return file_get_contents(public_path('index.html'));
        } else {
            return file_get_contents(base_path('frontend/index.html'));
        }
    } else {
        return redirect(Utils::getEmbeddedAppUrl($request->query("host", null)) . "/" . $request->path());
    }
})->middleware('shopify.installed');

Route::get('/api/auth', function (Request $request) {
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    // Delete any previously created OAuth sessions that were not completed (don't have an access token)
    Session::where('shop', $shop)->where('access_token', null)->delete();

    return AuthRedirection::redirect($request);
});

Route::get('/api/auth/callback', function (Request $request) {
    $session = OAuth::callback(
        $request->cookie(),
        $request->query(),
        ['App\Lib\CookieHandler', 'saveShopifyCookie'],
    );

    $host = $request->query('host');
    $shop = Utils::sanitizeShopDomain($request->query('shop'));

    $response = Registry::register('/api/webhooks', Topics::APP_UNINSTALLED, $shop, $session->getAccessToken());
    $responseOne = Registry::register('/api/subscriptioncontracts', Topics::SUBSCRIPTION_CONTRACTS_CREATE, $shop, $session->getAccessToken());
    $responseTwo = Registry::register('/api/subscriptioncontracts/billingattempt', Topics::SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS, $shop, $session->getAccessToken());
    $responseThree = Registry::register('/api/subscriptioncontracts/billingattempt/failure', Topics::SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE, $shop, $session->getAccessToken());
    $responseFour = Registry::register('/api/subscriptioncontracts/update', Topics::SUBSCRIPTION_CONTRACTS_UPDATE, $shop, $session->getAccessToken());
    if ($responseOne->isSuccess()) {
        Log::debug("Registered SUBSCRIPTION_CONTRACTS_CREATE webhook for shop $shop");
    }
    if ($responseTwo->isSuccess()) {
        Log::debug("Registered SUBSCRIPTION_BILLING_ATTEMPTS_SUCCESS webhook for shop $shop");
    }
    if ($responseThree->isSuccess()) {
        Log::debug("Registered SUBSCRIPTION_BILLING_ATTEMPTS_FAILURE webhook for shop $shop");
    }
    if ($responseFour->isSuccess()) {
        Log::debug("Registered SUBSCRIPTION_CONTRACTS_UPDATE webhook for shop $shop");
    }
    if ($response->isSuccess()) {
        Log::debug("Registered APP_UNINSTALLED webhook for shop $shop");
        try {
            $shop_name = explode('.', $shop);
            if (!Schema::hasTable($shop_name[0] . '_sellingplangroup')) {
                Schema::create($shop_name[0] . '_sellingplangroup', function (Blueprint $table) {
                    $table->id();
                    $table->string('groupid')->nullable(true);
                    $table->string('type')->nullable(true);
                    $table->timestamp('created_at')->useCurrent();
                    $table->timestamp('updated_at')->useCurrent();
                });
            }
        } catch (\Throwable $th) {
            Log::error(
                "Failed to create $shop_name[0] database " .
                    print_r(json_encode($th), true)
            );;
        }
    } else {
        Log::error(
            "Failed to register APP_UNINSTALLED webhook for shop $shop with response body: " .
                print_r($response->getBody(), true)
        );
    }

    $redirectUrl = Utils::getEmbeddedAppUrl($host);
    if (Config::get('shopify.billing.required')) {
        list($hasPayment, $confirmationUrl) = EnsureBilling::check($session, Config::get('shopify.billing'));

        if (!$hasPayment) {
            $redirectUrl = $confirmationUrl;
        }
    }

    return redirect($redirectUrl);
});

Route::get('/api/products/count', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Rest($session->getShop(), $session->getAccessToken());
    $result = $client->get('products/count');

    return response($result->getDecodedBody());
})->middleware('shopify.auth');

Route::get('/api/addnewcolumn', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $updated = DB::table('sessions')
        ->where('shop', $session->getShop())
        ->update(['activity' => $request->activity]);
    return response($updated);
})->middleware('shopify.auth');

Route::get('/api/checkactivity', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $query = <<<QUERY
    {
        shop {
            name
            features{
                eligibleForSubscriptions
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query]);

    $shopFeature = $result->getDecodedBody();
    $enableSubscription = $shopFeature['data']['shop']['features']['eligibleForSubscriptions'];
    $plantype = "";
    if ($enableSubscription) {
        $data = DB::table('sessions')->where('shop', $session->getShop())->get();
        // print_r($data->toArray());die;
        $plantype = '';
        $data = $data->toArray();

        if (property_exists($data[0], "activity")) {
            if (empty($data[0]->activity)) {
                $activity = 0;
            } else {
                if (!empty($data[0]->plan_type) || $data[0]->plan_type != null) {
                    $client = new Graphql($session->getShop(), $session->getAccessToken());
                    $query = <<<QUERY
                        {
                            currentAppInstallation {
                                id
                            }
                        }
                    QUERY;
                    $result = $client->query(['query' => $query]);
                    $resultBody = $result->getDecodedBody();
                    $metaValue = false;
                    if(!empty($resultBody['data']['currentAppInstallation']['id'])){
                        $ownerId = $resultBody['data']['currentAppInstallation']['id'];
                        $query = <<<QUERY
                            query {
                                appInstallation(id: "$ownerId") {
                                    metafield(key: "conditional", namespace: "plan") {
                                        value
                                    }
                                }
                            }
                        QUERY;
                        $result = $client->query(['query' => $query]);
                        $resultBody = $result->getDecodedBody();
                        if(!empty($resultBody['data']['appInstallation']['metafield']['value'])){
                            $metaValue = true;
                        }
                        
                    }
                    if(!empty($ownerId) && !$metaValue){
                        $query = <<<QUERY
                            mutation metafieldsSet(\$metafields: [MetafieldsSetInput!]!) {
                                metafieldsSet(metafields: \$metafields) {
                                metafields {
                                    namespace
                                    ownerType
                                    value
                                    createdAt
                                    key
                                }
                                userErrors {
                                    field
                                    message
                                }
                                }
                            }
                        QUERY;
                        $variables =[
                            "metafields" => [
                            [
                                "key"=> "conditional",
                                "namespace"=> "plan",
                                "ownerId"=> $ownerId,
                                "type"=> "boolean",
                                "value"=> "true"
                            ]
                            ]
                        ];
                        $result = $client->query(['query' => $query,'variables'=>$variables]);
                        $resultBody = $result->getDecodedBody();
                    }
                    $plantype = $data[0]->plan_type;
                    $activity = $data[0]->activity;
                } else {
                    $activity = 1;
                }
            }
        } else {
            $activity = 0;
        };
    } else {
        $activity = 9;
    }

    return response(json_encode(['plantype' => $plantype, 'activity' => $activity]));
})->middleware('shopify.auth');

Route::get('/api/planStatus', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $query = <<<QUERY
    {
        shop {
            name
            features{
                eligibleForSubscriptions
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query]);

    $shopFeature = $result->getDecodedBody();
    $enableSubscription = $shopFeature['data']['shop']['features']['eligibleForSubscriptions'];

    $plantype = '';
    if ($enableSubscription) {
        $data = DB::table('sessions')->where('shop', $session->getShop())->get();
        $activity = 0;
        if (property_exists($data[0], "plan_type")) {
            if ($data[0]->plan_type != null || !empty($data[0]->plan_type)) {

                $plantype = $data[0]->plan_type;
                $activity = $data[0]->activity;
            }
        }
    } else {
        $activity = 9;
    }

    return response(json_encode(['plantype' => $plantype, 'activity' => $activity]));
})->middleware('shopify.auth');

Route::get('/api/payment/update', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $updated = DB::table('sessions')->where('shop', $session->getShop())->update(['pending_charge_id' => $request['id'], 'pending_plan_type' => $request['plan']]);
    return response($updated);
})->middleware('shopify.auth');

Route::get('/api/skip/groupcreation', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $updated = DB::table('sessions')->where('shop', $session->getShop())->update(['activity' => 2]);
    return response($updated);
})->middleware('shopify.auth');

Route::get('/api/themes', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $result = Theme::all($session);
    return response(json_encode($result));
})->middleware('shopify.auth');

Route::get('/api/addtheme', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $asset = Asset::all(
        $session,
        ["theme_id" => $request['theme']],
        ["asset" => ["key" => "layout/theme.liquid"]]
    );
    $oldHtml = $asset[0]->value;
    $newHtml = "<span>hello</span></body>";
    if (str_contains($oldHtml, $newHtml)) {
        return response(json_encode(['status' => 'true']));
    }
    $mergeHtml = (str_replace(array("</body>"), $newHtml, $oldHtml));
    $asset = new Asset($session);
    $asset->theme_id = $request['theme'];
    $asset->key = "layout/theme.liquid";
    $asset->value = $mergeHtml;
    try {
        $asset->save(true);
        return response(json_encode(['status' => 'true']));
    } catch (\Throwable $e) {
        return response(json_encode(['status' => 'false']));
    }
    return response(json_encode(['status' => 'false']));
})->middleware('shopify.auth');

Route::get('/api/payment', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $application_charge = new RecurringApplicationCharge($session);
    $application_charge->name = "Subscription";

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    
    $returnUrl = "https://" . $session->getShop() . "/admin/apps/itgeeks-subscription/confirm";
    if( $request['freq'] == 'year' ){
        $query = <<<QUERY
                    mutation {
                        appSubscriptionCreate(
                            name: "Subscription"
                            returnUrl: "$returnUrl"
                            trialDays:15
                            test:true
                            lineItems: [
                                {
                                    plan: {
                                        appRecurringPricingDetails: {
                                            price: { amount: 278.00, currencyCode: USD }
                                            interval: ANNUAL
                                        }
                                    }
                                }
                            ]
                        ){
                            appSubscription {
                                id
                            }
                            confirmationUrl
                            userErrors {
                                field
                                message
                            }
                        }
                    }
            QUERY;
            try {
                $result = $client->query(['query' => $query]);
                $data = $result->getDecodedBody();
                $application_charge_id = str_replace('gid://shopify/AppSubscription/','',$data['data']['appSubscriptionCreate']['appSubscription']['id']);
                return response(json_encode(['status' => true, 'url' => $data['data']['appSubscriptionCreate']['confirmationUrl'], 'id' =>$application_charge_id ]));
            } catch (\Throwable $th) {
                return response(json_encode(['status' => false]));
            }
    }else{
        if ($request['plan'] == 'pro') {
            $application_charge->price = 29.00;
        } else {
            $application_charge->price = 29.00;
        }
        $application_charge->return_url = $returnUrl;
        $application_charge->trial_days = 15;
        $application_charge->test = true;
        try {
            $application_charge->save(true);
            return response(json_encode(['status' => true, 'url' => $application_charge->confirmation_url, 'id' => $application_charge->id]));
        } catch (\Throwable $th) {
            return response(json_encode(['status' => false]));
        }
    }

})->middleware('shopify.auth');

Route::get('/api/paymentfree', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession');
    $data = DB::table('sessions')->where('shop', $session->getShop())->get();

    if (property_exists($data[0], "charge_id")) {
        $charge_id = $data[0]->charge_id;
    } else {
        return response(json_encode(['status' => false, 'type' => '']));
    }

    try {
        if ($charge_id != null || !empty($charge_id)) {
            RecurringApplicationCharge::delete($session, $charge_id);
        }
        DB::table('sessions')->where('shop', $session->getShop())->update(['plan_type' => 'free', 'charge_id' => '', 'pending_charge_id' => '', 'pending_plan_type' => '']);
        return response(json_encode(['status' => true, 'type' => 'free']));
    } catch (\Throwable $th) {
        return response(json_encode(['status' => false, 'type' => '']));
    }
})->middleware('shopify.auth');

Route::get('/api/payment/confirm', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $complete = false;
    $data = DB::table('sessions')->where('shop', $session->getShop())->get();
    if (property_exists($data[0], "pending_charge_id") && property_exists($data[0], "pending_plan_type")) {
        $charge_id = $data[0]->pending_charge_id;
        $plantype = $data[0]->pending_plan_type;
    } else {
        return response(json_encode(['status' => $complete]));
    }
    // echo $charge_id;
    if ($charge_id == $request->charge_id) {
        try {
            DB::table('sessions')->where('shop', $session->getShop())->update(['plan_type' => $plantype, 'charge_id' => $charge_id, 'pending_charge_id' => '', 'pending_plan_type' => '']);
            $complete = true;
        } catch (\Throwable $th) {
            return response(json_encode(['status' => $complete]));
        }
    } else {
        return response(json_encode(['status' => $complete]));
    }
    return response(json_encode(['status' => $complete]));
})->middleware('shopify.auth');

Route::get('/api/products/create', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $success = $code = $error = null;
    try {
        ProductCreator::call($session, 5);
        $success = true;
        $code = 200;
        $error = null;
    } catch (\Exception $e) {
        $success = false;

        if ($e instanceof ShopifyProductCreatorException) {
            $code = $e->response->getStatusCode();
            $error = $e->response->getDecodedBody();
            if (array_key_exists("errors", $error)) {
                $error = $error["errors"];
            }
        } else {
            $code = 500;
            $error = $e->getMessage();
        }

        Log::error("Failed to create products: $error");
    } finally {
        return response()->json(["success" => $success, "error" => $error], $code);
    }
})->middleware('shopify.auth');

Route::post('/api/webhooks', function (Request $request) {
    try {
        $topic = $request->header(HttpHeaders::X_SHOPIFY_TOPIC, '');

        $response = Registry::process($request->header(), $request->getContent());
        if (!$response->isSuccess()) {
            Log::error("Failed to process '$topic' webhook: {$response->getErrorMessage()}");
            return response()->json(['message' => "Failed to process '$topic' webhook"], 500);
        }
    } catch (InvalidWebhookException $e) {
        Log::error("Got invalid webhook request for topic '$topic': {$e->getMessage()}");
        return response()->json(['message' => "Got invalid webhook request for topic '$topic'"], 401);
    } catch (\Exception $e) {
        Log::error("Got an exception when handling '$topic' webhook: {$e->getMessage()}");
        return response()->json(['message' => "Got an exception when handling '$topic' webhook"], 500);
    }
});
Route::post('/api/subscriptioncontracts', function (Request $request) {

    $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
    $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret
    $data = $request->getContent();
    $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

    $ifShopify = hash_equals($hmacHeader, $calculatedHmac);

    if (!$ifShopify) {
        Log::warning('Webhook verification failed.');
       return response('Unauthorized', 401);
    }

    $decodeData = json_decode($data);
    $origin_order_id = $decodeData->origin_order_id;
    $admin_graphql_api_id = $decodeData->admin_graphql_api_id;
    $header = $request->header();
    $shop = $header['x-shopify-shop-domain'][0];
    $shop_name = explode('.', $shop);
    $session = DB::table('sessions')->select('access_token','ordertag','ordertagvalue')->where('shop','=',$shop)->get();
    $token = $session->toArray()[0]->access_token;
    $ordertag = $session->toArray()[0]->ordertag;
    $ordertagvalue = $session->toArray()[0]->ordertagvalue;
    $clientRest = new Rest($shop, $token);
    $restOrder = $clientRest->get('orders/'.$origin_order_id);
    $restOrder = $restOrder->getDecodedBody();
    // dd($origin_order_id);
    $client = new Graphql($shop, $token);
    $query = <<<QUERY
    {
        subscriptionContract(id:"$admin_graphql_api_id"){
            id
            nextBillingDate
            status
            deliveryPolicy{
                interval
                intervalCount
            }
            customer{
                id
                email
                displayName
            }
            originOrder{
                lineItems(first:50){
                    edges{
                        node{
                            image{
                                url
                            }
                        }
                    }
                }
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
    
    $order = $restOrder['order'];

    if( $ordertag == '1' ){
        $orderTags = $order['tags'];
        $orderTagsArray = explode( ",", $orderTags );
        $tagAlready = 0;
        if( $orderTags != '' ){
            foreach ( $orderArrayValue as $orderTagsArray ) {
                if( $orderArrayValue == $ordertagvalue ){
                    $tagAlready = 1;
                }
            }
        }
        $newTags = $orderTags.','.$ordertagvalue;
        if( $tagAlready == 0 ){
            $updateOrder = $clientRest->put( 'orders/'.$origin_order_id, ["order"=>[
                "tags"=>$newTags
            ]] );
            $updateOrderValue = $updateOrder->getDecodedBody();
        }
    }

    $orders = [];
    $orders['id']=$order['id'];

    $arrays = array(
        'fields' => 'name'
    );
    $resultShop = $clientRest->get('shop', [], $arrays);

    $resultShop = $resultShop->getDecodedBody();
    
    $orders['shop']=$resultShop['shop']['name'];
    $orders['shopurl']=$shop_name[0];
    $orders['subscriptionContractId'] = $data['data']['subscriptionContract']['id'];
    $orders['subscriptionContractStatus'] = $data['data']['subscriptionContract']['status'];
    $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionContract']['nextBillingDate']));

    $newDateTime = new DateTime($nextbillingDate); 
    $dateTimeUTC = $newDateTime->format("Y-m-d H:i:s");

    $billingDate = date_create($data['data']['subscriptionContract']['nextBillingDate']);
    $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");;
    $email = $data['data']['subscriptionContract']['customer']['email'];
    $name = $data['data']['subscriptionContract']['customer']['displayName'];
    $customerId = $data['data']['subscriptionContract']['customer']['id'];
    $status = $data['data']['subscriptionContract']['status'];
    $orders['deliveryPolicy'] = $data['data']['subscriptionContract']['deliveryPolicy'];
    $interval = $orders['deliveryPolicy']['interval'];
    $intervalCount = $orders['deliveryPolicy']['intervalCount'];
    $orders['name']=$order['name'];
    $date=date_create($order['created_at']);
    $date->setTimezone(new DateTimeZone("Asia/Kolkata")); 
    $created_at_sort = $date->format("Y-m-d H:i:s");
    $creteadDate = $order['created_at'];
    $orders['createdAt']=date_format($date,"M d,Y");
    
    $currency = $order['current_total_price_set']['shop_money']['currency_code'];
    $orders['total']= $currency." ".$order['current_total_price'];
    $orders['currency'] = $currency;
    $orders['tax'] = $order['current_total_tax'];
    $orders['subtotal'] = $order['current_subtotal_price'];
    $orders['discount'] = $order['current_total_discounts'];
    $orders['shipping'] = $order['total_shipping_price_set']['shop_money']['amount'];
    $orders['shippingAddress'] = $order['shipping_address'];
    $orders['billingAddress'] = $order['billing_address'];
    //Log::error($order);
   // $orders['payment'] = $order['payment_details'];
    for($i=0;$i<count($order['line_items']);$i++){
        $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
        $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
        if(!empty($data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
            $orders['products'][$i]['productImage'] = $data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
        }else{
            $orders['products'][$i]['productImage'] = '';
        }
        $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
        $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
    }    
    try {
        if (!Schema::hasTable($shop_name[0] . '_subscriptioncontracts')) {
            Schema::create($shop_name[0] . '_subscriptioncontracts', function (Blueprint $table) {
                $table->id();
                $table->json('data')->nullable(true);
                $table->string('subId')->nullable(true);
                $table->string('name')->nullable(true);
                $table->string('order_name')->nullable(true);
                $table->string('email')->nullable(true);
                $table->string('nextBillingDate')->nullable(true);
                $table->string('status')->nullable(true);
                $table->string('total')->nullable(true);
                $table->string('interval')->nullable(true);
                $table->string('intervalCount')->nullable(true);
                $table->string('created_at')->nullable(true);
                $table->dateTime('created_at_sort')->nullable(true);
            });
        }
        if (!Schema::hasTable($shop_name[0] . '_customer')) {
            Schema::create($shop_name[0] . '_customer', function (Blueprint $table) {
                $table->id();
                $table->string('customer_id')->nullable(true);
                $table->string('name')->nullable(true);
                $table->string('email')->nullable(true);
                $table->dateTime('created_at')->useCurrent();
            });
        }
        if (!Schema::hasTable($shop_name[0] . '_billingAttempt')) {
            Schema::create($shop_name[0] . '_billingAttempt', function (Blueprint $table) {
                $table->id();
                $table->json('data')->nullable(true);
                $table->string('subId')->nullable(true);
                $table->string('status')->nullable(true);
                $table->string('total')->nullable(true);
                $table->timestamp('created_at')->useCurrent();
            });
        }
        $customerdone = DB::table($shop_name[0] . '_customer')->where('customer_id',$customerId)->get()->count();
        $encryption_name = $name;
        $encryption_email = $email;
        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_iv = '1332425434231121';
        $encryption_key = "easyitgkeyencryp";
        $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
        $encryptionemail = openssl_encrypt( $encryption_email, $ciphering, $encryption_key, $options, $encryption_iv );
        if(!$customerdone){
            DB::table($shop_name[0] . '_customer')->insert([
                        'name' => $encryptionname,
                        'email' => $encryptionemail,
                        'customer_id'=>$customerId
                ]
            );
        }
        $subscriptionContractId = $orders['subscriptionContractId'];
        try {
            $done = DB::table($shop_name[0] . '_subscriptioncontracts')->select('*')->where('subId',$subscriptionContractId)->get()->count();
            if(!$done){
                
                $ciphering = "AES-128-CTR";
                $iv_length = openssl_cipher_iv_length($ciphering);
                $options = 0;
                $encryption_iv = '1332425434231121';
                $encryption_key = "easyitgkeyencryp";

                if( isset( $orders['shippingAddress']['last_name'] ) ){
                    $encryption_slast_name = $orders['shippingAddress']['last_name'];
                    $encryptionslast_name = openssl_encrypt( $encryption_slast_name, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['shippingAddress']['last_name'] = $encryptionslast_name;
                }

                if( isset( $orders['shippingAddress']['first_name'] ) ){
                    $encryption_sfirst_name = $orders['shippingAddress']['first_name'];
                    $encryptionsfirst_name = openssl_encrypt( $encryption_sfirst_name, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['shippingAddress']['first_name'] = $encryptionsfirst_name;
                }

                if( isset( $orders['shippingAddress']['name'] ) ){
                    $encryption_sname = $orders['shippingAddress']['name'];
                    $encryptionsname = openssl_encrypt( $encryption_sname, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['shippingAddress']['name'] = $encryptionsname;
                }

                if( isset( $orders['billingAddress']['last_name'] ) ){
                    $encryption_last_name = $orders['billingAddress']['last_name'];
                    $encryptionlast_name = openssl_encrypt( $encryption_last_name, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['billingAddress']['last_name'] = $encryptionlast_name;
                }

                if( isset( $orders['billingAddress']['first_name'] ) ){
                    $encryption_first_name = $orders['billingAddress']['first_name'];
                    $encryptionfirst_name = openssl_encrypt( $encryption_first_name, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['billingAddress']['first_name'] = $encryptionfirst_name;
                }
                
                if( isset( $orders['billingAddress']['name'] ) ){
                    $encryption_name = $orders['billingAddress']['name'];
                    $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['billingAddress']['name'] = $encryptionname;
                }

                if( isset( $orders['billingAddress']['phone'] ) ){
                    $encryption_phone = $orders['billingAddress']['phone'];
                    $encryptionphone = openssl_encrypt( $encryption_phone, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['billingAddress']['phone'] = $encryptionphone;
                }

                if( isset( $orders['shippingAddress']['phone'] ) ){
                    $encryption_sphone = $orders['shippingAddress']['phone'];
                    $encryptionsphone = openssl_encrypt( $encryption_sphone, $ciphering, $encryption_key, $options, $encryption_iv );
                    $orders['shippingAddress']['phone'] = $encryptionsphone;
                }
                
                DB::table($shop_name[0] . '_subscriptioncontracts')->insert([
                            'subId' =>$subscriptionContractId,
                            'data' => json_encode($orders),
                            'status' => $status,
                            'order_name' => $orders['name'],
                            'name' => $encryptionname,
                            'email' => $encryptionemail,
                            'interval' => $interval,
                            'total'=>$orders['total'],
                            'intervalCount' => $intervalCount,
                            'nextBillingDate' => $dateTimeUTC,
                            'created_at' => $creteadDate,
                            'created_at_sort'=>$created_at_sort
                    ]
                );

                DB::table($shop_name[0] . '_billingAttempt')->insert([
                        'subId' =>$subscriptionContractId,
                        'status' => 'success',
                        'total' => $orders['total'],
                    ]
                );
                if (Schema::hasTable($shop_name[0] . '_notification_template')) {
                    $mail = DB::table($shop_name[0] . '_notification_template')->select('*')->where('topic','order')->get()->toArray();
                    if(empty($mail)){
                        $mail = DB::table('default_mail')->select('*')->where('topic','order')->get()->toArray();
                    }
                }else{
                    $mail = DB::table('default_mail')->select('*')->where('topic','order')->get()->toArray();
                }
                if(!empty($mail[0]->mail)){
                    $orders['mailHtml'] = $mail[0]->mail;
                    $orders['mail']['from_email'] = $mail[0]->from_email;
                    $orders['mail']['from_name'] = $mail[0]->from_name;
                    $orders['mail']['subject'] = $mail[0]->subject;
                }else{
                    $orders['mailHtml'] = '';
                    $orders['mail']['from_email'] = '';
                    $orders['mail']['from_name'] = '';
                    $orders['mail']['subject'] = '';
                }


                Mail::to($email)->send(new OrderMail($orders));
                //Log::error(new OrderMail($orders));
                if (!Schema::hasTable($shop_name[0] . '_billingAttemptSuccess')) {
                    Schema::create($shop_name[0] . '_billingAttemptSuccess', function (Blueprint $table) {
                        $table->id();
                        $table->json('data')->nullable(true);
                        $table->string('subId')->nullable(true);
                        $table->string('total')->nullable(true);
                        $table->boolean('mail')->default(false);
                        $table->timestamp('created_at')->useCurrent();
                    });
                }
                $done = DB::table($shop_name[0] . '_billingAttemptSuccess')->select('*')->where('subId',$admin_graphql_api_id)->get()->count();
                if(!$done){
                    DB::table($shop_name[0] . '_billingAttemptSuccess')->insert([
                                'subId' =>$admin_graphql_api_id,
                                'total' =>$orders['total'],
                        ]
                    );
                }
            }
        } catch (\Throwable $th) {
            Log::error(['error'=>$th]);
        }
       return true;
    } catch (\Throwable $th) {
        Log::error(['error'=>$th]);
    }
    return true;
});

Route::post('/api/subscriptioncontracts/update',function(Request $request){
   // echo true;
    $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
    $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret
    $data = $request->getContent();
    $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

    $ifShopify = hash_equals($hmacHeader, $calculatedHmac);

    if (!$ifShopify) {
        Log::warning('Webhook verification failed.');
       return response('Unauthorized', 401);
    }

    $decodeData = json_decode($data);
    $origin_order_id = $decodeData->origin_order_id;
    $admin_graphql_api_id = $decodeData->admin_graphql_api_id;
    $header = $request->header();
    $shop = $header['x-shopify-shop-domain'][0];
    $shop_name = explode('.', $shop);
    $session = DB::table('sessions')->select('access_token')->where('shop','=',$shop)->get();
    $token = $session->toArray()[0]->access_token;
    $clientRest = new Rest($shop, $token);
    $restOrder = $clientRest->get('orders/'.$origin_order_id);
    $restOrder = $restOrder->getDecodedBody();
    // dd($origin_order_id);
    $client = new Graphql($shop, $token);
    $query = <<<QUERY
    {
        subscriptionContract(id:"$admin_graphql_api_id"){
            id
            nextBillingDate
            status
            deliveryPolicy{
                interval
                intervalCount
            }
            customer{
                email
                displayName
            }
            originOrder{
                lineItems(first:50){
                    edges{
                        node{
                            image{
                                url
                            }
                        }
                    }
                }
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
    
    
    $order = $restOrder['order'];
    $orders = [];
    $orders['id']=$order['id'];
    $arrays = array(
        'fields' => 'name'
    );
    $resultShop = $clientRest->get('shop', [], $arrays);

    $resultShop = $resultShop->getDecodedBody();

    $orders['shop']=$resultShop['shop']['name'];
    $orders['shopurl']=$shop_name[0];
    $orders['subscriptionContractId'] = $data['data']['subscriptionContract']['id'];
    $orders['subscriptionContractStatus'] = $data['data']['subscriptionContract']['status'];
    $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionContract']['nextBillingDate']));

    $newDateTime = new DateTime($nextbillingDate); 
    $dateTimeUTC = $newDateTime->format("Y-m-d H:i:s");

    $billingDate = date_create($data['data']['subscriptionContract']['nextBillingDate']);
    $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");;
    $email = $data['data']['subscriptionContract']['customer']['email'];
    $name = $data['data']['subscriptionContract']['customer']['displayName'];
    $status = $data['data']['subscriptionContract']['status'];
    $orders['deliveryPolicy'] = $data['data']['subscriptionContract']['deliveryPolicy'];
    $interval = $orders['deliveryPolicy']['interval'];
    $intervalCount = $orders['deliveryPolicy']['intervalCount'];
    $orders['name']=$order['name'];
    $date=date_create($order['created_at']);
    $date->setTimezone(new DateTimeZone("Asia/Kolkata")); 
    $created_at_sort = $date->format("Y-m-d H:i:s");
    $creteadDate = $order['created_at'];
    $orders['createdAt']=date_format($date,"M d,Y");
    
    $currency = $order['current_total_price_set']['shop_money']['currency_code'];
    $orders['total']= $currency." ".$order['current_total_price'];
    $orders['currency'] = $currency;
    $orders['tax'] = $order['current_total_tax'];
    $orders['subtotal'] = $order['current_subtotal_price'];
    $orders['discount'] = $order['current_total_discounts'];
    $orders['shipping'] = $order['total_shipping_price_set']['shop_money']['amount'];
    $orders['shippingAddress'] = $order['shipping_address'];
    $orders['billingAddress'] = $order['billing_address'];
    //Log::error($order);
    //$orders['payment'] = $order['payment_details'];
    for($i=0;$i<count($order['line_items']);$i++){
        $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
        $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
        if(!empty($data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
            $orders['products'][$i]['productImage'] = $data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
        }else{
            $orders['products'][$i]['productImage'] = '';
        }
        $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
        $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
    }    
    try {
        if (!Schema::hasTable($shop_name[0] . '_subscriptioncontracts')) {
            Schema::create($shop_name[0] . '_subscriptioncontracts', function (Blueprint $table) {
                $table->id();
                $table->json('data')->nullable(true);
                $table->string('subId')->nullable(true);
                $table->string('name')->nullable(true);
                $table->string('order_name')->nullable(true);
                $table->string('email')->nullable(true);
                $table->string('nextBillingDate')->nullable(true);
                $table->string('status')->nullable(true);
                $table->string('total')->nullable(true);
                $table->string('interval')->nullable(true);
                $table->string('intervalCount')->nullable(true);
                $table->string('created_at')->nullable(true);
                $table->dateTime('created_at_sort')->nullable(true);
            });
        }
        $subscriptionContractId = $orders['subscriptionContractId'];
        $encryption_name = $name;
        $encryption_email = $email;
        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_iv = '1332425434231121';
        $encryption_key = "easyitgkeyencryp";
        $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
        $encryptionemail = openssl_encrypt( $encryption_email, $ciphering, $encryption_key, $options, $encryption_iv );
        try {
            $ciphering = "AES-128-CTR";
            $iv_length = openssl_cipher_iv_length($ciphering);
            $options = 0;
            $encryption_iv = '1332425434231121';
            $encryption_key = "easyitgkeyencryp";

            if( isset( $orders['shippingAddress']['last_name'] ) ){
                $encryption_slast_name = $orders['shippingAddress']['last_name'];
                $encryptionslast_name = openssl_encrypt( $encryption_slast_name, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['shippingAddress']['last_name'] = $encryptionslast_name;
            }

            if( isset( $orders['shippingAddress']['first_name'] ) ){
                $encryption_sfirst_name = $orders['shippingAddress']['first_name'];
                $encryptionsfirst_name = openssl_encrypt( $encryption_sfirst_name, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['shippingAddress']['first_name'] = $encryptionsfirst_name;
            }

            if( isset( $orders['shippingAddress']['name'] ) ){
                $encryption_sname = $orders['shippingAddress']['name'];
                $encryptionsname = openssl_encrypt( $encryption_sname, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['shippingAddress']['name'] = $encryptionsname;
            }

            if( isset( $orders['billingAddress']['last_name'] ) ){
                $encryption_last_name = $orders['billingAddress']['last_name'];
                $encryptionlast_name = openssl_encrypt( $encryption_last_name, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['billingAddress']['last_name'] = $encryptionlast_name;
            }

            if( isset( $orders['billingAddress']['first_name'] ) ){
                $encryption_first_name = $orders['billingAddress']['first_name'];
                $encryptionfirst_name = openssl_encrypt( $encryption_first_name, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['billingAddress']['first_name'] = $encryptionfirst_name;
            }
            
            if( isset( $orders['billingAddress']['name'] ) ){
                $encryption_name = $orders['billingAddress']['name'];
                $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['billingAddress']['name'] = $encryptionname;
            }

            if( isset( $orders['billingAddress']['phone'] ) ){
                $encryption_phone = $orders['billingAddress']['phone'];
                $encryptionphone = openssl_encrypt( $encryption_phone, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['billingAddress']['phone'] = $encryptionphone;
            }

            if( isset( $orders['shippingAddress']['phone'] ) ){
                $encryption_sphone = $orders['shippingAddress']['phone'];
                $encryptionsphone = openssl_encrypt( $encryption_sphone, $ciphering, $encryption_key, $options, $encryption_iv );
                $orders['shippingAddress']['phone'] = $encryptionsphone;
            }

            DB::table($shop_name[0] . '_subscriptioncontracts')->where('subId',$admin_graphql_api_id)->update([
                        'subId' =>$subscriptionContractId,
                        'data' => json_encode($orders),
                        'status' => $status,
                        'order_name' => $orders['name'],
                        'name' => $encryptionname,
                        'email' => $encryptionemail,
                        'interval' => $interval,
                        'total'=>$orders['total'],
                        'intervalCount' => $intervalCount,
                        'nextBillingDate' => $dateTimeUTC,
                        'created_at' => $creteadDate,
                        'created_at_sort'=>$created_at_sort
                ]
            );
            
            $_subscriptioncontracts_history = DB::table($shop_name[0] . '_subscriptioncontracts_history')->select('*')->where('subId',$admin_graphql_api_id)->get()->toArray();
            if(count($_subscriptioncontracts_history)){
                if(!empty($_subscriptioncontracts_history[0])){
                    if($_subscriptioncontracts_history[0]->status != $status && $_subscriptioncontracts_history[0]->statusChange){
                        if (Schema::hasTable($shop_name[0] . '_notification_template')) {
                            $mail = DB::table($shop_name[0] . '_notification_template')->select('*')->where('topic','status')->get()->toArray();
                            if(empty($mail)){
                                $mail = DB::table('default_mail')->select('*')->where('topic','status')->get()->toArray();
                            }
                        }else{
                            $mail = DB::table('default_mail')->select('*')->where('topic','status')->get()->toArray();
                        }
                        if(!empty($mail[0]->mail)){
                            $orders['mailHtml'] = $mail[0]->mail;
                            $orders['mail']['from_email'] = $mail[0]->from_email;
                            $orders['mail']['from_name'] = $mail[0]->from_name;
                            $orders['mail']['subject'] = $mail[0]->subject;
                        }else{
                            $orders['mailHtml'] = '';
                            $orders['mail']['from_email'] = '';
                            $orders['mail']['from_name'] = '';
                            $orders['mail']['subject'] = '';
                        }
                        Mail::to($email)->send(new SubStatusMail($orders));
                        DB::table($shop_name[0] . '_subscriptioncontracts_history')->where('subId',$admin_graphql_api_id)->where('statusChange',true)->delete();
                    }elseif($_subscriptioncontracts_history[0]->nextBillingDate != $dateTimeUTC && $_subscriptioncontracts_history[0]->skip){
                        if (Schema::hasTable($shop_name[0] . '_notification_template')) {
                            $mail = DB::table($shop_name[0] . '_notification_template')->select('*')->where('topic','skip')->get()->toArray();
                            if(empty($mail)){
                                $mail = DB::table('default_mail')->select('*')->where('topic','skip')->get()->toArray();
                            }
                        }else{
                            $mail = DB::table('default_mail')->select('*')->where('topic','skip')->get()->toArray();
                        }
                        if(!empty($mail[0]->mail)){
                            $orders['mailHtml'] = $mail[0]->mail;
                            $orders['mail']['from_email'] = $mail[0]->from_email;
                            $orders['mail']['from_name'] = $mail[0]->from_name;
                            $orders['mail']['subject'] = $mail[0]->subject;
                        }else{
                            $orders['mailHtml'] = '';
                            $orders['mail']['from_email'] = '';
                            $orders['mail']['from_name'] = '';
                            $orders['mail']['subject'] = '';
                        }
                        Mail::to($email)->send(new SkipSubMail($orders));
                        DB::table($shop_name[0] . '_subscriptioncontracts_history')->where('subId',$admin_graphql_api_id)->where('skip',true)->delete();
                        return true;
                    }
                }
            }
            
        } catch (\Throwable $th) {
            Log::error(['error'=>$th]);
            return true;
        }
    } catch (\Throwable $th) {
        Log::error(['error'=>$th]);
    }
});

Route::post('/api/subscriptioncontracts/billingattempt',function(Request $request){

    $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
    $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret
    $data = $request->getContent();
    $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

    $ifShopify = hash_equals($hmacHeader, $calculatedHmac);

    if (!$ifShopify) {
        Log::warning('Webhook verification failed.');
       return response('Unauthorized', 401);
    }
    
    // Log::error(['error'=>$data]);
    $decodeData = json_decode($data);
    $admin_graphql_api_id = $decodeData->admin_graphql_api_subscription_contract_id;
    $admin_graphql_order_id = $decodeData->order_id;
    $header = $request->header();
    $shop = $header['x-shopify-shop-domain'][0];
    $shop_name = explode('.', $shop);
    $session = DB::table('sessions')->select('access_token','ordertag','ordertagvalue')->where('shop',$shop)->get();
    $token = $session->toArray()[0]->access_token;
    $ordertag = $session->toArray()[0]->ordertag;
    $ordertagvalue = $session->toArray()[0]->ordertagvalue;
    $client = new Graphql($shop, $token);
    $query1 = <<<QUERY
    {
        subscriptionContract(id:"$admin_graphql_api_id"){
            deliveryPolicy{
                interval
                intervalCount
            }
        }
    }
    QUERY;
    $result1 = $client->query(['query' => $query1]);
    $data1 = $result1->getDecodedBody();
    $deliveryPolicy = $data1['data']['subscriptionContract']['deliveryPolicy'];
    $setNextBillingDate = date('d M Y H:i:s',strtotime( '+'.$deliveryPolicy['intervalCount'].' '.$deliveryPolicy['interval']));
    $setNextBillingDate = date_format(date_create($setNextBillingDate), 'c');

    $query = <<<QUERY
    mutation subscriptionContractSetNextBillingDate(\$contractId: ID!, \$date: DateTime!) {
        subscriptionContractSetNextBillingDate(contractId: \$contractId, date: \$date) {
          contract {
            id
            nextBillingDate
            deliveryPolicy{
                interval
                intervalCount
            }
            customer{
                email
                displayName
            }
            originOrder{
                id
                lineItems(first:50){
                    edges{
                        node{
                            image{
                                url
                            }
                        }
                    }
                }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY;
    $variables = [
        "contractId"=> $admin_graphql_api_id,
        "date"=> $setNextBillingDate
    ];
    $result = $client->query(['query' => $query,'variables'=>$variables]);
    $data = $result->getDecodedBody();
    
    $origin_order_id = str_replace('gid://shopify/Order/','',$data['data']['subscriptionContractSetNextBillingDate']['contract']['originOrder']['id']);
    $subscriptionContractId = $data['data']['subscriptionContractSetNextBillingDate']['contract']['id'];
    $clientRest = new Rest($shop, $token);
    $restOrder = $clientRest->get('orders/'.$admin_graphql_order_id);
    $restOrder = $restOrder->getDecodedBody();
    $order = $restOrder['order'];

    if( $ordertag == '1' ){
        $orderTags = $order['tags'];
        $orderTagsArray = explode( ",", $orderTags );
        $tagAlready = 0;
        if( $orderTags != '' ){
            foreach ( $orderArrayValue as $orderTagsArray ) {
                if( $orderArrayValue == $ordertagvalue ){
                    $tagAlready = 1;
                }
            }
        }
        $newTags = $orderTags.','.$ordertagvalue;
        if( $tagAlready == 0 ){
            $updateOrder = $clientRest->put( 'orders/'.$admin_graphql_order_id, ["order"=>[
                "tags"=>$newTags
            ]] );
            $updateOrderValue = $updateOrder->getDecodedBody();
        }
    }
    
    $orders = [];
    $orders['id']=$order['id'];
    $arrays = array(
        'fields' => 'name'
    );
    $resultShop = $clientRest->get('shop', [], $arrays);

    $resultShop = $resultShop->getDecodedBody();
    
    $orders['shop']=$resultShop['shop']['name'];
    $orders['shopurl']=$shop_name[0];

    $email = $data['data']['subscriptionContractSetNextBillingDate']['contract']['customer']['email'];
    $name = $data['data']['subscriptionContractSetNextBillingDate']['contract']['customer']['displayName'];
    $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionContractSetNextBillingDate']['contract']['nextBillingDate']));

    $newDateTime = new DateTime($nextbillingDate); 
    $dateTimeUTC = $nextbillingDate;

    $billingDate = date_create($data['data']['subscriptionContractSetNextBillingDate']['contract']['nextBillingDate']);
    $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");
    $orders['subscriptionContractId'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['id'];
    $orders['deliveryPolicy'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['deliveryPolicy'];
    $orders['name']=$order['name'];
    $date=date_create($order['created_at']);
    $creteadDate = $order['created_at'];
    $orders['createdAt']=date_format($date,"M d,Y");
    
    $currency = $order['current_total_price_set']['shop_money']['currency_code'];
    $orders['total']= $currency." ".$order['current_total_price'];
    $orders['currency'] = $currency;
    $orders['tax'] = $order['current_total_tax'];
    $orders['subtotal'] = $order['current_subtotal_price'];
    $orders['discount'] = $order['current_total_discounts'];
    $orders['shipping'] = $order['total_shipping_price_set']['shop_money']['amount'];
    $orders['shippingAddress'] = $order['shipping_address'];
    $orders['billingAddress'] = $order['billing_address'];
    //Log::error($order);
    //$orders['payment'] = $order['payment_details'];
    for($i=0;$i<count($order['line_items']);$i++){
        $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
        $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
        if(!empty($data['data']['subscriptionContractSetNextBillingDate']['contract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
            $orders['products'][$i]['productImage'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
        }else{
            $orders['products'][$i]['productImage'] = '';
        }
        $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
        $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
    }   
    
    try {

        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_iv = '1332425434231121';
        $encryption_key = "easyitgkeyencryp";

        if( isset( $orders['shippingAddress']['last_name'] ) ){
            $encryption_slast_name = $orders['shippingAddress']['last_name'];
            $encryptionslast_name = openssl_encrypt( $encryption_slast_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['last_name'] = $encryptionslast_name;
        }

        if( isset( $orders['shippingAddress']['first_name'] ) ){
            $encryption_sfirst_name = $orders['shippingAddress']['first_name'];
            $encryptionsfirst_name = openssl_encrypt( $encryption_sfirst_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['first_name'] = $encryptionsfirst_name;
        }

        if( isset( $orders['shippingAddress']['name'] ) ){
            $encryption_sname = $orders['shippingAddress']['name'];
            $encryptionsname = openssl_encrypt( $encryption_sname, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['name'] = $encryptionsname;
        }

        if( isset( $orders['billingAddress']['last_name'] ) ){
            $encryption_last_name = $orders['billingAddress']['last_name'];
            $encryptionlast_name = openssl_encrypt( $encryption_last_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['last_name'] = $encryptionlast_name;
        }

        if( isset( $orders['billingAddress']['first_name'] ) ){
            $encryption_first_name = $orders['billingAddress']['first_name'];
            $encryptionfirst_name = openssl_encrypt( $encryption_first_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['first_name'] = $encryptionfirst_name;
        }
        
        if( isset( $orders['billingAddress']['name'] ) ){
            $encryption_name = $orders['billingAddress']['name'];
            $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['name'] = $encryptionname;
        }

        if( isset( $orders['billingAddress']['phone'] ) ){
            $encryption_phone = $orders['billingAddress']['phone'];
            $encryptionphone = openssl_encrypt( $encryption_phone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['phone'] = $encryptionphone;
        }

        if( isset( $orders['shippingAddress']['phone'] ) ){
            $encryption_sphone = $orders['shippingAddress']['phone'];
            $encryptionsphone = openssl_encrypt( $encryption_sphone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['phone'] = $encryptionsphone;
        }

        DB::table($shop_name[0] . '_subscriptioncontracts')->where('subId',$admin_graphql_api_id)->update([
                    'subId' =>$subscriptionContractId,
                    'data' => json_encode($orders),
                    'nextBillingDate' => $dateTimeUTC,
                    'created_at' => $creteadDate,
                    'total'=>$orders['total'],
        ]);
        
        if (!Schema::hasTable($shop_name[0] . '_billingAttemptSuccess')) {
            Schema::create($shop_name[0] . '_billingAttemptSuccess', function (Blueprint $table) {
                $table->id();
                $table->json('data')->nullable(true);
                $table->string('subId')->nullable(true);
                $table->string('total')->nullable(true);
                $table->boolean('mail')->default(false);
                $table->timestamp('created_at')->useCurrent();
            });
        }
        if (Schema::hasTable($shop_name[0] . '_billingAttempt')) {
            $id_billingAttempt = DB::table($shop_name[0] . '_billingAttempt')->select('id')->where('subId',$subscriptionContractId)->latest()->first();
            DB::table($shop_name[0] . '_billingAttempt')->where('id',$id_billingAttempt->id)->update(['status'=>'success']);
        }
        if (Schema::hasTable($shop_name[0] . '_notification_template')) {
            $mail = DB::table($shop_name[0] . '_notification_template')->select('*')->where('topic','order')->get()->toArray();
            if(empty($mail)){
                $mail = DB::table('default_mail')->select('*')->where('topic','order')->get()->toArray();
            }
        }else{
            $mail = DB::table('default_mail')->select('*')->where('topic','order')->get()->toArray();
        }
        if(!empty($mail[0]->mail)){
            $orders['mailHtml'] = $mail[0]->mail;
            $orders['mail']['from_email'] = $mail[0]->from_email;
            $orders['mail']['from_name'] = $mail[0]->from_name;
            $orders['mail']['subject'] = $mail[0]->subject;
        }else{
            $orders['mailHtml'] = '';
            $orders['mail']['from_email'] = '';
            $orders['mail']['from_name'] = '';
            $orders['mail']['subject'] = '';
        }
        $done = DB::table($shop_name[0] . '_billingAttemptSuccess')->select('*')->where('subId',$subscriptionContractId)->get()->count();
        $mail = DB::table($shop_name[0] . '_billingAttemptSuccess')->select('mail')->where('subId',$subscriptionContractId)->get();
        if(!empty($mail) && !empty($mail->toArray())){
            $sentMail = ($mail->toArray())[0]->mail;
            if(!$sentMail){
                Mail::to($email)->send(new OrderMail($orders));
                DB::table($shop_name[0] . '_billingAttemptSuccess')->where('subId',$subscriptionContractId)->update(['mail'=>true]);
            }
        }
        if(!$done){
            DB::table($shop_name[0] . '_billingAttemptSuccess')->insert([
                        'subId' =>$subscriptionContractId,
                        'total'=>$orders['total'],
                        'mail'=>true
                ]
            );
            Mail::to($email)->send(new OrderMail($orders));
        }
    } catch (\Throwable $th) {
        Log::error(['error'=>$th]);
    }
    return true;
});

Route::post('/api/subscriptioncontracts/billingattempt/failure',function(Request $request){
    $hmacHeader = $request->header('X-Shopify-Hmac-SHA256');
    $secret = env('SHOPIFY_API_SECRET'); // Replace with your webhook secret
    $data = $request->getContent();
    $calculatedHmac = base64_encode(hash_hmac('sha256', $data, $secret, true));

    $ifShopify = hash_equals($hmacHeader, $calculatedHmac);

    if (!$ifShopify) {
        Log::warning('Webhook verification failed.');
       return response('Unauthorized', 401);
    }

    $decodeData = json_decode($data);

    $admin_graphql_api_id = $decodeData->admin_graphql_api_subscription_contract_id;
    
    $header = $request->header();
    $shop = $header['x-shopify-shop-domain'][0];
    $shop_name = explode('.', $shop);
    $session = DB::table('sessions')->select('access_token')->where('shop',$shop)->get();
    $token = $session->toArray()[0]->access_token;
    $client = new Graphql($shop, $token);
    $query = <<<QUERY
    {
        subscriptionContract(id:"$admin_graphql_api_id"){
            customer{
                email
            }
    }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
    $email = $data['data']['subscriptionContract']['customer']['email'];
    if (!Schema::hasTable($shop_name[0] . '_billingAttemptFailed')) {
        Schema::create($shop_name[0] . '_billingAttemptFailed', function (Blueprint $table) {
            $table->id();
            $table->json('data')->nullable(true);
            $table->string('subId')->nullable(true);
            $table->timestamp('created_at')->useCurrent();
        });
    }
    try {
        $done = DB::table($shop_name[0] . '_billingAttemptFailed')->select('*')->where('subId',$admin_graphql_api_id)->get()->count();
        if(!$done){
            DB::table($shop_name[0] . '_billingAttemptFailed')->insert([
                        'subId' =>$admin_graphql_api_id,
                        'data' => $data,
                ]
            );
            //Mail::to($email)->send(new OrderMail($orders));
        }
    } catch (\Throwable $th) {
        Log::error(['error'=>json_encode($th)]);
    }
});

Route::get('/api/products/{params}', function (Request $request, $params) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active
    $params = json_decode($params, true);
    $query = $params['query'];
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $query = <<<QUERY
    {
        products(first: 20,query:"$query") {
            edges {
            node {
                id
                title
                vendor
                productType
                sellingPlanGroups(first:1){
                    edges{
                        node{
                            name
                            id
                        }
                    }
                }
                images(first:1){
                    edges{
                        node{
                            id
                            url
                        }
                    } 
                }
                handle
            }
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query]);

    return response($result->getDecodedBody());
})->middleware('shopify.auth');


Route::get('/api/subproducts/{ids}', function (Request $request, $ids) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Rest($session->getShop(), $session->getAccessToken());

    $array = array(
        'ids' => $ids,
        'fields' => 'id,title,vendor,product_type,image'
    );

    $result = $client->get('products', [], $array);
    $array = array(
        'fields' => 'myshopify_domain'
    );
    $resultShop = $client->get('shop', [], $array);

    $arrayResult = array(
        'data' => $result->getDecodedBody(),
        'shop' => $resultShop->getDecodedBody()
    );

    return response($arrayResult);
})->middleware('shopify.auth');


Route::post('/api/createsubgroup', function (Request $request) {
    /** @var AuthSession */
    Log::error("itgCronRunningCheck");
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $table_name = $shop_name[0] . '_sellingplangroup';
    $params = $request;
    $sellingPlanGroupName = $params['nm'];
    $scheduleFrequency = $params['sF'];
    $scheduleFrequencyName = $params['sFN'];
    $scheduleIntervalArray = $params['sI'];
    $discountValue = $params['dP'];
    $subscriptionType = $params['tp'];
    $subscriptionEdit = $params['ed'];
    $subscriptionEditId = $params['id'];
    $subscriptionAlreadyId = $params['al'];
    $subscriptionPlanUpdate = $params['pu'];
    $subscriptionPlanState = $params['ps'];
    $ids = $params['ids'];
    $deletePlans = $params['pr'];
    $scheduleIntervalValue = 'day';

    $updatedData = array();
    $updateCount = 0;
    foreach ($subscriptionPlanUpdate as $key => $value) {
        $removedPlan = 0;
        foreach ($deletePlans as $dkey => $dvalue) {
            if ($dvalue == $value['id']) {
                $removedPlan = 1;
            }
        }
        if ($removedPlan == 0) {
            foreach ($subscriptionPlanState as $pkey => $pvalue) {
                if ($value['id'] == $pvalue['id']) {
                    $updatedData[$updateCount] = array();
                    $added = 0;
                    if (isset($value['discountPer'])) {
                        if ($value['discountPer'] != $pvalue['discountPer']) {
                            $updatedData[$updateCount]['discountPer'] = $value['discountPer'];
                            $added = 1;
                        }
                    }
                    if (isset($value['name']) && !empty($value['name'])) {
                        if ($value['name'] != $pvalue['name']) {
                            $updatedData[$updateCount]['name'] = $value['name'];
                            $added = 1;
                        }
                    }
                    if (isset($value['intervalCount']) && !empty($value['intervalCount'])) {
                        if ($value['intervalCount'] != $pvalue['intervalCount']) {
                            $updatedData[$updateCount]['intervalCount'] = $value['intervalCount'];
                            $added = 1;
                        }
                    }
                    if (isset($value['interval']) && !empty($value['interval'])) {
                        if ($value['interval'] != $pvalue['interval']) {
                            $updatedData[$updateCount]['interval'] = $value['interval'];
                            $added = 1;
                        }
                    }
                    if ($added == 1) {
                        $updatedData[$updateCount]['id'] = $value['id'];
                    }
                    $updateCount++;
                }
            }
        }
    }


    $sellingPlanDeleteIds = [];
    $countKey = 0;
    foreach ($deletePlans as $key => $value) {
        if (!empty($value)) {
            $sellingPlanDeleteIds[$countKey] = "gid://shopify/SellingPlan/$value";
            $countKey++;
        }
    }

    $sellingPlansToCreateUpdate = [];
    $countUpdate = 0;
    foreach ($updatedData as $key => $value) {
        if (!empty($value) && $value != '' && isset($value['id'])) {
            $sellingPlanNameId = "gid://shopify/SellingPlan/" . $value['id'];
            $sellingPlanName = '';
            if (isset($value['name']) && !empty($value['name'])) {
                $sellingPlanName .= $value['name'];
            } else {
                foreach ($subscriptionPlanState as $pkey => $pvalue) {
                    if ($pvalue['id'] == $value['id']) {
                        $sellingPlanName .= $pvalue['name'];
                    }
                }
            }
            if (isset($value['intervalCount']) && !empty($value['intervalCount'])) {
                $sellingPlanName .= ' ' . $value['intervalCount'];
                $intervalCount = $value['intervalCount'];
            } else {

                foreach ($subscriptionPlanState as $pkey => $pvalue) {
                    if ($pvalue['id'] == $value['id']) {
                        $sellingPlanName .= ' ' . $pvalue['intervalCount'];
                        $intervalCount = $pvalue['intervalCount'];
                    }
                }
            }
            if (isset($value['interval']) && !empty($value['interval'])) {
                $scheduleInterval = $value['interval'];
            } else {
                foreach ($subscriptionPlanState as $pkey => $pvalue) {
                    if ($pvalue['id'] == $value['id']) {
                        $scheduleInterval = $pvalue['interval'];
                    }
                }
            }
            if (isset($value['discountPer'])) {
                $discountPer = $value['discountPer'];
            } else {
                foreach ($subscriptionPlanState as $pkey => $pvalue) {
                    if ($pvalue['id'] == $value['id']) {
                        $discountPer = $pvalue['discountPer'];
                    }
                }
            }
            if ($scheduleInterval == 'DAY') {
                $scheduleIntervalValue = 'day';
            }
            if ($scheduleInterval == 'WEEK') {
                $scheduleIntervalValue = 'week';
            }
            if ($scheduleInterval == 'MONTH') {
                $scheduleIntervalValue = 'month';
            }
            if ($intervalCount > 1) {
                $scheduleIntervalValue = $scheduleIntervalValue . 's';
            }
            $sellingPlanName .= ' ' . $scheduleIntervalValue;
            $sellingPlansToCreateUpdate[$countUpdate] = [
                "id" => $sellingPlanNameId,
                "name" => "$sellingPlanName",
                "options" => "$intervalCount $scheduleIntervalValue",
                "billingPolicy" => [
                    "recurring" => [
                        "interval" => $scheduleInterval,
                        "intervalCount" => $intervalCount,
                    ]
                ],
                "deliveryPolicy" => [
                    "recurring" => [
                        "interval" => $scheduleInterval,
                        "intervalCount" => $intervalCount,
                    ]
                ],
                "pricingPolicies" => [
                    ["fixed" => [
                        "adjustmentType" => "PERCENTAGE",
                        "adjustmentValue" => [
                            "percentage" => $discountPer
                        ],
                    ]]
                ],
            ];
            $countUpdate++;
        }
    }

    $sellingPlansToCreate = [];
    foreach ($scheduleFrequency as $key => $value) {
        $scheduleInterval = $scheduleIntervalArray[$key]; 
        if ($scheduleInterval == 'DAY') {
            $scheduleIntervalValue = 'day';
        }
        if ($scheduleInterval == 'WEEK') {
            $scheduleIntervalValue = 'week';
        }
        if ($scheduleInterval == 'MONTH') {
            $scheduleIntervalValue = 'month';
        }
        if ($value > 1) {
            $scheduleIntervalValue = $scheduleIntervalValue . 's';
        }
        $position = $key + 1;
        $cscheduleFrequencyName = $scheduleFrequencyName[$key];

        $sellingPlansToCreate[$key] = [
            "name" => "$cscheduleFrequencyName $value $scheduleIntervalValue",
            "options" => "$value $scheduleIntervalValue",
            "category" => "SUBSCRIPTION",
            "position" => $position,
            "billingPolicy" => [
                "recurring" => [
                    "interval" => $scheduleInterval,
                    "intervalCount" => $value,
                ]
            ],
            "deliveryPolicy" => [
                "recurring" => [
                    "interval" => $scheduleInterval,
                    "intervalCount" => $value,
                ]
            ],
            "pricingPolicies" => [
                ["fixed" => [
                    "adjustmentType" => "PERCENTAGE",
                    "adjustmentValue" => [
                        "percentage" => $discountValue
                    ],
                ]]
            ],
        ];
    }

    $productIdsGql = [];
    $countKey = 0;
    foreach ($ids as $key => $value) {
        if (!empty($value)) {
            $alreadyAv = 0;
            foreach ($subscriptionAlreadyId as $akey => $avalue) {
                if ($avalue == $value) {
                    $alreadyAv = 1;
                }
            }
            if ($alreadyAv == 0) {
                $productIdsGql[$countKey] = "gid://shopify/Product/$value";
                $countKey++;
            }
        }
    }
    $productRemoveIdsGql = [];
    $countKey = 0;
    foreach ($subscriptionAlreadyId as $key => $value) {
        $alreadyAv = 0;
        foreach ($ids as $ikey => $ivalue) {
            if ($ivalue == $value) {
                $alreadyAv = 1;
            }
        }
        if ($alreadyAv == 0) {
            $productRemoveIdsGql[$countKey] = "gid://shopify/Product/$value";
            $countKey++;
        }
    }

    $sellingPlanHandle = str_replace(' ', '-', strtolower($sellingPlanGroupName));

    $client = new Graphql($session->getShop(), $session->getAccessToken());

    if ($subscriptionEdit) {
        $groupId = 'gid://shopify/SellingPlanGroup/' . $subscriptionEditId;
        if (!empty($productIdsGql)) {
            $queryUsingVariables = <<<QUERY
                mutation sellingPlanGroupAddProducts(\$id: ID!, \$productIds: [ID!]!) {
                    sellingPlanGroupAddProducts(id: \$id, productIds: \$productIds) {
                        sellingPlanGroup{
                            id
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            QUERY;
            $variables = [
                "id" => $groupId,
                "productIds" => $productIdsGql
            ];
            $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);
        }
        if (!empty($productRemoveIdsGql)) {
            $queryUsingVariables = <<<QUERY
                mutation sellingPlanGroupRemoveProducts(\$id: ID!, \$productIds: [ID!]!) {
                    sellingPlanGroupRemoveProducts(id: \$id, productIds: \$productIds) {
                        removedProductIds
                        userErrors {
                            field
                            message
                        }
                    }
                }
            QUERY;
            $variables = [
                "id" => $groupId,
                "productIds" => $productRemoveIdsGql
            ];
            $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);
        }
        $queryUsingVariables = <<<QUERY
            mutation sellingPlanGroupUpdate(\$id: ID!,\$input: SellingPlanGroupInput!) {
                sellingPlanGroupUpdate(id: \$id,input: \$input) {
                    sellingPlanGroup {
                        id
                        sellingPlans(first:20){
                            edges {
                                node {
                                    billingPolicy{
                                        ... on SellingPlanRecurringBillingPolicy{
                                            interval
                                            intervalCount
                                        }
                                    }
                                }
                            }
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                } 
            }
        QUERY;
        $variables = [
            "id" => $groupId,
            "input" => [
                "name" => $sellingPlanGroupName,
                "merchantCode" => $sellingPlanHandle,
                "options" => ["$sellingPlanGroupName"],
                "position" => 1,
                "sellingPlansToDelete" => $sellingPlanDeleteIds,
                "sellingPlansToUpdate" => $sellingPlansToCreateUpdate
            ]
        ];
        $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);
        $resultDecode = $result->getDecodedBody();
        $oldSellingPlans = $resultDecode['data']['sellingPlanGroupUpdate']['sellingPlanGroup']['sellingPlans']['edges'];
        $newSellingPlansToCreate = [];
        $newCount = 0;
        foreach ($sellingPlansToCreate as $key => $value) {
            $intervalCount = $value['billingPolicy']['recurring']['intervalCount'];
            $interval = $value['billingPolicy']['recurring']['interval'];
            $sellingPlanData = $value;
            $skip = 0;
            foreach ($oldSellingPlans as $key => $value) {
                $oldInterval = $value['node']['billingPolicy']['interval'];
                $oldIntervalCount = $value['node']['billingPolicy']['intervalCount'];
                if ($intervalCount == $oldIntervalCount && $oldInterval == $interval) {
                    $skip = 1;
                }
            }
            if ($skip == 0) {
                $newSellingPlansToCreate[$newCount] = $sellingPlanData;
                $newCount++;
            }
        }
        if (!empty($newSellingPlansToCreate)) {
            $variables = [
                "id" => $groupId,
                "input" => [
                    "sellingPlansToCreate" => $newSellingPlansToCreate
                ]
            ];
            $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);
        }
        $status = 'update';
    } else {
        $queryUsingVariables = <<<QUERY
            mutation sellingPlanGroupCreate(\$input: SellingPlanGroupInput!,\$resources: SellingPlanGroupResourceInput!,) {
                sellingPlanGroupCreate(input: \$input, resources:\$resources) {
                    sellingPlanGroup {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                } 
            }
        QUERY;

        $variables = [
            "input" => [
                "name" => $sellingPlanGroupName,
                "merchantCode" => $sellingPlanHandle,
                "options" => ["$sellingPlanGroupName"],
                "position" => 1,
                "sellingPlansToCreate" => $sellingPlansToCreate,
            ],
            "resources" => [
                "productIds" => $productIdsGql,
                "productVariantIds" => []
            ]
        ];

        $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);

        $resultDecode = $result->getDecodedBody();

        $groupId = $resultDecode['data']['sellingPlanGroupCreate']['sellingPlanGroup']['id'];
        $status = 'create';
    }

    $data = DB::table($table_name)->where('groupid', $groupId)->get();

    if (!empty($data->toArray())) {
        $update = DB::table($table_name)->where('groupid', $groupId)->update(['type' => $subscriptionType]);
    } else {
        $insert = DB::table($table_name)->insert(['groupid' => $groupId, 'type' => $subscriptionType]);
    }
    $planBool = false;
    if($subscriptionType == 'subscription-only'){
        $planBool = true;
    }
    foreach ($ids as $value) {
        if (!empty($value)) {
            $productquery = <<<QUERY
                mutation productUpdate(\$input: ProductInput!) {
                    productUpdate(input: \$input) {
                    product {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                    }
                }
            QUERY;
            $variables = ["input"=>["id"=>"gid://shopify/Product/$value","requiresSellingPlan"=>$planBool]];
            $result = $client->query(['query' => $productquery, 'variables' => $variables]);
        }
    }
    
    $arrayResult = array(
        'status' => $status,
        'id' => $groupId,
        'data' => $result->getDecodedBody(),
    );

    return response($arrayResult);
})->middleware('shopify.auth');

Route::post('/api/getsubgroup', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession');

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $params = $request;
    $startCursor = $params['startCursor'];
    $endCursor = $params['endCursor'];
    $query = $params['query'];
    $action = $params['action'];
    if ($action == "next") {
        $query = <<<QUERY
            {
            sellingPlanGroups( first:10, after:"$endCursor", query:"$query" ) {
                    edges {
                        node {
                            id
                            name
                            summary
                            productCount
                        }
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                        startCursor
                        endCursor
                    }
                }
            }
        QUERY;
    } elseif ($action == "prev") {
        $query = <<<QUERY
            {
            sellingPlanGroups( last:10, before:"$startCursor", query:"$query" ) {
                    edges {
                        node {
                            id
                            name
                            summary
                            productCount
                        }
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                        startCursor
                        endCursor
                    }
                }
            }
        QUERY;
    } else {
        $query = <<<QUERY
            {
            sellingPlanGroups(first:10, query:"$query") {
                    edges {
                        node {
                            id
                            name
                            summary
                            productCount
                        }
                    }
                    pageInfo {
                        hasNextPage
                        hasPreviousPage
                        startCursor
                        endCursor
                    }
                }
            }
        QUERY;
    }
    $result = $client->query(['query' => $query]);

    return response($result->getDecodedBody());
})->middleware('shopify.auth');

Route::post('/api/getsubscriptions', function (Request $request) {
    /** @var AuthSession */
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $shopName = $shop_name[0];
    $database = $shopName . '_subscriptioncontracts';
    $params = $request->all();
    $query = $params['query'];
    $action = $params['action'];
    $page = $params['page'];
    $status = $params['status'];
    $type = $params['type'];
    if (Schema::hasTable($shop_name[0] . '_subscriptioncontracts')) {
        if(!empty($query)){
            $records = DB::table($database)->where('email', 'LIKE', '%' . $query['searchValue'] . '%')->orWhere('name', 'like', '%' . $query['searchValue'] . '%')->orwhere('order_name', 'LIKE', '%' . $query['searchValue'] . '%')->orwhere('subId', 'LIKE', '%' . $query['searchValue'] . '%')->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset(0)->get();
            $allPages = 0;
            for($i=0;$i<count($records);$i++){
                $date = $records[$i]->created_at;
                $date=date_create($date);
                $records[$i]->created_at=date_format($date,"M d,Y");
                $encryptionname = $records[$i]->name;
                $encryptionemail = $records[$i]->email;
                $ciphering = "AES-128-CTR";
                $options = 0;
                $decryption_iv = "1332425434231121";
                $decryption_key = "easyitgkeyencryp";
                $decryptionname=openssl_decrypt($encryptionname, $ciphering, $decryption_key, $options, $decryption_iv);
                $decryptionemail=openssl_decrypt($encryptionemail, $ciphering, $decryption_key, $options, $decryption_iv);
                $records[$i]->name = $decryptionname;
                $records[$i]->email = $decryptionemail;
            }
            return response(json_encode(['records' => $records, 'pages' => $allPages, 'page' => 1]));
            die;
        }
        if($action==''){
            if( !empty($type) || !empty($status) ){
                if(!empty($type) && !empty($status)){
                    $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('interval',$type)->where('status',$status)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset(0)->get();
                    $pages = DB::table($database)->where('interval',$type)->where('status',$status)->get()->count();
                }
                elseif(empty($type) && !empty($status)){
                    $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('status',$status)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset(0)->get();
                    $pages = DB::table($database)->where('status',$status)->get()->count();
                }
                elseif(!empty($type) && empty($status)){
                    $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('interval',$type)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset(0)->get();
                    $pages = DB::table($database)->where('interval',$type)->get()->count();
                }
            }else{
                $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset(0)->get();
                $pages = DB::table($database)->get()->count();
            }
            if($pages>10){
                $allPages = ceil($pages / 10);
            }else{
                $allPages = 1;
            }
            for($i=0;$i<count($records);$i++){
                $date = $records[$i]->created_at;
                $date=date_create($date);
                $records[$i]->created_at=date_format($date,"M d,Y");
                $encryptionname = $records[$i]->name;
                $encryptionemail = $records[$i]->email;
                $ciphering = "AES-128-CTR";
                $options = 0;
                $decryption_iv = "1332425434231121";
                $decryption_key = "easyitgkeyencryp";
                $decryptionname=openssl_decrypt($encryptionname, $ciphering, $decryption_key, $options, $decryption_iv);
                $decryptionemail=openssl_decrypt($encryptionemail, $ciphering, $decryption_key, $options, $decryption_iv);
                $records[$i]->name = $decryptionname;
                $records[$i]->email = $decryptionemail;
            }
            return response(json_encode(['records' => $records, 'pages' => $allPages, 'page' => 1]));
        }else {
            if( !empty($type) || !empty($status) ){
                if(!empty($type) && !empty($status)){
                    $count = DB::table($database)->where('interval',$type)->where('status',$status)->get()->count();
                }
                elseif(empty($type) && !empty($status)){
                    $count = DB::table($database)->where('status',$status)->get()->count();
                }
                elseif(!empty($type) && empty($status)){
                    $count = DB::table($database)->where('interval',$type)->get()->count();
                }
            }else{
                $count = DB::table($database)->get()->count();
            }
            if($count>10){
                $page = $request['page'];
                $allPages = ceil($count / 10);
                if($action == 'next'){
                    if ($page < $allPages) {
                        $page++;
                    }
                } else if($action == 'prev'){
                    if ($page == 1 || $page < 1) {
                        $page = 1;
                    }
                    if ($page > 1) {
                        $page--;
                    }
                }
                $newpage = ($page - 1) * 10;
            }else{
                $newpage = 0;
                $allPages = 0;
            }
        }
        if( !empty($type) || !empty($status) ){
            if(!empty($type) && !empty($status)){
                $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('interval',$type)->where('status',$status)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset($newpage)->get();
            }
            elseif(empty($type) && !empty($status)){
                $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('status',$status)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset($newpage)->get();
            }
            elseif(!empty($type) && empty($status)){
                $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->where('interval',$type)->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset($newpage)->get();
            }
        }else{
            $records = DB::table($database)->orderBy('created_at_sort', 'DESC')->select('subId','order_name','name','email','status','interval','intervalCount','created_at')->limit(10)->offset($newpage)->get();
        }
        for($i=0;$i<count($records);$i++){
            $date = $records[$i]->created_at;
            $date=date_create($date);
            $records[$i]->created_at=date_format($date,"M d,Y");
            $encryptionname = $records[$i]->name;
            $encryptionemail = $records[$i]->email;
            $ciphering = "AES-128-CTR";
            $options = 0;
            $decryption_iv = "1332425434231121";
            $decryption_key = "easyitgkeyencryp";
            $decryptionname=openssl_decrypt($encryptionname, $ciphering, $decryption_key, $options, $decryption_iv);
            $decryptionemail=openssl_decrypt($encryptionemail, $ciphering, $decryption_key, $options, $decryption_iv);
            $records[$i]->name = $decryptionname;
            $records[$i]->email = $decryptionemail;
        }
    }else{
        $records = '';
        $page = 0;
        $allPages = 0;
    }
    return response(json_encode(['records' => $records, 'page' => $page, 'pages' => $allPages]));
    
})->middleware('shopify.auth');

Route::get('/api/getsubscription', function (Request $request) {
    $session = $request->get('shopifySession');
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $shop_name = explode('.',$session->getShop());
    $params = $request->all();
    $id = "gid://shopify/SubscriptionContract/".$params["id"];
    $customerId = $params["customer_id"];
    // print_r($id);die;

    $query = <<<QUERY
        {
            subscriptionContract(id:"$id") {
                createdAt
                nextBillingDate
                status
                customer{
                    id
                    displayName
                    email
                }
                orders(first:50){
                    edges{
                        node{
                            id
                            name
                            createdAt
                            fulfillments{
                                displayStatus
                            }
                            totalPriceSet{
                                presentmentMoney{
                                    amount
                                    currencyCode
                                }
                            }
                        }
                    }
                }
                originOrder{
                    billingAddress{
                        name
                        address1
                        address2
                        city
                        province
                        provinceCode
                        zip
                        country
                    }
                    shippingAddress{
                        name
                        address1
                        address2
                        city
                        province
                        provinceCode
                        zip
                        country
                    }
                }
            }
        }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();

    $croninfo = DB::table('easylog')->insert([
        'data' => json_encode($data)
    ]);
    $customerdata = $data['data']['subscriptionContract']['customer'];
    $Unformattedorders = $data['data']['subscriptionContract']['orders']['edges'];
    $orders = [];
    $i=0;
    foreach($Unformattedorders as $order){
        $orders[$i]['id']=$order['node']['id'];
        $orders[$i]['name']=$order['node']['name'];
        $date=date_create($order['node']['createdAt']);
        $orders[$i]['createdAt']=date_format($date,"M d, Y");
        if(empty($order['node']['fulfillments'])){
            $orders[$i]['status']='UNFULFILLED';
        }else{
            $orders[$i]['status']=$order['node']['fulfillments'][0]['displayStatus'];
        }
        $currency = $order['node']['totalPriceSet']['presentmentMoney']['currencyCode'];
        $orders[$i]['total']= $currency." ".$order['node']['totalPriceSet']['presentmentMoney']['amount'];
        $total = $orders[$i]['total'];
        $orders[$i]['id']=$order['node']['id'];
        $i++;
    }
    // dd($orders);
    $customerId = str_replace('gid://shopify/Customer/','',$customerdata['id']);
    $shippingAddress = $data['data']['subscriptionContract']['originOrder']['shippingAddress'];
    $billingAddress = $data['data']['subscriptionContract']['originOrder']['billingAddress'];
    $nextDate=date_create($data['data']['subscriptionContract']['nextBillingDate']);
    $nextBilling = date_format($nextDate,"l M d, Y");

    $pendingSubscriptionId = '';
    $nextActionUrl = '';
    if (Schema::hasTable($shop_name[0] . '_billingAttempt')) {
        $billingids = DB::table($shop_name[0].'_billingAttempt')->where('subId',$id)->where('status','pending')->latest()->first();
        $pendingSubscriptionId = $billingids;
        if(!empty($billingids) && !empty($billingids->data)){
            $findbillId = json_decode($billingids->data);
            $billingId = $findbillId->data->subscriptionBillingAttemptCreate->subscriptionBillingAttempt->id;
            $query2 = <<<QUERY
                {
                    subscriptionBillingAttempt(id:"$billingId") {
                        id
                        nextActionUrl
                    }
                }
            QUERY;
            $result2 = $client->query(['query' => $query2]);
            $resultBody2 = $result2->getDecodedBody();
            if(!empty($resultBody2['data']['subscriptionBillingAttempt']['nextActionUrl']) && $resultBody2['data']['subscriptionBillingAttempt']['nextActionUrl'] != null){
                $nextActionUrl = $resultBody2['data']['subscriptionBillingAttempt']['nextActionUrl'];
            }else{
                $nextActionUrl = '';
            }
        }
    }
    return response()->json(['status'=>$data['data']['subscriptionContract']['status'],'nextBillingDate'=>$nextBilling,'customerId'=>$customerId,'customerDetails'=>$customerdata,'billingAddress'=>$billingAddress,'shippingAddress'=>$shippingAddress,'orders'=>$orders,'total'=>$total,'shop'=>$shop_name[0],'nextActionUrl'=>$nextActionUrl,'pendingSubscriptionId',$pendingSubscriptionId]);

})->middleware('shopify.auth');

Route::get('/api/getsubscription/singleorder',function(Request $request){
    $session = $request->get('shopifySession');
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $id = $request['id'];
    $query = <<<QUERY
        {
            order(id:"$id") {
                name
                createdAt
                displayFulfillmentStatus
                totalDiscountsSet{
                    presentmentMoney{
                        amount
                        currencyCode
                    }
                }
                discountCode
                currentSubtotalLineItemsQuantity
                subtotalPriceSet{
                    presentmentMoney{
                        amount
                        currencyCode
                    }
                }
                totalPriceSet{
                    presentmentMoney{
                        amount
                        currencyCode
                    }
                }
                totalTaxSet{
                    presentmentMoney{
                        amount
                        currencyCode
                    }
                }
                totalShippingPriceSet{
                    presentmentMoney{
                        amount
                        currencyCode
                    }
                }
                lineItems(first:10){
                    edges{
                        node{
                            id 
                            name
                            image{
                                url
                            }
                            discountedUnitPriceSet{
                                presentmentMoney{
                                    amount
                                    currencyCode
                                }
                            }
                            quantity
                        }
                    }
                }
                customer{
                    id
                    displayName
                    email
                }
            }
        }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
    $date=date_create($data['data']['order']['createdAt']);
    $date=date_format($date,"M d,Y");
    $order['date'] = $date;
    $order['name'] = $data['data']['order']['name'];
    $order['status'] = $data['data']['order']['displayFulfillmentStatus'];
    if(!empty($data['data']['order']['discountCode'])){
        $order['discountCode'] = $data['data']['order']['discountCode'];
    }else{
        $order['discountCode'] = '';
    }
    if($data['data']['order']['totalPriceSet']['presentmentMoney']['currencyCode'] == 'INR'){
        $currency = '₹';
    }else{
        $currency = $order['node']['totalPriceSet']['presentmentMoney']['currencyCode'];
    }
    $order['currency'] = $currency;
    $order['totalQuantity'] = $data['data']['order']['currentSubtotalLineItemsQuantity'];
    $order['tax'] = $data['data']['order']['totalTaxSet']['presentmentMoney']['amount'];
    $order['total'] = $data['data']['order']['totalPriceSet']['presentmentMoney']['amount'];
    $order['subtotal'] = $data['data']['order']['subtotalPriceSet']['presentmentMoney']['amount'];
    $order['discount'] = $data['data']['order']['totalDiscountsSet']['presentmentMoney']['amount'];
    $order['shipping'] = $data['data']['order']['totalShippingPriceSet']['presentmentMoney']['amount'];
    $order['status'] = $data['data']['order']['displayFulfillmentStatus'];
    for($i=0;$i<count($data['data']['order']['lineItems']['edges']);$i++){
        $order['products'][$i]['id'] = $data['data']['order']['lineItems']['edges'][$i]['node']['id'];
        $order['products'][$i]['productTitle'] = $data['data']['order']['lineItems']['edges'][$i]['node']['name'];
        $order['products'][$i]['productImage'] = $data['data']['order']['lineItems']['edges'][$i]['node']['image']['url'];
        $order['products'][$i]['productQuantity'] = $data['data']['order']['lineItems']['edges'][$i]['node']['quantity'];
        $order['products'][$i]['totalPrice'] = $data['data']['order']['lineItems']['edges'][$i]['node']['discountedUnitPriceSet']['presentmentMoney']['amount'];
    }
    return response()->json($order);
})->middleware('shopify.auth');

Route::get('/api/deletegroup/{params}', function (Request $request, $params) {
    /** @var AuthSession */
    $session = $request->get('shopifySession');
    $params = json_decode($params, true);
    $deleteId = 'gid://shopify/SellingPlanGroup/' . $params['id'];

    $queryUsingVariables = <<<QUERY
        mutation sellingPlanGroupDelete(\$id: ID!) {
            sellingPlanGroupDelete(id: \$id) {
            deletedSellingPlanGroupId
                userErrors {
                    field
                    message
                }
            }
        }
    QUERY;
    $variables = [
        "id" => $deleteId
    ];

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $result = $client->query(['query' => $queryUsingVariables, 'variables' => $variables]);

    $shop = $session->getShop();

    $shop_name = explode('.', $shop);
    $table_name = $shop_name[0] . '_sellingplangroup';

    $data = DB::table($table_name)->where('groupid', $deleteId)->get();

    if (!empty($data->toArray())) {
        $data = DB::table($table_name)->where('groupid', $deleteId)->delete();
    }

    return response($result->getDecodedBody());
})->middleware('shopify.auth');


Route::get('/api/editgroup/{groupIdParam}', function (Request $request, $groupIdParam) {
    /** @var AuthSession */
    $session = $request->get('shopifySession'); // Provided by the shopify.auth middleware, guaranteed to be active

    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $clientRest = new Rest($session->getShop(), $session->getAccessToken());

    $params = json_decode($groupIdParam, true);

    $groupId = 'gid://shopify/SellingPlanGroup/' . $params['id'];

    $query = <<<QUERY
        {
            sellingPlanGroup(id:"$groupId") {
                id
                name
                summary
                productCount
                options
                products(first:20){
                    edges {
                        node {
                            id
                        }
                    }
                }
                sellingPlans(first:20){
                    edges {
                        node {
                            id
                            name
                            options
                            position
                            category
                            billingPolicy{
                                ... on SellingPlanRecurringBillingPolicy{
                                    interval
                                    intervalCount
                                }
                            }
                            deliveryPolicy{
                                ... on SellingPlanRecurringDeliveryPolicy{
                                    interval
                                    intervalCount
                                }
                            }
                            pricingPolicies{
                                ... on SellingPlanFixedPricingPolicy{
                                    adjustmentType
                                    adjustmentValue {
                                    ... on
                                    SellingPlanPricingPolicyPercentageValue {
                                        percentage
                                    }
                                    ... on
                                    MoneyV2 {
                                        amount
                                        currencyCode
                                    }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    QUERY;
    $result = $client->query(['query' => $query]);
    $resultBody = $result->getDecodedBody();
    $ids = '';
    $count = 0;
    if (isset($resultBody['data']['sellingPlanGroup'])) {
        $sellingPlanGroup = $resultBody['data']['sellingPlanGroup'];
        if (isset($sellingPlanGroup['products']['edges'])) {
            $products = $sellingPlanGroup['products']['edges'];
            foreach ($products as $product) :
                if (isset($product['node']['id'])) {
                    $productId = str_replace("gid://shopify/Product/", "", $product['node']['id']);
                    if ($count == 0) {
                        $ids .= $productId;
                    } else {
                        $ids .= ',' . $productId;
                    }
                    $count++;
                }
            endforeach;
        }
    }
    $resultProductDecode = '';
    if (!empty($ids)) {
        $array = array(
            'ids' => $ids,
            'fields' => 'id,title,vendor,product_type,image'
        );
        $resultProduct = $clientRest->get('products', [], $array);
        $resultProductDecode = $resultProduct->getDecodedBody();
    }

    $shop = $session->getShop();

    $shop_name = explode('.', $shop);
    $table_name = $shop_name[0] . '_sellingplangroup';

    $data = DB::table($table_name)->where('groupid', $groupId)->get();

    $arrayResult = array(
        'dtb' => $data,
        'data' => $result->getDecodedBody(),
        'products' => $resultProductDecode,
        'shop'=>$shop
    );

    return response($arrayResult);
})->middleware('shopify.auth');

Route::get('/api/index/data',function( Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop); 
    $totalsumBefore = 0;
    $totalsumAfter = 0;
    $interval = $request->interval;
    if(empty($interval) || $interval == 'WEEK'){
        $sevenDayBefore = date('Y-m-d H:i:s', strtotime('-7 days'));
        $sevenDayAfter = date('Y-m-d H:i:s', strtotime('+7 days'));
    }else{
        $sevenDayBefore = date('Y-m-d H:i:s', strtotime('-'.$interval));
        $sevenDayAfter = date('Y-m-d H:i:s', strtotime('+'.$interval));
    }
    $curretDay = date('Y-m-d H:i:s');
    if (Schema::hasTable($shop_name[0] . '_billingAttempt')) {
        $getDBDataBefore = DB::table($shop_name[0].'_billingAttempt')->select('subId')->where('created_at','>',$sevenDayBefore)->where('created_at','<',$curretDay)->where('status','success')->get();
        foreach($getDBDataBefore as $getDBDataBeforeIds){
            $getTotalBefore = DB::table($shop_name[0].'_subscriptioncontracts')->select('total')->where('subId',$getDBDataBeforeIds->subId)->get()->toArray();
            foreach($getTotalBefore as $TotalBefore){
                $newTotalBefore = 0;
                preg_match_all('!\d+(?:\.\d+)?!', $TotalBefore->total, $newTotalBefore);
                if(!empty($newTotalBefore[0])){
                    $totalsumBefore += $newTotalBefore[0][0];
                }
            }
        }
        $getTotalAfter = DB::table($shop_name[0].'_subscriptioncontracts')->select('total','nextBillingDate','interval','intervalCount')->where('nextBillingDate','<',$sevenDayAfter)->where('status','ACTIVE')->get()->toArray();
        foreach($getTotalAfter as $TotalAfter){
            $newTotalBefore = 0;
            $nextbill = $TotalAfter->nextBillingDate;
            preg_match_all('!\d+(?:\.\d+)?!', $TotalAfter->total, $newTotalBefore);
            $underSevenDay = date('Y-m-d', strtotime($nextbill));
            // $underSevenDay = date('Y-m-d', strtotime($underSevenDay.'+'.$TotalAfter->intervalCount.' '.$TotalAfter->interval));
            while($underSevenDay < $sevenDayAfter){
                $underSevenDay = date('Y-m-d', strtotime($underSevenDay.'+'.$TotalAfter->intervalCount.' '.$TotalAfter->interval));
                if(!empty($newTotalBefore[0])){
                    $totalsumAfter += $newTotalBefore[0][0];
                }
            }
        }
        if( !empty( $getTotalAfter ) ){
            $currency = explode(' ',$getTotalAfter[0]->total)[0];
        }else{
            $currency = '';
        }
        $orderCount = count($getDBDataBefore);
        $orderAfterCount = count($getTotalAfter);
    }else{
        $orderCount = 0;
        $orderAfterCount = 0;
        $currency = '';
        $totalsumBefore = 0;
        $totalsumAfter = 0;
    }
    return response()->json(['count'=>$orderCount,'currency'=>$currency,'totalsumBefore'=>$totalsumBefore,'totalsumAfter'=>$totalsumAfter,'orderAfterCount'=>$orderAfterCount]);
})->middleware('shopify.auth');

Route::get('/api/subscriptionContract/update/status',function( Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);  
    if (!Schema::hasTable($shop_name[0] . '_subscriptioncontracts_history')) {
        Schema::create($shop_name[0] . '_subscriptioncontracts_history', function (Blueprint $table) {
            $table->id();
            $table->json('data')->nullable(true);
            $table->string('subId')->nullable(true);
            $table->string('name')->nullable(true);
            $table->string('order_name')->nullable(true);
            $table->string('email')->nullable(true);
            $table->string('nextBillingDate')->nullable(true);
            $table->string('status')->nullable(true);
            $table->string('statusChange')->nullable(true);
            $table->string('skip')->nullable(true);
            $table->string('total')->nullable(true);
            $table->string('interval')->nullable(true);
            $table->string('intervalCount')->nullable(true);
            $table->string('created_at')->nullable(true);
            $table->dateTime('created_at_sort')->nullable(true);
        });
    }
    $subscriptionContractId = "gid://shopify/SubscriptionContract/".$request['id'];
    $_subscriptioncontracts_history = DB::table($shop_name[0] . '_subscriptioncontracts')->select('*')->where('subId',$subscriptionContractId)->get()->toArray();
    foreach($_subscriptioncontracts_history[0] as $key => $value){
        if($key!='id' && $key!='data'){
            $_subscriptioncontracts_history_data[$key] =$value; 
        }
    }
    $_subscriptioncontracts_history_data['statusChange'] =true;
    $statusSave = DB::table($shop_name[0] . '_subscriptioncontracts_history')->insert($_subscriptioncontracts_history_data);
    if(!$statusSave){
        return response()->json(['status'=>false]);
    }
    $id = "gid://shopify/SubscriptionContract/".$request['id'];
    $status = $request['status'];
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $query = <<<QUERY
    mutation subscriptionContractUpdate(\$contractId: ID!) {
        subscriptionContractUpdate(contractId: \$contractId) {
          draft {
            id
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY;
    $variables = [
        "contractId"=>$id
    ];
    $result = $client->query(['query' => $query,'variables'=>$variables]);
    $resultBody = $result->getDecodedBody(); 
    $draftId = $resultBody['data']['subscriptionContractUpdate']['draft']['id'];
    $query2 = <<<QUERY
    mutation subscriptionDraftUpdate(\$draftId: ID!, \$input: SubscriptionDraftInput!) {
        subscriptionDraftUpdate(draftId: \$draftId, input: \$input) {
          draft {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY;
    $variables2 = [
        "draftId"=>$draftId,
        "input"=>["status" => $status]
    ];
    $result2 = $client->query(['query' => $query2,'variables'=>$variables2]);
    $resultBody2 = $result2->getDecodedBody();
    $query3 = <<<QUERY
    mutation subscriptionDraftCommit(\$draftId: ID!) {
        subscriptionDraftCommit(draftId: \$draftId) {
          contract {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY;
    $variables3 = [
        "draftId"=>$draftId
    ];
    $result3 = $client->query(['query' => $query3,'variables'=>$variables3]);
    $resultBody3 = $result3->getDecodedBody();
    $data = $resultBody3['data']['subscriptionDraftCommit'];
    if(empty($data)){
        return false;
    }


    $query = <<<QUERY
    {
        subscriptionContract(id:"$id") {
            id
            status
            nextBillingDate
            deliveryPolicy{
                interval
                intervalCount
            }
            customer{
                email
                displayName
            }
            originOrder{
                id
                lineItems(first:50){
                    edges{
                        node{
                            image{
                                url
                            }
                        }
                    }
                }
            }
        }
    }
    QUERY;
    $result = $client->query(['query' => $query,'variables'=>$variables]);
    $data = $result->getDecodedBody();
    
    $origin_order_id = str_replace('gid://shopify/Order/','',$data['data']['subscriptionContract']['originOrder']['id']);
    $subscriptionContractId = $data['data']['subscriptionContract']['id'];
    $clientRest = new Rest($session->getShop(), $session->getAccessToken());
    $restOrder = $clientRest->get('orders/'.$origin_order_id);
    $restOrder = $restOrder->getDecodedBody();
    $order = $restOrder['order'];
    $orders = [];
    $orders['id']=$order['id']; 
    $arrays = array(
        'fields' => 'name'
    );
    $resultShop = $clientRest->get('shop', [], $arrays);

    $resultShop = $resultShop->getDecodedBody();
    
    $orders['shop']=$resultShop['shop']['name'];
    $orders['shopurl']=$shop_name[0];

    $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionContract']['nextBillingDate']));

    $newDateTime = new DateTime($nextbillingDate, new DateTimeZone("UTC")); 
    $newDateTime->setTimezone(new DateTimeZone("Asia/Kolkata")); 
    $dateTimeUTC = $newDateTime->format("Y-m-d H:i:s");
    $email = $data['data']['subscriptionContract']['customer']['email'];
    $billingDate = date_create($data['data']['subscriptionContract']['nextBillingDate']);
    $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");
    $orders['subscriptionContractId'] = $data['data']['subscriptionContract']['id'];
    $orders['subscriptionContractStatus'] = $data['data']['subscriptionContract']['status'];
    $orders['deliveryPolicy'] = $data['data']['subscriptionContract']['deliveryPolicy'];
    $orders['name']=$order['name'];
    $date=date_create($order['created_at']);
    $creteadDate = $order['created_at'];
    $orders['createdAt']=date_format($date,"M d,Y");
    
    $currency = $order['current_total_price_set']['shop_money']['currency_code'];
    $orders['total']= $currency." ".$order['current_total_price'];
    $orders['currency'] = $currency;
    $orders['tax'] = $order['current_total_tax'];
    $orders['subtotal'] = $order['current_subtotal_price'];
    $orders['discount'] = $order['current_total_discounts'];
    $orders['shipping'] = $order['total_shipping_price_set']['shop_money']['amount'];
    $orders['shippingAddress'] = $order['shipping_address'];
    $orders['billingAddress'] = $order['billing_address'];
  //  Log::error($order);
  //  $orders['payment'] = $order['payment_details'];
    for($i=0;$i<count($order['line_items']);$i++){
        $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
        $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
        if(!empty($data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
            $orders['products'][$i]['productImage'] = $data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
        }else{
            $orders['products'][$i]['productImage'] = '';
        }
        $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
        $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
    }
    try {
        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_iv = '1332425434231121';
        $encryption_key = "easyitgkeyencryp";

        if( isset( $orders['shippingAddress']['last_name'] ) ){
            $encryption_slast_name = $orders['shippingAddress']['last_name'];
            $encryptionslast_name = openssl_encrypt( $encryption_slast_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['last_name'] = $encryptionslast_name;
        }

        if( isset( $orders['shippingAddress']['first_name'] ) ){
            $encryption_sfirst_name = $orders['shippingAddress']['first_name'];
            $encryptionsfirst_name = openssl_encrypt( $encryption_sfirst_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['first_name'] = $encryptionsfirst_name;
        }

        if( isset( $orders['shippingAddress']['name'] ) ){
            $encryption_sname = $orders['shippingAddress']['name'];
            $encryptionsname = openssl_encrypt( $encryption_sname, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['name'] = $encryptionsname;
        }

        if( isset( $orders['billingAddress']['last_name'] ) ){
            $encryption_last_name = $orders['billingAddress']['last_name'];
            $encryptionlast_name = openssl_encrypt( $encryption_last_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['last_name'] = $encryptionlast_name;
        }

        if( isset( $orders['billingAddress']['first_name'] ) ){
            $encryption_first_name = $orders['billingAddress']['first_name'];
            $encryptionfirst_name = openssl_encrypt( $encryption_first_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['first_name'] = $encryptionfirst_name;
        }
        
        if( isset( $orders['billingAddress']['name'] ) ){
            $encryption_name = $orders['billingAddress']['name'];
            $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['name'] = $encryptionname;
        }

        if( isset( $orders['billingAddress']['phone'] ) ){
            $encryption_phone = $orders['billingAddress']['phone'];
            $encryptionphone = openssl_encrypt( $encryption_phone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['phone'] = $encryptionphone;
        }

        if( isset( $orders['shippingAddress']['phone'] ) ){
            $encryption_sphone = $orders['shippingAddress']['phone'];
            $encryptionsphone = openssl_encrypt( $encryption_sphone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['phone'] = $encryptionsphone;
        }
        DB::table($shop_name[0] . '_subscriptioncontracts')->where('subId',$id)->update([
            'data' => json_encode($orders),
            'status' =>$status
        ]);
    } catch (\Throwable $th) {
        Log::error(['error'=>json_encode($th)]);
    }
    return true;
})->middleware('shopify.auth');

Route::get('/api/subscriptionContract/update/skip',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop); 
    if (!Schema::hasTable($shop_name[0] . '_subscriptioncontracts_history')) {
        Schema::create($shop_name[0] . '_subscriptioncontracts_history', function (Blueprint $table) {
            $table->id();
            $table->json('data')->nullable(true);
            $table->string('subId')->nullable(true);
            $table->string('name')->nullable(true);
            $table->string('order_name')->nullable(true);
            $table->string('email')->nullable(true);
            $table->string('nextBillingDate')->nullable(true);
            $table->string('status')->nullable(true);
            $table->string('statusChange')->nullable(true);
            $table->string('skip')->nullable(true);
            $table->string('total')->nullable(true);
            $table->string('interval')->nullable(true);
            $table->string('intervalCount')->nullable(true);
            $table->string('created_at')->nullable(true);
            $table->dateTime('created_at_sort')->nullable(true);
        });
    }
    $subscriptionContractId = "gid://shopify/SubscriptionContract/".$request['id'];
    $_subscriptioncontracts_history = DB::table($shop_name[0] . '_subscriptioncontracts')->select('*')->where('subId',$subscriptionContractId)->get()->toArray();
    foreach($_subscriptioncontracts_history[0] as $key => $value){
        if($key!='id' && $key!='data'){
            $_subscriptioncontracts_history_data[$key] =$value; 
        }
    }
    $_subscriptioncontracts_history_data['skip'] =true;
    $statusSave = DB::table($shop_name[0] . '_subscriptioncontracts_history')->insert($_subscriptioncontracts_history_data);
    if(!$statusSave){
        return response()->json(['status'=>false]);
    }
    $id = "gid://shopify/SubscriptionContract/".$request['id'];
    $client = new Graphql($session->getShop(), $session->getAccessToken());

    $query1 = <<<QUERY
    {
        subscriptionContract(id:"$id"){
            nextBillingDate
            deliveryPolicy{
                interval
                intervalCount
            }
        }
    }
    QUERY;
    $result1 = $client->query(['query' => $query1]);
    $data1 = $result1->getDecodedBody();
    $deliveryPolicy = $data1['data']['subscriptionContract']['deliveryPolicy'];
    $oldNextDate = date("Y-m-d H:i:s",strtotime($data1['data']['subscriptionContract']['nextBillingDate']));
    $oldNextDate = date_create($oldNextDate);
    $setNextBillingDate = date_add($oldNextDate,date_interval_create_from_date_string( '+'.$deliveryPolicy['intervalCount'].' '.$deliveryPolicy['interval']));
    $setNextBillingDate = date_format($setNextBillingDate, 'c');
    $query = <<<QUERY
    mutation subscriptionContractSetNextBillingDate(\$contractId: ID!, \$date: DateTime!) {
        subscriptionContractSetNextBillingDate(contractId: \$contractId, date: \$date) {
          contract {
            id
            status
            nextBillingDate
            customer{
                email
                displayName
            }
            deliveryPolicy{
                interval
                intervalCount
            }
            originOrder{
                id
                lineItems(first:50){
                    edges{
                        node{
                            image{
                                url
                            }
                        }
                    }
                }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    QUERY;
    $variables = [
        "contractId"=> $id,
        "date"=> $setNextBillingDate
    ];
    $result = $client->query(['query' => $query,'variables'=>$variables]);
    $data = $result->getDecodedBody();
    $origin_order_id = str_replace('gid://shopify/Order/','',$data['data']['subscriptionContractSetNextBillingDate']['contract']['originOrder']['id']);
    $subscriptionContractId = $data['data']['subscriptionContractSetNextBillingDate']['contract']['id'];
    $clientRest = new Rest($session->getShop(), $session->getAccessToken());
    $restOrder = $clientRest->get('orders/'.$origin_order_id);
    $restOrder = $restOrder->getDecodedBody();
    $order = $restOrder['order'];
    $orders = [];
    $orders['id']=$order['id'];
    $arrays = array(
        'fields' => 'name'
    );
    $resultShop = $clientRest->get('shop', [], $arrays);

    $resultShop = $resultShop->getDecodedBody();
    
    $orders['shop']=$resultShop['shop']['name'];
    $orders['shopurl']=$shop_name[0];
    $email = $data['data']['subscriptionContractSetNextBillingDate']['contract']['customer']['email'];
    $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionContractSetNextBillingDate']['contract']['nextBillingDate']));
    
    $newDateTime = new DateTime($nextbillingDate); 
    $dateTimeUTC = $newDateTime->format("Y-m-d H:i:s");
    
    $billingDate = date_create($dateTimeUTC);
    $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");
    $orders['subscriptionContractId'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['id'];
    $orders['subscriptionContractStatus'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['status'];
    $orders['deliveryPolicy'] = $data['data']['subscriptionContractSetNextBillingDate']['contract']['deliveryPolicy'];
    $orders['name']=$order['name'];
    $date=date_create($order['created_at']);
    $creteadDate = $order['created_at'];
    $orders['createdAt']=date_format($date,"M d,Y");
    
    $currency = $order['current_total_price_set']['shop_money']['currency_code'];
    $orders['total']= $currency." ".$order['current_total_price'];
    $orders['currency'] = $currency;
    $orders['tax'] = $order['current_total_tax'];
    $orders['subtotal'] = $order['current_subtotal_price'];
    $orders['discount'] = $order['current_total_discounts'];
    $orders['shipping'] = $order['total_shipping_price_set']['shop_money']['amount'];
    $orders['shippingAddress'] = $order['shipping_address'];
    $orders['billingAddress'] = $order['billing_address'];
    //Log::error($order);
    //$orders['payment'] = $order['payment_details'];
    for($i=0;$i<count($order['line_items']);$i++){
        $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
        $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
        if(!empty($data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
            $orders['products'][$i]['productImage'] = $data['data']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
        }else{
            $orders['products'][$i]['productImage'] = '';
        }
        $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
        $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
    }   
    
    try {


        $ciphering = "AES-128-CTR";
        $iv_length = openssl_cipher_iv_length($ciphering);
        $options = 0;
        $encryption_iv = '1332425434231121';
        $encryption_key = "easyitgkeyencryp";

        if( isset( $orders['shippingAddress']['last_name'] ) ){
            $encryption_slast_name = $orders['shippingAddress']['last_name'];
            $encryptionslast_name = openssl_encrypt( $encryption_slast_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['last_name'] = $encryptionslast_name;
        }

        if( isset( $orders['shippingAddress']['first_name'] ) ){
            $encryption_sfirst_name = $orders['shippingAddress']['first_name'];
            $encryptionsfirst_name = openssl_encrypt( $encryption_sfirst_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['first_name'] = $encryptionsfirst_name;
        }

        if( isset( $orders['shippingAddress']['name'] ) ){
            $encryption_sname = $orders['shippingAddress']['name'];
            $encryptionsname = openssl_encrypt( $encryption_sname, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['name'] = $encryptionsname;
        }

        if( isset( $orders['billingAddress']['last_name'] ) ){
            $encryption_last_name = $orders['billingAddress']['last_name'];
            $encryptionlast_name = openssl_encrypt( $encryption_last_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['last_name'] = $encryptionlast_name;
        }

        if( isset( $orders['billingAddress']['first_name'] ) ){
            $encryption_first_name = $orders['billingAddress']['first_name'];
            $encryptionfirst_name = openssl_encrypt( $encryption_first_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['first_name'] = $encryptionfirst_name;
        }
        
        if( isset( $orders['billingAddress']['name'] ) ){
            $encryption_name = $orders['billingAddress']['name'];
            $encryptionname = openssl_encrypt( $encryption_name, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['name'] = $encryptionname;
        }

        if( isset( $orders['billingAddress']['phone'] ) ){
            $encryption_phone = $orders['billingAddress']['phone'];
            $encryptionphone = openssl_encrypt( $encryption_phone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['billingAddress']['phone'] = $encryptionphone;
        }

        if( isset( $orders['shippingAddress']['phone'] ) ){
            $encryption_sphone = $orders['shippingAddress']['phone'];
            $encryptionsphone = openssl_encrypt( $encryption_sphone, $ciphering, $encryption_key, $options, $encryption_iv );
            $orders['shippingAddress']['phone'] = $encryptionsphone;
        }

        DB::table($shop_name[0] . '_subscriptioncontracts')->where('subId',$id)->update([
                    'subId' =>$subscriptionContractId,
                    'data' => json_encode($orders),
                    'nextBillingDate' => $dateTimeUTC,
                    'created_at' => $creteadDate,
            ]
        );
        $nextDate=date_create($dateTimeUTC);
        $nextBilling = date_format($nextDate,"l M d, Y");
        
        return response()->json(['status'=>true,'nextBillingDate'=>$nextBilling]);
    } catch (\Throwable $th) {
        Log::error(['error'=>$th]);
        return response()->json(['status'=>false]);
    }
    return response()->json(['status'=>false]);
})->middleware('shopify.auth');

Route::get('/api/subscriptionContract/retry',function( Request $request){
    $id = 'gid://shopify/SubscriptionContract/'.$request->id;
    $session = $request->get('shopifySession');
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $shop_name = explode('.',$session->getShop());

    $oldsubscriptionContractid = $id;
    $breaksubscriptionContractId = str_replace('gid://shopify/SubscriptionContract/','',$oldsubscriptionContractid);
    $idempotencyKey = uniqid().$breaksubscriptionContractId;
    $query = <<<QUERY
    mutation subscriptionBillingAttemptCreate(\$subscriptionBillingAttemptInput: SubscriptionBillingAttemptInput!, \$subscriptionContractId: ID!) {
        subscriptionBillingAttemptCreate(subscriptionBillingAttemptInput: \$subscriptionBillingAttemptInput, subscriptionContractId: \$subscriptionContractId) {
        subscriptionBillingAttempt {
            id
            originTime
            errorMessage
            nextActionUrl
            order {
                id
            }
            ready
            subscriptionContract{
                id
                nextBillingDate
                deliveryPolicy{
                    interval
                    intervalCount
                }
                originOrder{
                    id
                    totalPriceSet
                    {
                        presentmentMoney{
                            amount
                            currencyCode
                        }
                    }
                }
            }
        }
        userErrors {
            field
            message
        }
        }
    }
    QUERY;
    $variables =[
        "subscriptionBillingAttemptInput"=>[
        "idempotencyKey"=>$idempotencyKey
        ],
        "subscriptionContractId"=>$oldsubscriptionContractid
    ];
    
    $result = $client->query(['query' => $query,'variables'=>$variables]);

    Log::debug($result->getDecodedBody());

    $query = <<<QUERY
        {
            subscriptionContract(id:"$id") {
                createdAt
                nextBillingDate
                status
                customer{
                    id
                    displayName
                    email
                }
            }
        }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
    $email = $data['data']['subscriptionContract']['customer']['email'];
    dd($email);
    if(!empty($request->nextactionurl)){
        $nextActionUrl = $request->nextactionurl;
        dd($nextActionUrl);
    }else{
        dd('$nextActionUrl');
    }
})->middleware('shopify.auth');
Route::get('/api/easy-subscription/customer/data',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop); 
    if (Schema::hasTable($shop_name[0] . '_customer')) {
        try {
            $session = $request->get('shopifySession');
            $shop = $session->getShop();
            $shop_name = explode('.', $shop); 
            $customer=[];
            $action = $request['action'];
            $query = $request['query'];
            $count = DB::table($shop_name[0] . '_customer')->count();
            $page = $request['page'];
            $next = false;
            $prev = false;
            if(empty($query)){
                if($count>10){
                    $allPages = ceil($count / 10);
                    if($action == 'next'){
                        if ($page < $allPages) {
                            $page++;
                        }
                    } else if($action == 'prev'){
                        if ($page == 1 || $page < 1) {
                            $page = 1;
                        }
                        if ($page > 1) {
                            $page--;
                        }
                    } else{
                        $page = 1;
                    }
                    $newpage = ($page - 1) * 10;
                }else{
                    $newpage = 0;
                    $allPages = 1;
                }
                if($page<$allPages){
                    $next = true;
                    if($page>1){
                        $prev = true;
                    }
                }else if($page>=$allPages && $page>1){
                    if($page>1){
                        $prev = true;
                    }
                }
                $data = DB::table($shop_name[0] . '_customer')->select('*')->limit(10)->offset($newpage)->get()->toArray();
            }else{
                $allPages = 1;
                $data = DB::table($shop_name[0] . '_customer')->select('*')->where('email', 'LIKE', '%' . $query. '%')->orWhere('name', 'like', '%' . $query . '%')->limit(10)->get()->toArray();
            }
            function customersdetails($data,$shop_name){
                $customer=[];
                foreach($data as $customers){
                    $total = 0;
                    $customers = (array)$customers;
                    $encryptionname = $customers['name'];
                    $encryptionemail = $customers['email'];
                    $ciphering = "AES-128-CTR";
                    $options = 0;
                    $decryption_iv = "1332425434231121";
                    $decryption_key = "easyitgkeyencryp";
                    $decryptionname=openssl_decrypt($encryptionname, $ciphering, $decryption_key, $options, $decryption_iv);
                    $decryptionemail=openssl_decrypt($encryptionemail, $ciphering, $decryption_key, $options, $decryption_iv);
                    $planData = DB::table($shop_name[0] . '_subscriptioncontracts')->where('email',$encryptionemail)->where('status','ACTIVE')->get()->count();
                    $customers['activePlans'] =$planData;
                    $subscriptionContractIds = DB::table($shop_name[0] . '_subscriptioncontracts')->select('data','subId','total')->where('email',$encryptionemail)->get();
                    foreach($subscriptionContractIds as $subscriptionContractId){
                        $addTotals = DB::table($shop_name[0] . '_billingAttempt')->select('total')->where('subId',$subscriptionContractId->subId)->where('status','success')->get()->toArray();
                        if(!empty($addTotals)){ 
                            foreach($addTotals as $addTotal){
                                preg_match_all('!\d+(?:\.\d+)?!', $addTotal->total, $newTotalBefore);
                                $total += $newTotalBefore[0][0];
                            }
                        }
                        $currencydata = json_decode($subscriptionContractId->data);
                        $currency = $currencydata->currency; 
                    }
                    $customers['currency'] = $currency;
                    $customers['total'] =$total;
                    $customers['shop'] =$shop_name[0];
                    $customers['email'] = $decryptionemail;
                    $customers['name'] = $decryptionname;
                    $customer[] = $customers;
                }
                return $customer;
            }
            $customer = customersdetails($data,$shop_name);
            return response()->json(['status'=>true,'customers'=>$customer,'pages'=>$allPages,'page'=>$page,'next'=>$next,'prev'=>$prev]);
        } catch (\Throwable $th) {
            dd($th);
            return response()->json(['status'=>false,'error'=>'Something Went Wrong']);
        }
    }else{
        return response()->json(['status'=>true,'customers'=>'','pages'=>0,'page'=>0,'next'=>0,'prev'=>0]);
    }
})->middleware('shopify.auth');

Route::get('/api/easy-subscription/settings/notification_mail_settings',function(Request $request){
    $session = $request->get('shopifySession');
    $result[0] = '';
    $catagory = $request->catagory;
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    if (!Schema::hasTable($shop_name[0] . '_notification_template')) {
        try {
            Schema::create($shop_name[0] . '_notification_template', function (Blueprint $table) {
                $table->id();
                $table->string('topic')->nullable(true);
                $table->string('from_name')->nullable(true);
                $table->string('from_email')->nullable(true);
                $table->string('subject')->nullable(true);
                $table->longText('mail')->nullable(true);
                $table->dateTime('createdAt')->useCurrent();
            });
            $data1 = DB::table('default_mail')->get();
            $defaultdatas = $data1->toArray();
            foreach($defaultdatas as $defaultdata){
                $storeData = (array)$defaultdata;
                DB::table($shop_name[0] . '_notification_template')->insert($storeData);
            }
            return response()->json(['status' => true, 'message' => $defaultdatas[0]]);
        } catch (\Throwable $th) {
            Log::error(
                "Failed to create $shop_name[0] database " .
                    print_r(json_encode($th), true)
            );;
        }
    } else {
        $data = DB::table($shop_name[0] . '_notification_template')->where('topic', $catagory)->get();
        if (!empty($data->toArray())) {
            $result = $data->toArray();
            return response()->json(['status' => true, 'message' => $result[0]]);
        }
    }
    return response()->json(['status' => false, 'message' => $result[0]]);
})->middleware('shopify.auth');

Route::post('/api/easy-subscription/settings/subscription_mail_activation/update',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $result = ['status' => false];
    $requesteddata = $request->form;
    $name = $requesteddata['name'];
    $email = $requesteddata['email'];
    $subject = $requesteddata['subject'];
    $message = $request->code;
    $catagory = $requesteddata['catagory'];
    $data = DB::table($shop_name[0] . '_notification_template')->where('topic', $catagory)->get();
    if (!empty($data->toArray())) {
        try {
            DB::table($shop_name[0] . '_notification_template')->where('topic', $catagory)->update([
                'from_name' => $name,
                'from_email' => $email,
                'subject' => $subject,
                'mail' => $message
            ]);
            $result = ['status' => true];
        } catch (\Throwable $th) {
            $result = ['status' => false];
        }
    } else {
        try {
            DB::table($shop_name[0] . '_notification_template')->insert([
                'from_name' => $name,
                'from_email' => $email,
                'subject' => $subject,
                'mail' => $message,
                'topic' => $catagory
            ]);
            $result = ['status' => true];
        } catch (\Throwable $th) {
            $result = ['status' => false];
        }
    }
    return response($result);
})->middleware('shopify.auth');
Route::post('/api/easy-subscription/testmail',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $email = $request['form']['email'];
    $name = $request['form']['name'];
    $topic = $request['form']['catagory'];
    $message = $request->code;
    $testEmail = $request->testEmail;
    $data = DB::table('dummy_data')->select('data')->where('topic',$topic)->get()->toArray();
    $dummyData = json_decode($data[0]->data);
    $dummyData = (array)$dummyData;
    $dummyData['deliveryPolicy'] = (array)$dummyData['deliveryPolicy'];
    $dummyData['shippingAddress'] = (array)$dummyData['shippingAddress'];
    $dummyData['billingAddress'] = (array)$dummyData['billingAddress'];
    $dummyData['payment'] = (array)$dummyData['payment'];
    for($i=0;$i<count($dummyData['products']);$i++){
        $dummyData['products'][$i]= (array)$dummyData['products'][$i];
    }
    $orders = $dummyData;
    $orders['mailHtml'] = $message;
    $orders['shop'] = $dummyData['shop'];
    $orders['shopurl']=$shop_name[0];
    $orders['mail']['from_email'] = $email;
    $orders['mail']['from_name'] = $name;
    $orders['mail']['subject'] = 'This is a test mail';

    if($topic=='order'){
        Mail::to($testEmail)->send(new OrderMail($orders));
    }else if($topic=='status'){
        Mail::to($testEmail)->send(new SubStatusMail($orders));
    }else if($topic=='skip'){
        Mail::to($testEmail)->send(new SkipSubMail($orders));
    }
    return response()->json(['status'=>true]);
    dd("Email is sent successfully.");
})->middleware('shopify.auth');
Route::post('/api/easy-subscription/previewmail',function(Request $request){
    $topic = $request['topic'];
    $data = DB::table('dummy_data')->select('data')->where('topic',$topic)->get()->toArray();
    $dummyData = json_decode($data[0]->data);
    $dummyData = (array)$dummyData;
    $dummyData['deliveryPolicy'] = (array)$dummyData['deliveryPolicy'];
    $dummyData['shippingAddress'] = (array)$dummyData['shippingAddress'];
    $dummyData['billingAddress'] = (array)$dummyData['billingAddress'];
    $dummyData['payment'] = (array)$dummyData['payment'];
    for($i=0;$i<count($dummyData['products']);$i++){
        $dummyData['products'][$i]= (array)$dummyData['products'][$i];
    }
    $orders = $dummyData;
    $i=0;
    $html = $request['code'];
    $data = $orders;
    if(!empty($data['subscriptionContractStatus'])){
        $replacement_find[$i] = "<subscriptionContractStatus>";
        $replacement_replace[$i++] = $data['subscriptionContractStatus'];
    }
    if(!empty($data['subscriptionContractId'])){
        $replacement_find[$i] = "<subscriptionContractId>";
        $replacedId = str_replace("gid://shopify/SubscriptionContract/","",$data['subscriptionContractId']);
        $replacement_replace[$i++] = 'Subscription #'.$replacedId;
    }
    if(!empty($data['name'])){
        $replacement_find[$i] = "<orderName>";
        $replacement_replace[$i++] = $data['name'];
    }
    if(!empty($data['shop'])){
        $replacement_find[$i] = "<shop>";
        $replacement_replace[$i++] = $data['shop'];
    }
    if(!empty($data['nextBillingDate'])){
        $replacement_find[$i] = "<nextBillingDate>";
        $replacement_replace[$i++] = $data['nextBillingDate'];
    }
    if(!empty($data['total'])){
        $replacement_find[$i] = "<total>";
        $replacement_replace[$i++] = $data['total'];
    }
    if(!empty($data['currency'])){
        $replacement_find[$i] = "<currency>";
        $replacement_replace[$i++] = $data['currency'];
    }
    if(!empty($data['shipping'])){
        $replacement_find[$i] = "<shipping>";
        $replacement_replace[$i++] = $data['shipping'];
    }
    if(!empty($data['subtotal'])){
        $replacement_find[$i] = "<subtotal>";
        $replacement_replace[$i++] = $data['subtotal'];
    }
    if(!empty($data['tax'])){
        $replacement_find[$i] = "<tax>";
        $replacement_replace[$i++] = $data['tax'];
    }
    if(!empty($data['shippingAddress']['name'])){
        $replacement_find[$i] = "<shippingAddressName>";
        $replacement_replace[$i++] = $data['shippingAddress']['name'];
    }
    if(!empty($data['shippingAddress']['address1'])){
        $replacement_find[$i] = "<shippingAddressAddress1>";
        $replacement_replace[$i++] = $data['shippingAddress']['address1'];
    }
    if(!empty($data['shippingAddress']['address2'])){
        $replacement_find[$i] = "<shippingAddressAddress2>";
        $replacement_replace[$i++] = $data['shippingAddress']['address2'];
    }
    if(!empty($data['shippingAddress']['zip'])){
        $replacement_find[$i] = "<shippingAddressZip>";
        $replacement_replace[$i++] = $data['shippingAddress']['zip'];
    }
    if(!empty($data['shippingAddress']['city'])){
        $replacement_find[$i] = "<shippingAddressCity>";
        $replacement_replace[$i++] = $data['shippingAddress']['city'];
    }
    if(!empty($data['shippingAddress']['province_code'])){
        $replacement_find[$i] = "<shippingAddressProvince_code>";
        $replacement_replace[$i++] = $data['shippingAddress']['province_code'];
    }
    if(!empty($data['shippingAddress']['country'])){
        $replacement_find[$i] = "<shippingAddressCountry>";
        $replacement_replace[$i++] = $data['shippingAddress']['country'];
    }
    if(!empty($data['billingAddress']['name'])){
        $encryptionname = $data['billingAddress']['name'];
        $ciphering = "AES-128-CTR";
        $options = 0;
        $decryption_iv = "1332425434231121";
        $decryption_key = "easyitgkeyencryp";
        $decryptionname=openssl_decrypt($encryptionname, $ciphering, $decryption_key, $options, $decryption_iv);
        $replacement_find[$i] = "<billingAddressName>";
        $replacement_replace[$i++] = $decryptionname;
    }
    if(!empty($data['billingAddress']['address1'])){
        $replacement_find[$i] = "<billingAddressAddress1>";
        $replacement_replace[$i++] = $data['billingAddress']['address1'];
    }
    if(!empty($data['billingAddress']['address2'])){
        $replacement_find[$i] = "<billingAddressAddress2>";
        $replacement_replace[$i++] = $data['billingAddress']['address2'];
    }
    if(!empty($data['billingAddress']['zip'])){
        $replacement_find[$i] = "<billingAddressZip>";
        $replacement_replace[$i++] = $data['billingAddress']['zip'];
    }
    if(!empty($data['billingAddress']['city'])){
        $replacement_find[$i] = "<billingAddressCity>";
        $replacement_replace[$i++] = $data['billingAddress']['city'];
    }
    if(!empty($data['billingAddress']['province_code'])){
        $replacement_find[$i] = "<billingAddressProvince_code>";
        $replacement_replace[$i++] = $data['billingAddress']['province_code'];
    }
    if(!empty($data['billingAddress']['country'])){
        $replacement_find[$i] = "<billingAddressCountry>";
        $replacement_replace[$i++] = $data['billingAddress']['country'];
    }
    if(!empty($data['payment']['credit_card_company'])){
        $replacement_find[$i] = "<credit_card_company>";
        $replacement_replace[$i++] = $data['payment']['credit_card_company'];
    }
    if(!empty($data['payment']['credit_card_number'])){
        $replacement_find[$i] = "<credit_card_number>";
        $replacement_replace[$i++] = $data['payment']['credit_card_number'];
    }

    $productStyle = "";
    $productStyle.= <<<STR
                <style>
                    .easySubsriptionHeader .easySubsriptionMailOrderSummery h2.orderSummeryTitle {padding-top: 0;}
                    .easySubsriptionHeader h2.orderSummeryTitle {margin: 0;padding-top: 30px;padding-bottom: 10px;}
                    body{font-family:Verdana,sans-serif;margin:0}
                    .easySubsription *{margin:0;padding:0;box-sizing:border-box}
                    .easySubsription a{color:#333;text-decoration:none}
                    .easySubsription h1,.easySubsription h2,.easySubsription h4,.easySubsription h5,.easySubsription h6,.easySubsription p,.easySubsription span,.easySubsription table,.easySubsriptionh3{color:#333;}.easySubsription h1,.easySubsription h2,.easySubsription h4,.easySubsription h5,.easySubsription h6,.easySubsriptionh3{font-weight:500}.easySubsription .easySubsriptionMailShop{font-size:28px;margin:10px 0}.easySubsription h2{font-size:20px;margin:10px 0}.easySubsription h4{font-size:18px}.easySubsription h5{font-size:15px}.easySubsription .easySubsriptionWrapper{width:100%;max-width:450px;min-width:300px;margin:auto}.easySubsription .easySubsriptionActBtn a.btn{padding:10px 15px;display:inline-block;background-color:#1990c6;color:#fff}.easySubsription .easySubsriptionActBtn{margin:0;padding-bottom:20px;position:relative;width:100%;display:flex;align-items:center;gap:15px}.easySubsription .easySubsriptionActBtn a{color:#1990c6;background-color:#fff}.easySubsriptionHeader{width:100%;position:relative;line-height:1.6em}.easySubsriptionHeader h2.easySubsriptionMailShop{margin:0;padding-bottom:40px}.easySubsriptionHeader h3.easySubsriptionMailTitle{width:100%;padding-bottom:10px}.easySubsriptionHeader .easySubsriptionMailDesc{width:100%;padding-bottom:20px}.easySubsriptionHeader h3.easySubsriptionMailInfoTitle{color:#1990c6;text-decoration:underline}.easySubsriptionHeader .easySubsriptionMailOrderSummery{position:relative;width:100%;padding-top:40px}.easySubsriptionHeader .easySubsriptionMailOrderSummery h2.orderSummeryTitle{margin:0 0 10px}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems{position:relative;width:100%}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct{position:relative;width:100%;padding:15px 0;border-top:1px solid #bbb;display:flex;align-items:flex-start;gap:15px}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct .easySubsriptionProductDesc{font-size:14px}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct .easySubsriptionProductDesc label{display:block;font-weight:600;padding-bottom: 5px;}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct .easySubsriptionProductPrice{width:100%;text-align:right;font-weight:600;font-size:14px}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct img{margin-top:0px}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct.easySubsriptionProductSubParent .easySubsriptionProductSub{position:relative;width:100%;display:flex;align-items:center}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct.easySubsriptionProductSubParent .easySubsriptionProductSub .easySubsriptionProductDesc{text-align:right}.easySubsriptionHeader .easySubsriptionMailOrderSummery .easySubsriptionMailOrderSummeryItems .easySubsriptionProduct.easySubsriptionProductSubParent .easySubsriptionProductSub:last-child{border-top:1px solid #777;padding-top:10px}.easySubsriptionHeader .easySubsriptionMailCustomerSummery{position:relative;width:100%;display:flex;flex-wrap:wrap;padding-top:10px}.easySubsriptionHeader .easySubsriptionMailCustomerSummery h2.orderSummeryTitle{margin:0;width:100%;padding-bottom:20px}.easySubsriptionHeader .easySubsriptionMailCustomerSummery .easySubsriptionMailCustomerSummeryBox{width:50%;padding:15px;background-color:#eee;font-size:14px;font-style:italic}.easySubsriptionHeader .easySubsriptionMailCustomerSummery .easySubsriptionMailCustomerSummeryBox label{font-weight:600;padding-bottom:10px;display:block}
                </style>
            STR;
    $replacement_find[$i] = "<defaulteasystyle>";
    $replacement_replace[$i++] = $productStyle;

    $productHtml = "";
    if(!empty($data['products'])){
        foreach($data['products'] as $product){
            $productImage = $product['productImage'];
            $productTitle = $product['productTitle'];
            $productQuantity = $product['productQuantity'];
            $intervalCount = $data['deliveryPolicy']['intervalCount'];
            $interval = $data['deliveryPolicy']['interval'];
            $totalPrice = $product['totalPrice'];
            $curr = $data['currency'];
            $productHtml.= <<<STR

                    <tr class="easySubsriptionProduct">
                        <td width="20%">
                            <img width="50px" src=$productImage alt="">
                        </td>
                        <td width="50%">
                            <div class="easySubsriptionProductDesc">
                                <label>$productTitle × $productQuantity</label>
                                <span>Deliver every $intervalCount $interval</span>
                            </div>
                        </td>
                        <td width="30%">
                            <div class="easySubsriptionProductPrice">
                                $curr $totalPrice
                            </div>
                        </td>
                    </tr>
            STR;
        }
        $replacement_find[$i] = "<products>";
        $replacement_replace[$i++] = $productHtml;
    }
    $preview = str_replace($replacement_find, $replacement_replace, $html);
    return response()->json(['status'=>true,'html'=>$preview]);
})->middleware('shopify.auth');
Route::get('/api/easy-subscription/settings/customerportal/update',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $result = [];
    $userUpdateData = json_decode($request['data']);
    $data = DB::table($shop_name[0] . '_customerportal_settings')->get();
    if (!empty($data->toArray())) {
        try {
            DB::table($shop_name[0] . '_customerportal_settings')->update([
                $userUpdateData->type => $userUpdateData->bool,
            ]);
            $result = ['status' => true];
        } catch (\Throwable $th) {
            $result = ['status' => false];
        }
    } else {
        try {
            DB::table($shop_name[0] . '_customerportal_settings')->insert([
                $userUpdateData->type => $userUpdateData->bool,
            ]);
            $result = ['status' => true];
        } catch (\Throwable $th) {
            $result = ['status' => false];
        }
    }
    return response($result);
})->middleware('shopify.auth');

Route::get('/api/easy-subscription/settings/ordertags/update',function(Request $request){
    $session = $request->get('shopifySession');
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $result = [];
    $userUpdateData = json_decode($request['data']);
    try {
        DB::table('sessions')->where('shop', $shop)->update(['ordertag' => $userUpdateData->tagenable, 'ordertagvalue' => $userUpdateData->tagvalue]);
        $result = ['status' => true];
    } catch (\Throwable $th) {
        $result = ['status' => false];
    }
    return response($result);
})->middleware('shopify.auth');

Route::get('/api/easy-subscription/settings/ordertags',function(Request $request){
    $session = $request->get('shopifySession');
    $result = [];
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    $data = DB::table('sessions')->select('ordertag','ordertagvalue')->where('shop',$shop)->get();
    if (!empty($data->toArray())) {
        $result = $data->toArray();
    }
    return response(json_encode($result));
})->middleware('shopify.auth');

Route::get('/api/easy-subscription/settings/customerportal',function(Request $request){
    $session = $request->get('shopifySession');
    $result = [];
    $shop = $session->getShop();
    $shop_name = explode('.', $shop);
    if (!Schema::hasTable($shop_name[0] . '_customerportal_settings')) {
        Schema::create($shop_name[0] . '_customerportal_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('pauseResumeSubscriptions')->default(false);
            $table->boolean('cancelSubscriptions')->default(false);
            $table->boolean('skipNextOrder')->default(false);
            $table->timestamp('created_at')->useCurrent();
        });
        DB::table($shop_name[0] . '_customerportal_settings')->insert(
            [
                'pauseResumeSubscriptions' =>false,
                'skipNextOrder' =>false,
                'cancelSubscriptions' =>false,
            ]
        );
        $data = DB::table($shop_name[0] . '_customerportal_settings')->get();
        if (!empty($data->toArray())) {
            $result = $data->toArray();
        }
    } else {
        $data = DB::table($shop_name[0] . '_customerportal_settings')->get();
        if (!empty($data->toArray())) {
            $result = $data->toArray();
        }
    }
    return response(json_encode($result));
})->middleware('shopify.auth');

Route::get('/api/easy-subscription/widgetsetting/product',function(Request $request){
    $session = $request->get('shopifySession');
    $client = new Graphql($session->getShop(), $session->getAccessToken());
    $field = $request->widget;
    if( empty( $field ) ){
        $query = <<<QUERY
            {
                currentAppInstallation {
                    id
                }
            }
        QUERY;
        $result = $client->query(['query' => $query]);
        $resultBody = $result->getDecodedBody();
       
        if(!empty($resultBody['data']['currentAppInstallation']['id'])){
            $ownerId = $resultBody['data']['currentAppInstallation']['id'];
            $query = <<<QUERY
                query {
                    appInstallation(id: "$ownerId") {
                        metafield(key: "widget", namespace: "metafield") {
                            value
                        }
                    }
                }
            QUERY;
            $result = $client->query(['query' => $query]);
            $resultBody = $result->getDecodedBody();
            if(!empty($resultBody['data']['appInstallation']['metafield']['value'])){
                $metaValue = $resultBody['data']['appInstallation']['metafield']['value'];
            }else{
                $query2 = <<<QUERY
                    mutation metafieldsSet(\$metafields: [MetafieldsSetInput!]!) {
                        metafieldsSet(metafields: \$metafields) {
                        metafields {
                            namespace
                            ownerType
                            value
                            createdAt
                            key
                        }
                        userErrors {
                            field
                            message
                        }
                        }
                    }
                QUERY;
                $variables2 =[
                    "metafields" => [
                        [
                            "key"=> "widget",
                            "namespace"=> "metafield",
                            "ownerId"=> $ownerId,
                            "type"=> "single_line_text_field",
                            "value"=> "easywidgetSetting1"
                        ]
                    ]
                ];
                $result2 = $client->query(['query' => $query2,'variables'=>$variables2]);
                $resultBody2 = $result2->getDecodedBody();
                
                if(!empty($resultBody2['data']['metafieldsSet']['metafields'][0]['value'])){
                    $metaValue = $resultBody2['data']['metafieldsSet']['metafields'][0]['value'];
                }
            }
        }      
    }else{
        $query = <<<QUERY
            {
                currentAppInstallation {
                    id
                }
            }
        QUERY;
        $result = $client->query(['query' => $query]);
        $resultBody = $result->getDecodedBody();
        if(!empty($resultBody['data']['currentAppInstallation']['id'])){
            $ownerId = $resultBody['data']['currentAppInstallation']['id'];
            $query = <<<QUERY
                mutation metafieldsSet(\$metafields: [MetafieldsSetInput!]!) {
                    metafieldsSet(metafields: \$metafields) {
                    metafields {
                        namespace
                        ownerType
                        value
                        createdAt
                        key
                    }
                    userErrors {
                        field
                        message
                    }
                    }
                }
            QUERY;
            $variables =[
                "metafields" => [
                    [
                        "key"=> "widget",
                        "namespace"=> "metafield",
                        "ownerId"=> $ownerId,
                        "type"=> "single_line_text_field",
                        "value"=> $field
                    ]
                ]
            ];
            $result = $client->query(['query' => $query,'variables'=>$variables]);
            $resultBody = $result->getDecodedBody();
            if(!empty($resultBody['data']['metafieldsSet']['metafields'][0]['value'])){
                $metaValue = $resultBody['data']['metafieldsSet']['metafields'][0]['value'];
            }
            
        }
    }
    return response()->json(['data'=>$metaValue]);
})->middleware('shopify.auth');