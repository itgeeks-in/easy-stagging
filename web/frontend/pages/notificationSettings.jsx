import { useNavigate } from 'react-router-dom';
import { useState,useContext, useEffect, useRef } from 'react';
// import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, notificationEditIcon, } from "../assets";
export default function NotificationSettings(){
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    // const fetch = useAuthenticatedFetch();
    const navigateTo = useNavigate();
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const [ loadStart , loadStartOption ] = useState(false);
    const [ showApp, showAppOption ] = useState(true);
    const activityContext = useContext(ItgContext);
    useEffect(()=>{
        if(activityContext.activity !== ' '){
            if( activityContext.activity === 9 ){
            navigateTo('/noteligible');
            }else if ( activityContext.activity === 0 ){
            navigateTo('/welcome');
            } else if ( activityContext.activity === 1 ){
            navigateTo('/plans');
            } else if(activityContext.activity!=' ') {
            showAppOption(true);
            loadStartOption(false);
            }
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
    return(
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
                    <div className="notificationSetting">
                        <div className="notificationSettingHead">
                            <h5 >Notification settings</h5>
                            <p>Notifications are automatically sent out to either
                                the store owner or the customer.</p>
                        </div>
                        <div onClick={() => { navigateTo("/subscriptionactivation"); }} className="notificationSections">
                            <div className="notificationManagecont" >
                                <div className="cont">
                                    <h6>Subscription order Confirmation</h6>
                                    <p>Sent to customers when subscription order is confirmed.</p>
                                </div>
                            </div>
                            <div className="notificationHeadIcon"><img src={notificationEditIcon} alt="" /></div>
                        </div>
                        <div onClick={() => { navigateTo("/subscriptioncancel"); }} className="notificationSections">
                            <div className="notificationManagecont" >
                                <div className="cont">
                                    <h6> Subscription status change </h6>
                                    <p> Sent to customers when subscriptions status will change </p>
                                </div>
                            </div>
                            <div className="notificationHeadIcon"> <img src={notificationEditIcon} alt="" /> </div>
                        </div>
                        <div onClick={() => { navigateTo("/skipbilling"); }} className="notificationSections">
                            <div className="notificationManagecont" >
                                <div className="cont">
                                    <h6> Subscription recurring order skip </h6>
                                    <p> Sent to customers when their recurring order is skipped </p>
                                </div>
                            </div>
                            <div className="notificationHeadIcon"> <img src={notificationEditIcon} alt="" /> </div>
                        </div>
                    </div>
                </div>
                </div>       
            </>:<>
                <div className="itg-main-loader active"> <img src={loaderIcon} alt=""/> </div>
            </>}
        </>
        
    )
}