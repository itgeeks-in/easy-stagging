<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OrderMail extends Mailable
{
    use Queueable, SerializesModels;
    public $mailData;
    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($mailData)
    {
        $this->mailData = $mailData;
    }
  
    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $i=0;
        $html = $this->mailData['mailHtml'];
        $data = $this->mailData;
        $replacement_find = [];
        $replacement_replace = [];
        if(!empty($data['name'])){
            $replacement_find[$i] = "<orderName>";
            $replacement_replace[$i++] = $data['name'];
        }

    if(!empty($data['subscriptionContractId'])){
        $replacement_find[$i] = "<subscriptionContractId>";
        $replacedId = str_replace("gid://shopify/SubscriptionContract/","",$data['subscriptionContractId']);
        $replacement_replace[$i++] = 'Subscription #'.$replacedId;
    }
    
    if(!empty($data['shopurl'])){
        $replacement_find[$i] = "<shophandle>";
        $replacement_replace[$i++] = $data['shopurl'];
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
        /*
        if(!empty($data['payment']['credit_card_company'])){
            $replacement_find[$i] = "<credit_card_company>";
            $replacement_replace[$i++] = $data['payment']['credit_card_company'];
        }
        if(!empty($data['payment']['credit_card_number'])){
            $replacement_find[$i] = "<credit_card_number>";
            $replacement_replace[$i++] = $data['payment']['credit_card_number'];
        }
        */
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
        $this->mailData['mailHtml'] = str_replace($replacement_find, $replacement_replace, $html);
        $from_mail = $data['mail']['from_email'];
        $from_name = $data['mail']['from_name'];
        $subject = $data['mail']['subject'];
        return $this->subject($subject)->from($from_mail,$from_name)->view('emails.order');
    }
}
