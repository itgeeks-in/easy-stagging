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
        pauseResumeSubscriptions: false,
        cancelSubscriptions: false,
        skipNextOrder: false,
    });
    function UpdateSetting(data) {
        fetch(
            "/api/easy-subscription/settings/customerportal/update?data=" +
                JSON.stringify(data)
        )
            .then((res) => res.json())
            .then((data) => console.log(data));
    }
    useAppQuery({
        url: "/api/easy-subscription/settings/customerportal",
        reactQueryOptions: {
            onSuccess: (data) => {
                if (data.length > 0) {
                    setActivation({
                        ...activation,
                        pauseResumeSubscriptions:
                            data[0]["pauseResumeSubscriptions"],
                        cancelSubscriptions: data[0]["cancelSubscriptions"],
                        skipNextOrder: data[0]["skipNextOrder"]
                    });
                    setIsLoading(false);
                }
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
                            <h5 className="innerHead">Customer portal</h5>
                            <p className="paragraph">
                                Select which features your customers have access to from
                                the customer portal.
                            </p>
                        </div>
                        <div className={activation.pauseResumeSubscriptions?"notificationSections active":"notificationSections"}>
                            <div className="cont">
                                <h6 className="sectionsHead">
                                    Customers can pause and resume their subscriptions
                                </h6>
                            </div>
                            <button
                                onClick={() => {
                                    let dataChange = {
                                        type: "pauseResumeSubscriptions",
                                        bool: !activation.pauseResumeSubscriptions,
                                    };
                                    UpdateSetting(dataChange);
                                    setActivation({
                                        ...activation,
                                        pauseResumeSubscriptions:
                                            !activation.pauseResumeSubscriptions,
                                    });
                                }}
                                className={
                                    activation.pauseResumeSubscriptions
                                        ? "btn active"
                                        : "btn"
                                }
                            >
                                {activation.pauseResumeSubscriptions
                                    ? "Disable"
                                    : "Enable"}
                            </button>
                        </div>
                        <div className={activation.cancelSubscriptions?"notificationSections active":"notificationSections"}>
                            <div className="cont">
                                <h6 className="sectionsHead">
                                    Customers can cancel their subscriptions
                                </h6>
                            </div>
                            <button
                                onClick={() => {
                                    let dataChange = {
                                        type: "cancelSubscriptions",
                                        bool: !activation.cancelSubscriptions,
                                    };
                                    UpdateSetting(dataChange);
                                    setActivation({
                                        ...activation,
                                        cancelSubscriptions:
                                            !activation.cancelSubscriptions,
                                    });
                                }}
                                className={
                                    activation.cancelSubscriptions
                                        ? "btn active"
                                        : "btn"
                                }
                            >
                                {activation.cancelSubscriptions ? "Disable" : "Enable"}
                            </button>
                        </div>
                        <div className={activation.skipNextOrder?"notificationSections active":"notificationSections"}>
                            <div className="cont">
                                <h6 className="sectionsHead">
                                    Customers can skip their next order
                                </h6>
                            </div>
                            <button
                                onClick={() => {
                                    let dataChange = {
                                        type: "skipNextOrder",
                                        bool: !activation.skipNextOrder,
                                    };
                                    UpdateSetting(dataChange);
                                    setActivation({
                                        ...activation,
                                        skipNextOrder: !activation.skipNextOrder,
                                    });
                                }}
                                className={
                                    activation.skipNextOrder ? "btn active" : "btn"
                                }
                            >
                                {activation.skipNextOrder ? "Disable" : "Enable"}
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