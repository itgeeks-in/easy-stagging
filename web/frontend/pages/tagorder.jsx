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
    const [ isLoading, setIsLoading ] = useState(true);
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
            "/api/easy-subscription/settings/customerportal/update?data=" +
                JSON.stringify(dataChange)
        ).then((res) => res.json()).then((data) => console.log(data));
    }
    useAppQuery({
        url: "/api/easy-subscription/settings/ordertags",
        reactQueryOptions: {
            onSuccess: (data) => {
                console.log(data);
                /*
                if ( data.length > 0 ) {
                    setActivation({
                        ...activation,
                        enaletag:
                            data[0]["enaletag"]
                    });
                }
                */
                setIsLoading(false);

            },
        },
    });

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
                                Enable tag for all suscription orders
                            </p>
                        </div>
                        <div className={activation.pauseResumeSubscriptions?"notificationSections active":"notificationSections"}>
                            <div className="cont easycont">
                                <h6 className="sectionsHead">
                                    Enable this tag for all suscription orders.
                                </h6>
                                <input type="text" placeholder="Suscription tag" value={orderTag}/>
                                <p>Tag for any order that contains a subscription product</p>
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