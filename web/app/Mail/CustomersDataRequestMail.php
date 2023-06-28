<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomersDataRequest extends Mailable
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
        $data = $this->mailData;
        $customerShop = $data['store'];
        $customerShopUserId = $data['customer'];
        $html = "<b>Customers data request</b> for Easy Subscription and Customer shop is <b>$customerShop</b>, Shop's user id is <b>$customerShopUserId</b>";
        $this->mailData['mailHtml'] = $html;
        return $this->subject("Customer Data Request Easy Suscriptions")->from("support@easysubscription.io","Easy Suscriptionn")->view('customer.request');
    }
}
