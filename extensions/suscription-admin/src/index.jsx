import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  BlockStack,
  Button,
  Card,
  Checkbox,
  InlineStack,
  Text,
  TextBlock,
  TextField,
  extend,
  render,
  useData,
  useContainer,
  useSessionToken,
  useLocale,
  Spinner,
  Radio,
  Select
} from '@shopify/admin-ui-extensions-react';

const translations = {
  de: {
    hello: 'Guten Tag',
  },
  en: {
    hello: 'Hello',
  },
  fr: {
    hello: 'Bonjour',
  },
};

function Actions({onPrimary, onClose, title}) {
  return (
    <InlineStack inlineAlignment="trailing">
      <Button title="Cancel" onPress={onClose} />
      <Button title={title} onPress={onPrimary} kind="primary" />
    </InlineStack>
  );
}

// 'Add' mode should allow a user to add the current product to an existing selling plan
// [Shopify admin renders this mode inside a modal container]
function Add() {
  // Information about the product and/or plan your extension is editing.
  // Your extension receives different data in each mode.
  const data = useData();

  // The UI your extension renders inside
  const {close, done, setPrimaryAction, setSecondaryAction} = useContainer();

  // Information about the merchant's selected language. Use this to support multiple languages.
  const locale = useLocale();

  // Use locale to set translations with a fallback
  const localizedStrings = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  // Session token contains information about the current user. Use it to authenticate calls
  // from your extension to your app server.
  const {getSessionToken} = useSessionToken();

  const [selectedPlans, setSelectedPlans] = useState([]);
  const mockPlans = [
    {name: 'Subscription Plan A', id: 'a'},
    {name: 'Subscription Plan B', id: 'b'},
    {name: 'Subscription Plan C', id: 'c'},
  ];

  // Configure the extension container UI
  useEffect(() => {
    setPrimaryAction({
      content: 'Add to plan',
      onAction: async () => {
        // Get a fresh session token before every call to your app server.
        const token = await getSessionToken();

        // Here, send the form data to your app server to add the product to an existing plan.

        // Upon completion, call done() to trigger a reload of the resource page
        // and terminate the extension.
        done();
      },
    });

    setSecondaryAction({
      content: 'Cancel',
      onAction: () => close(),
    });
  }, [getSessionToken, close, done, setPrimaryAction, setSecondaryAction]);

  return (
    <>
      <TextBlock size="extraLarge">{localizedStrings.hello}!</TextBlock>
      <Text>
        Add Product id {data.productId} to an existing plan or existing plans
      </Text>

      <InlineStack>
        {mockPlans.map((plan) => (
          <Checkbox
            key={plan.id}
            label={plan.name}
            onChange={(checked) => {
              const plans = checked
                ? selectedPlans.concat(plan.id)
                : selectedPlans.filter((id) => id !== plan.id);
              setSelectedPlans(plans);
            }}
            checked={selectedPlans.includes(plan.id)}
          />
        ))}
      </InlineStack>
    </>
  );
}

// 'Create' mode should create a new selling plan, and add the current product to it
// [Shopify admin renders this mode inside an app overlay container]
function Create() {
  const data = useData();
  const {close, done} = useContainer();
  const locale = useLocale();
  const localizedStrings = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const {getSessionToken} = useSessionToken();

  // Mock plan settings
  const [planTitle, setPlanTitle] = useState('');
  const [percentageOff, setPercentageOff] = useState('');
  const [deliveryFrequency, setDeliveryFrequency] = useState('');
  

  const onPrimaryAction = useCallback(async () => {
    const token = await getSessionToken();

    // Here, send the form data to your app server to create the new plan.

    done();
  }, [getSessionToken, done]);

  const cachedActions = useMemo(
    () => (
      <Actions
        onPrimary={onPrimaryAction}
        onClose={close}
        title="Create plan"
      />
    ),
    [onPrimaryAction, close]
  );

  return (
    <>
      <BlockStack spacing="none">
        <TextBlock size="extraLarge">
          {localizedStrings.hello}! Create subscription plan
        </TextBlock>
      </BlockStack>

      <Card
        title={`Create subscription plan for Product id ${data.productId}`}
        sectioned
      >
        <TextField
          label="Plan title"
          value={planTitle}
          onChange={setPlanTitle}
        />
      </Card>

      <Card title="Delivery and discount" sectioned>
        <InlineStack>
          <TextField
            type="number"
            label="Delivery frequency (in weeks)"
            value={deliveryFrequency}
            onChange={setDeliveryFrequency}
          />
          <TextField
            type="number"
            label="Percentage off (%)"
            value={percentageOff}
            onChange={setPercentageOff}
          />
        </InlineStack>
      </Card>

      {cachedActions}
    </>
  );
}

