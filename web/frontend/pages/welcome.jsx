import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAppQuery } from '../hooks';
import { welcomeCss, welcomeIcon, loaderIcon, welcomeGiftIcon, privacyCheckIcon } from "../assets";

export default function Welcome(){

    const navigateTo = useNavigate();
    const [ loadStart , loadStartOption ] = useState(false);
    const [ status, setStatus ] = useState(0);
    const [ privacy, privacyCheck ] = useState(false);
    const [ privacybox, privacyCheckox ] = useState(false);

    const { data }=useAppQuery({
        url:"/api/checkactivity",
        reactQueryOptions: {
            onSuccess: (data) => {
                var convertInteger = data.activity;
                if ( convertInteger == 9 ){
                    navigateTo('/noteligible');
                } else if ( convertInteger == 1 ){
                    navigateTo('/plans');
                } else if ( convertInteger != 0 ) {
                    navigateTo('/');
                }else{
                    setStatus(convertInteger);
                }
            },
        }, 
    },[]);

    const{ udata, refetch:updateColumn }= useAppQuery({
        url:"/api/addnewcolumn?activity=1",
        reactQueryOptions: {
            onSuccess: (data) => {
                navigateTo('/plans');
            },
            enabled:false,
        }, 
    },[]);

    function letsGoEvent(){
        loadStartOption(true);
        updateColumn();
    }
 
    function letsGoEventPrivacy(){
        privacyCheck(true);
    }

    function privacyboxFunc(){
        privacyCheckox(!privacybox);
    }

    return (
        <>
            {status==0?<>
                <div className={loadStart?"itg-main-loader active":"itg-main-loader"}>
                    <img src={loaderIcon} alt=""/>
                </div>
                {privacy?<>
                    <div className="itgWelcomeBack privacyox">
                        <div className="itgWelcomeFront ">
                            <div className="itgWelcomeIcon">
                                <img src={privacyCheckIcon} alt="" width="80"/>
                            </div>
                            <div className="itgWelcomeContent">
                                <h4 className="title">We protected customer data and fields!</h4>
                                <div className="desc">
                                    <div className="easyPrivacyBBox">
                                        <input type="checkbox" id="itgPrivacyCheck" name="itgcheckbox" checked={privacybox} onChange={privacyboxFunc}/>
                                        <label htmlFor="itgPrivacyCheck">By clicking the "Let's go!" button, you agree to our Terms & Conditions and that you have read our Privacy Policy. 
                                        <a href="https://easysubscription.io/privacy-policy/" target="_blank" className="btn-link">More Details</a></label>
                                    </div>
                                </div>
                            </div>
                            <div className="itgWelcomeButton">
                                <button type="button" onClick={letsGoEvent} className="btn primary-btn">Let's go!</button>
                            </div>
                        </div>
                    </div>
                </>:<>
                    <div className="itgWelcomeBack">
                        <div className="itgWelcomeFront">
                            <div className="itgWelcomeIcon">
                                <img src={welcomeGiftIcon} alt="" width="80"/>
                            </div>
                            <div className="itgWelcomeContent">
                                <h4 className="title"> !!  Welcome to world of Easy Subscription  !!</h4>
                                <div className="desc">
                                    <p>Smoothest App to sell subscription products directly through your Shopify checkouts. Unlock a world of possibilities with our subscription service.</p>
                                </div>
                            </div>
                            <div className="itgWelcomeButton">
                                <button type="button" onClick={letsGoEventPrivacy} className="btn primary-btn">Start exploring now! <span>{'>'}</span></button>
                            </div>
                        </div>
                    </div>
                </>}
            </>:<></>}
        </>
    );

}