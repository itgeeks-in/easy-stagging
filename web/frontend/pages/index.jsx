import { useNavigate, NavLink } from 'react-router-dom';
import { useState,useContext, useEffect, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, customizeIcon, subscriptionGroupIcon,managesubscriptionIcon, selectIcon } from "../assets";
export default function Index() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  const fetch = useAuthenticatedFetch();
  const navigateTo = useNavigate();
  const [ toggleMenu, setToggleMenu ] = useState(true);
  const [ checkMobile, setCheckMobile ] = useState(false);
  const [ loadStart , loadStartOption ] = useState(false);
  const [ showApp, showAppOption ] = useState(true);
  const [ onpage, setOnPage ] = useState(true);
  const [ indexData , setIndexData ] = useState(' ');
  const activityContext = useContext(ItgContext);
  const [selectedValueInterval, setSelectedValueInterval] = useState("WEEK");
  const [selectedTextInterval, setSelectedTextInterval] = useState("WEEK");
  const [cstmSlctOptionsTypeInterval, setCstmSlctOptionsTypeInterval] = useState(false);
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
        StatisticsData('WEEK');
        loadStartOption(false);
      }
    }else{
      loadStartOption(true);
    }
    return () => {  
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
  function StatisticsData(interval){
    fetch('/api/index/data?interval='+interval).then((res)=>{
      if(res.ok){
        return res.json();
      }
      throw new error('something went wrong');
    }).then((data)=>{
      if(onpage){
        setIndexData(data);
      }
    }).catch((err)=>{
      console.log(err);
    })
  }
  function resetFilter(){
    setIndexData(' ');
    setSelectedTextInterval('WEEK');
    setSelectedValueInterval('WEEK');
    StatisticsData('WEEK');
  }
  function customSelectInterval() {
    setCstmSlctOptionsTypeInterval(!cstmSlctOptionsTypeInterval);
  }
  function selectIntervalValue(e) {
    setIndexData(' ');
    let target = e.target;
    let innerText = target.innerText;
    let value = target.getAttribute("value");
    if(value!=undefined){
      setSelectedTextInterval(innerText);
      setSelectedValueInterval(value);
      setCstmSlctOptionsTypeInterval(!cstmSlctOptionsTypeInterval);
      StatisticsData(value);
    }else{
      StatisticsData('WEEK');
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
            <div className='app_index'>
              <div className='app_index_in'>
                <div className="app_index_in_head">
                  <h5 className='app_index_in_innerHead'>Dunning Statistics</h5>
                  <div className="itgSubscriptionsFilter">
                    {selectedValueInterval !== 'WEEK'?<>
                          <button type='button' onClick={resetFilter}>Reset Filter</button>
                    </>:""}
                    <div className="itgCustomSelectParent">
                      <h3>Interval</h3>
                      <div className="itg-custom-select">
                        <div onClick={customSelectInterval} className="custom-select-selected">
                          <div id="selectedValue"><span>{selectedTextInterval}</span></div>
                          <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                        </div>
                        <ul className={ cstmSlctOptionsTypeInterval ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                          <li onClick={selectIntervalValue} value="1 DAY">DAY</li>
                          <li onClick={selectIntervalValue} value="WEEK">WEEK</li>
                          <li onClick={selectIntervalValue} value="1 MONTH">1 MONTH</li>
                          <li onClick={selectIntervalValue} value="3 MONTH">3 MONTH</li>
                          <li onClick={selectIntervalValue} value="6 MONTH">6 MONTH</li>
                          <li onClick={selectIntervalValue} value="9 MONTH">9 MONTH</li>
                          <li onClick={selectIntervalValue} value="1 YEAR">1 YEAR</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='app_index_in_row'>
                  <div className='app_index_in_coloumn'>
                    {indexData == " " ?
                        <div className="itg-product-loader">
                            <div>
                                <img
                                    src={loaderIcon}
                                    alt="loading...."
                                />
                            </div>
                        </div>:
                        <>
                          <span className='app_index_in_linksstyle'>Orders</span>
                          <span className='app_index_in_count'>{indexData.count}</span>
                          <span className='app_index_in_timeline'>LAST {selectedValueInterval}</span>
                        </>
                    }
                    
                  </div>
                  <div className='app_index_in_coloumn'>
                    {indexData == " " ?
                      <div className="itg-product-loader">
                          <div>
                              <img
                                  src={loaderIcon}
                                  alt="loading...."
                              />
                          </div>
                      </div>:
                      <>
                        <span className='app_index_in_linksstyle'>Sales</span>
                        <span className='app_index_in_count'>{indexData.currency} {indexData.totalsumBefore.toFixed(2)}</span>
                        <span className='app_index_in_timeline'>LAST {selectedValueInterval}</span>
                      </>
                    }
                  </div>
                  <div className='app_index_in_coloumn'>
                    {indexData == " " ?
                      <div className="itg-product-loader">
                          <div>
                              <img
                                  src={loaderIcon}
                                  alt="loading...."
                              />
                          </div>
                      </div>:
                      <>
                        <span className='app_index_in_linksstyle'>Upcoming sales</span>
                        <span className='app_index_in_count'>{indexData.currency} {indexData.totalsumAfter.toFixed(2)}</span>
                        <span className='app_index_in_timeline'>NEXT {selectedValueInterval}</span>
                      </>
                    }
                  </div>
                </div>
                <div className='app_index_in_subscriptionrow '>
                  <div className='app_index_in_icon'>
                    <img src={subscriptionGroupIcon} alt="Group" />
                  </div>
                  <div className='app_index_in_details'>
                    <div>
                      <h5>Create subscription group</h5>
                      <p>Add subscription selling plans to your products by creating a subscription rule.</p>
                    </div>
                    <div>
                    <NavLink className="btn" to="/subscriptiongroup">Create subscription group</NavLink>
                    </div>
                  </div>
                </div>
                <div className='app_index_in_subscriptionrow '>
                  <div className='app_index_in_icon'>
                    <img src={customizeIcon} alt="Group" />
                  </div>
                  <div className='app_index_in_details'>
                    <div>
                      <h5>Customise your subscription widget</h5>
                      <p>Make it your own! Create your customized look for the subscription.</p>
                    </div>
                    <div>
                    <NavLink className="btn" to="/WidgetSetting">Customize your widget</NavLink>
                    </div>
                  </div>
                </div>
                <div className='app_index_in_subscriptionrow '>
                  <div className='app_index_in_icon'>
                    <img src={managesubscriptionIcon} alt="Group" />
                  </div>
                  <div className='app_index_in_details'>
                    <div>
                      <h5>Manage subscriptions</h5>
                      <p>You can view and manage all the created subscriptions from your subscriptions page.</p>
                    </div>
                    <div>
                      <NavLink className="btn" to="/groups">Manage subscriptions</NavLink>
                    </div>
                  </div>
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
