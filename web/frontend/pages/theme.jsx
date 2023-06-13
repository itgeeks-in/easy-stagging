import { useNavigate } from 'react-router-dom';
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { useState, useContext, useEffect } from "react";
import { themeCss, buttonDownloadIcon, themeIcon, fileTextIcon, loaderIcon, downArrowIcon, creatGroup } from '../assets';
import ItgContext from '../context/activityState.jsx';

export default function SelectTheme(){

    const navigateTo = useNavigate();
    const fetch = useAuthenticatedFetch();
    const [ loadStart , loadStartOption ] = useState(true);
    // const [ themes , getThemes ] = useState({});
    // const [ selectedTheme , setSelectedTheme ] = useState({id:'', name:'', selectError:false, integrate:false});
    // const [ customSelectOption , setCustomSelectOption] = useState(false);
    const [ redirectTo , setRedirectTo] = useState(' ');
    const activityContext = useContext(ItgContext);

    // const { themeData, refetch:getThemesData } = useAppQuery({
    //     url:"/api/themes",
    //     reactQueryOptions: {
    //         onSuccess: (data) => {
    //             loadStartOption(false);
    //             getThemes(data);
    //         },
    //         enabled:false,
    //     }, 
    // },[]);

    const{ planStatus }=useAppQuery({
        url:"/api/planStatus",
        reactQueryOptions: {
            onSuccess:(data) => {
                var convertInteger = parseInt(data.activity);
                if ( convertInteger == 9 ){
                    navigateTo('/noteligible');
                }else{
                    if( data.plantype == '' ){
                        navigateTo('/plans');
                    }else if( convertInteger == 2){
                        navigateTo('/');
                    }else{
                        loadStartOption(false);
                    }
                }
            },
        }, 
    },[]);

    // function customSelect(){
    //     setCustomSelectOption(!customSelectOption);
    // }
    // function selectThemeChange(e){
    //     var targetElement = e.target;
    //     var themeName = targetElement.getAttribute('data-name');
    //     var themeId = targetElement.getAttribute('data-value');
    //     setSelectedTheme({...selectedTheme, id:themeId, name:themeName, selectError:false, integrate:false });
    //     setCustomSelectOption(!customSelectOption);
    // }
    // function integrateSelectedTheme(){
    //     loadStartOption(true);
    // }

    // function integrateSelectedTheme(){
    //     if( selectedTheme.id != '' ){
    //         loadStartOption(true);
    //         fetch(`/api/addtheme?theme=`+selectedTheme.id).then((response)=>{
    //             return response.json();
    //         }).then((data)=>{
    //             loadStartOption(false);
    //             setSelectedTheme({...selectedTheme, integrate:true });
    //         });
    //     }else{
    //         setSelectedTheme({...selectedTheme, selectError:true, integrate:false });
    //     }
    // }
    useEffect(()=>{
        if(redirectTo != ' '){
            navigateTo(redirectTo);
        }
    },[activityContext])
    
    function skipGroupCreation(){
        loadStartOption(true);
        fetch(`/api/skip/groupcreation`).then((response)=>{
            if(activityContext.update()){
                    setRedirectTo('/');
            }else{
                loadStartOption(false);
            }
        });
    }

    function subscriptionGroupCreation(){
        loadStartOption(true);
        fetch(`/api/skip/groupcreation`).then((response)=>{
            let status;
            if(status = activityContext.update()){
                setRedirectTo('/subscriptiongroup');
            }else{
                loadStartOption(false);
            }
        });
    }


    return(
        <>
            <div className={loadStart?"itg-main-loader active":"itg-main-loader"}>
                <img src={loaderIcon} alt=""/>
            </div>
            <div className="itgThemePage">
                <div className="itgThemePageInner">
                    {/* <div className="itgThemePageTitle">
                        <div className="icon">
                            <img src={themeIcon} alt="" />
                        </div>
                        <h5 className="title">Theme integration</h5>
                    </div>
                    <div className="itgThemePageIntegration">
                        <h5 className="title">Select your theme</h5>
                        <div className="desc"><p>Choose theme in which snippets need to be installed</p></div>
                        <div className="itgThemePageIntegrationSelectBox">
                            <div className="itgThemePageIntegrationSelectBoxInput">
                                <div className="itgThemePageIntegrationSelectBoxInputSelected" onClick={customSelect}>
                                    <div className="itgThemePageIntegrationSelectBoxInputSelectedValue">
                                        <span>{selectedTheme.id!=''?selectedTheme.name:"--Please select--"}</span>
                                    </div>
                                    <div className="selectIcon">
                                        <img src={downArrowIcon} alt=""/>
                                    </div>
                                </div>
                                {themes.length>0?
                                <ul className={customSelectOption?"itgThemePageIntegrationSelectBoxInputOptions active":"itgThemePageIntegrationSelectBoxInputOptions"}>
                                    {themes.map((data)=>{
                                        var currentId = parseInt(selectedTheme.id);
                                        return (
                                            <li className={currentId === data.id?"itgSelectedOption active":"itgSelectedOption"} key={data.id} data-value={data.id} data-name={data.name} onClick={selectThemeChange}>{data.name}</li>
                                        );
                                    })}
                                </ul> :<></>}
                            </div>
                            <div className="itgThemePageIntegrationSelectBoxAction">
                                <button onClick={integrateSelectedTheme} className="btn primary-btn">Install 
                                    <img src={buttonDownloadIcon} alt="select theme" />
                                </button>
                            </div>
                        </div>
                        {selectedTheme.integrate?<>
                            <div className="itgsuccess">Integrated Successfully</div>
                        </>:<>
                            {selectedTheme.selectError?<>
                            <div className="itgerror">Kindly Please select theme</div>
                            </>:<></>}
                        </>}
                        <div className="desc itgBottomDesc"><p>Lorem Ipsum has been the industry's standard dummy text ever since the 1500s</p></div>
                    </div> */}
                    <div className="itgCreatePlanGroup">
                        <div className="itgCreatePlanGroupTitle">
                            <div className="icon">
                                <img src={creatGroup} alt="" />
                            </div>
                            <h5 className="title">Create a new subscription plan group</h5>
                            <div className="desc">
                                <p>A subscription plan group is a collection of subscriptions which allows customers to choose from different options that best suit their needs.</p>
                            </div>
                        </div>
                        <div className="itgCreatePlanGroupAction">
                            <button className="btn primary-btn" onClick={subscriptionGroupCreation}>Create group</button>
                            <button className="btn" onClick={skipGroupCreation}>Skip</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}