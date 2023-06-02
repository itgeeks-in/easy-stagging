import { useState } from 'react';
import { Sidebar, Topbar } from '../components';
export function Layout(props){
    const [ toggleMenu, setToggleMenu ] = useState(true);
    const toggle = () =>{
        setToggleMenu(!toggleMenu);
    }
    return(
        <>
            <div className="itgDashboardPage">
                <Sidebar togglemenu={toggleMenu}/>
                <div className={toggleMenu?"itgDashboardPageContent":"itgDashboardPageContent full"}>
                    <Topbar toggle={toggle}/>
                    {props.children}
                </div>
            </div>       
        </>
    )
}