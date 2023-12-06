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

  const [planTitle, setPlanTitle] = useState('Current plan');
  const [percentageOff, setPercentageOff] = useState('10');
  const [deliveryFrequency, setDeliveryFrequency] = useState('1');

  const onPrimaryAction = useCallback(async () => {
    const token = await getSessionToken();

    // Here, send the form data to your app server to modify the selling plan.

    done();
  }, [getSessionToken, done]);

  const cachedActions = useMemo(
    () => (
      <Actions onPrimary={onPrimaryAction} onClose={close} title="Edit plan" />
    ),
    [onPrimaryAction, close]
  );



  const [ loader , loaderOption ] = useState(true);
  const [ groupDetails , groupDetailsOption ] = useState({});
  const [ productDetails , productDetailsOption ] = useState({});
  const [ subscriptionType , subscriptionTypeOption ] = useState('subscription-one-time');

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

  function subscriptionTypeChage(e){
      subscriptionTypeOption(e);
  }

  const options = [
    {
      label: 'Cool option',
      value: 'cool-option',
    },
    {
      label: 'Cooler option',
      value: 'cooler-option',
    },
    {
      label: 'Coolest option',
      value: 'coolest-option',
    },
  ];

  //console.log(groupDetails);

  //console.log(productDetails);

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
          <TextField
            value={groupDetails.name}
            onChange={setPlanTitle}
          />
        </Card>

        <Card
          title={`Subscription Type`}
          sectioned
        >
        
        <BlockStack spacing="none">
          <Radio
            label="One-time + Subscription"
            helpText="This gives option to your customers either to purchase the item as one time purchase or a recurring subscription."
            checked={subscriptionType=="subscription-one-time"}
            value="subscription-one-time"
            id="option1"
            name="subsciptionoptions"
            onChange={subscriptionTypeChage}
          />
          <Radio
            label="Subscription only"
            helpText="This gives option to your customers to purchase the item on recurring basis."
            id="option2"
            value="subscription-only"
            name="subsciptionoptions"
            checked={subscriptionType=="subscription-only"}
            onChange={subscriptionTypeChage}
          />
          </BlockStack>
        </Card>

        <Card
          title={`Subscription Plans`}
          sectioned
        >
          <BlockStack spacing="loose">
            <Text size="base">Set the name and billing rules for your subscription group</Text>
            <InlineStack>
              <TextField
                type="text"
                label="Name"
                value={deliveryFrequency}
                onChange={setDeliveryFrequency}
              />
              <TextField
                type="number"
                label="Order frequency"
                value={percentageOff}
                onChange={setPercentageOff}
              />
              <Select
                label="Select delivery frequency type"
                options={options}
                labelInline={false}
                onChange={(value) => console.log(value, 'was selected')}
                value="cooler-option"
              />
            </InlineStack>
          </BlockStack>
        </Card>

        <Card title="Discount" sectioned>
          <InlineStack>
            <TextField
              type="number"
              label="Offer discounts for the subscription product"
              value={deliveryFrequency}
              onChange={setDeliveryFrequency}
            />
          </InlineStack>
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