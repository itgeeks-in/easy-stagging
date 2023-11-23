<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Subscriptions</title>
    <style>
        .easySubscriptionWidget {
  position: relative;
  width: 100%;
}
.easySubscriptionWidget .easySubscriptionWidgetIn {
  padding: 20px 0;
}
.easySubscriptionWidget .easySubscriptionWidgetIn button.button {
  background-color: #2D292A;
  border-color: #2D292A;
  color: #fff;
  font-size: 16px;
  padding: 12px 30px;
  margin-bottom: 2px;
}
.easySubscriptionWidget .easySubscriptionWidgetIn button.button.loading {
  opacity: 0.6;
}
.easySubscriptionWidgetIn .easySubscriptionWidgetModel,
.easySubscriptionWidgetIn .easySubscriptionSubscriptionModel {
  position: relative; 
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba( 255, 255, 255, 0.8 );
  z-index: 99999999;
  overflow:auto;
}
.easySubscriptionWidgetIn .easySubscriptionSubscriptionModel{
  z-index: 999999999;
  background-color: rgba( 255, 255, 255, 0.90 );
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner,
.easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner {
  width: 100%;
  max-width: 1200px;
  margin: auto;
  padding: 30px;
  background-color:#F6F6F8;
  border: 1px solid #eee;
  margin-top: 30px;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelInnerTitle h3.title,
.easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner .easySubscriptionWidgetModelInnerTitle h3.title {
  margin: 0;
  font-size: 24px;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelInnerTitle,
.easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner .easySubscriptionWidgetModelInnerTitle {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelIn {
  position: relative;
  width: 100%;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInstatusfilters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #222;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInstatusfilters span.easySubscriptionlinks {
  line-height: 1em;
  padding-bottom: 2px;
  border-bottom: 2px solid;
  cursor: pointer;
}
.easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInstatusfilters span.easySubscriptionlinks.active {
  color: #2D292A;
}
.easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems {
  width: 100%;
  position: relative;
  padding-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}
.easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems {
  position: relative;
  width: 100%;
  color:#222;
}
.easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsHead {
  width: 100%;
  position: relative;
  padding-bottom: 15px;
}
.easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems {
  position: relative;
  width: 100%;
  padding: 20px;
  background-color: #fff;
  border: 1px solid #E0E0E0;
}
.easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsHead .easySubbscriptionTitle,
.easySubscriptionSubscriptionModelInner .easyCustomerSubscriptionStatus .easySubbscriptionTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
span.status-ACTIVE,
span.status-PAUSED,
span.status-CANCELLED {
  position: relative;
  display: inline-block;
  padding: 5px 10px;
  font-size: 12px;
  background-color: #6bf88b;
  border-radius: 20px;
  margin-left: 10px;
}
span.status-PAUSED{
  background-color: #f7f94e;
}
span.status-CANCELLED{
  background-color: #fa5044;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails {
  position: relative;
  display: flex;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn {
  width: 100%;
  max-width: 20%;
  box-sizing: border-box;
  padding-right: 20px;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn:nth-child(1),
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn:nth-child(2) {
  max-width: 30%;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn:last-child {
  padding-right: 0;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetailsIn {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetailsIn .easySubscriptionWidgetModelInLineitemsImg {
  width: 100%;
  max-width: 80px;
  display: flex;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetailsIn .easySubscriptionWidgetModelInLineitemsImg img {
  width: 100%;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetailsIn .easySubscriptionWidgetModelInLineitemsPriceDetails {
  width: 100%;
  max-width: calc( 100% - 80px );
  padding-left: 10px;
}
.easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetailsIn .easySubscriptionWidgetModelInLineitemsPriceDetails > label {
  font-weight: 600;
  font-size: 16px;
}
.easySubscriptionWidgetModelInLineitemsPriceDetails .easySubscriptionProductPriceQuantity {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}
.easySubscriptionWidgetModelInLineitemsPriceDetails .easySubscriptionProductPriceQuantity > div {
  width: 100%;
  max-width: 100%;
}
.easySubscriptionSubscriptionModelInner .easyCustomerSubscriptionStatus label.easyCustomerSubscriptionStatusNextOrder {
  font-size: 20px;
  display: block;
}
.easySubscriptionSubscriptionModelInner .easyCustomerSubscriptionStatus .easySubbscriptionTitle{
  padding-top: 20px;
}
.easySubscriptionSubscriptionModelIn .easyCustomerOrderStatusParent {
  position: relative;
  width: 100%;
  padding-bottom: 30px;
}
.easySubscriptionSubscriptionModelIn .easySubscriptioneasyCustomerOrdersBox,
.easySubscriptionSubscriptionModelIn .easySubscriptioneasyCustomerOrdersBox .easySubscriptioneasyCustomerOrders,
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable,
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent {
  position: relative;
  width: 100%;
}
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataHeader,
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent .easyCustomerOrdersDataContentRow {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  position: relative;
}
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataHeader .easyCustomerOrdersHead,
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent .easyCustomerOrdersDataContentRow .easyCustomerOrdersDataTableBox {
  position: relative;
  width: 100%;
  max-width: 25%;
  box-sizing: border-box;
  padding: 15px;
  line-height: 1em;
  font-weight: 600;
  background-color: #fff;
}
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent .easyCustomerOrdersDataContentRow .easyCustomerOrdersDataTableBoxRow {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent .easyCustomerOrdersDataContentRow .easyCustomerOrdersDataTableBoxRow {
  border-top: 1px solid #eee;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
}
.easySubscriptioneasyCustomerOrders .easyCustomerOrdersTable .easyCustomerOrdersDataContent .easyCustomerOrdersDataContentRow .easyCustomerOrdersDataTableBoxRow .easyCustomerOrdersDataTableBox {
  font-weight: 400;
}
.easySubscriptionSubscriptionModelIn .easyCustomerOrderStatusParent .easyCustomerSubscriptionStatusbtns {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 10px;
}
.easySubscriptionWidgetModelInLineItems .easySubNotFound {
  position: relative;
  width: 100%;
  padding: 20px;
  background-color: #fff;
  border: 1px solid #E0E0E0;
}

@media only screen and (max-width: 800px) {
  .easySubscriptionWidgetModel .easySubscriptionWidgetModelInner, .easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner{
    margin-top: 30px;
    margin-bottom: 30px;
    padding:15px;
  }
  .easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelInnerTitle, .easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner .easySubscriptionWidgetModelInnerTitle{
    flex-wrap: wrap;
  }
  .easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelInnerTitle h3.title, .easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner .easySubscriptionWidgetModelInnerTitle h3.title{
    order:2;
    display: block;
    padding-top: 15px;
    font-size: 20px;
    width: 100%;
  }
  .easySubscriptionWidgetModel .easySubscriptionWidgetModelInner .easySubscriptionWidgetModelInnerTitle, .easySubscriptionWidgetIn .easySubscriptionSubscriptionModel .easySubscriptionSubscriptionModelInner .easySubscriptionWidgetModelInnerTitle{
    padding-bottom: 15px;
  }
  .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems{
    padding: 15px;
  }
  .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsHead .easySubbscriptionTitle, .easySubscriptionSubscriptionModelInner .easyCustomerSubscriptionStatus .easySubbscriptionTitle{
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap:10px;
  }
  .easySubscriptionWidgetModelIn .easySubscriptionWidgetModelInLineItems .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsHead .easySubbscriptionTitle > span,
  .easySubscriptionSubscriptionModelInner .easyCustomerSubscriptionStatus .easySubbscriptionTitle > span{
    margin-left: 0;
  } 
  .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails{
    flex-wrap: wrap; 
    gap:10px;
  }
  .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn:nth-child(1),
  .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn:nth-child(2),
  .easySubscriptionLineItems .easySubscriptionWidgetModelInLineitemsDetails .easySubscriptionWidgetModelInLineitemsDetailsIn{
    max-width: 100%;
    padding-right: 0;
  }
}
    </style>
</head>
<body>
<div class="easySubscriptionWidget">
  <div class="easySubscriptionWidgetIn">
      <button class="btn button" id="easySubscriptionMannage" data-url="" email="akashsharma@itgeeks.com" value="app-test-itg">Manage Subscriptions</button>
      <div class="easySubscriptionWidgetModel" style="display: block;">
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
