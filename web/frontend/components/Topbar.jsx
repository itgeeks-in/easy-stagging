import { toggleIcon, mailIcon, phoneIcon } from "../assets";
import { Link  } from "react-router-dom";
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
                </div>
            </div>
        </>
    )
}