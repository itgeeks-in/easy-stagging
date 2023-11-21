import { useNavigate, NavLink } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, viewIcon, chevronRight, chevronLeft, searchIcon } from "../assets";
export default function Index() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  const fetch = useAuthenticatedFetch();
  const navigateTo = useNavigate();
  const [ toggleMenu, setToggleMenu ] = useState(true);
  const [ loadStart , loadStartOption ] = useState(false);
  const [ showApp, showAppOption ] = useState(true);
  const [ customerData , setCustomerData ] = useState(' ');
  const [ customerDataLoad , setCustomerDataLoad ] = useState(true);
  const [ pagination , setPagination ] = useState({'next':false,'prev':false});
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ totalPage, setTotalPage ] = useState(1);
  const [ onpage, setOnPage ] = useState(true);
  const activityContext = useContext(ItgContext);
  const [searchValue, setSearchValue] = useState("");
  useEffect(()=>{
    setOnPage(true);
    if(activityContext.activity !== ' '){
      if( activityContext.activity === 9 ){
        navigateTo('/noteligible');
      }else if ( activityContext.activity === 0 ){
        navigateTo('/welcome');
      } else if ( activityContext.activity === 1 ){
        navigateTo('/plans');
      } else if(activityContext.activity!=' ') {
        showAppOption(true);
        getCustomerData(searchValue,'',1);
        loadStartOption(false);
      }
    }else{
      loadStartOption(true);
    }
    return()=>{
      setOnPage(false);
    }
  },[activityContext]);
  
  useEffect(()=>{
    if( windowSize.current[0] < 776 ){
      setToggleMenu(!toggleMenu);
    }
  }, []);
  
  const toggle = () =>{
    setToggleMenu(!toggleMenu);
  }
  function getCustomerData(query,action,page){
    fetch('/api/easy-subscription/customer/data?query='+query+'&action='+action+"&page="+page).then((res)=>{
      //console.log(res); 
      if(res.ok){
        return res.json();
      }
      throw new error('something went wrong');
    }).then((data)=>{
      if(onpage){
        if(data.status){
          setCustomerDataLoad(false);
          setTotalPage(data.pages);
          setCustomerData(data.customers);
          setCurrentPage(data.page);
          setPagination({'next':data.next,'prev':data.prev});
        }else{
          console.log(data.error);
        }
      }
    }).catch((err)=>{
      setCustomerDataLoad(false);
      console.log(err);
    })
  }
  function changeSearchValue(e) {
    let target = e.target;
    let value = target.value;
    if (value == "") {
      setCustomerDataLoad(true);
      setSearchValue('');
      getCustomerData('','',1);
    }
    setSearchValue(value);
  }
  function searchData() {
    if (searchValue == "") {
        return;
    }
    setCustomerDataLoad(true);
    getCustomerData(searchValue,'','');
  }
  function customerDataReset(e){
    e.preventDefault();
    setCustomerDataLoad(true);
    setSearchValue('');
    getCustomerData('','',1);
  }
  function paginationPerform(e){
    let action = e.target.getAttribute('data-action');
    if( action != null & action != undefined){
      setCustomerDataLoad(true);
      getCustomerData(searchValue,action,currentPage);
    }
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
            <div className="itgSubscriptionCustomers">
              <div className="itgSubscriptionCustomersIn">
                <div className="itgSubscriptionCustomersHead">
                  <h5 className="itgSubscriptionCustomersInnerHead">Customers</h5>
                  {searchValue!=''?<button onClick={customerDataReset} className={false==false?"btn hide":"btn"}>Reset Search</button>:""}
                </div>
                <div className="itgCustomerDataTable">
                  {customerData.length>0?customerData==' '||customerDataLoad?
                    <>
                      <div className="itg-product-loader">
                        <img src={loaderIcon} alt=""/>
                      </div>
                    </>:
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
                    <div className="itgCustomerDataHeader">
                      <div className="itgCustomerDataTableBox">
                        <label>Customer</label>
                      </div>
                      <div className="itgCustomerDataTableBox">
                        <label>Email</label>
                      </div>
                      <div className="itgCustomerDataTableBox">
                        <label>Active Plan</label>
                      </div>
                      <div className="itgCustomerDataTableBox">
                        <label></label>
                      </div>
                    </div>
                    <div className="itgCustomerDataContent">
                     {customerData.map(function({id,customer_id,name,currency,email,shop,activePlans,total}){
                        var objectId = customer_id.replace("gid://shopify/Customer/", "");
                        let link = "https://admin.shopify.com/store/"+shop+"/customers/"+objectId;
                          return( 
                          <div key={id} data={id} className="itgCustomerContentRow">
                              <div className="itgCustomerDataTableBox">
                                  <span className="product-title">
                                    {name}
                                  </span>
                              </div>
                              <div className="itgCustomerDataTableBox">
                                  <span>{email}</span>
                              </div>
                              <div className="itgCustomerDataTableBox">
                                  <span>{activePlans}</span>
                              </div>
                              <div className="itgCustomerDataTableBox">
                                  <span className="itg-Customer-action">
                                  <NavLink to={link} target="_blank"><img src={viewIcon} alt=""/></NavLink>
                                  </span>
                              </div>
                          </div>
                          )
                      })}
                    </div>
                     <div className="itgCustomerDataPagination">
                      <button type="button" onClick={paginationPerform} disabled={!pagination.prev} data-action="prev" className={pagination.prev?"pagination-btn":"pagination-btn disable"}><img data-action="prev" src={chevronLeft} alt=""/></button>
                      <button type="button" onClick={paginationPerform} disabled={!pagination.next} data-action="next" className={pagination.next?"pagination-btn":"pagination-btn disable"}><img src={chevronRight} data-action="next" alt=""/></button> 
                    </div>
                    </>
                  :
                    customerDataLoad?
                      <>
                        <div className="itg-product-loader">
                          <img src={loaderIcon} alt=""/>
                        </div>
                      </>:
                    <div className="itgDataNorecordsParent">
                      <div className='itgDataNorecords'>
                        <div className="itgDataicon">
                          <img src={searchIcon} alt="" />
                        </div>
                          <h4>No Records Found  
                            {searchValue !== ''?<> For "{searchValue}" </>:""}
                          </h4>
                      </div>{searchValue !== ''?
                      <button type='button' onClick={customerDataReset}>Reset Search</button>:""}
                    </div>
                  }
                </div>
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
