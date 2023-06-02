import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { useState } from "react";
import { loaderIcon, viewIcon, chevronRight, chevronLeft } from "../assets";
import { Sidebar, Topbar } from '../components';
export default function orderview() {
    const [loadStart, loadStartOption] = useState(true);
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const toggle = () => {
        setToggleMenu(!toggleMenu);
    };
    const { data } = useAppQuery({
        url: "/api/checkactivity",
        reactQueryOptions: {
            onSuccess: (data) => {
                var convertInteger = parseInt(data);
                if (convertInteger == 9) {
                    navigateTo("/noteligible");
                } else if (convertInteger == 0) {
                    navigateTo("/welcome");
                } else if (convertInteger == 1) {
                    navigateTo("/plans");
                }else {
                    // setTimeout(function(){
                        loadStartOption(false);
                    // }, 1000);
                }
            },
        },
    });
    return <>
        {loadStart?<>
          <div className="itg-main-loader active">
              <img src={loaderIcon} alt=""/>
          </div>
        </>:<></>}
        <div className="itgDashboardPage">
          <Sidebar toggle={toggle} togglemenu={toggleMenu}/>
            <div className={toggleMenu?"itgDashboardPageContent":"itgDashboardPageContent full"}>
                <Topbar toggle={toggle}/>
                <div className="itgDashboardPageContentInner">
                    <div className="itgDashboardPageContentTitle">
                        <h5 className="title">Orders</h5>
                        <button>Refund In Shopify</button>
                    </div>
                    <div className="itgorderview">
                        <div className="itgorderviewcustomerdetails">
                            <div className="itgorderviewcustomerdetailsIn">
                                <div>
                                    <div className="itgorderviewcustomerdetailsInHead">
                                        <h6>Customer</h6>
                                    </div>
                                    <div className="itgorderviewcustomerdetailsInCont customer">
                                        <p>Leslie Lab</p>
                                        <p>coachlab101@gmail.com</p>
                                        <p className="">View in Shopify</p>
                                    </div>
                                </div>
                            </div>
                            <div className="itgorderviewcustomerdetailsIn">
                                <div>
                                    <div className="itgorderviewcustomerdetailsInHead">
                                        <h6>Shipping Address</h6>
                                    </div>
                                    <div className="itgorderviewcustomerdetailsInCont address">
                                        <p>LESLIE LAB</p>
                                        <p>306 South Buckhorn Bath Avenue Saratoga Springs, UT 84045</p>
                                        <p>United States</p>
                                    </div>
                                </div>
                            </div>
                            <div className="itgorderviewcustomerdetailsIn">
                                <div>
                                    <div className="itgorderviewcustomerdetailsInHead">
                                        <h6>Billing Address</h6>
                                    </div>
                                    <div className="itgorderviewcustomerdetailsInCont address">
                                        <p>LESLIE LAB</p>
                                        <p>306 South Buckhorn Bath Avenue Saratoga Springs, UT 84045</p>
                                        <p>United States</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>;
}
