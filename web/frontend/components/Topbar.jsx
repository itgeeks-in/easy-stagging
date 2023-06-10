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
                                <Link to="/"><img src={phoneIcon} className="icon" alt="easy-subscription" /><span>Schedule demo call</span></Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}