// 'Remove' mode should remove the current product from a selling plan.
// This should not delete the selling plan.
// [Shopify admin renders this mode inside a modal container]
function Remove() {
  const data = useData();
  const {close, done, setPrimaryAction, setSecondaryAction} = useContainer();
  const locale = useLocale();
  const localizedStrings = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const {getSessionToken} = useSessionToken();

  const [ loader , loaderOption ] = useState(true);
  const [ groupDetails , groupDetailsOption ] = useState({});
  const [ productDetails , productDetailsOption ] = useState({});


  useEffect(() => {
    setPrimaryAction({
      content: 'Remove from plan',
      onAction: async () => {
        const token = await getSessionToken();

        const postData = async () => {
    
          const responseP = await fetch('https://app.easysubscription.io/api/ad/prod/sub/remtrig', {
            method: 'POST', // Use POST method
            headers: {
              'Content-Type': 'application/json', // Set Content-Type header if sending JSON
              'token-shop': token || 'unknown token',
            },
            body: JSON.stringify(data)
          });
        
          // If the server responds with an OK status, then refresh the UI and close the modal
          if (responseP.ok) {
    
            const responseData = await responseP.json();
            loaderOption(false);
            done();
    
          } else {
            console.log('Handle error.');
          }  
    
        };
    
        loaderOption(true);
        postData();

      },
    });

    setSecondaryAction({
      content: 'Cancel',
      onAction: () => close(),
    });
  }, [getSessionToken, close, done, setPrimaryAction, setSecondaryAction]);

  useEffect(() => {

    const fetchData = async () => {

      const tokenS = await getSessionToken();

      const response = await fetch('https://app.easysubscription.io/api/ad/prod/sub/rem', {
        method: 'POST', // Use POST method
        headers: {
          'Content-Type': 'application/json', // Set Content-Type header if sending JSON
          'token-shop': tokenS || 'unknown token',
        },
        body: JSON.stringify(data)
      });
    
      // If the server responds with an OK status, then refresh the UI and close the modal
      if (response.ok) {

        const responseBody = await response.json();

        productDetailsOption(responseBody.product.data.product);
        groupDetailsOption(responseBody.group.data.sellingPlanGroup);
        loaderOption(false);

      } else {
        console.log('Handle error.');
      }  

    };

    fetchData();

  }, [data]);


  return (
    <>
        {loader?<>
          <Spinner accessibilityLabel="Spinner example" size="large"/>
        </>:<>
          {groupDetails.name?<>
            <BlockStack spacing="base">
              <TextBlock size="medium">{groupDetails.name}</TextBlock>
              <Text size="base">{groupDetails.summary}</Text>
              <Text size="base">--------</Text>
              <Text size="base" strong={true}>Selling Plans</Text>
              <InlineStack inlineAlignment="leading" spacing="loose">
              {groupDetails.sellingPlans.edges.map(function(value,index){
                return(
                  <>
                    <Text>- {value.node.name}</Text>
                  </>
                );
              })}
              </InlineStack>
              <Text size="base">--------</Text>
              <Text size="base" appearance="critical">Remove Product "{productDetails.title}"" from Plan group "{groupDetails.name}"</Text>
            </BlockStack>
          </>:<>
            <Spinner accessibilityLabel="Spinner example" size="large"/>
          </>}
        </>}
    </>
  );
}

