import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { useAppQuery } from '../hooks';
import { welcomeCss, helpCircle, loaderIcon } from "../assets";

export default function Welcome(){
    const navigateTo = useNavigate();
    const [ loadStart , loadStartOption ] = useState(false);
    const { data }=useAppQuery({
        url:"/api/checkactivity",
        reactQueryOptions: {
            onSuccess: (data) => {
                var convertInteger = parseInt(data);
                return data;
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

    return (
        <>
            {data?.activity==9?<>
                <div className={loadStart?"itg-main-loader active":"itg-main-loader"}>
                    <img src={loaderIcon} alt=""/>
                </div>
                <div className="itgWelcomeBack">
                    <div className="itgWelcomeFront">
                        <div className="itgWelcomeIcon">
                            <img src={helpCircle} alt="" width="80"/>
                        </div>
                        <div className="itgWelcomeContent">
                            <h4 className="title">Your store does not meet the requirements for subscriptions.</h4>
                            <div className="desc">
                                <p>This issue can be fixed by making some changes to your Shopify store settings. You can learn moreabout Shopify's subscription eligibility requirements <a href="https://help.shopify.com/en/manual/products/purchase-options/subscriptions/setup#eligibility-requirements" target="_blank" className="link-btn">here.</a></p>
                            </div>
                        </div>
                        <div className="itgWelcomeButton">
                            <a href="https://help.shopify.com/en/manual/products/purchase-options/subscriptions/setup#eligibility-requirements" target="_blank" className="btn">Check here <span>{'>'}</span></a>
                        </div>
                    </div>
                </div>
            </>:<></>}
        </>
    );

}