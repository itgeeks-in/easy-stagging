import { plansCss, loaderIcon } from "../assets";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";


export default function subscription(){
    const navigateTo = useNavigate();
    const fetch = useAuthenticatedFetch();
    const [ loadStart , loadStartOption ] = useState(true);
    const [ planType, setplantype ] = useState('');
    const [ planFreq, setPlanFreq ] = useState('month');
    const [ existingPlan, setExistingPlan ] = useState({ type:'', confirmCheck:false, activity:1, chooseDiscount:false, chooseDplan:false });
    
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
    const upgradePlanFreq = planFreq;
    const{ data, refetch:createPaidPlan } = useAppQuery({
        url:"/api/payment?plan="+upgradePlan+"&freq="+upgradePlanFreq,
        reactQueryOptions: {
            onSuccess: (data) => {
                console.log(data);
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
            setExistingPlan({...existingPlan, confirmCheck:true, chooseDiscount:false});
        }else{
            setExistingPlan({...existingPlan, confirmCheck:true, chooseDiscount:true});
        }
    }

    function paymentPageDicount(e){
        var targetElement = e.target
        var plan = targetElement.getAttribute('planfreq');
        setPlanFreq(plan);
        setExistingPlan({...existingPlan, confirmCheck:true, chooseDiscount:false});
    }

    function closeConfirmPopup(){
        setExistingPlan({...existingPlan, confirmCheck:false, chooseDiscount:false});
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
                                        <li>Single Subscription Group</li>
                                        <li>Single Widget Style</li>
                                        <li>Customer Management</li>
                                        <li>Email Customization</li>
                                        <li>24*7 Support</li>
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
                                    <h5 className="title">$29.00/month</h5>
                                    <h4 className="subtitle">or $278/year and save 20%</h4>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerContent">
                                    <ul className="list">
                                        <li>Multiple Subscription Groups</li>
                                        <li>Multiple Widget Styles</li>
                                        <li>Customer Management</li>
                                        <li>Email Customization</li>
                                        <li>Order Tagging</li>
                                        <li>24*7 Support</li> 
                                        <li>Dedicated Manager</li> 
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
                                    <p class="easyYearlyDiscount"></p>
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
                        {existingPlan.chooseDiscount?<>
                            <h5 className="title">Kindly please select frequency</h5>
                            <div className="itgProPlanConfirmationAction">
                                <button type="button" className="btn" onClick={paymentPageDicount} planfreq="month">Monthly $29.00/month </button>
                                <button type="button" className="btn primary-btn" onClick={paymentPageDicount} planfreq="year">Yearly $278/year and save 20%</button>
                            </div>
                        </>:<>
                            <h5 className="title">Kindly please confirm to select this plan</h5>
                            <div className="itgProPlanConfirmationAction">
                                <button type="button" className="btn primary-btn" onClick={sentToPaymentPage}>Yes</button>
                                <button type="button" className="btn" onClick={closeConfirmPopup}>No</button>
                            </div>
                        </>}
                    </div>
                </div>
            </>:<></>}
        </div>
        </>
    );
}