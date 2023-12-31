import { useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon } from "../assets";
export default function NotificationSettings(){
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    const fetch = useAuthenticatedFetch();
    const navigateTo = useNavigate();
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const [ loadStart , loadStartOption ] = useState(false);
    const [ showApp, showAppOption ] = useState(true);
    const [ showSuccess, setShowSuccess ] = useState(false);
    const [ isLoading, setIsLoading ] = useState(true);
    const [ saveButton, setSaveButton ] = useState("Save");
    const [ orderTag, setOrderTag ] = useState("easysubscription");
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

    const [activation, setActivation] = useState({
        enaletag: false,
    });

    function UpdateSetting(data) {
        let dataChange = {
            tagvalue: orderTag,
            tagenable: data
        };
        fetch(
            "/api/easy-subscription/settings/ordertags/update?data=" +
                JSON.stringify(dataChange)
        ).then((res) => res.json()).then((data) => {
            setSaveButton("Save");
            setShowSuccess(true);
            setIsLoading(false);
            setTimeout(function(){
                setShowSuccess(false);
            }, 5000);
        });
    }

    useAppQuery({
        url: "/api/easy-subscription/settings/ordertags",
        reactQueryOptions: {
            onSuccess:(data) => {
                if( data.length > 0 ) {
                    if( data[0]["ordertag"] == '1' || data[0]["ordertag"] == 'true' ){
                        setActivation({...activation, enaletag:true });
                    }else{
                        setActivation({...activation, enaletag:false });
                    }
                    if( data[0]["ordertagvalue"] != '' && data[0]["ordertagvalue"] != null ){
                       setOrderTag(data[0]["ordertagvalue"]);
                    }
                }
                setIsLoading(false);
            },
        },
    });
    
    function orderTagChange(e) {
        let target = e.target;
        let value = target.value;
        if (value != "") {
            setOrderTag(value);
        }
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
                        {isLoading ? (
                            <div className="itg-main-loader active">
                                <img src={loaderIcon} alt=""/>
                            </div>
                        ) :<>
                        <div className="notificationSettingHead">
                            <h5 className="innerHead">Order Tags</h5>
                            <p className="paragraph">
                                Enable tag for all Subscription orders
                            </p>
                        </div>
                        <div className={activation.enaletag?"notificationSections active":"notificationSections"}>
                            <div className="cont easycont">
                                <h6 className="sectionsHead">
                                    Enable this tag for all Subscription orders.
                                </h6>
                                <input type="text" placeholder="Suscription tag" value={orderTag} onChange={orderTagChange}/>
                                <p>Tag for any order that contains a subscription product</p>
                                <button type="button" onClick={() => {
                                    UpdateSetting(activation.enaletag);
                                    setSaveButton("Saving...");
                                    setIsLoading(true);
                                }}>{saveButton}</button>
                                {showSuccess?<>
                                    <div class="itgDashboardAction">Order tag is saved successfully.</div>
                                </>:<></>}
                            </div>
                            <button
                                onClick={() => {
                                    UpdateSetting(!activation.enaletag);
                                    setActivation({
                                        ...activation,
                                        enaletag:
                                            !activation.enaletag,
                                    });
                                }}
                                className={
                                    activation.enaletag
                                        ? "btn active"
                                        : "btn"
                                }>
                                {activation.enaletag
                                    ? "Disable"
                                    : "Enable"}
                            </button>
                        </div>
                        </>}
                    </div>
                </div>
            </div>       
            </>:<>
                <div className="itg-main-loader active"> <img src={loaderIcon} alt=""/> </div>
            </>}
        </>
    
)
}