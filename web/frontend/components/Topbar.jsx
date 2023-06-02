import { toggleIcon, mailIcon, helpCircleIcon } from "../assets";
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
                                <Link to="/"><img src={mailIcon} className="icon" alt="easy-subscription" /><span>Feature Request</span></Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </>
    )
}