import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, NavLink, useParams } from "react-router-dom";
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { welcomeIcon, loaderIcon, searchIcon, productPlaceholder, deleteIconLight, verifyCheck, addIcon, removeIcon } from "../assets";
import ItgContext from '../context/activityState.jsx';
export default function createSubscriptionGroup(){

    const navigateTo = useNavigate();
    const fetch = useAuthenticatedFetch();
    const [ loadStart , loadStartOption ] = useState(true);
    const [ openPopup , setOpenPopup ] = useState(false);
    const [ dayWarn, dayWarnOption ] = useState(false);  
    const [ samePlan, samePlanOption ] = useState(false);  
    const [ subscriptionAdd, subscriptionAddOptions ] = useState({ count: 0, load:false, adding:false, ids:[], products:{}, shop:{}, alreadyIds:[] });
    const [ filterValues, filterValuesOptions ] = useState({ title: '', type: '', vendor: '' , query: '' });
    const [ subscriptionAction, subscriptionActionOptions ] = useState({ name:"", namereq:false, details:true, discountPer:0, discount:false, type:'subscription-one-time', scheduleInterval:'MONTH', scheduleIntervalValue:'Months' , scheduleFrequency:[1], scheduleFrequencyName:["Delivery every"],scheduleFrequencyIds:[], expire:false, expireNumber:0 });
    const [ productData, productDataOption ] = useState({}); 
    const [ editSubscriptionGroup, editSubscriptionGroupOption ] = useState({ edit:false, data:{}, id:'', plansState:{}, planUpdate:{}, planRemove:[] }); 

    const queryParameters = new URLSearchParams(window.location.search)
    const groupId = queryParameters.get("id");

    const groupIdParamValues = {
        id:groupId
    }

    const groupIdParam = JSON.stringify(groupIdParamValues);
    const activityContext = useContext(ItgContext);
      useEffect(()=>{
        if(activityContext.activity !== ' '){
            if( activityContext.activity === 9 ){
                navigateTo('/noteligible');
            }else if ( activityContext.activity === 0 ){
                navigateTo('/welcome');
            } else if ( activityContext.activity === 1 || activityContext.planType === ' ' ){
                navigateTo('/plans');
            } else if(activityContext.activity!== ' ') {
            if( groupId != null ){
                editSubscriptionGroupOption({...editSubscriptionGroup, edit:true});
                refetchEditData();
            }else{
                loadStartOption(false);
            }
            }
        }else{
            loadStartOption(true);
        }
    },[activityContext])

    const { editData, refetch:refetchEditData } = useAppQuery({ url: `/api/editgroup/${groupIdParam}`,
        reactQueryOptions: {
            onSuccess: (data) => {
                loadStartOption(false);
                if( data.products.products ){
                    var products = data.products.products;
                    var idsArray = subscriptionAdd.ids;
                    var alreadyArray = [];
                    let shop = data.shop;
                    products.map(function(product, i){
                        if( idsArray.indexOf(product.id) > -1 ){}else{
                            idsArray.push(product.id);
                        }
                        alreadyArray.push(product.id);
                    });
                    subscriptionAddOptions({...subscriptionAdd, ids:idsArray, products:products, alreadyIds:alreadyArray ,shop:{myshopify_domain:shop}});
                }
                if( data.data.data.sellingPlanGroup ){
                    var subscriptionType;
                    if((data.dtb).length>0){
                        subscriptionType = data.dtb[0].type;
                    }else{
                        subscriptionType = '';
                    }
                    // var subscriptionType = data.dtb[0].type;
                    var sellingPlanGroup = data.data.data.sellingPlanGroup;
                    var scheduleIntervalValue = 'Months';
                    var scheduleInterval = 'MONTH';
                    var discountPer = 0;
                    var discount = false;
                    var scheduleFrequency = [];
                    var scheduleFrequencyName = [];
                    var scheduleFrequencyIds = [];
                    var planState = {};
                    if( sellingPlanGroup.sellingPlans.edges ){
                        sellingPlanGroup.sellingPlans.edges.map(function(sellingPlan, i){
                            var scheduleFrequencyId = sellingPlan.node.id.replace("gid://shopify/SellingPlan/", "");
                            scheduleFrequencyIds.push(scheduleFrequencyId);
                            var sellingPlanName = sellingPlan.node.name;
                            var sellingPlanOption = sellingPlan.node.options[0];
                            scheduleInterval = sellingPlan.node.billingPolicy.interval;
                            var intervalCount = sellingPlan.node.billingPolicy.intervalCount;
                            var scheduleIntervalValue = 'day';
                            scheduleFrequency.push(intervalCount);
                            if( scheduleInterval == 'DAY' ){
                                scheduleIntervalValue = 'day';
                            }
                            if( scheduleInterval == 'WEEK' ){
                                scheduleIntervalValue = 'week';	
                            }
                            if( scheduleInterval == 'MONTH' ){
                                scheduleIntervalValue = 'month';	
                            }
                            if( intervalCount > 1 ){
                                scheduleIntervalValue = scheduleIntervalValue+'s';
                            }
                            var sellingPlanName=sellingPlanName.replace(' '+sellingPlanOption, "");
                            scheduleFrequencyName.push(sellingPlanName);
                            var pricingPolicies = sellingPlan.node.pricingPolicies[0];
                            discountPer = pricingPolicies.adjustmentValue.percentage;
                            if( discountPer > 0 ){
                                discount = true;
                            }
                            planState[i]={}
                            planState[i].discountPer=discountPer;
                            planState[i].name = sellingPlanName;
                            planState[i].intervalCount = intervalCount;
                            planState[i].interval = scheduleInterval;
                            planState[i].id = scheduleFrequencyId;
                        });
                    }
                    editSubscriptionGroupOption({...editSubscriptionGroup, data:sellingPlanGroup, id:sellingPlanGroup.id , plansState:planState});
                    subscriptionActionOptions({...subscriptionAction, name:sellingPlanGroup.name,type:subscriptionType, discount:discount, discountPer:discountPer, scheduleInterval:scheduleInterval, scheduleIntervalValue:scheduleIntervalValue , scheduleFrequency:scheduleFrequency, scheduleFrequencyName:scheduleFrequencyName, scheduleFrequencyIds:scheduleFrequencyIds});
                }else{
                    editSubscriptionGroupOption({...editSubscriptionGroup, edit:false});
                }
            },
            enabled:false
        },
    });


    const params = JSON.stringify(filterValues);
    const { data, refetch:refetchProducts } = useAppQuery({ url: `/api/products/${params}`,
        reactQueryOptions: {
            onSuccess: (data) => {
                loadStartOption(false);
                productDataOption(data);
            },
            enabled:false
        },
    });

    const { dataProd, refetch:refetchSubProducts } = useAppQuery({ url: `/api/subproducts/${subscriptionAdd.ids}`,
        reactQueryOptions: {
            onSuccess: (response) => {
                setOpenPopup(false);
                loadStartOption(false);
                productDataOption({});
                subscriptionAddOptions({...subscriptionAdd, count:0, adding:true, products:response.data.products, shop:response.shop.shop});
            },
            enabled:false
        }, 
    });

    async function createSubGroupTriggerFunc(e){
        const editSubscriptionGroupId = editSubscriptionGroup.id.replace("gid://shopify/SellingPlanGroup/", "");
        const createSubGroupData = {
            ed:editSubscriptionGroup.edit,
            id:editSubscriptionGroupId,
            al:subscriptionAdd.alreadyIds,
            nm:subscriptionAction.name,
            dP:subscriptionAction.discountPer,
            sF:subscriptionAction.scheduleFrequency,
            sI:subscriptionAction.scheduleInterval,
            sFN:subscriptionAction.scheduleFrequencyName,
            tp:subscriptionAction.type,
            ids:subscriptionAdd.ids,
            pu:editSubscriptionGroup.planUpdate,
            ps:editSubscriptionGroup.plansState,
            pr:editSubscriptionGroup.planRemove
        }
        const response = await fetch('/api/createsubgroup', {
            method: 'POST',
            body: JSON.stringify(createSubGroupData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        }).then((res) => res.json()).then((response) => {
           // console.log(response);
            var id = response.id.replace("gid://shopify/SellingPlanGroup/", "");
            var status = response.status;
            navigateTo('/groups?status='+status+'&id='+id);
            loadStartOption(false);
        })
        .catch((err) => {
            console.log(err.message);
        });
    }

    function openPopupFunc(){
        setOpenPopup(true);
        refetchProducts();
    }

    function closePopupFunc(){
        setOpenPopup(false);
        subscriptionAddOptions({...subscriptionAdd, count:0});
        productDataOption({});
        filterValuesOptions({...filterValues, title: '', type: '', vendor: '' , query: ''});
    }

    function checkOptionChange(e){
        var idsArray = subscriptionAdd.ids;
        let countChange = 0;
        if( e.target.checked ){ 
          countChange = subscriptionAdd.count+1;
          if( idsArray.indexOf(e.target.value) > -1 ){}else{
            idsArray.push(e.target.value);
          }
        }else{
          if( subscriptionAdd.count > 0 ){
            countChange = subscriptionAdd.count-1;
          }
          if( idsArray.indexOf(e.target.value) > -1 ){
            idsArray.splice(idsArray.indexOf(e.target.value), 1);
          }
        }
        subscriptionAddOptions({...subscriptionAdd, count:countChange, ids:idsArray });
    }

    function addProductsInSubscription(e){
        e.preventDefault();
        loadStartOption(true);
        refetchSubProducts();
        filterValuesOptions({...filterValues, title: '', type: '', vendor: '' , query: ''});
    }

    function deleteFromSubGroup(e){
        var targetElement = e.target;
        var id = parseInt(targetElement.getAttribute('data-id'));
        var newIds = subscriptionAdd.ids;
        var newObject = subscriptionAdd.products;
        {subscriptionAdd.ids.map(function(data, i){
            var dataId = parseInt(data);
            if( dataId == id ){
                delete newIds[i];
            }
        })}
        {subscriptionAdd.products.map(function(object, i){
            if( id == object.id ){
                delete newObject[i];
            }
        })}
        subscriptionAddOptions({...subscriptionAdd, ids:newIds, products:newObject });
    }

    function formFilterSubmit(e){
        e.preventDefault();
        productDataOption({});
        refetchProducts();
    }

    function inputOptionChange(e){
        filterValuesOptions({...filterValues, [e.target.name]: e.target.value});
    }

    function groupNameChange(e){
        var targetElement = e.target;
        if( targetElement.value == '' ){
            subscriptionActionOptions({...subscriptionAction, name:targetElement.value, namereq:true });
        }else{
            subscriptionActionOptions({...subscriptionAction, name:targetElement.value, namereq:false });
        }
    }

    function scheduleIntervalChange(e){
        var value = e.target.value;
        var targetElement = e.target;
        var valueView = 'Days';
        if( value == 'WEEK' ){
            valueView = 'Weeks';
        }
        if( value == 'MONTH' ){
            valueView = 'Months';
        }
        subscriptionActionOptions({...subscriptionAction, scheduleInterval:value, scheduleIntervalValue:valueView });
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency;
        var warn = false;
        if( value == 'DAY' ){
            let i = 0;
            while ( i < scheduleFrequencyArrayValues.length ) {
                if( scheduleFrequencyArrayValues[i] < 1 ){
                    warn = true;
                }
                i++;
            }
        }
        if( editSubscriptionGroup.edit ){
            var planUpdate = editSubscriptionGroup.planUpdate;
            var plansState = editSubscriptionGroup.plansState;
            for ( const property in plansState ) {
                if( planUpdate.hasOwnProperty(property) ){
                    planUpdate[property].id=plansState[property].id;
                    planUpdate[property].interval=value;
                }else{
                    planUpdate[property]={}
                    planUpdate[property].id=plansState[property].id;;
                    planUpdate[property].interval=value;
                }
            }
            editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
        }
        dayWarnOption(warn);
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues));
    }

    function toFindDuplicates(arry) {
        var arry = arry;
        let toMap = {};
        let resultToReturn = false;
        for (let i = 0; i < arry.length; i++) {
            if (toMap[arry[i]]) {
                resultToReturn = true;
                break;
            }
            toMap[arry[i]] = true;
        }
        return resultToReturn;
    }

    function scheduleFrequencyChange(e){
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency;
        var scheduleInterval = subscriptionAction.scheduleInterval;
        var value = parseInt(e.target.value);
        if( value > 1 ){
            value = value;
        }else{
            value = 1;
        }
        var targetElement = e.target;
        var index = targetElement.getAttribute('data-index');
        scheduleFrequencyArrayValues[index]=value;
        subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues });
        var warn = false;
        if( scheduleInterval == 'DAY' ){
            scheduleFrequencyArrayValues.map(function(object, i){
                if( object == 1 ){
                    warn = true;
                }
            });
        }
        if( editSubscriptionGroup.edit ){
            var planUpdate = editSubscriptionGroup.planUpdate;
            var planId = targetElement.getAttribute('data-id');
            if( planId !== null ){
                if( objsize(planUpdate) > 0 ){
                    var length = objsize(planUpdate);
                    var find = 0;
                    for ( const property in planUpdate ) {
                        if( planUpdate[property]['id'] == planId ){
                            planUpdate[property].intervalCount=value;
                            find = 1;
                        }
                    }
                    if( find==0 ){
                        planUpdate[length]={}
                        planUpdate[length].id=planId;
                        planUpdate[length].intervalCount=value;
                    }
                }else{
                    planUpdate[0]={}
                    planUpdate[0].id=planId;
                    planUpdate[0].intervalCount=value;
                }
                editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
            }
        }
        dayWarnOption(warn);
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues));
    }

    function scheduleAdd(e){
        e.preventDefault();
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency; 
        var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
        var firstValue = scheduleFrequencyArrayValues[scheduleFrequencyArrayValues.length-1]+1;
        var sellingPlanName = "Delivery every";
        scheduleFrequencyArrayValues.push(firstValue);
        scheduleFrequencyNameArray.push(sellingPlanName);
        subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues, scheduleFrequencyName:scheduleFrequencyNameArray });
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues));
    }

    function scheduleRemove(e){
        e.preventDefault();
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency; 
        var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
        var scheduleFrequencyIdsArray = subscriptionAction.scheduleFrequencyIds;
        var targetElement = e.target;
        var index = targetElement.getAttribute('data-index');
        scheduleFrequencyNameArray.splice(index, 1); 
        scheduleFrequencyArrayValues.splice(index, 1); 
        if( editSubscriptionGroup.edit ){
            var planId = targetElement.getAttribute('data-id');
            scheduleFrequencyIdsArray.splice(index, 1); 
            var planRemove = editSubscriptionGroup.planRemove;
            if( planRemove.includes(planId, 0) ){}else{
                planRemove.push(planId);
            }
            editSubscriptionGroupOption({...editSubscriptionGroup, planRemove:planRemove});
        }
        subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues, scheduleFrequencyName:scheduleFrequencyNameArray, scheduleFrequencyIds:scheduleFrequencyIdsArray });
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues));
    }

    function objsize(obj) {
        var size = 0, key;
      
        for (key in obj) {
            if (obj.hasOwnProperty(key))
            size++;
        }
        return size;
    };

    function sellingPlanNameChange(e){
        var targetElement = e.target;
        var value = targetElement.value;
        var index = targetElement.getAttribute('data-index');
        var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
        scheduleFrequencyNameArray[index]=value;
        subscriptionActionOptions({...subscriptionAction, scheduleFrequencyName:scheduleFrequencyNameArray });
        if( editSubscriptionGroup.edit ){
            var planUpdate = editSubscriptionGroup.planUpdate;
            var planId = targetElement.getAttribute('data-id');
            if( planId !== null ){
                if( objsize(planUpdate) > 0 ){
                    var length = objsize(planUpdate);
                    var find = 0;
                    for ( const property in planUpdate ) {
                       if( planUpdate[property]['id'] == planId ){
                        planUpdate[property].name=value;
                        find = 1;
                       }
                    }
                    if( find==0 ){
                        planUpdate[length]={}
                        planUpdate[length].id=planId;
                        planUpdate[length].name=value;
                    }
                }else{
                    planUpdate[0]={}
                    planUpdate[0].id=planId;
                    planUpdate[0].name=value;
                }
                editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
            }
        }
    }

    function createSubscriptionGroup(){
        if( dayWarn ){}else{
            if( samePlan ){}else{
                if( subscriptionAction.name == '' ){
                    subscriptionActionOptions({...subscriptionAction, namereq:true });
                }else{
                    loadStartOption(true);
                    createSubGroupTriggerFunc();
                }
            }
        }
    }

    return (
        <>
            <div className="itgSubGroupPage">
                <div className="itgSubGroupPageInner">
                    <div className="itgSubGroupPageInnerLeft">
                        <div className="itgSubGroupPageInnerTitle">
                            <NavLink to="/groups" className="link-btn">Back</NavLink>
                            <h5 className="title">{editSubscriptionGroup.edit?"Edit":"Create"} subscription group</h5>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <h6 className="title">Subscription group</h6>
                            <div className="desc"><p>Specify the names for your subscription plan group.</p></div>
                            <div className="itgSubGroupPageInnerField">
                                <label>Subscription group name</label>
                                <input type="text" className={subscriptionAction.namereq?"input required":"input"} value={subscriptionAction.name} onChange={groupNameChange}/>
                            </div>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <h6 className="title">Subscription type</h6>
                            <div className="itgSubGroupPageInnerFieldTypes">
                                <div className="itgSubGroupPageInnerFieldItem">
                                    <div className="itgSubGroupPageInnerFieldItemInner">
                                        <div className="itgSubGroupPageInnerFieldItemInnerCheck">
                                            <input 
                                                type="radio" 
                                                id="subscription-one-time" 
                                                name="subscription-type" 
                                                value="subscription-one-time" 
                                                checked={subscriptionAction.type === "subscription-one-time"}
                                                onChange={() => {
                                                    subscriptionActionOptions({...subscriptionAction, type:"subscription-one-time" });  
                                                }}
                                            />
                                        </div>
                                        <div className="itgSubGroupPageInnerFieldItemInnerDetail">
                                            <label className="h7" htmlFor="subscription-one-time">One-time and subscription</label>
                                            <div className="desc">
                                                <p>Your product(s) will have the option of being purchased as a one-time item or as a recurring subscription item.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="itgSubGroupPageInnerFieldItem">
                                    <div className="itgSubGroupPageInnerFieldItemInner">
                                        <div className="itgSubGroupPageInnerFieldItemInnerCheck">
                                            <input 
                                                type="radio"
                                                id="subscription-type"
                                                name="subscription-type" 
                                                value="subscription-only" 
                                                checked={subscriptionAction.type === "subscription-only"}
                                                onChange={() => {
                                                    subscriptionActionOptions({...subscriptionAction, type:"subscription-only" });  
                                                }}
                                            />
                                        </div>
                                        <div className="itgSubGroupPageInnerFieldItemInnerDetail">
                                            <label className="h7" htmlFor="subscription-type">Subscription only</label>
                                            <div className="desc">
                                                <p>Your product(s) will only be offered as a recurring subscription item. (Ex. Box of the month)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <div className="itgSubGroupPageInnerGroupTitle">
                                <div className="itgSubGroupPageInnerGroupTitleBox">
                                    <h6 className="title">Subscription products</h6>
                                    <div className="desc"><p>Choose the products and variants you'd like to sell via subscription.</p></div>
                                </div>
                                <div className="itgSubGroupPageInnerGroupTitleAction">
                                    <button type="button" className="btn secondary-btn" onClick={openPopupFunc}>Add Products</button>
                                </div>
                            </div>
                            { subscriptionAdd.products.length > 0 ?<>
                                <div className="itgSubGroupPageInnerGroupProducts">
                                {subscriptionAdd.products.map(function(object, i){
                                        var imageSrc = productPlaceholder;
                                        if( object.image ){
                                        if( object.image.src ){
                                            if( object.image.src.indexOf(".png") != -1 ){
                                            imageSrc = object.image.src.replace(".png","_100x.png");
                                            }else if( object.image.src.indexOf(".jpg") != -1 ){
                                            imageSrc = object.image.src.replace(".jpg","_100x.jpg");
                                            }else if( object.image.src.indexOf(".gif") != -1 ){
                                            imageSrc = object.image.src.replace(".gif","_100x.gif");
                                            }
                                        }
                                        }
                                        var subkey = 'sub-'+object.id;
                                        var productUrl = 'https://'+subscriptionAdd.shop.myshopify_domain+'/admin/products/'+object.id;
                                        return(
                                            <div key={subkey} className="itgSubGroupPageInnerGroupProductsItem">
                                                <div className="itgSubGroupPageInnerGroupProductsItemInner">
                                                    <div className="itgSubGroupPageInnerGroupProductsItemInnerImage">
                                                        <img src={imageSrc} alt={object.title} width="60"/>
                                                    </div>
                                                    <div className="itgSubGroupPageInnerGroupProductsItemInnerTitle">
                                                        <label>{object.title}</label>
                                                        <a href={productUrl} target="_blank" className="link-btn">View Details</a>
                                                    </div>
                                                    <div className="itgSubGroupPageInnerGroupProductsItemInnerDelete">
                                                        <button type="button" data-id={object.id} className="icon-btn" onClick={deleteFromSubGroup}><img src={deleteIconLight} alt="" data-id={object.id}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>:<></>}
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <h6 className="title">Subscription plans</h6>
                            <div className="desc"><p>Specify the plans belonging to this group.</p></div>
                            <div className="itgSubGroupPageInnerFieldPlans">
                                {subscriptionAction.scheduleFrequency.map(function(object, i){
                                    var sellingPlanName = subscriptionAction.scheduleFrequencyName[i]; 
                                    return(
                                        <div key={i} className={i==0?"itgSubGroupPageInnerFieldPlanItem":"itgSubGroupPageInnerFieldPlanItem hidden-labbel"}>
                                            <div className="itgSubGroupPageInnerFieldPlanItemName">
                                                <label>Name</label>
                                                <input type="text" className="input" data-index={i} data-id={subscriptionAction.scheduleFrequencyIds[i]} value={sellingPlanName} onChange={sellingPlanNameChange}/>
                                            </div>
                                            <div className="itgSubGroupPageInnerFieldPlanItemBillingRule">
                                                <label>Billing Rules</label>
                                                <div className="itgSubGroupPageInnerFieldPlanItemBillingRuleFields">
                                                    <input type="number" className="input" data-index={i} data-id={subscriptionAction.scheduleFrequencyIds[i]}  value={object} onChange={scheduleFrequencyChange}/>
                                                    <select name="frequency-interval" value={subscriptionAction.scheduleInterval} data-id={subscriptionAction.scheduleFrequencyIds[i]} className="itg-frequency-value-interval" onChange={scheduleIntervalChange} disabled={i>0}>
                                                        <option value="DAY">Days</option>
                                                        <option value="WEEK">Weeks</option>
                                                        <option value="MONTH">Months</option>
                                                    </select>
                                                    {i==0?<></>:<>
                                                        <div className="itgSubGroupPageInnerFieldPlanItemBillingRuleFieldsRemove">
                                                            <a href="#" className="link-btn" data-index={i} data-id={subscriptionAction.scheduleFrequencyIds[i]} onClick={scheduleRemove}>
                                                                <span data-index={i} data-id={subscriptionAction.scheduleFrequencyIds[i]}>Remove</span>
                                                            </a>
                                                        </div>
                                                    </>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="itgSubGroupPageInnerGroupFreq">
                                <a href="#" className="itgSubGroupPageInnerGroupAddFreq" onClick={scheduleAdd}>
                                    <img src={addIcon} alt=""/>
                                    <span>Add plan</span>
                                </a>
                            </div>
                            {samePlan?<>
                                <div className="itgSubGroupPageInnerGroupFreqWarn">Every plan will have different Billing Rules</div> 
                            </>:<></>}
                            {dayWarn?<>
                                <div className="itgSubGroupPageInnerGroupFreqWarn">Min value for Days is 1</div> 
                            </>:<></>}
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <div className="itgSubGroupPageInnerGroupDiscount">		
                                <h6 className="title">Set up a discount</h6>
                                <div className="itgSubGroupPageInnerGroupDiscountBox">
                                    <div className="itgSubGroupPageInnerGroupDiscountItem">
                                        <div className="desc"><p>Offer an incentive to subscribe and save by offering a discount.</p></div>
                                        <div className="itgSubGroupPageInnerGroupDiscountItemDiscount">
                                            <input type="checkbox" name="set-up-discount" checked={subscriptionAction.discount} id="set-up-discount" onChange={(e) => {
                                                if( e.target.checked ){ 
                                                    subscriptionActionOptions({...subscriptionAction, discount:true, discountPer:0 });
                                                }else{
                                                    subscriptionActionOptions({...subscriptionAction, discount:false, discountPer:0 });
                                                }
                                                if( editSubscriptionGroup.edit ){
                                                    var planUpdate = editSubscriptionGroup.planUpdate;
                                                    var plansState = editSubscriptionGroup.plansState;
                                                    for ( const property in plansState ) {
                                                        if( planUpdate.hasOwnProperty(property) ){
                                                            planUpdate[property].id=plansState[property].id;
                                                            planUpdate[property].discountPer=0;
                                                        }else{
                                                            planUpdate[property]={}
                                                            planUpdate[property].id=plansState[property].id;;
                                                            planUpdate[property].discountPer=0;
                                                        }
                                                    }
                                                    editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
                                                }
                                            }}/>
                                            <label htmlFor="set-up-discount">Yes, I'd like to offer a discount</label>	
                                        </div>
                                        { subscriptionAction.discount ?
                                        <div className="itgSubGroupPageInnerGroupDiscountNumberBox">
                                            <div className="itgSubGroupPageInnerGroupDiscountNumber">
                                                <input type="number" name="set-up-discount-percent" value={subscriptionAction.discountPer} onChange={(e) => {
                                                    if( e.target.value > 99 ){
                                                        subscriptionActionOptions({...subscriptionAction, discountPer:99 });
                                                    }else if( e.target.value < 1 ){
                                                        subscriptionActionOptions({...subscriptionAction, discountPer:0 });
                                                    }else{
                                                        subscriptionActionOptions({...subscriptionAction, discountPer:parseInt(e.target.value) });
                                                    }
                                                    if( editSubscriptionGroup.edit ){
                                                        var planUpdate = editSubscriptionGroup.planUpdate;
                                                        var plansState = editSubscriptionGroup.plansState;
                                                        for ( const property in plansState ) {
                                                            if( planUpdate.hasOwnProperty(property) ){
                                                                planUpdate[property].id=plansState[property].id;
                                                                planUpdate[property].discountPer=parseInt(e.target.value);
                                                            }else{
                                                                planUpdate[property]={}
                                                                planUpdate[property].id=plansState[property].id;;
                                                                planUpdate[property].discountPer=parseInt(e.target.value);
                                                            }
                                                        }
                                                        editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
                                                    }
                                                }}/>
                                                <span>% off</span>
                                            </div>
                                        </div>
                                        :<></>}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="itgSubGroupPageInnerGroupSave">
                            <button type="button" className="btn primary-btn" onClick={createSubscriptionGroup}>Save Group</button>
                            {samePlan?<>
                            <div className="itgSubGroupPageInnerGroupSaveRequire">
                                Every plan will have different Billing Rules
                            </div> 
                            </>:<></>}
                            {dayWarn?<>
                            <div className="itgSubGroupPageInnerGroupSaveRequire">
                                Min value for Days is 1
                            </div> 
                            </>:<></>}
                            {subscriptionAction.namereq ? <><div className="itgSubGroupPageInnerGroupSaveRequire">Group name is required</div></> : <></> }
                        </div>
                    </div>
                    <div className="itgSubGroupPageInnerRight">
                        <div className="itgSubGroupPageInnerSaveAction">
                            <NavLink to="/groups" className="link-btn">Back</NavLink>
                            <button type="button" className="btn primary-btn" onClick={createSubscriptionGroup}>Save</button>
                        </div>
                        <div className="itgSubGroupPageInnerPreview">
                            <h6 className="title">Product preview</h6>
                            <ul className="itgSubGroupPageInnerPreviewList">
                                <li>
                                    <img src={verifyCheck} alt=""/>
                                    <span className="itgSubGroupPageInnerPreviewType">
                                    { subscriptionAction.type == "subscription-one-time" ?
                                    "Products can be purchased one-time or on a recurring basis."
                                    :
                                    "Products can be purchased on a recurring basis."
                                    }
                                    </span>
                                </li>
                                <li>
                                    <img src={verifyCheck} alt=""/>
                                    <span>Product ships every <span className="itgSubGroupPageInnerPreviewTypeShipDetail">
                                    {subscriptionAction.scheduleFrequency.map(function(object, i){
                                        if( i === 0 ){
                                        return(
                                            <span key={i}>{object}</span>
                                        );
                                        }else{
                                        return(
                                            <span key={i}>, {object}</span>
                                        );
                                        }
                                    })}
                                    &nbsp;{subscriptionAction.scheduleIntervalValue}.
                                    </span></span>
                                </li>
                                { subscriptionAction.discount && subscriptionAction.discountPer > 0 ?
                                    <>
                                    <li className="itgSubGroupPageInnerPreviewTypeDiscount">
                                        <img src={verifyCheck} alt=""/>
                                        <span className="itgSubGroupPageInnerPreviewTypeDiscountDetail">Customers <span className="itgSubGroupPageInnerPreviewTypeDiscountDetailHighlight">save {subscriptionAction.discountPer}%</span> when they subscribe.</span>
                                    </li>
                                    </>
                                    :<></>
                                }
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {openPopup?
            <div className="itgAddSubProductsPopup">
                <div className="itgAddSubProductsPopupBox">
                    <div className="itgAddSubProductsPopupTitle">
                        <h5 className="title">Add products</h5>
                    </div>
                    <div className="itgAddSubProductsPopupSearch">
                        <form className="itgAddSubProductsPopupSearchForm" onSubmit={formFilterSubmit}>
                            <div className="itgAddSubProductsPopupSearchFormGroup">
                                <input type="text" name="query" placeholder="Searching all products" className="input-area" onChange={inputOptionChange}/>
                                <button type="submit" className="icon-btn">
                                    <img src={searchIcon} alt=""/>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="itgAddSubProductsPopupProducts">
                        <div className="itgAddSubProductsPopupProductTable">
                            <div className="itgAddSubProductsPopupProductTableHeader">
                                <div className="itgTableBlock"><label>Products</label></div>
                                <div className="itgTableBlock"><label>Vendor</label></div>
                                <div className="itgTableBlock"><label>Type</label></div>
                            </div>
                            <div className="itgAddSubProductsPopupProductTableBodyItems">
                                { productData.data ?
                                <>
                                    { productData.data.products.edges.length > 0 ?
                                    <>
                                        {productData.data.products.edges.map(function(object, i){
                                            var object = object.node;
                                            var objectId = object.id.replace("gid://shopify/Product/", "");
                                            var imageSrc = productPlaceholder;
                                            var already = object.sellingPlanGroups.edges.length;
                                            var objectIdLabbel = 'labbelproduct-'+objectId;
                                            var checkedAlready = false;
                                            if( object.images ){
                                                if( object.images.edges ){
                                                    if( object.images.edges[0].node ){
                                                        if( object.images.edges[0].node.url.indexOf(".png") != -1 ){
                                                            imageSrc = object.images.edges[0].node.url.replace(".png","_100x.png");
                                                        }else if( object.images.edges[0].node.url.indexOf(".jpg") != -1 ){
                                                            imageSrc = object.images.edges[0].node.url.replace(".jpg","_100x.jpg");
                                                        }else if( object.images.edges[0].node.url.indexOf(".gif") != -1 ){
                                                            imageSrc = object.images.edges[0].node.url.replace(".gif","_100x.gif");
                                                        }
                                                    }
                                                }
                                            }
                                            {subscriptionAdd.ids.map(function(objectTwo, iTwo){
                                                if( objectId == objectTwo ){
                                                    checkedAlready = true;
                                                }
                                            })}
                                            return(
                                                <label key={object.id} htmlFor={objectIdLabbel} className={already?"itgAddSubProductsPopupProductTableBody already":"itgAddSubProductsPopupProductTableBody"}>
                                                    <div className="itgTableBlock">
                                                        <div className="itgTableBlockProductView">
                                                            <div className="itgTableBlockProductCheck">
                                                            {already? <>
                                                                <input type="checkbox" className="itg-add-product-check" name="productadd" disabled/>
                                                            </> : <>
                                                                <input type="checkbox" id={objectIdLabbel} value={objectId} className="itg-add-product-check" name="productadd" onChange={checkOptionChange}/>
                                                            </> }
                                                            </div>
                                                            <div className="itgTableBlockProductImage">
                                                                <img src={imageSrc} alt={object.title} width="40"/>
                                                            </div>
                                                            <div className="itgTableBlockProductTitle">{object.title}</div>
                                                        </div>
                                                    </div>
                                                    <div className="itgTableBlock"><span>{object.vendor}</span></div>
                                                    <div className="itgTableBlock"><span>{object.product_type}</span></div>
                                                </label>
                                            );
                                        })}
                                    </>
                                    :<>
                                        <div className="itgAddSubProductsPopupProductTableBodyEmpty">
                                            <div className="itgAddSubProductsPopupProductTableBodyEmptyText">Products not found !</div>
                                        </div>
                                    </>}
                                </>
                                :<>
                                    <div className="itg-main-loader active">
                                        <img src={loaderIcon} alt=""/>
                                    </div>
                                </>}
                            </div>
                            <div className="itgAddSubProductsPopupProductTableBodyActionInfo">
                                <label>Info :</label>
                                <span>Highlighted and disabled products are already in the Selling plan group.</span>
                            </div>
                            <div className="itgAddSubProductsPopupProductTableBodyAction">
                                <button type="button" className="btn" onClick={closePopupFunc}>Cancel</button>
                                <button type="button" className="btn primary-btn" onClick={addProductsInSubscription} disabled={ subscriptionAdd.count > 0 ? "" : "disabled" }>Add <span className="add-product-count">{subscriptionAdd.count}</span> Products</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>:<></>}

            {loadStart?<>
            <div className="itg-main-loader active">
                <img src={loaderIcon} alt=""/>
            </div>
            </>:<></>}
        </>
    );

}