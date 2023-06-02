import { useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, widget1, widget2, widget3, widget4, widget5, widget6 } from "../assets";
export default function NotificationSettings(){
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    const fetch = useAuthenticatedFetch();
    const navigateTo = useNavigate();
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const [ loadStart , loadStartOption ] = useState(true);
    const [ showApp, showAppOption ] = useState(true);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ easywidgetSettingValue, setEasywidgetSettingValue ] = useState('easywidgetSetting1');
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
                widgetMetaField('');
            }
        }
    },[activityContext])
    function widgetMetaField(field){
        loadStartOption(true);
        fetch('/api/easy-subscription/widgetsetting/product?widget='+field).then(res=>{ return res.json()}).then((data)=>{
            setEasywidgetSettingValue(data.data);
            loadStartOption(false);
        })
    }

    useEffect(()=>{
        if( windowSize.current[0] < 776 ){
          setToggleMenu(!toggleMenu);
        }
    }, []);

    const toggle = () =>{
        setToggleMenu(!toggleMenu);
    }
    function easywidgetSettingValuefun(e){
        let target = e.target;
        let value = target.getAttribute('value');
        console.log(value);
        setEasywidgetSettingValue(value);
        widgetMetaField(value);
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
                    <div className="widgetSetting">
                        <div className="widgetSettingHead">
                            <h5 >Notification settings</h5>
                            <p>Notifications are automatically sent out to either
                                the store owner or the customer.</p>
                        </div>
                        <div className="widgetSection">
                            <div className={easywidgetSettingValue == 'easywidgetSetting1'?'widgetSectionIn active':"widgetSectionIn"} onClick={easywidgetSettingValuefun} value="easywidgetSetting1">
                                <div className="widgetSectionInImg" value="easywidgetSetting1">
                                    <img src={widget1} alt="" value="easywidgetSetting1"/>
                                </div>
                                <div className="widgetSectionInContent" value="easywidgetSetting1">
                                    <div className={easywidgetSettingValue == 'easywidgetSetting1'?'easywidgetSetting active':"easywidgetSetting"} value="easywidgetSetting1"><span></span></div>
                                    <label value="easywidgetSetting1">Style One</label>
                                </div>
                            </div>
                            <div className={easywidgetSettingValue == 'easywidgetSetting2'?'widgetSectionIn active':"widgetSectionIn"} onClick={easywidgetSettingValuefun} value="easywidgetSetting2">
                                <div className="widgetSectionInImg" value="easywidgetSetting2">
                                    <img src={widget2} alt="" value="easywidgetSetting2"/>
                                </div>
                                <div className="widgetSectionInContent" value="easywidgetSetting2">
                                    <div className={easywidgetSettingValue == 'easywidgetSetting2'?'easywidgetSetting active':"easywidgetSetting"} value="easywidgetSetting2"><span></span></div>
                                    <label value="easywidgetSetting2">Style Second</label>
                                </div>
                            </div>
                            <div className={easywidgetSettingValue == 'easywidgetSetting3'?'widgetSectionIn active':"widgetSectionIn"} onClick={easywidgetSettingValuefun} value="easywidgetSetting3">
                                <div className="widgetSectionInImg" value="easywidgetSetting3">
                                    <img src={widget3} alt="" value="easywidgetSetting3"/>
                                </div>
                                <div className="widgetSectionInContent" value="easywidgetSetting3">
                                    <div className={easywidgetSettingValue == 'easywidgetSetting3'?'easywidgetSetting active':"easywidgetSetting"} value="easywidgetSetting3"><span></span></div>
                                    <label value="easywidgetSetting3">Style Third</label>
                                </div>
                            </div>
                            <div className={easywidgetSettingValue == 'easywidgetSetting4'?'widgetSectionIn active':"widgetSectionIn"} onClick={easywidgetSettingValuefun} value="easywidgetSetting4">
                                <div className="widgetSectionInImg" value="easywidgetSetting4">
                                    <img src={widget4} alt="" value="easywidgetSetting4"/>
                                </div>
                                <div className="widgetSectionInContent" value="easywidgetSetting4">
                                    <div className={easywidgetSettingValue == 'easywidgetSetting4'?'easywidgetSetting active':"easywidgetSetting"} value="easywidgetSetting4"><span></span></div>
                                    <label value="easywidgetSetting4">Style Fourth</label>
                                </div>
                            </div>
                            <div className={easywidgetSettingValue == 'easywidgetSetting5'?'widgetSectionIn active':"widgetSectionIn"} onClick={easywidgetSettingValuefun} value="easywidgetSetting5">
                                <div className="widgetSectionInImg" value="easywidgetSetting5">
                                    <img src={widget5} alt="" value="easywidgetSetting5"/>
                                </div>
                                <div className="widgetSectionInContent" value="easywidgetSetting5">
                                    <div className={easywidgetSettingValue == 'easywidgetSetting5'?'easywidgetSetting active':"easywidgetSetting"} value="easywidgetSetting5"><span></span></div>
                                    <label value="easywidgetSetting5">Style Fifth</label>
                                </div>
                            </div>
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