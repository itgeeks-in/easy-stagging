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
    const [selectedTextType, setSelectedTextType] = useState("Cancel Subscription");
    const [selectedValueType, setSelectedValueType] = useState("pause");
    const [retryDunning, retryDunningOption] = useState(1);
    const [retryAttempt, retryAttemptOption] = useState(4);
    const [updated, UpdatedData] = useState(false);

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

    async function UpdateSetting() {

        loadStartOption(true);
        
        var sendData = {
            retry:retryAttempt,
            daybefore:retryDunning,
            status:selectedValueType
        }
        const response = await fetch('/api/settings/dunning/update', {
            method: 'POST',
            body: JSON.stringify(sendData),
            headers: {
                'Content-type': 'application/json; charset=UTF-8',
            },
        }).then((res) => res.json()).then((response) => {
            UpdatedData(true);
            loadStartOption(false);
            setTimeout(function(){
                UpdatedData(false);
            },4000)
        })
        .catch((err) => {
            console.log(err.message);
        });

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

    function retryAttemptSetup(e){
        let target = e.target;
        var value = parseInt(target.value);
        if( value < 2 ){
            value = 1;
        }else if( value > 7 ){
            value = 7;
        }else{
            value = value;
        }
        retryAttemptOption(value);
    }

    function retryDunningSetup(e){
        let target = e.target;
        var value = parseInt(target.value);
        if( value < 2 ){
            value = 1;
        }else if( value > 7 ){
            value = 7;
        }else{
            value = value;
        }
        retryDunningOption(value);
    }

    useAppQuery({
        url: "/api/easy-subscription/settings/dunning",
        reactQueryOptions: {
            onSuccess: (data) => {
                if (data.length > 0) {
                    var dunningData = data[0];
                    retryAttemptOption(dunningData.retry);
                    retryDunningOption(dunningData.daybefore);
                    setSelectedValueType(dunningData.status);
                    if( dunningData.status == 'cancle' ){
                        setSelectedTextType('Cancel Subscription');
                    }
                    if( dunningData.status == 'pause' ){
                        setSelectedTextType('Pause Subscription');
                    }
                    if( dunningData.status == 'skip' ){
                        setSelectedTextType('Skip failed Order');
                    }
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
                            <div class="notificationManagecont dunningBlockData">
                                <div class="cont">
                                    <h6>Dunning Management Setting</h6>
                                    <p>With this section, Easy Subscriptions facilitates you to set and modify the mechanisms such as how often and how many times you want the card to be retried before canceling the subscription or skipping the order.</p>
                                    <div className="itgCustomSelectParentDunningBlock">
                                        <div className="itgCustomSelectParent">
                                            <h3>Retry Attempts</h3>
                                            <div class="itgSubGroupPageInnerGroupDiscountNumberBox">
                                                <div class="itgSubGroupPageInnerGroupDiscountNumber">
                                                    <input type="number" onChange={retryAttemptSetup} name="set-up-attempt-number" value={retryAttempt}/>
                                                    <span>Attempt</span> 
                                                </div>
                                            </div>
                                        </div>
                                        <div className="itgCustomSelectParent">
                                            <h3>Day Before Retrying</h3>
                                            <div class="itgSubGroupPageInnerGroupDiscountNumberBox">
                                                <div class="itgSubGroupPageInnerGroupDiscountNumber">
                                                    <input type="number" onChange={retryDunningSetup} name="set-up-day-retry" value={retryDunning}/>
                                                    <span>Day</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="itgCustomSelectParent">
                                            <h3>Once the subscription reaches the maximum number of failures:</h3>
                                            <div className="itg-custom-select">
                                                <div onClick={customSelectType} className="custom-select-selected">
                                                    <div id="selectedValue"><span>{selectedTextType}</span></div>
                                                    <div className="selectIcon"><img src={selectIcon} alt="select" /></div>
                                                </div>
                                                <ul className={ cstmSlctOptionsType ? "itg-custom-select-menu" : "itg-custom-select-menu itg-custom-select-hide" }>
                                                    <li onClick={selectTypeValue} value="cancle">Cancel Subscription</li>
                                                    <li onClick={selectTypeValue} value="pause">Pause Subscription</li>
                                                    <li onClick={selectTypeValue} value="skip">Skip failed Order</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="itgCustomSelectParentDunningAction">
                                        <button type="button" class="btn" onClick={UpdateSetting}>Save</button>
                                    </div>
                                    {updated?<>
                                        <div class="itgDashboardAction">Settings saved successfully.</div>
                                    </>:<></>}
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