<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Manage Subscriptions</title>
        <link rel="stylesheet" href="{{ asset('css/shopify.css') }}">
        <script src="{{ asset('js/shopify.js') }}"></script>
    </head>
    <body>
    @if( isset($data) && isset($data['shop']) && isset($data['logged_in_customer_id']) )
        <div class="easySubscriptionWidget">
            <div class="easySubscriptionWidgetIn">
                <div class="easySubscriptionWidgetModel" style="display:none;">
                    <div class="easySubscriptionWidgetModelInner">
                        <div class="easySubscriptionWidgetModelInnerTitle">
                            <h3 class="title">Subscriptions</h3>
                        </div>
                        <div id="easySubscriptionWidgetModelIn" class="easySubscriptionWidgetModelIn">
                            <div class="easySubscriptionWidgetModelInstatusfilters">
                                <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter active" value='All'>All</span>
                                <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Active">Active</span>
                                <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Paused">Paused</span>
                                <span class="easySubscriptionlinks easySubscriptionlinksstatusfilter" value="Cancelled">Cancelled</span>
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
        <button class="btn button" id="easySubscriptionMannage" email="{{ $data['logged_in_customer_id'] }}" value="{{ str_replace('.myshopify.com', '', $data['shop']) }}" style="display:none;">Manage Subscriptions</button>
    @endif
    </body>
</html>
