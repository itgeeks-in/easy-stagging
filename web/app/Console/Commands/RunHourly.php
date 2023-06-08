<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Shopify\Clients\Graphql;
use Shopify\Clients\Rest;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Http\Controllers\PendingMail;

class RunHourly extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'command:hourly';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(){

        info( 'Test Cron' );
       // Log::error("itgCronRunning");
        $sessions = DB::table('sessions')->select('shop','access_token')->where('access_token','!=','')->get();
        foreach($sessions as $session){
            $shop = $session->shop;
            $token = $session->access_token;
            $shop_name = explode('.', $shop);
            $datetime = new \DateTime(date('Y-m-d H:i:s'));
            $datetime->setTimezone(new \DateTimeZone('Asia/Kolkata'));
            $time = $datetime->format('Y-m-d H:i:s');
            if (Schema::hasTable($shop_name[0].'_subscriptioncontracts')) {
                $subscriptionContractsPaused = DB::table($shop_name[0].'_subscriptioncontracts')->select('*')->where('nextBillingDate','<',$time)->where('status','PAUSED')->get()->toArray();
                $datetime = new \DateTime(date('Y-m-d H:i:s'));
                $datetime->setTimezone(new \DateTimeZone('Asia/Kolkata'));
                $time = $datetime->format('Y-m-d H:i:s');
                $subscriptionContractsPaused = DB::table($shop_name[0].'_subscriptioncontracts')->select('*')->where('nextBillingDate','<',$time)->where('status','PAUSED')->get()->toArray();
                foreach($subscriptionContractsPaused as $subscriptionContractPaused){
                    $subscriptionContractPaused = (array)$subscriptionContractPaused;
                    $subscriptionContractPausedID = $subscriptionContractPaused['subId'];
                    $client = new Graphql($shop, $token);
                    $query1 = <<<QUERY
                    {
                        subscriptionContract(id:"$subscriptionContractPausedID"){
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
                    $setNextBillingDate = date('Y-m-d H:i:s',strtotime( '+'.$deliveryPolicy['intervalCount'].' '.$deliveryPolicy['interval']));
                    $query2 = <<<QUERY
                    mutation subscriptionContractSetNextBillingDate(\$contractId: ID!, \$date: DateTime!) {
                        subscriptionContractSetNextBillingDate(contractId: \$contractId, date: \$date) {
                        contract {
                            id
                        }
                        userErrors {
                            field
                            message
                        }
                        }
                    }
                    QUERY;
                    $setNextBillingDateformate = date_create($setNextBillingDate);
                    $shopifysetNextBillingDate = date_format($setNextBillingDateformate, 'c');
                    $variables = [
                        "contractId"=> $subscriptionContractPausedID,
                        "date"=> $shopifysetNextBillingDate
                    ];
                    $result = $client->query(['query' => $query2,'variables'=>$variables]);
                    DB::table($shop_name[0] . '_subscriptioncontracts')->where('subId',$subscriptionContractPausedID)->update([
                        'nextBillingDate' => $setNextBillingDate,
                    ]);
                }
                $subscriptionContracts = DB::table($shop_name[0].'_subscriptioncontracts')->select('*')->where('nextBillingDate','<',$time)->where('status','ACTIVE')->get()->toArray();
                foreach($subscriptionContracts as $subscriptionContract){
                    $client = new Graphql($shop, $token);
                    $oldsubscriptionContractid = $subscriptionContract->subId;
                    $breaksubscriptionContractId = str_replace('gid://shopify/SubscriptionContract/','',$subscriptionContract->subId);
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
                    $resultBody = $result->getDecodedBody();
                    $billingStatus = 'pending';
                    $totalprice = '';
                    if( empty( $resultBody['data']['userErrors'] ) ){
                        $totalprice = $resultBody['data']['subscriptionBillingAttemptCreate']['subscriptionBillingAttempt']['subscriptionContract']['originOrder']['totalPriceSet']['presentmentMoney']['currencyCode'] .' '. $resultBody['data']['subscriptionBillingAttemptCreate']['subscriptionBillingAttempt']['subscriptionContract']['originOrder']['totalPriceSet']['presentmentMoney']['amount'];
                        $subscriptionBillingAttemptId = $resultBody['data']['subscriptionBillingAttemptCreate']['subscriptionBillingAttempt']['id'];
                        $clientRest = new Rest($shop, $token);
                        $request1 = new \Illuminate\Http\Request();
                        $request1->replace(['id' => $subscriptionBillingAttemptId,'client' => $client,'clientRest'=>$clientRest,'shop'=>$shop]);
                        (new PendingMail)->index($request1);
                    }else{
                        $billingStatus = 'failed';
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
                    if (Schema::hasTable($shop_name[0] . '_billingAttemptSuccess')) {
                        $mail = DB::table($shop_name[0] . '_billingAttemptSuccess')->where('subId',$oldsubscriptionContractid)->update(['mail'=>false]);
                    }
                    try {
                        DB::table($shop_name[0] . '_billingAttempt')->insert([
                                'subId' =>$oldsubscriptionContractid,
                                'data' => json_encode($resultBody),
                                'status' => $billingStatus,
                                'total' => $totalprice,
                            ]
                        );
                    } catch (\Throwable $th) {
                        Log::error(['error'=>json_encode($th)]);
                    }
                }
            }
            $this->info('Scheduled command run succesfully.');
            $croninfo = DB::table('cronrun')->insert([
                'store' => $shop
            ]);
        }
    }
}
