import { plansCss, loaderIcon } from "../assets";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";


export default function subscription(){
    const navigateTo = useNavigate();
    const fetch = useAuthenticatedFetch();
    const [ loadStart , loadStartOption ] = useState(true);
    const [ planType, setplantype ] = useState('');
    const [ existingPlan, setExistingPlan ] = useState({ type:'', confirmCheck:false, activity:1 });
    
    const{ planStatus }=useAppQuery({
        url:"/api/planStatus",
        reactQueryOptions: {
            onSuccess: (data) => {
                var convertInteger = parseInt(data.activity);
                if ( convertInteger == 9 ){
                    navigateTo('/noteligible');
                }else{
                    setExistingPlan({...existingPlan, type:data.plantype, activity:data.activity});
                    loadStartOption(false);
                }
            },
        }, 
    },[]);

    const{ freeplan, refetch:createFreePlan }=useAppQuery({
        url:"/api/paymentfree",
        reactQueryOptions: {
            onSuccess: (data) => {
                setExistingPlan({...existingPlan, type:data.type, confirmCheck:false});
                loadStartOption(false);
            },
            enabled:false,
        }, 
    },[]); 
    
    const upgradePlan = planType;
    const{ data, refetch:createPaidPlan } = useAppQuery({
        url:"/api/payment?plan="+upgradePlan,
        reactQueryOptions: {
            onSuccess: (data) => {
                if( data.id ){
                    fetch(`/api/payment/update?id=`+data.id+`&plan=`+upgradePlan).then((response)=>{
                        if(response.status === 200){
                            if( data.status ){
                                window.top.location.href= data.url;
                            }else{
                                createPaidPlan();
                            }
                        }else{
                            createPaidPlan();
                        }
                    });
                }
            },
            enabled:false,
        }, 
    },[]);
    
    function paymentPage(e){
        var targetElement = e.target
        var plan = targetElement.getAttribute('plantype');
        setplantype(plan);
        if( plan == 'free' ){
            setExistingPlan({...existingPlan, confirmCheck:true});
        }else{
            setExistingPlan({...existingPlan, confirmCheck:true});
        }
    }

    function closeConfirmPopup(){
        setExistingPlan({...existingPlan, confirmCheck:false});
    }

    function sentToPaymentPage(){
        loadStartOption(true);
        if( planType == 'free' ){
            createFreePlan();
        }else{
            createPaidPlan();
        }
    }

    function integrateTheme(){
        navigateTo('/theme');
    }

    function goToDashboard(){
        navigateTo('/');
    }


    return(
        <>
        <div className="itgPlanPage">
            <div className={loadStart?"itg-main-loader active":"itg-main-loader"}>
                <img src={loaderIcon} alt=""/>
            </div>
            <div className="itgPlanSelection">
                <div className="itgPlanSelectionInner">
                    <div className="itgPlanSelectionTitle">
                        <h4 className="title">Give a try on our Free Version</h4>
                        <div className="desc">
                            <p>Scale your subscription business with no monthly fees, paying on a per transaction basis.</p>
                        </div>
                    </div>
                    <div className="itgPlanSelectionBox">
                        <div className={existingPlan.type=='free'?"itgPlanSelectionBoxChild active":"itgPlanSelectionBoxChild"}>
                            <div className="itgPlanSelectionBoxChildInner">
                                <div className="itgPlanSelectionBoxChildInnerTitle">
                                    <label>STANDARD</label>
                                    <h5 className="title">Free to install</h5>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerContent">
                                    <ul className="list">
                                        <li>Recurring Billing engine</li>
                                        <li>Integration library</li>
                                        <li>Recharge API</li>
                                        <li>Recharge SMS</li>
                                        <li>Customer Portal</li>
                                        <li>Payment Processing</li>
                                    </ul>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerAction">
                                    {existingPlan.type == 'free'?
                                        <button type="button" className="btn dark-btn" plantype="free" disabled="disabled">Activated</button>
                                    :
                                        <button type="button" className="btn" onClick={paymentPage} plantype="free">
                                          {existingPlan.type == 'pro'?"Downgrade plan":"Choose standard "}<span>{'>'}</span>
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                        <div className={existingPlan.type=='pro'?"itgPlanSelectionBoxChild active":"itgPlanSelectionBoxChild"}>
                            <div className="itgPlanSelectionBoxChildInner">
                                <div className="itgPlanSelectionBoxChildInnerTitle">
                                    <label>PRO</label>
                                    <h5 className="title">$9.00/month</h5>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerContent">
                                    <ul className="list">
                                        <li>Everything in standard plus:</li>
                                        <li>Enhanced analytics</li>
                                        <li>Custom domains Bundles</li>
                                        <li>Bundles</li>
                                        <li>Enhanced customer portal</li>
                                        <li>Configurable API Rate Limits</li>
                                    </ul>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerAction">
                                    {existingPlan.type == 'pro'?
                                        <button type="button" className="btn dark-btn" plantype="free" disabled="disabled">Activated</button>
                                    :
                                        <button type="button" className="btn primary-btn" onClick={paymentPage} plantype="pro">
                                            {existingPlan.type == 'free'?"Upgrade plan":"Choose pro "}<span>{'>'}</span>
                                        </button>
                                    }
                                </div>
                            </div>
                        </div>
                        {existingPlan.type!=''?<>
                            <div className="itgPlanSelectionActionBox">
                                {existingPlan.activity==2?<>
                                    <button type="button" className="btn" onClick={goToDashboard}>Dashboard</button>
                                </>:<>
                                    <button type="button" className="btn primary-btn" onClick={integrateTheme}>Next</button>
                                </>}
                            </div>
                        </>:<></>}
                    </div>
                </div>
            </div>
            {existingPlan.confirmCheck?<>
                <div className="itgProPlanConfirmation">
                    <div className="itgProPlanConfirmationInner">
                        <h5 className="title">Kindly please confirm to select this plan</h5>
                        <div className="itgProPlanConfirmationAction">
                            <button type="button" className="btn primary-btn" onClick={sentToPaymentPage}>Yes</button>
                            <button type="button" className="btn" onClick={closeConfirmPopup}>No</button>
                        </div>
                    </div>
                </div>
            </>:<></>}
        </div>
        </>
    );
}