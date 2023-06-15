import { useNavigate,NavLink } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import ItgContext from '../context/activityState.jsx';
import { Sidebar, Topbar } from '../components';
import { loaderIcon, searchIcon, viewIcon, chevronRight, chevronLeft,selectIcon } from "../assets";

export default function Groups() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  const navigateTo = useNavigate();
  const fetch = useAuthenticatedFetch();
  const [ toggleMenu, setToggleMenu ] = useState(true);
  const [ loadStart , loadStartOption ] = useState(false);
  const [ allowRetry , setAllowRetry ] = useState(false);
  const [ showApp, showAppOption ] = useState(true);
  const [ getsubscription, getsubscriptionOptions ] = useState({ data: {}, loading:true, deleteid:0, deletedid:0 });
  const [ currentSubscription, currentSubscriptionOption ] = useState({ id: "", customer:"" });
  const [ totalPage, setTotalPage ] = useState(0);
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ subscriptionFilter, subscriptionFilterOptions ] = useState({ hasNextPage:false, hasPreviousPage:false, query:'',page:'', action:'' });

  const queryParameters = new URLSearchParams(window.location.search);
  const subscriptionId = queryParameters.get("id");
  const customerId = queryParameters.get("customer_id");

  const [showCustomerDetails,setShowCustomerDetails] = useState(false);
  const [showCustomerDetailsData,setShowCustomerDetailsData] = useState({});
  const [ customerLoader, setCustomerLoader ] = useState(true);
  const [showOrderDetails,setShowOrderDetails] = useState(false);
  const activityContext = useContext(ItgContext); 
  const [selectedValueStatus, setSelectedValueStatus] = useState(" ");
  const [selectedValueType, setSelectedValueType] = useState(" ");
  const [selectedTextStatus, setSelectedTextStatus] = useState("ALL");
  const [selectedTextType, setSelectedTextType] = useState("ALL");
  const [cstmSlctOptionsType, setCstmSlctOptionsType] = useState(false);
  const [cstmSlctOptionsStatus, setCstmSlctOptionsStatus] = useState(false);
  const [ changeStatus, setChangeStatus ] = useState(false); 
  const [searchValue, setSearchValue] = useState("");
  const [ onpage, setOnPage ] = useState(true);
  useEffect(()=>{
    if(subscriptionId != null && subscriptionId != '' && customerId != null && customerId != ''){
      setShowCustomerDetails(true);
      setCustomerLoader(true);
      viewSubscriptionDataFetch();
    }else{
      setShowCustomerDetails(false);
    }
  },[subscriptionId])
  function getSubGroupTriggerFunc(status,type,query, action ){
      getsubscriptionOptions({...getsubscription, loading:true });
      const getSubGroupData = {
        query:query,
        action:action,
        status:status,
        type:type,
        page:currentPage,
        id:subscriptionId,
        customerId:customerId
      }
      let currpage = currentPage;
      if(action=='next'){
        currpage = currentPage+1;
      }else if(action=='prev'){
        currpage = currentPage-1;
      }
      const response = fetch('/api/getsubscriptions', {
          method: 'POST',
          body: JSON.stringify(getSubGroupData),
          headers: {
              'Content-type': 'application/json; charset=UTF-8',
          },
      }).then((res) => res.json()).then((response) => {
        if(onpage){
          setTotalPage(response.pages);
          setCurrentPage(response.page);
          if(currpage == response.pages){
            var hasNextPage = false;
          }else if(currpage < response.pages){
            var hasNextPage = true;
          }
          if(currpage <= 1){
            var hasPreviousPage= false;
          }else{
            var hasPreviousPage= true;
          }
          subscriptionFilterOptions({...subscriptionFilter,query:query, hasNextPage:hasNextPage, hasPreviousPage:hasPreviousPage});
          getsubscriptionOptions({...getsubscription, data:response, loading:false});
        }
      })
      .catch((err) => {
          console.log(err.message);
      });
  }
  useEffect(()=>{
    setOnPage(true);
    if(activityContext.activity !== ' '){
      if( activityContext.activity === 9 ){
        navigateTo('/noteligible');
      }else if ( activityContext.activity === 0 ){
        navigateTo('/welcome');
      } else if ( activityContext.activity === 1 ){
        navigateTo('/plans');
      } else if(activityContext.activity!==' ') {
        if(!showCustomerDetails) {
          getSubGroupTriggerFunc('','',subscriptionFilter.query, subscriptionFilter.action);
        }
        showAppOption(true);
        loadStartOption(false);
      }
    }else{
      loadStartOption(true);
    }
    return ()=>{
      setOnPage(false);
    }
  },[activityContext])
  useEffect(()=>{
    getSubGroupTriggerFunc('','',subscriptionFilter.query, subscriptionFilter.action);
  },[showCustomerDetailsData.status]);
  useEffect(()=>{
    if( windowSize.current[0] < 776 ){
      setToggleMenu(!toggleMenu);
    }
  }, []);
  const toggle = () =>{
    setToggleMenu(!toggleMenu);
  }

  function paginationPrevPerform(e){
    var action = 'prev';
    if( subscriptionFilter.hasPreviousPage ){
      getSubGroupTriggerFunc(selectedValueStatus,selectedValueType,subscriptionFilter.query, 'prev');
    }
  }

  function paginationNextPerform(e){
    var action = 'next';
    if( subscriptionFilter.hasNextPage ){
      getSubGroupTriggerFunc(selectedValueStatus,selectedValueType,subscriptionFilter.query, 'next');
    }
  }

  function viewSubscription(e){
    var targetElement = e.target;
    var customer_id = targetElement.getAttribute('data-customer');
    var subscription_id = targetElement.getAttribute('data-id');
    navigateTo('/subscriptions?customer_id='+customer_id+'&id='+subscription_id);
  }

  function viewSubscriptionDataFetch(){
    setShowOrderDetails(false);
    fetch('/api/getsubscription?customer_id='+customerId+'&id='+subscriptionId)
    .then((res) => {
      if (res.ok) {
          return res.json();
      }
      throw new Error("Something went wrong");
    }).then((response) => {
      if(Object.keys(response).length !== 0){
        setShowCustomerDetailsData(response);
      }else{
        setShowCustomerDetails(false);
      }
      setCustomerLoader(false);
    })
    .catch((err)=>{
      console.warn(err);
      setShowCustomerDetails(false);
      setCustomerLoader(false);
    })
  }
  function selectTypeValue(e) {
    let target = e.target;
    let innerText = target.innerText;
    let value = target.getAttribute("value");
    setSelectedTextType(innerText);
    setSelectedValueType(value);
    setCstmSlctOptionsType(!cstmSlctOptionsType);
    getSubGroupTriggerFunc(selectedValueStatus,value,'', '');
  }
  function customSelectType() {
    setCstmSlctOptionsType(!cstmSlctOptionsType);
  }
  function selectStatusValue(e) {
    let target = e.target;
    let innerText = target.innerText;
    let value = target.getAttribute("value");
    setSelectedTextStatus(innerText);
    setSelectedValueStatus(value);
    setCstmSlctOptionsStatus(!cstmSlctOptionsStatus);
    getSubGroupTriggerFunc(value,selectedValueType,'', '');
  }
  function customSelectStatus() {
      setCstmSlctOptionsStatus(!cstmSlctOptionsStatus);
  }
  function resetFilter(){
    setSelectedTextType('ALL');
    setSelectedTextStatus('ALL');
    setSelectedValueType(' ');
    setSelectedValueStatus(' ');
    getSubGroupTriggerFunc('','','', '');
    orderDataReset();
  }
  function changeSubscriptionStatus(e){
    let target = e.target;
    let value = target.value;
    if( value == 'PAUSED' || value == 'CANCELLED' || value == 'ACTIVE' ){
      setChangeStatus(true);
      if(subscriptionId != null && subscriptionId != ''){
        fetch('/api/subscriptionContract/update/status?id='+subscriptionId+"&status="+value).then((res)=>{
          if(res.ok){
            return res.json();
          }
          throw new Error('something went wrong');
        }).then((data)=>{
          if(data){
            setShowCustomerDetailsData({...showCustomerDetailsData,status:value});
            setChangeStatus(false);
          }else{
            setChangeStatus(false);
          }
        }).catch((err)=>{
          console.warn(err);
          setChangeStatus(false);
        })
      }
    }
  }
  function skipSubscription(){
    setChangeStatus(true);
    if(subscriptionId != null && subscriptionId != ''){
      fetch('/api/subscriptionContract/update/skip?id='+subscriptionId).then((res)=>{
        if(res.ok){
          return res.json();
        }
        throw new Error('something went wrong');
      }).then((data)=>{
        if(data.status){
          setShowCustomerDetailsData({...showCustomerDetailsData,nextBillingDate:data.nextBillingDate});
          setChangeStatus(false);
        }else{
          setChangeStatus(false);
        }
      }).catch((err)=>{
        console.warn(err);
        setChangeStatus(false);
      })
    }
  }
  function retrySubscription(e){
    let target = e.target;
    let value = target.value;
    setChangeStatus(true);
   // console.log(e.target.value);
    fetch('/api/subscriptionContract/retry?nextactionurl='+value+'&id='+subscriptionId).then((res)=>{
      if(res.ok){
        return res.json();
      }
      throw new Error('something went wrong');
    }).then((data)=>{
      if(data.status){
        setShowCustomerDetailsData({...showCustomerDetailsData,pendingSubscriptionId:''});
        setChangeStatus(false);
      }else{
        setChangeStatus(false);
      }
    }).catch((err)=>{
      console.warn(err);
      setChangeStatus(false);
    })
    //console.log('skip');
  }
  function changeSearchValue(e) {
    let target = e.target;
    let value = target.value;
    if (value == "") {
        orderDataReset();
    }
    setSearchValue(value);
  }
  function searchData() {
    if (searchValue == "") {
        return;
    }
    subscriptionFilterOptions({...subscriptionFilter, query:{'searchValue':searchValue}});
    getSubGroupTriggerFunc('','',{'searchValue':searchValue}, subscriptionFilter.action);
  }
  function orderDataReset() {
    setSearchValue('');
    subscriptionFilterOptions({...subscriptionFilter, query:''});
    getSubGroupTriggerFunc('','','', subscriptionFilter.action);
  }
  return (
    <>
      {showApp?<>
        {loadStart?<>
          <div className="itg-main-loader active">
              <img src={loaderIcon} alt=""/>
          </div>
        </>:<></>}
        <div className="itgDashboardPage">
          <Sidebar toggle={toggle} togglemenu={toggleMenu}/>
          <div className={toggleMenu?"itgDashboardPageContent":"itgDashboardPageContent full"}>
            <Topbar toggle={toggle}/>
            <div className="itgDashboardPageContentInner">
              <div className="itgDashboardPageContentTitle">
                <h5 className="title">Orders {customerId!=null&&subscriptionId!=null?"Details":""} {subscriptionId!=null?<>#{subscriptionId}</>:<></>}</h5>
                {showCustomerDetails?<NavLink to="/subscriptions" className="link-btn">Back</NavLink>:
                  <>
                    <div className="itgSubscriptionsFilter">
                      {selectedValueStatus !== ' ' || selectedValueType !== ' ' || (subscriptionFilter.query !='' && subscriptionFilter.query !=undefined)?<>
                            <button type='button' onClick={resetFilter}>Reset Filter</button>
                      </>:""}
                      <div className="itgCustomSelectParent">
                        <h3>Type</h3>
                        <div className="itg-custom-select">
                          <div onClick={customSelectType} className="custom-select-selected">
                            <div id="selectedValue"><span>{selectedTextType}</span></div>
                            <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                          </div>
                          <ul className={ cstmSlctOptionsType ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                            <li onClick={selectTypeValue} value=" ">All</li>
                            <li onClick={selectTypeValue} value="DAY">DAY</li>
                            <li onClick={selectTypeValue} value="WEEK">WEEK</li>
                            <li onClick={selectTypeValue} value="MONTH">MONTH</li>
                          </ul>
                        </div>
                      </div>
                      <div className="itgCustomSelectParent">
                        <h3>Status</h3>
                        <div className="itg-custom-select">
                          <div onClick={customSelectStatus} className="custom-select-selected">
                            <div id="selectedValue"><span>{selectedTextStatus}</span></div>
                            <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                          </div>
                          <ul className={ cstmSlctOptionsStatus ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                            <li onClick={selectStatusValue} value=" ">ALL</li>
                            <li onClick={selectStatusValue} value="ACTIVE">ACTIVE</li>
                            <li onClick={selectStatusValue} value="CANCELLED">CANCELLED</li>
                            <li onClick={selectStatusValue} value="EXPIRED">EXPIRED</li>
                            <li onClick={selectStatusValue} value="FAILED">FAILED</li>
                            <li onClick={selectStatusValue} value="PAUSED">PAUSED</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                }
              </div>
              { !showCustomerDetails?
              <div className="itgAddSubGroupData">
                { getsubscription.loading ? 
                  <>
                    {loadStart?<></>:<>
                      <div className="itg-product-loader">
                        <img src={loaderIcon} alt=""/>
                      </div>
                    </>}
                  </>
                : 
                  <>
                    <div className="itgOrderSearch">
                      <div className="itgOrderSearchInput">
                        <input type="text" placeholder="Search by name, email, order" value={searchValue} onChange={changeSearchValue} name="search" />
                        <div className="itgOrderSearchButton">
                          <button onClick={searchData} type="button" className="btn primary-btn">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="18" 
                              height="18" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="feather feather-search">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                   { !showCustomerDetails && getsubscription.data.records.length > 0 ? <>
                    <div className="itgAddSubGroupDataTable subscriptionsTable">
                      <div className="itgAddSubGroupDataHeader">
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Subscription</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Customer</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Date</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Type</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Status</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label></label>
                        </div>
                      </div>
                      <div className="itgAddSubGroupDataContent">
                        {getsubscription.data.records.map(function({subId,name,order_name,email,created_at,intervalCount,interval,status}){
                            var objectId = subId.replace("gid://shopify/SubscriptionContract/", "");
                            var statusClass = "status-tag stats"+status;
                            return(
                              <div key={objectId} className="itgAddSubGroupDataContentRow">
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span className="product-title">
                                        #{objectId}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span>
                                        <span className="name">{name}</span>
                                        <span className="email">{email}</span>
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span>
                                        {created_at}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span>
                                        <span className="intervalCount">Every {intervalCount} {interval}</span>
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span class={statusClass}>
                                        {status}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span className="itg-group-action">
                                        <button type="button" className="icon-btn-simple" data-id={objectId} data-customer={customerId} onClick={viewSubscription}>
                                          <img src={viewIcon} alt="" data-id={objectId} data-customer={customerId}/>
                                        </button>
                                      </span>
                                  </div>
                              </div>
                            );
                        })}
                      </div>
                      <div className="itgAddSubGroupDataPagination">
                        <button type="button" onClick={paginationPrevPerform} data-action="prev" className={subscriptionFilter.hasPreviousPage?"pagination-btn":"pagination-btn disable"}><img src={chevronLeft} alt=""/></button>
                        <button type="button" onClick={paginationNextPerform} data-action="next" className={subscriptionFilter.hasNextPage?"pagination-btn":"pagination-btn disable"}><img src={chevronRight} alt=""/></button>
                      </div>
                    </div>
                   </> : 
                   <>
                   <div className="itgDataNorecordsParent">
                    <div className='itgDataNorecords'>
                      <div className="itgDataicon">
                        <img src={searchIcon} alt="" />
                      </div>
                        <h4>No Records Found</h4>
                    </div> 
                    {selectedValueStatus !== ' ' || selectedValueType !== ' '?<>
                          <button type='button' onClick={resetFilter}>Reset Filter</button>
                    </>:""}
                   </div>
                  </>
                  }
                </> }
              </div>:""}
              <div>
                {showCustomerDetails?customerLoader?
                  <>
                    <div className="itg-product-loader">
                      <img src={loaderIcon} alt=""/>
                    </div>
                  </>:
                  <>
                  <div className="itgorderview">
                      <div className="itgCustomerOrderStatusParent">
                          {!changeStatus?<></>:<>
                            <div className="itgCustomerSubscriptionStatusLoader">
                              <div className="itg-product-loader">
                                <img src={loaderIcon} alt=""/>
                              </div>
                            </div>
                          </>}
                        <div className="itgCustomerSubscriptionStatus">
                          <h3 className={changeStatus?"itgCustomerSubscriptionStatusLowOp":""}>Status :<span className={'itgCustomerSubscriptionStatus'+showCustomerDetailsData.status}>{showCustomerDetailsData.status}</span></h3>
                          {showCustomerDetailsData.status=='ACTIVE'?<>
                            <div className="itgCustomerSubscriptionStatusbtns">
                              <button disabled={changeStatus} onClick={changeSubscriptionStatus} type='button' value='PAUSED'>Pause</button>
                              <button disabled={changeStatus} onClick={changeSubscriptionStatus} type='button' value='CANCELLED'>Cancle</button>
                            </div>
                          </>:showCustomerDetailsData.status=='CANCELLED'?
                            <div className="itgCustomerSubscriptionStatusbtns">
                              <button disabled={changeStatus} onClick={changeSubscriptionStatus} type='button' value='ACTIVE'>Active</button>
                            </div>:showCustomerDetailsData.status=='PAUSED'?<>
                            <div className="itgCustomerSubscriptionStatusbtns">
                              <button disabled={changeStatus} onClick={changeSubscriptionStatus} type='button' value='ACTIVE'>Resume</button>
                              <button disabled={changeStatus} onClick={changeSubscriptionStatus} type='button' value='CANCELLED'>Cancle</button>
                            </div>
                          </>:""}
                        </div>
                        {showCustomerDetailsData.status=='ACTIVE'?<>
                        <div className="itgCustomerOrdersNextOrder">
                          <h3 className={changeStatus?"itgCustomerSubscriptionStatusLowOp":""}>Next Order : {showCustomerDetailsData.nextBillingDate} {showCustomerDetailsData.total}</h3>
                          <div>
                          {allowRetry? <>
                            {showCustomerDetailsData.pendingSubscriptionId != ''?
                               <button style={{marginRight:"10px"}} disabled={changeStatus} type='button' onClick={retrySubscription} value={showCustomerDetailsData.nextActionUrl}>Retry Billing</button>
                            :""} </>
                          :""} 
                            <button disabled={changeStatus} type='button' onClick={skipSubscription}>Skip</button>
                          </div>
                        </div></>:""}
                      </div>
                      <div className="itgCustomerOrders">
                        {!showOrderDetails?
                        <div className="itgCustomerOrdersTable">
                          <div className="itgCustomerOrdersDataHeader">
                            <div className="itgCustomerOrdersHead">
                              <label>Order</label>
                            </div>
                            <div className="itgCustomerOrdersHead">
                              <label>Date</label>
                            </div>
                            <div className="itgCustomerOrdersHead">
                              <label>Total</label>
                            </div>
                            <div className="itgCustomerOrdersHead">
                              <label>Status</label>
                            </div>
                          </div>
                          <div className="itgCustomerOrdersDataContent">
                            {showCustomerDetailsData.orders.map(({id,name,createdAt,status,total})=>
                            {
                              var objectId = id.replace("gid://shopify/Order/", "");
                              let link = "https://admin.shopify.com/store/"+showCustomerDetailsData.shop+"/orders/"+objectId;
                              return(
                                <div key={id} className="itgCustomerOrdersDataContentRow">
                                    <div className="itgCustomerOrdersDataTableBox">
                                        <span>
                                          {name}
                                        </span>
                                    </div>
                                    <div className="itgCustomerOrdersDataTableBox">
                                        <span>
                                          {createdAt}
                                        </span>
                                    </div>
                                    <div className="itgCustomerOrdersDataTableBox">
                                        <span>
                                          {total}
                                        </span>
                                    </div>
                                    <div className="itgCustomerOrdersDataTableBox">
                                        <span>
                                          {status}
                                        </span>
                                    </div>
                                    <div className="itgCustomerOrdersDataTableBox">
                                        <span className="itg-group-action">
                                            <a href={link} target="_blank" rel="noopener noreferrer"><img src={viewIcon} alt="" /></a>
                                        </span>
                                    </div>
                                </div>
                              );
                            }
                            )}
                          </div>
                        </div>:""
                        }

                      </div>
                      
                      <div className="itgorderviewcustomerdetails">
                          <div className="itgorderviewcustomerdetailsIn">
                              <div>
                                  <div className="itgorderviewcustomerdetailsInHead">
                                      <h6>Customer</h6>
                                  </div>
                                  <div className="itgorderviewcustomerdetailsInCont customer">
                                      <p>{showCustomerDetailsData.customerDetails.displayName}</p>
                                      <p>{showCustomerDetailsData.customerDetails.email}</p>
                                      {/* <p className="link" onClick={customerRedirect}>View in Shopify</p> */}
                                  </div>
                              </div>
                          </div>
                          <div className="itgorderviewcustomerdetailsIn">
                              <div>
                                  <div className="itgorderviewcustomerdetailsInHead">
                                      <h6>Shipping Address</h6>
                                  </div>
                                  <div className="itgorderviewcustomerdetailsInCont address">
                                      <p>{showCustomerDetailsData.billingAddress.name}</p>
                                      <p>{showCustomerDetailsData.billingAddress.address2} {showCustomerDetailsData.billingAddress.city} {showCustomerDetailsData.billingAddress.province}, {showCustomerDetailsData.billingAddress.provinceCode} {showCustomerDetailsData.billingAddress.zip}</p>
                                      <p>{showCustomerDetailsData.billingAddress.country}</p>
                                  </div>
                              </div>
                          </div>
                          <div className="itgorderviewcustomerdetailsIn">
                              <div>
                                  <div className="itgorderviewcustomerdetailsInHead">
                                      <h6>Billing Address</h6>
                                  </div>
                                  <div className="itgorderviewcustomerdetailsInCont address">
                                  <p>{showCustomerDetailsData.shippingAddress.name}</p>
                                      <p>{showCustomerDetailsData.shippingAddress.address2} {showCustomerDetailsData.shippingAddress.city} {showCustomerDetailsData.shippingAddress.province}, {showCustomerDetailsData.shippingAddress.provinceCode} {showCustomerDetailsData.shippingAddress.zip}</p>
                                      <p>{showCustomerDetailsData.shippingAddress.country}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
                  </>
                  :""
                }
              </div>
            </div>
          </div>
        </div>
      </>:<>
          <div className="itg-main-loader active">
              <img src={loaderIcon} alt=""/>
          </div>
      </>}
    </>
  );
}
