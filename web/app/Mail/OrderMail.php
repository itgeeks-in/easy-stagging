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
            $replacement_find[$i] = "<billingAddressName>";
            $replacement_replace[$i++] = $data['billingAddress']['name'];
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