// 'Edit' mode should modify an existing selling plan.
// Changes should affect other products that have this plan applied.
// [Shopify admin renders this mode inside an app overlay container]
function Edit() {
  const data = useData();
  const {close, done} = useContainer();
  const locale = useLocale();
  const localizedStrings = useMemo(() => {
    return translations[locale] || translations.en;
  }, [locale]);

  const {getSessionToken} = useSessionToken();

  const [ loader , loaderOption ] = useState(true);
  const [ samePlan, samePlanOption ] = useState(false); 
  const [ groupDetails , groupDetailsOption ] = useState({});
  const [ productDetails , productDetailsOption ] = useState({});
  const [ subscriptionType , subscriptionTypeOption ] = useState('subscription-one-time');
  const [ subscriptionAction, subscriptionActionOptions ] = useState({ name:"New Subscription Group", namereq:false, namespec:false, discountPer:0, discount:false, scheduleInterval:["MONTH"], scheduleIntervalValue:["Months"] , scheduleFrequency:[1], scheduleFrequencyName:["Delivery every"], scheduleFrequencyIds:[] });
  const [ editSubscriptionGroup, editSubscriptionGroupOption ] = useState({ edit:true, data:{}, id:'', plansState:{}, planUpdate:{}, planRemove:[] });


  const onPrimaryAction = useCallback(async () => {
    const tokenE = await getSessionToken();
    

    if( samePlan ){}else{
        if( subscriptionAction.name == '' ){
            subscriptionActionOptions({...subscriptionAction, namereq:true });
        }else{
            if( subscriptionAction.namespec === true ){}else{
                loaderOption(true);

                const createSubGroupData = {
                    ed:editSubscriptionGroup.edit,
                    id:data.sellingPlanGroupId,
                    nm:subscriptionAction.name,
                    dP:subscriptionAction.discountPer,
                    sF:subscriptionAction.scheduleFrequency,
                    sI:subscriptionAction.scheduleInterval,
                    sFN:subscriptionAction.scheduleFrequencyName,
                    tp:subscriptionType,
                    pu:editSubscriptionGroup.planUpdate,
                    ps:editSubscriptionGroup.plansState,
                    pr:editSubscriptionGroup.planRemove
                }

                const responseE = await fetch('https://app.easysubscription.io/api/ad/prod/sub/ed', {
                  method: 'POST', // Use POST method
                  headers: {
                    'Content-Type': 'application/json', // Set Content-Type header if sending JSON
                    'token-shop': tokenE || 'unknown token',
                  },
                  body: JSON.stringify(createSubGroupData)
                });

                if (responseE.ok) {
    
                  const responseEData = await responseE.json();
                  console.log(responseEData);
                  loaderOption(false);
                  //done();
          
                } else {
                  console.log('Handle error.');
                }  

            }
        }
    }

    //done();
  }, [getSessionToken, data, done, subscriptionType, subscriptionAction, editSubscriptionGroup, samePlan]);

  const cachedActions = useMemo(
    () => (
      <Actions onPrimary={onPrimaryAction} onClose={close} title="Save Group" />
    ),
    [onPrimaryAction, close]
  );

  useEffect(() => {

    const fetchData = async () => {

      const tokenS = await getSessionToken();

      const response = await fetch('https://app.easysubscription.io/api/ad/prod/sub/rem', {
        method: 'POST', // Use POST method
        headers: {
          'Content-Type': 'application/json', // Set Content-Type header if sending JSON
          'token-shop': tokenS || 'unknown token',
        },
        body: JSON.stringify(data)
      });
    
      // If the server responds with an OK status, then refresh the UI and close the modal
      if (response.ok) {

        const responseBody = await response.json();

        productDetailsOption(responseBody.product.data.product);
        groupDetailsOption(responseBody.group.data.sellingPlanGroup);
        if( responseBody.dtb[0].type ){
          subscriptionTypeOption(responseBody.dtb[0].type)
        }
        var sellingPlanGroup = responseBody.group.data.sellingPlanGroup;
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
        subscriptionActionOptions({...subscriptionAction, name:sellingPlanGroup.name, discount:discount, discountPer:discountPer, scheduleInterval:scheduleInterval, scheduleIntervalValue:scheduleIntervalValue , scheduleFrequency:scheduleFrequency, scheduleFrequencyName:scheduleFrequencyName, scheduleFrequencyIds:scheduleFrequencyIds});
        loaderOption(false);

      } else {
        console.log('Handle error.');
      }  

    };

    fetchData();

  }, [data]);

  function subscriptionTypeChage(e){
      subscriptionTypeOption(e);
  }

  function containsSpecialChars(str) {
      const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
      return specialChars.test(str);  
  }

  function subscriptionActionName(value){
    if( value == '' ){
        subscriptionActionOptions({...subscriptionAction, name:value, namereq:true, namespec:false });
    }else{
        if( containsSpecialChars(value) === true ){
            subscriptionActionOptions({...subscriptionAction, name:value, namereq:false, namespec:true });
        }else{
            subscriptionActionOptions({...subscriptionAction, name:value, namereq:false, namespec:false });
        }
    }
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


  const options = [
    {
      label: 'Days',
      value: 'DAY',
    },
    {
      label: 'Weeks',
      value: 'WEEK',
    },
    {
      label: 'Months',
      value: 'MONTH',
    },
  ];

  function objsize(obj) {
      var size = 0, key;
    
      for (key in obj) {
          if (obj.hasOwnProperty(key))
          size++;
      }
      return size;
  };

  return (
    <>
      {loader?<>
        <Spinner accessibilityLabel="Spinner example" size="large"/>
      </>:<>
        <BlockStack spacing="none">
          <TextBlock size="extraLarge">
            Edit a subscription group
          </TextBlock>
        </BlockStack>

        <Card
          title={`Group Name`}
          sectioned
        >
          <BlockStack spacing="loose">
            <TextField
              value={subscriptionAction.name}
              onChange={subscriptionActionName}
            />
            {subscriptionAction.namereq?<>
              <Text size="base" appearance="critical">Group name is required</Text>
            </>:<></>}
            {subscriptionAction.namespec?<>
              <Text size="base" appearance="critical">Special characters not allowed</Text>
            </>:<></>}
          </BlockStack>
        </Card>

        <Card
          title={`Subscription Plans`}
          sectioned
        >
          <BlockStack spacing="loose">
            <Text size="base">Set the name and billing rules for your subscription group</Text>
            {subscriptionAction.scheduleFrequency.map(function(object, i){
                var sellingPlanName = subscriptionAction.scheduleFrequencyName[i]; 
                var index = i;
                var planId = subscriptionAction.scheduleFrequencyIds[i];
                return(
                  <>
                    <InlineStack>
                        <TextField
                          type="text"
                          label="Name"
                          value={sellingPlanName}
                          onChange={(value) => {
                            var scheduleFrequencyNameArray = subscriptionAction.scheduleFrequencyName;
                            scheduleFrequencyNameArray[index]=value;
                            subscriptionActionOptions({...subscriptionAction, scheduleFrequencyName:scheduleFrequencyNameArray });
                            var planUpdate = editSubscriptionGroup.planUpdate;
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
                          }}
                        />
                        <TextField
                          type="number"
                          label="Order frequency"
                          value={object}
                          onChange={(value) => {
                            var scheduleFrequencyArrayValues = subscriptionAction.scheduleFrequency;
                            var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval;
                            var value = parseInt(value);
                            if( value > 1 ){
                                value = value;
                            }else{
                                value = 1;
                            }
                            scheduleFrequencyArrayValues[index]=value;
                            subscriptionActionOptions({...subscriptionAction, scheduleFrequency:scheduleFrequencyArrayValues });
                            var planUpdate = editSubscriptionGroup.planUpdate;
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
                            samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
                          }}
                        />
                        <Select
                          label="Select delivery frequency type"
                          options={options}
                          labelInline={false}
                          onChange={(value) => {
                            var scheduleIntervalArrayValues = subscriptionAction.scheduleInterval;
                            var scheduleIntervalValueArrayValues = subscriptionAction.scheduleIntervalValue;
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
                            var planUpdate = editSubscriptionGroup.planUpdate;
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
                            samePlanOption(toFindDuplicates(scheduleFrequencyArrayValues, scheduleIntervalArrayValues));
                          }}
                          value={subscriptionAction.scheduleInterval[i]}
                        />
                    </InlineStack>
                  </>
                );
            })}
            {samePlan?<>
              <Text size="base" appearance="critical">Every plan will have different Billing Rules</Text>
            </>:<></>}
          </BlockStack>
        </Card>

        <Card title="Discount" sectioned>
          <InlineStack>
            <TextField
              type="number"
              label="Percentage off (%)"
              value={subscriptionAction.discountPer}
              onChange={(value) => {
                var value = parseInt(value);
                if( value > 1 ){
                    value = value;
                }else{
                    value = 1;
                }
                subscriptionActionOptions({...subscriptionAction, discountPer:value});
              }}
            />
          </InlineStack>
        </Card>

        <Card title="Info:" sectioned>
          <Text size="base" appearance="critical">Changes will apply to the subscription group, and they will affect all the products present in this group.</Text>
        </Card>

        {cachedActions}
      </>}
    </>
  );
}

// Your extension must render all four modes
extend(
  'Admin::Product::SubscriptionPlan::Add',
  render(() => <Add />)
);
extend(
  'Admin::Product::SubscriptionPlan::Create',
  render(() => <Create />)
);
extend(
  'Admin::Product::SubscriptionPlan::Remove',
  render(() => <Remove />)
);
extend(
  'Admin::Product::SubscriptionPlan::Edit',
  render(() => <Edit />)
);