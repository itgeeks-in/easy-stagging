import { useNavigate, NavLink } from 'react-router-dom';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, editIcon, settingsIcon, bellIcon, tagIcon, dunningIcon } from "../assets";
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { useContext, useEffect, useState, useRef } from 'react';
import { Sidebar, Topbar } from '../components';
export default function settings(){ 
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    const fetch = useAuthenticatedFetch();
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
        }else{
            loadStartOption(true);
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
                    <div className="itgSettingPage">
                        <div className="itgSettingPageIn">
                            <div className="itgSettingPageHead">
                                <h5 className="itgSubscriptionCustomersInnerHead">Settings</h5>
                            </div>
                            <div onClick={() => { navigateTo("/customerportal"); }} className="settingOptions" >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={settingsIcon} alt="general" />
                                    </div>
                                </div>
                                <div className="settingOptionContent">
                                    <h5 className="settingOptionContentHead">
                                        Customer Portal
                                    </h5>
                                    <p className="settingOptionContentDes">
                                    Choose the features that will be available to your customers through the customer portal
                                    </p>
                                </div>
                            </div>
                            <div onClick={() => { navigateTo("/dunning"); }} className="settingOptions" >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={dunningIcon} alt="general" />
                                    </div>
                                </div>
                                <div className="settingOptionContent">
                                    <h5 className="settingOptionContentHead">
                                        Dunning Management
                                    </h5>
                                    <p className="settingOptionContentDes">
                                        Address incidents of card expiration, or anything else that would result in involuntary churn of customers
                                    </p>
                                </div>
                            </div>
                            <div className="settingOptions" onClick={() => { navigateTo("/notificationSettings"); }} >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={bellIcon} alt="general" />
                                    </div>
                                </div>
                                <div className="settingOptionContent">
                                    <h5 className="settingOptionContentHead">
                                        Notifications
                                    </h5>
                                    <p className="settingOptionContentDes">
                                    Manage email notifications that are sent to you and your customers
                                    </p>
                                </div>
                            </div>
                            <div className="settingOptions" onClick={() => { navigateTo("/WidgetSetting"); }} >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={editIcon} alt="general" />
                                    </div>
                                </div>
                                <div className="settingOptionContent">
                                    <h5 className="settingOptionContentHead">
                                        Widget
                                    </h5>
                                    <p className="settingOptionContentDes">
                                    Select the subscription widget for the product page
                                    </p>
                                </div>
                            </div>

                            <div className="settingOptions" onClick={() => { navigateTo("/tagorder"); }} >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={tagIcon} alt="general" />
                                    </div>
                                </div>
                                <div className="settingOptionContent">
                                    <h5 className="settingOptionContentHead">
                                        Order Tags
                                    </h5>
                                    <p className="settingOptionContentDes">
                                    Include tags in subscription orders
                                    </p>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div></>:""}
        </>
    )
}