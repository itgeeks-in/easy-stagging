import { useNavigate, NavLink } from 'react-router-dom';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, editIcon, settingsIcon, bellIcon } from "../assets";
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
                                        Live Chat
                                    </h5>
                                    <p className="settingOptionContentDes">
                                       Connect with us through live chat for immediate support and personalized assistance.
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
                                        Help docs
                                    </h5>
                                    <p className="settingOptionContentDes">
                                        Access our comprehensive help documentation for clear instructions and valuable resources to resolve your queries.
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
                                        Video tutorials
                                    </h5>
                                    <p className="settingOptionContentDes">
                                        Explore our extensive library of video tutorials for step-by-step guidance and hands-on learning.
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
                                        Email Support
                                    </h5>
                                    <p className="settingOptionContentDes">
                                        Reach out to us via email for reliable and efficient support tailored to your needs.
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