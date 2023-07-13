import { toggleIcon, mailIcon, phoneIcon } from "../assets";
import { Link  } from "react-router-dom";
import TawkMessengerReact from '@tawk.to/tawk-messenger-react';

export function Topbar(props) {
    return (
        <>
            <div className="itgDashboardPageTopBar">
                <div className="itgDashboardPageTopBarInner">
                    <div className="itgDashboardPageTopBarToogle">
                        <a onClick={props.toggle}>
                            <img src={toggleIcon} alt="menu" />
                        </a>
                    </div>
                    <div className="itgDashboardPageTopBarMenu">
                        <ul>
                            <li>
                                <a href="https://calendly.com/support-hiq" target="_blank"><img src={phoneIcon} className="icon" alt="easy-subscription" width="16"/><span>Schedule a Demo Call</span></a>
                            </li>
                        </ul>
                    </div>
                    <TawkMessengerReact
                propertyId="64ae72afcc26a871b027eaa9"
                widgetId="1h54n00iv"/>
                </div>
            </div>
        </>
    )
}