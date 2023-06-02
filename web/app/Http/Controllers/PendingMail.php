<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Mail\PendingMailSend;

class PendingMail extends Controller
{
    public function index(Request $request){
        $client = $request->client;
        $clientRest = $request->clientRest;
        $shop = $request->shop;
        $shop_name = explode('.', $shop);
        $id = $request->id;
        $querybill = <<<QUERY
        {
            subscriptionBillingAttempt(id:"$id") {
                id
                nextActionUrl
                subscriptionContract{
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
        }
        QUERY;
        $resultbill = $client->query(['query' => $querybill]);
        $data = $resultbill->getDecodedBody();
        $origin_order_id = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['originOrder']['id'];
        $order_id = str_replace('gid://shopify/Order/','',$origin_order_id);
        $restOrder = $clientRest->get('orders/'.$order_id);
        $restOrder = $restOrder->getDecodedBody();
        $order = $restOrder['order'];
        $orders = [];
        $orders['id']=$order['id'];
        $orders['shop']=$shop_name[0];
        $orders['subscriptionContractId'] = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['id'];
        $orders['subscriptionContractStatus'] = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['status'];
        $nextbillingDate = date("Y-m-d H:i:s",strtotime($data['data']['subscriptionBillingAttempt']['subscriptionContract']['nextBillingDate']));

        $newDateTime = new \DateTime($nextbillingDate); 
        $dateTimeUTC = $newDateTime->format("Y-m-d H:i:s");

        $billingDate = date_create($data['data']['subscriptionBillingAttempt']['subscriptionContract']['nextBillingDate']);
        $orders['nextBillingDate'] = date_format($billingDate,"M d,Y");;
        $email = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['customer']['email'];
        $name = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['customer']['displayName'];
        $customerId = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['customer']['id'];
        $status = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['status'];
        $orders['deliveryPolicy'] = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['deliveryPolicy'];
        $interval = $orders['deliveryPolicy']['interval'];
        $intervalCount = $orders['deliveryPolicy']['intervalCount'];
        $orders['name']=$order['name'];
        $date=date_create($order['created_at']);
        $date->setTimezone(new \DateTimeZone("Asia/Kolkata")); 
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
        $orders['payment'] = $order['payment_details'];
        for($i=0;$i<count($order['line_items']);$i++){
            $orders['products'][$i]['id'] = $order['line_items'][$i]['id'];
            $orders['products'][$i]['productTitle'] = $order['line_items'][$i]['name'];
            if(!empty($data['data']['subscriptionBillingAttempt']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'])){
                $orders['products'][$i]['productImage'] = $data['data']['subscriptionBillingAttempt']['subscriptionContract']['originOrder']['lineItems']['edges'][$i]['node']['image']['url'];
            }else{
                $orders['products'][$i]['productImage'] = '';
            }
            $orders['products'][$i]['productQuantity'] = $order['line_items'][$i]['quantity'];
            $orders['products'][$i]['totalPrice'] = $order['line_items'][$i]['price'];
        }
        Mail::to($email)->send(new PendingMailSend($orders));
    }
}
