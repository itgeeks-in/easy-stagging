import { useNavigate } from 'react-router-dom';
import { useState, useContext, useEffect, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import ItgContext from '../context/activityState.jsx';
import { loaderIcon, selectIcon } from "../assets";
export default function NotificationSettings(){
    const windowSize = useRef([window.innerWidth, window.innerHeight]);
    const fetch = useAuthenticatedFetch();
    const navigateTo = useNavigate();
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const [ loadStart , loadStartOption ] = useState(false);
    const [ showApp, showAppOption ] = useState(true);
    const [ isLoading, setIsLoading ] = useState(true);
    const [cstmSlctOptionsType, setCstmSlctOptionsType] = useState(false);
    const [selectedTextType, setSelectedTextType] = useState("ALL");
    const [selectedValueType, setSelectedValueType] = useState(" ");

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
        ).then((res) => res.json()).then((data) => {});
    }

    
  function customSelectType() {
    setCstmSlctOptionsType(!cstmSlctOptionsType);
  }
  
  function selectTypeValue(e) {
    let target = e.target;
    let innerText = target.innerText;
    let value = target.getAttribute("value");
    setSelectedTextType(innerText);
    setSelectedValueType(value);
    setCstmSlctOptionsType(!cstmSlctOptionsType);
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
                            <h5 className="innerHead">Dunning Management</h5>
                            <p className="paragraph">
                                Address incidents of card expiration, or anything else that would result in involuntary churn of customers
                            </p>
                        </div>
                        <div class="notificationSections">
                            <div class="notificationManagecont">
                                <div class="cont">
                                    <h6>Dunning Management Setting</h6>
                                    <p>Sent to customers when subscription order is confirmed.</p>
                                    <div className="itgCustomSelectParentDunningBlock">
                                        <div className="itgCustomSelectParent">
                                            <h3>Type</h3>
                                            <div className="itg-custom-select">
                                                <div onClick={customSelectType} className="custom-select-selected">
                                                    <div id="selectedValue"><span>{selectedTextType}</span></div>
                                                    <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                                                </div>
                                                <ul className={ cstmSlctOptionsType ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                                                    <li onClick={selectTypeValue} value=" ">All</li>
                                                    <li onClick={selectTypeValue} value="DAY">DAY</li>
                                                    <li onClick={selectTypeValue} value="WEEK">WEEK</li>
                                                    <li onClick={selectTypeValue} value="MONTH">MONTH</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="itgCustomSelectParent">
                                            <h3>Type</h3>
                                            <div className="itg-custom-select">
                                                <div onClick={customSelectType} className="custom-select-selected">
                                                    <div id="selectedValue"><span>{selectedTextType}</span></div>
                                                    <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                                                </div>
                                                <ul className={ cstmSlctOptionsType ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                                                    <li onClick={selectTypeValue} value=" ">All</li>
                                                    <li onClick={selectTypeValue} value="DAY">DAY</li>
                                                    <li onClick={selectTypeValue} value="WEEK">WEEK</li>
                                                    <li onClick={selectTypeValue} value="MONTH">MONTH</li>
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="itgCustomSelectParent">
                                            <h3>Type</h3>
                                            <div className="itg-custom-select">
                                                <div onClick={customSelectType} className="custom-select-selected">
                                                    <div id="selectedValue"><span>{selectedTextType}</span></div>
                                                    <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                                                </div>
                                                <ul className={ cstmSlctOptionsType ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                                                    <li onClick={selectTypeValue} value=" ">All</li>
                                                    <li onClick={selectTypeValue} value="DAY">DAY</li>
                                                    <li onClick={selectTypeValue} value="WEEK">WEEK</li>
                                                    <li onClick={selectTypeValue} value="MONTH">MONTH</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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