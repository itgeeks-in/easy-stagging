addEventListener('DOMContentLoaded',(e)=>{
    let lineItemsHtml;
    let url = 'https://6ad4-49-249-2-6.ngrok-free.app';
    let easySubscriptionShowMore;
    let easySubscriptionMannage = document.getElementById('easySubscriptionMannage');
    let easySubscriptionWidgetModelIn = document.getElementById('easySubscriptionWidgetModelIn');
    let easySubscriptionWidgetShowFilter = document.getElementById('easySubscriptionWidgetShowFilter');
    let easySubscriptionSubscriptionModel = document.getElementById('easySubscriptionSubscriptionModel');
    let selectValueChange = document.getElementsByClassName('easySubscriptionselectValueChange');
    let shopname = easySubscriptionMannage.value;
    let customerEmail = easySubscriptionMannage.getAttribute('email');
    let customerDataForm = new FormData();
    let easySubscriptionlinksstatusfilterValue = '';
    let easySubscriptionlinksstatusfilter = document.getElementsByClassName('easySubscriptionlinksstatusfilter');
    for(items of easySubscriptionlinksstatusfilter){
        items.addEventListener('click',(e)=>{
            for(let i=0 ; i<easySubscriptionlinksstatusfilter.length ; i++){
                easySubscriptionlinksstatusfilter[i].classList.remove('active');
            }
            e.target.classList.add('active');
            getCutomerSubscriptions();
        })
    }
    customerDataForm.append('customerEmail',customerEmail);
    customerDataForm.append('shopname',shopname);
    customerDataForm.append('token','c01dd5c97da7e41af6d9446454402036');
    for(items of selectValueChange){
        items.addEventListener('click',(e)=>{
            easySubscriptionWidgetShowFilter.setAttribute('value',e.target.value);
        })
    }
    document.getElementById('easySubscriptionClosebtn').addEventListener('click',()=>{
    document.getElementsByClassName('easySubscriptionWidgetModel')[0].style.display="none";
    });
    document.getElementById('easySubscriptionInnerClosebtn').addEventListener('click',()=>{
    easySubscriptionSubscriptionModel.style.display="none";
    });
    function getCutomerSubscriptions(){
        let statusFilter = '';
        if(document.querySelector('.easySubscriptionlinksstatusfilter.active')){
            statusFilter = document.querySelector('.easySubscriptionlinksstatusfilter.active');
            statusFilter = statusFilter.getAttribute('value');
        }
        customerDataForm.append('statusFilter',statusFilter);
        const xhttp = new XMLHttpRequest();
        xhttp.onload = function() {
        let res = this.responseText;
        let data = JSON.parse(res);
        var easySubscriptionWidgetModelInLineItems = document.getElementsByClassName('easySubscriptionWidgetModelInLineItems');
        for(items of easySubscriptionWidgetModelInLineItems){
            items.parentNode.removeChild(items);
        }
        let lineItemsDiv = document.createElement("div");
        lineItemsDiv.classList.add('easySubscriptionWidgetModelInLineItems');
        lineItemsDiv.innerHTML = ``;
            if((data.data).length>0){
                lineItemsDiv.innerHTML += data.data.map(({status,image,interval,subId,nextBillingDate,productCurrency,totalPrice,productQuantity,productTitle,intervalCount,total})=>{
                    let id = subId.replace('gid://shopify/SubscriptionContract/','');
                    return(
                        `<div class="easySubscriptionLineItems">
                            <div class="easySubscriptionWidgetModelInLineitemsHead">
                                <h4 class="easySubbscriptionTitle">Subscription #`+id+` <span class="status-`+status+`">`+status+`</span></h4>
                            </div>
                            <div class="easySubscriptionWidgetModelInLineitemsDetails">
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionWidgetModelInLineitemsImg">
                                        <img id="  " src="`+image+`&width=100" alt="">
                                    </div>
                                    <div class="easySubscriptionWidgetModelInLineitemsPriceDetails">
                                        <label id="easySubscriptionProductTitle">`+productTitle+`</label>
                                        <div class="easySubscriptionProductPriceQuantity">
                                            <div class="easySubscriptionProductPrice">
                                                <label>Price:</label>
                                                <span>`+productCurrency+` `+totalPrice+`</span>
                                            </div>
                                            <div class="easySubscriptionProductQuantity">
                                                <label>Quantity:</label>
                                                <span>`+productQuantity+`</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionOrderFrequency">
                                        <label>Order frequency:</label>
                                        <span id="easySubscriptionOrderFrequencyTime">`+intervalCount+` `+interval+`</span>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <div class="easySubscriptionOrderTotal">
                                        <label>Total:</label>
                                        <span id="easySubscriptionOrderTotalPrice">`+total+`</span>
                                    </div>
                                </div>
                                <div class="easySubscriptionWidgetModelInLineitemsDetailsIn">
                                    <button class="easySubscriptionMoreDetails btn button" subId=`+subId+`>Show more detail</button>
                                </div>
                            </div>
                        </div>`
                    )
                }).join('')
                easySubscriptionWidgetModelIn.appendChild(lineItemsDiv);
                document.getElementsByClassName('easySubscriptionWidgetModel')[0].style.display="block";
                easySubscriptionShowMore = document.getElementsByClassName('easySubscriptionMoreDetails');
                for(items of easySubscriptionShowMore){
                    items.addEventListener('click',(e)=>{
                        let subidmoredetailsId = e.target.getAttribute('subid');
                        getCutomerSubscription(subidmoredetailsId);
                    })
                }
            }
        }
        xhttp.open("POST", url+"/api/customerdata");
        xhttp.send(customerDataForm);
    }
    function getCutomerSubscription(subidmoredetailsId){
        const xhttp1 = new XMLHttpRequest();
        xhttp1.onload = function() {
            let easySubscriptionSubscriptionModelIn = document.createElement("div");
            easySubscriptionSubscriptionModelIndiv = document.getElementsByClassName('easySubscriptionSubscriptionModelIn');
            for(items of easySubscriptionSubscriptionModelIndiv){
                items.parentNode.removeChild(items);
            }
            easySubscriptionSubscriptionModelIn.innerHTML = '';
            easySubscriptionSubscriptionModelIn.classList.add('easySubscriptionSubscriptionModelIn');
            let res1 = this.responseText;
            let data1 = JSON.parse(res1);
            if(data1){
                easySubscriptionSubscriptionModelIn.innerHTML = data1.btnStatus;
                let easySubscriptionitgCustomerOrdersdiv = document.getElementsByClassName('easySubscriptionitgCustomerOrders');
                for(items of easySubscriptionitgCustomerOrdersdiv){
                    items.parentNode.removeChild(items);
                }
                let easySubscriptionitgCustomerOrders = document.createElement("div");
                easySubscriptionitgCustomerOrders.innerHTML = '';
                easySubscriptionitgCustomerOrders.classList.add('easySubscriptionitgCustomerOrders');
                easySubscriptionitgCustomerOrders.innerHTML = `<div class="easySubscriptionitgCustomerOrders">
                    <div class="itgCustomerOrdersTable">
                        <div class="itgCustomerOrdersDataHeader">
                            <div class="itgCustomerOrdersHead">
                                <label>Order</label>
                            </div>
                            <div class="itgCustomerOrdersHead"><label>Date</label></div>
                            <div class="itgCustomerOrdersHead"><label>Total</label></div>
                            <div class="itgCustomerOrdersHead"><label>Type</label></div>
                        </div>
                        <div class="itgCustomerOrdersDataContent">
                            <div id="itgCustomerOrdersDataContentRow" class="itgCustomerOrdersDataContentRow">   
                            </div>
                        </div>
                    </div>
                </div>`;
                easySubscriptionSubscriptionModelIn.appendChild(easySubscriptionitgCustomerOrders);
                easySubscriptionSubscriptionModel.appendChild(easySubscriptionSubscriptionModelIn);
                
                document.getElementById('itgCustomerOrdersDataContentRow').innerHTML += data1.orders.map(({interval,intervalCount,name,createdAt,total})=>{
                    return(
                        `<div class="itgCustomerOrdersDataTableBox"><span>`+name+`</span></div>
                        <div class="itgCustomerOrdersDataTableBox"><span>`+createdAt+`</span></div>
                        <div class="itgCustomerOrdersDataTableBox"><span>`+total+`</span></div>
                        <div class="itgCustomerOrdersDataTableBox"><span>Every `+data1.intervalCount+` `+data1.interval+`</span></div>`
                    )
                }).join('')
                easySubscriptionSubscriptionModel.style.display="block";
                let itgCustomerSubscriptionStatusbutton = document.getElementsByClassName("itgCustomerSubscriptionStatusbutton");
                for (const iterator of itgCustomerSubscriptionStatusbutton) {
                    iterator.addEventListener('click',(e)=>{
                        let target = e.target;
                        let changesubscriptionDatastatusform = new FormData();
                        let subidmoredetailsId = target.value;
                        changesubscriptionDatastatusform.append('id',target.value);
                        changesubscriptionDatastatusform.append('catag',target.getAttribute('statusValue'));
                        changesubscriptionDatastatusform.append('shopname',shopname);
                        const xhttp2 = new XMLHttpRequest();
                        xhttp2.onload = function() {
                            getCutomerSubscription(subidmoredetailsId);
                        }
                        xhttp2.open("POST", url+"/api/cstm/changesubscriptionDatastatus");
                        xhttp2.send(changesubscriptionDatastatusform);
                    })
                }
            }
        }
        let subidmoredetails = new FormData();
        subidmoredetails.append('subidmoredetailsId',subidmoredetailsId);
        subidmoredetails.append('shopname',shopname);;
        xhttp1.open("POST", url+"/api/singlesubscriptionData");
        xhttp1.send(subidmoredetails);
    }
    easySubscriptionMannage.addEventListener('click',(e)=>{
        getCutomerSubscriptions();
    })
})