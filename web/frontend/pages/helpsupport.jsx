import { useNavigate, NavLink } from 'react-router-dom';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, editIcon, settingsIcon, bellIcon, messageIcon, videoIcon, mailIcon, bookOpen } from "../assets";
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
                                <h5 className="itgSubscriptionCustomersInnerHead">Support</h5>
                            </div>
                            <a href="https://calendly.com/support-hiq/support" target="_blank" className="settingOptions" >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={messageIcon} alt="general" />
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
                            </a>
                            <a href="https://easysubscription.io/help-doc/" target="_blank" className="settingOptions" >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={bookOpen} alt="general" />
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
                            </a>
                            {/*
                            <div className="settingOptions" onClick={() => { navigateTo("/WidgetSetting"); }} >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={videoIcon} alt="general" />
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
                            */}
                            <a href="https://easysubscription.io/contact-us/" target="_blank" className="settingOptions" >
                                <div className="settingsOptionIconBack">
                                    <div className="settingsOptionIcon">
                                        <img src={mailIcon} alt="general" />
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
                            </a>
                        </div>
                    </div>
                </div>
            </div></>:""}
        </>
    )
}