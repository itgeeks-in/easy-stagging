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
    const [ subscriptionAction, subscriptionActionOptions ] = useState({ name:"New Subscription Group", namereq:false, namespec:false, details:true, discountPer:0, discount:false, type:'subscription-one-time', scheduleInterval:["MONTH"], scheduleIntervalValue:["Months"] , scheduleFrequency:[1], scheduleFrequencyName:["Delivery every"],scheduleFrequencyIds:[], expire:false, expireNumber:0 });
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
                    var scheduleIntervalValue = [];
                    var scheduleInterval = [];
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
                            var scheduleIntervalName = sellingPlan.node.billingPolicy.interval;
                            var intervalCount = sellingPlan.node.billingPolicy.intervalCount;
                            var scheduleIntervalValueName = 'day';
                            scheduleFrequency.push(intervalCount);
                            if( scheduleIntervalName == 'DAY' ){
                                scheduleIntervalValueName = 'day';
                            }
                            if( scheduleIntervalName == 'WEEK' ){
                                scheduleIntervalValueName = 'week';	
                            }
                            if( scheduleIntervalName == 'MONTH' ){
                                scheduleIntervalValueName = 'month';	
                            }
                            if( intervalCount > 1 ){
                                scheduleIntervalValueName = scheduleIntervalValueName+'s';
                            }
                            scheduleInterval.push(scheduleIntervalName);
                            scheduleIntervalValue.push(scheduleIntervalValueName);
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
                            planState[i].interval = scheduleIntervalName;
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
            subscriptionActionOptions({...subscriptionAction, name:targetElement.value, namereq:true, namespec:false });
        }else{
            if( containsSpecialChars(targetElement.value) === true ){
                subscriptionActionOptions({...subscriptionAction, name:targetElement.value, namereq:false, namespec:true });
            }else{
                subscriptionActionOptions({...subscriptionAction, name:targetElement.value, namereq:false, namespec:false });
            }
        }
    }

    function containsSpecialChars(str) {
        const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
        return specialChars.test(str);  
    }

    function scheduleIntervalChange(e){
        var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval;
        var scheduleIntervalValueArrayValues = subscriptionAction.scheduleIntervalValue;
        var value = e.target.value;
        var targetElement = e.target;
        var index = targetElement.getAttribute('data-index');
        var valueView = 'Days';
        if( value == 'WEEK' ){
            valueView = 'Weeks';
        }
        if( value == 'MONTH' ){
            valueView = 'Months';
        }
        scheduleIntervalArrayValues[index] = value;
        scheduleIntervalValueArrayValues[index] = valueView;
        subscriptionActionOptions({...subscriptionAction, scheduleInterval:scheduleIntervalArrayValues, scheduleIntervalValue:scheduleIntervalValueArrayValues });
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
            var planId = targetElement.getAttribute('data-id');
            if( planId !== null ){
                if( objsize(planUpdate) > 0 ){
                    var length = objsize(planUpdate);
                    var find = 0;
                    for ( const property in planUpdate ) {
                        if( planUpdate[property]['id'] == planId ){
                            planUpdate[property].interval=value;
                            find = 1;
                        }
                    }
                    if( find==0 ){
                        planUpdate[length]={}
                        planUpdate[length].id=planId;
                        planUpdate[length].interval=value;
                    }
                }else{
                    planUpdate[0]={}
                    planUpdate[0].id=planId;
                    planUpdate[0].interval=value;
                }
                editSubscriptionGroupOption({...editSubscriptionGroup, planUpdate:planUpdate});
            }
        }
        dayWarnOption(warn);
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
    }

    function toFindDuplicates(arryOne, arryTwo) {
        var newArray = [];
        for (let i = 0; i < arryOne.length; i++) {
            newArray[i]=arryOne[i]+''+arryTwo[i];
        }
        var arry = newArray;
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
        var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval;
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
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
    }

    function scheduleAdd(e){
        e.preventDefault();
        var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval; 
        var scheduleIntervalValueArrayValues = subscriptionAction.scheduleIntervalValue; 
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency; 
        var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
        var firstValue = scheduleFrequencyArrayValues[scheduleFrequencyArrayValues.length-1]+1;
        var firstIntervalValue = scheduleIntervalArrayValues[scheduleIntervalArrayValues.length-1];
        var sellingPlanName = "Delivery every";
        scheduleFrequencyArrayValues.push(firstValue);
        scheduleIntervalArrayValues.push(firstIntervalValue);
        scheduleFrequencyNameArray.push(sellingPlanName);
        var valueView = 'Days';
        if( firstIntervalValue == 'WEEK' ){
            valueView = 'Weeks';
        }
        if( firstIntervalValue == 'MONTH' ){
            valueView = 'Months';
        }
        scheduleIntervalValueArrayValues.push(valueView);
        subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues, scheduleInterval:scheduleIntervalArrayValues, scheduleIntervalValue:scheduleIntervalValueArrayValues, scheduleFrequencyName:scheduleFrequencyNameArray });
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
    }

    function scheduleRemove(e){
        e.preventDefault();
        var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval;
        var scheduleIntervalValueArrayValues = subscriptionAction.scheduleIntervalValue;
        var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency; 
        var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
        var scheduleFrequencyIdsArray = subscriptionAction.scheduleFrequencyIds;
        var targetElement = e.target;
        var index = targetElement.getAttribute('data-index');
        scheduleFrequencyNameArray.splice(index, 1); 
        scheduleIntervalArrayValues.splice(index, 1); 
        scheduleIntervalValueArrayValues.splice(index, 1); 
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
        subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues, scheduleInterval:scheduleIntervalArrayValues, scheduleIntervalValue:scheduleIntervalValueArrayValues, scheduleFrequencyName:scheduleFrequencyNameArray, scheduleFrequencyIds:scheduleFrequencyIdsArray });
        samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
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

    function createSubscriptionGroupF(){
        if( dayWarn ){}else{
            if( samePlan ){}else{
                if( subscriptionAction.name == '' ){
                    subscriptionActionOptions({...subscriptionAction, namereq:true });
                }else{
                    if( subscriptionAction.namespec === true ){}else{
                        loadStartOption(true);
                        createSubGroupTriggerFunc();
                    }
                }
            }
        }
    }

    console.log(productData);

    return (
        <>
            <div className="itgSubGroupPage">
                <div className="itgSubGroupPageInner">
                    <div className="itgSubGroupPageInnerLeft">
                        <div className="itgSubGroupPageInnerTitle">
                            <NavLink to="/groups" className="link-btn">Back</NavLink>
                            <h5 className="title">{editSubscriptionGroup.edit?"Edit":"Create"} a subscription group</h5>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <h6 className="title">Group Name</h6>
                            <div className="itgSubGroupPageInnerField">
                                <input type="text" className={(subscriptionAction.namereq || subscriptionAction.namespec )?"input required":"input"} value={subscriptionAction.name} onChange={groupNameChange}/>
                                {subscriptionAction.namespec?<>
                                    <div className="itgSubGroupPageInnerGroupNameSpecial">Special characters not allowed</div>
                                </>:<></>}
                            </div>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <h6 className="title">Subscription Type</h6>
                            <div className="itgSubGroupPageInnerFieldTypes">
                                <div className="itgSubGroupPageInnerFieldItem" data-checked={subscriptionAction.type === "subscription-one-time"}>
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
                                            <label className="h7" htmlFor="subscription-one-time">One-time + Subscription</label>
                                            <div className="desc">
                                                <p>This gives option to your customers either to purchase the item as one time purchase or a recurring subscription.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="itgSubGroupPageInnerFieldItem" data-checked={subscriptionAction.type === "subscription-only"}>
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
                                                <p>This gives option to your customers to purchase the item on recurring basis.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="itgSubGroupPageInnerGroup">
                            <div className="itgSubGroupPageInnerGroupTitle">
                                <div className="itgSubGroupPageInnerGroupTitleBox">
                                    <h6 className="title">Subscription Products</h6>
                                    <div className="desc"><p>Add the products for which you want to offer a subscription</p></div>
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
                            <h6 className="title">Subscription Plans</h6>
                            <div className="desc"><p>Set the name and billing rules for your subscription group</p></div>
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
                                                    <select name="frequency-interval" data-index={i} value={subscriptionAction.scheduleInterval[i]} data-id={subscriptionAction.scheduleFrequencyIds[i]} className="itg-frequency-value-interval" onChange={scheduleIntervalChange}>
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
                                <h6 className="title">Create a discount</h6>
                                <div className="itgSubGroupPageInnerGroupDiscountBox">
                                    <div className="itgSubGroupPageInnerGroupDiscountItem">
                                        <div className="desc"><p>Offer discounts for the subscription product</p></div>
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
                            <button type="button" className="btn primary-btn" onClick={createSubscriptionGroupF}>Save Group</button>
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
                            <button type="button" className="btn primary-btn" onClick={createSubscriptionGroupF}>Save</button>
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
                                        var scheduleIntervalValueArray = subscriptionAction.scheduleIntervalValue;
                                        if( i === 0 ){
                                            return(
                                                <span key={i}>{object} {scheduleIntervalValueArray[i]}</span>
                                            );
                                        }else{
                                            return(
                                                <span key={i}>, {object} {scheduleIntervalValueArray[i]}</span>
                                            );
                                        }
                                    })}
                                    </span>.</span>
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
                                <input type="text" name="query" placeholder="Search Products" className="input-area" onChange={inputOptionChange}/>
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
                                            console.log(object);
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
                                <label>Note :</label>
                                <span>The products that are highlighted are disabled because they are already added in a different Subscription Group.</span>
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