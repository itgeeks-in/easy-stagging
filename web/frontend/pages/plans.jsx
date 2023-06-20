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
        var planFreq = targetElement.getAttribute('planfreq');
        setPlanFreq(planFreq);
        setplantype(plan);
        if( plan == 'free' ){
            setExistingPlan({...existingPlan, confirmCheck:true, chooseDiscount:false});
        }else{
            setExistingPlan({...existingPlan, confirmCheck:true, chooseDiscount:false});
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
                        <h4 className="title">Plans and Pricing</h4>
                        <div className="desc">
                            <p>We offer monthly and yearly plans for Easy Subscription</p>
                        </div>
                    </div>
                    <div className="itgPlanSelectionBox"> 
                        {existingPlan.type!=''?<>
                            <div className="itgPlanSelectionActionBox">
                                {existingPlan.activity==2?<>
                                    <button type="button" className="btn" onClick={goToDashboard}>Dashboard</button>
                                </>:<>
                                    <button type="button" className="btn primary-btn" onClick={integrateTheme}>Next</button>
                                </>}
                            </div>
                        </>:<></>}
                        <div className={existingPlan.type=='promonthly'?"itgPlanSelectionBoxChild active":"itgPlanSelectionBoxChild"}>
                            <div className="itgPlanSelectionBoxChildInner">
                                <div className="itgPlanSelectionBoxChildInnerTitle">
                                    <label>PRO monthly</label>
                                    <h5 className="title">$29/month</h5>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerContent">
                                    <ul className="list">
                                        <li>Widget Styling</li>
                                        <li>Customer Management</li>
                                        <li>Email Customization</li>
                                        <li>Order Tagging</li>
                                        <li>24*7 Support</li> 
                                        <li>Dedicated Manager</li> 
                                    </ul>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerAction">
                                    {existingPlan.type == 'promonthly'?
                                        <button type="button" className="btn dark-btn" plantype="pro" disabled="disabled">Activated</button>
                                    :
                                        <>
                                            {existingPlan.type == 'promonthly'?
                                                <button type="button" className="btn dark-btn" plantype="pro" disabled="disabled">Disabled</button>
                                            :
                                                <button type="button" className="btn" onClick={paymentPage} plantype="promonthly" planfreq="month">
                                                    {existingPlan.type == 'free'?"Upgrade plan":"Choose pro "}<span>{'>'}</span>
                                                </button>
                                            }
                                        </>
                                    }
                                    <p class="easyYearlyDiscount"></p>
                                </div>
                            </div>
                        </div>
                        <div className={existingPlan.type=='proyearly'?"itgPlanSelectionBoxChild active":"itgPlanSelectionBoxChild"}>
                            <div className="itgPlanSelectionBoxChildInner">
                                <div className="itgPlanSelectionBoxChildInnerTitle">
                                    <label>PRO yearly</label>
                                    <h5 className="title">$278/year</h5>
                                    <h4 className="subtitle">Save 20%</h4>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerContent">
                                    <ul className="list">
                                        <li>Widget Styling</li>
                                        <li>Customer Management</li>
                                        <li>Email Customization</li>
                                        <li>Order Tagging</li>
                                        <li>24*7 Support</li> 
                                        <li>Dedicated Manager</li> 
                                    </ul>
                                </div>
                                <div className="itgPlanSelectionBoxChildInnerAction">
                                    {existingPlan.type == 'proyearly'?
                                        <button type="button" className="btn dark-btn" plantype="pro" disabled="disabled">Activated</button>
                                    :
                                        <>
                                            <button type="button" className="btn primary-btn" onClick={paymentPage} plantype="proyearly" planfreq="year">
                                                {existingPlan.type == 'free'?"Upgrade plan":"Choose pro "}<span>{'>'}</span>
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                        </div>
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
                            <h5 className="title">Please press "Confirm" to continue with the Pro Plan.</h5>
                            <div className="itgProPlanConfirmationAction">
                                <button type="button" className="btn primary-btn" onClick={sentToPaymentPage}>Confirm</button>
                                <button type="button" className="btn" onClick={closeConfirmPopup}>Cancel</button>
                            </div>
                        </>}
                    </div>
                </div>
            </>:<></>}
        </div>
        </>
    );
}