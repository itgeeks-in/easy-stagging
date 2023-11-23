<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Subscriptions</title>
    <link rel="stylesheet" href="{{ asset('css/shopify.css') }}">
</head>
<body>
<div class="easySubscriptionWidget">
  <div class="easySubscriptionWidgetIn">
      <div class="easySubscriptionWidgetModel">
          <div class="easySubscriptionWidgetModelInner">
            <div class="easySubscriptionWidgetModelInnerTitle">
                <h3 class="title">Subscriptions</h3>
                <button type="button" class="btn button" id="easySubscriptionClosebtn">Close</button>
            </div>
            <div id="easySubscriptionWidgetModelIn" class="easySubscriptionWidgetModelIn">
                <div class="easySubscriptionWidgetModelInstatusfilters">
                    <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter active" value="All">All</span>
                    <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Active">Active</span>
                    <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Paused">Paused</span>
                    <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Cancelled">Cancelled</span>
                </div>
                        <div class="easySubscriptionWidgetModelInLineItems"><div class="easySubscriptionLineItems">
                            <div class="easySubscriptionWidgetModelInLineitemsHead">
                                <h4 class="easySubbscriptionTitle">Subscription #11986633025 <span class="status-ACTIVE">ACTIVE</span></h4>
                            </div>
                            <div class="easySubscriptionWidgetModelInLineitemsDetails">
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionWidgetModelInLineitemsImg">
                                        <img id="  " src="https://cdn.shopify.com/s/files/1/0772/4898/7457/products/womens-red-t-shirt_925x_d758a807-7222-423c-8909-657e0f002b41.jpg?v=1686063328&amp;width=100" alt="">
                                    </div>
                                    <div class="easySubscriptionWidgetModelInLineitemsPriceDetails">
                                        <label id="easySubscriptionProductTitle">Red Sports Tee</label>
                                        <div class="easySubscriptionProductPriceQuantity">
                                            <div class="easySubscriptionProductPrice">
                                                <label>Price:</label>
                                                <span>USD 45.00</span>
                                            </div>
                                            <div class="easySubscriptionProductQuantity">
                                                <label>Quantity:</label>
                                                <span>1</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionOrderFrequency">
                                        <label>Order frequency:</label>
                                        <span id="easySubscriptionOrderFrequencyTime">1 DAY</span>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionOrderTotal">
                                        <label>Total:</label>
                                        <span id="easySubscriptionOrderTotalPrice">USD 65.41</span>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <button class="easySubscriptionMoreDetails btn button" subid="gid://shopify/SubscriptionContract/11986633025">View More</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
          </div>
      </div> 
      <div id="easySubscriptionSubscriptionModel" style="display:none;" class="easySubscriptionSubscriptionModel">
        <div id="easySubscriptionSubscriptionModelInner" class="easySubscriptionSubscriptionModelInner">
          <div class="easySubscriptionWidgetModelInnerTitle">
            <h3 class="title">Subscription <span id="easySubscriptionId"></span></h3>
            <button type="button" class="btn button" id="easySubscriptionInnerClosebtn">Close</button>
          </div>
        </div>
      </div>
  </div>
</div>
</body>
</html>
