<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Shopify\Clients\Graphql;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Shopify\Clients\Rest;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\PendingMail;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::get('/', function () {
    return "Hello API";
});
Route::get('/customercheck', function () {
    return "Hello Customer";
});

Route::post('customerdata',function(Request $request){
    $token = $request->token;
    if($token != 'c01dd5c97da7e41af6d9446454402036'){
        return response()->json(['status'=>false]);
    }
    $shop = $request->shopname;
    $email = $request->customerEmail;
    $statusFilter = $request->statusFilter;
    $sessions = DB::table('sessions')->select('shop','access_token')->where('shop',$shop.'.myshopify.com')->get();
    $subscriptionContracts = [];
    $authShop = $sessions[0]->shop;
    $authTokken = $sessions[0]->access_token;
    if(!$statusFilter || $statusFilter == '' || $statusFilter == 'All'){
        $subscriptionContractsDbData = DB::table($shop.'_subscriptioncontracts')->select('*')->where('email',$email)->orderBy("created_at","desc")->get()->toArray();
    }elseif($statusFilter == 'Active'){
        $subscriptionContractsDbData = DB::table($shop.'_subscriptioncontracts')->select('*')->where('email',$email)->where('status','ACTIVE')->orderBy("created_at","desc")->get()->toArray();
    }elseif($statusFilter == 'Cancelled'){
        $subscriptionContractsDbData = DB::table($shop.'_subscriptioncontracts')->select('*')->where('email',$email)->where('status','CANCELLED')->orderBy("created_at","desc")->get()->toArray();
    }elseif($statusFilter == 'Paused'){
        $subscriptionContractsDbData = DB::table($shop.'_subscriptioncontracts')->select('*')->where('email',$email)->where('status','PAUSED')->orderBy("created_at","desc")->get()->toArray();
    }
    
    foreach($subscriptionContractsDbData as $subscriptionContractDbData){
        $data = [];
        if(!empty(json_decode($subscriptionContractDbData->data)->products[0]->productImage)){
            $data['image'] = json_decode($subscriptionContractDbData->data)->products[0]->productImage;
            $data['productQuantity'] = json_decode($subscriptionContractDbData->data)->products[0]->productQuantity;
            $data['totalPrice'] = json_decode($subscriptionContractDbData->data)->products[0]->totalPrice;
            $data['productTitle'] = json_decode($subscriptionContractDbData->data)->products[0]->productTitle;
            $data['productCurrency'] = json_decode($subscriptionContractDbData->data)->currency;
        }
        $data['subId'] = $subscriptionContractDbData->subId;
        $data['total'] = $subscriptionContractDbData->total;
        $data['interval'] = $subscriptionContractDbData->interval;
        $data['intervalCount'] = $subscriptionContractDbData->intervalCount;
        $data['nextBillingDate'] = $subscriptionContractDbData->nextBillingDate;
        $data['status'] = $subscriptionContractDbData->status;
        $subscriptionContracts[] = $data;
    }
    return response()->json(['data'=>$subscriptionContracts]);
});
Route::post('singlesubscriptionData',function(Request $request){
    $subID = $request->subidmoredetailsId;
    $shop = $request->shopname;
    $sessions = DB::table('sessions')->select('shop','access_token')->where('shop',$shop.'.myshopify.com')->get();
    $subscriptionContracts = [];
    $authShop = $sessions[0]->shop;
    $authTokken = $sessions[0]->access_token;
    $client = new Graphql($authShop, $authTokken);
    $shop_name = $shop;
    $query = <<<QUERY
        {
            subscriptionContract(id:"$subID") {
                createdAt
                nextBillingDate
                status
                deliveryPolicy{
                    interval
                    intervalCount
                }
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
            }
        }
    QUERY;
    $result = $client->query(['query' => $query]);
    $data = $result->getDecodedBody();
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
    $nextDate=date_create($data['data']['subscriptionContract']['nextBillingDate']);
    $interval=$data['data']['subscriptionContract']['deliveryPolicy']['interval'];
    $intervalCount=$data['data']['subscriptionContract']['deliveryPolicy']['intervalCount'];
    $nextBilling = date_format($nextDate,"l M d, Y");
    // dd($shop_name);
    $subscriptionStatus = $data['data']['subscriptionContract']['status'];
    $btnStatus = [
        'pauseResumeSubscriptions' => false,
        'skipNextOrder' => false,
        'cancelSubscriptions' => false,
    ];
    
    if (Schema::hasTable($shop. '_customerportal_settings')) {
        $dataDB = DB::table($shop. '_customerportal_settings')->select('pauseResumeSubscriptions','skipNextOrder','cancelSubscriptions')->get();
        if (!empty($dataDB->toArray())) {
            $btnStatus = (array) $dataDB->toArray()[0];
            if($btnStatus['pauseResumeSubscriptions']){

            }
        }
    }
    $changeStatusHtmlfirst = '<div class="easyCustomerOrderStatusParent">
    <div class="easyCustomerSubscriptionStatus">
        <h4 class="easySubbscriptionTitle">Status :<span class="easyCustomerSubscriptionStatus status-'.$subscriptionStatus.'">'.$subscriptionStatus.'</span></h4>
        <label class="easyCustomerSubscriptionStatusNextOrder">Next Order : '.$nextBilling.' '.$total.'</label>
    </div>
    <div class="easyCustomerSubscriptionStatusbtns">';
    $changeStatusHtmlLast = '</div>
    </div>';
    $cancelSubHtml = '<button class="easyCustomerSubscriptionStatusbutton btn button" value='.$subID.' type="button" statusValue="CANCELLED">Cancle</button>';
    $skipSubHtml = '<button class="easyCustomerSubscriptionStatusbutton btn button" value='.$subID.' statusValue="SKIP" type="button">Skip</button>';
    $PauseSubHtml = '<button class="easyCustomerSubscriptionStatusbutton btn button" value='.$subID.' type="button" statusValue="PAUSED">Pause</button>';
    $activeSubHtml = '<button class="easyCustomerSubscriptionStatusbutton btn button" value='.$subID.' type="button" statusValue="ACTIVE">Active</button>';
    if($subscriptionStatus == 'ACTIVE'){
        $easySubscriptionSubscriptionModelIn = $changeStatusHtmlfirst;
        if($btnStatus['pauseResumeSubscriptions']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$PauseSubHtml;
        }
        if($btnStatus['cancelSubscriptions']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$cancelSubHtml;
        }
        if($btnStatus['skipNextOrder']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$skipSubHtml;
        }
        $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$changeStatusHtmlLast;
    } else if($subscriptionStatus == 'PAUSED'){
        $easySubscriptionSubscriptionModelIn = $changeStatusHtmlfirst;
        if($btnStatus['pauseResumeSubscriptions']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$activeSubHtml;
        }
        if($btnStatus['cancelSubscriptions']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$cancelSubHtml;
        }
        if($btnStatus['skipNextOrder']){
            $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$skipSubHtml;
        }
        $easySubscriptionSubscriptionModelIn = $easySubscriptionSubscriptionModelIn.$changeStatusHtmlLast;
    } else if($subscriptionStatus == 'CANCELLED'){
        $easySubscriptionSubscriptionModelIn = '<div class="easyCustomerOrderStatusParent">
            <div class="easyCustomerSubscriptionStatus">
                <h3 class="easySubbscriptionTitle">Status :<span class="easyCustomerSubscriptionStatus status-'.$subscriptionStatus.'">'.$subscriptionStatus.'</span></h3>
                <label class="easyCustomerSubscriptionStatusNextOrder">Next Order : '.$nextBilling.' '.$total.'</label>
            </div>
        </div>';
    }
    return response()->json(['status'=>$subscriptionStatus,'nextBillingDate'=>$nextBilling,'customerId'=>$customerId,'customerDetails'=>$customerdata,'orders'=>$orders,'total'=>$total,'shop'=>$shop_name,'intervalCount'=>$intervalCount,'interval'=>$interval,'id'=>$subID,'btnStatus'=>$easySubscriptionSubscriptionModelIn]);
});
Route::post('cstm/changesubscriptionDatastatus',function(Request $request){
    $subscriptionContractId = $request->id;
    $status = $request->catag;
    $shop = $request->shopname;
    if($status == ''){
        return response()->json(['status'=>false]);
    }
    $sessions = DB::table('sessions')->select('shop','access_token')->where('shop',$shop.'.myshopify.com')->get();
    $authShop = $sessions[0]->shop;
    $authTokken = $sessions[0]->access_token;
    if (!Schema::hasTable($shop. '_subscriptioncontracts_history')) {
        Schema::create($shop. '_subscriptioncontracts_history', function (Blueprint $table) {
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
    
    $_subscriptioncontracts_history = DB::table($shop. '_subscriptioncontracts')->select('*')->where('subId',$subscriptionContractId)->get()->toArray();
    foreach($_subscriptioncontracts_history[0] as $key => $value){
        if($key!='id' && $key!='data'){
            $_subscriptioncontracts_history_data[$key] =$value; 
        }
    }
    if($status == 'CANCELLED' ||  $status == 'ACTIVE' || $status == 'PAUSED'){
        $_subscriptioncontracts_history_data['statusChange'] =true;
        $statusSave = DB::table($shop. '_subscriptioncontracts_history')->insert($_subscriptioncontracts_history_data);
        if(!$statusSave){
            return response()->json(['status'=>false]);
        }
        $client = new Graphql($authShop, $authTokken);
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
            "contractId"=>$subscriptionContractId
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
        print_r($data);
        if(empty($data)){
            return false;
        }
        $query = <<<QUERY
        {
            subscriptionContract(id:"$subscriptionContractId") {
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
        $clientRest = new Rest($authShop, $authTokken);
        $restOrder = $clientRest->get('orders/'.$origin_order_id);
        $restOrder = $restOrder->getDecodedBody();
        $order = $restOrder['order'];
        $orders = [];
        $orders['id']=$order['id'];
        $orders['shop']=$shop;
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
            DB::table($shop. '_subscriptioncontracts')->where('subId',$subscriptionContractId)->update([
                'data' => json_encode($orders),
                'status' =>$status
            ]);
        } catch (\Throwable $th) {
            Log::error(['error'=>json_encode($th)]);
        }
        return response()->json(['status'=>true]);
    }elseif($status == 'SKIP'){
        $_subscriptioncontracts_history_data['skip'] =true;
        $statusSave = DB::table($shop. '_subscriptioncontracts_history')->insert($_subscriptioncontracts_history_data);
        if(!$statusSave){
            return response()->json(['status'=>false]);
        }
        $client = new Graphql($authShop, $authTokken);

        $query1 = <<<QUERY
        {
            subscriptionContract(id:"$subscriptionContractId"){
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
            "contractId"=> $subscriptionContractId,
            "date"=> $setNextBillingDate
        ];
        $result = $client->query(['query' => $query,'variables'=>$variables]);
        $data = $result->getDecodedBody();
        $origin_order_id = str_replace('gid://shopify/Order/','',$data['data']['subscriptionContractSetNextBillingDate']['contract']['originOrder']['id']);
        $subscriptionContractId = $data['data']['subscriptionContractSetNextBillingDate']['contract']['id'];
        $clientRest = new Rest($authShop, $authTokken);
        $restOrder = $clientRest->get('orders/'.$origin_order_id);
        $restOrder = $restOrder->getDecodedBody();
        $order = $restOrder['order'];
        $orders = [];
        $orders['id']=$order['id'];
        $orders['shop']=$shop;
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
            DB::table($shop. '_subscriptioncontracts')->where('subId',$subscriptionContractId)->update([
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
    }
});
