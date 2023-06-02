import { useState, createContext, useContext } from "react";
import { useAppQuery,useAuthenticatedFetch } from "../hooks";
import ItgContext from './activityState.jsx';
// const ItgContext = createContext();
export function ItgActivityContext(props){
    const [ activity ,setActivity ] = useState(' ');
    const [ planType ,setPlanType ] = useState('');
    const fetch = useAuthenticatedFetch();
    let success = false;
    function update(){
        fetch('/api/checkactivity').then((res)=>{
            if(res.ok){
                return res.json();
            }
            throw new Error('something went wrong');
        }).then((data)=>{
            var convertInteger = data.activity;
            setActivity(convertInteger);
            if(!data.plantype){
                setPlanType(' ');
            }else{
                setPlanType(data.plantype);
            }
            success = true;
        }).catch((err)=>{
            console.warn(err);
            success = false;
        })
        return success;
    }
    update();
    return(
        <>
            <ItgContext.Provider value={{activity,planType,update}}>
                {props.children}
            </ItgContext.Provider>
        </>
    )
}