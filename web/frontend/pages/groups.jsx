import { useNavigate } from 'react-router-dom';
import { useContext, useEffect, useState, useRef } from 'react';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';
import { Sidebar, Topbar } from '../components';
import { loaderIcon, editIcon, deleteIcon, chevronRight, chevronLeft, searchIcon } from "../assets";
import ItgContext from '../context/activityState.jsx';
export default function Groups() {
  const windowSize = useRef([window.innerWidth, window.innerHeight]);
  const navigateTo = useNavigate();
  const fetch = useAuthenticatedFetch();
  const [ toggleMenu, setToggleMenu ] = useState(true);
  const [ loadStart , loadStartOption ] = useState(false);
  const [ showApp, showAppOption ] = useState(true);
  const [ getsubscription, getsubscriptionOptions ] = useState({ data: {}, loading:true, deleteid:0, deletedid:0 });
  const [ subscriptionFilter, subscriptionFilterOptions ] = useState({ startCursor:'', endCursor:'', hasNextPage:false, hasPreviousPage:false, query:'', action:'' });
  const [ editGroup, editGroupOptions ] = useState({ start:false, edit:false });
  const [ deletepopup, deletepopupOptions ] = useState({ start:false, deleting:false });

  const queryParameters = new URLSearchParams(window.location.search);
  const groupId = queryParameters.get("id");
  const groupStatus = queryParameters.get("status");
  const [ onpage, setOnPage ] = useState(true);
  function getSubGroupTriggerFunc(startCursor, endCursor, query, action){
      getsubscriptionOptions({...getsubscription, loading:true });
      const getSubGroupData = {
        startCursor:startCursor,
        endCursor:endCursor,
        query:query,
        action:action,
      }
      const response = fetch('/api/getsubgroup', {
          method: 'POST',
          body: JSON.stringify(getSubGroupData),
          headers: {
              'Content-type': 'application/json; charset=UTF-8',
          },
      }).then((res) => res.json()).then((response) => {
        if(onpage){
          var startCursor = response.data.sellingPlanGroups.pageInfo.startCursor;
          var endCursor= response.data.sellingPlanGroups.pageInfo.endCursor;
          var hasNextPage = response.data.sellingPlanGroups.pageInfo.hasNextPage;
          var hasPreviousPage= response.data.sellingPlanGroups.pageInfo.hasPreviousPage;
          subscriptionFilterOptions({...subscriptionFilter, hasNextPage:hasNextPage, hasPreviousPage:hasPreviousPage, startCursor:startCursor, endCursor:endCursor});
          getsubscriptionOptions({...getsubscription, data:response, loading:false});
          if( groupId != null || groupStatus != null ){
            setTimeout(function(){
             // navigateTo('/groups');
            }, 8000);
          }
        }
      })
      .catch((err) => {
          console.log(err.message);
      });
  }

  const activityContext = useContext(ItgContext);
    useEffect(()=>{
      setOnPage(true);
      if(activityContext.activity !== ' ' && activityContext.planType !==' '){
        if( activityContext.activity === 9 ){
          navigateTo('/noteligible');
        }else if ( activityContext.activity!==' ' && activityContext.activity === 0 ){
          navigateTo('/welcome');
        } else if ( activityContext.activity === 1 || activityContext.planType ===' ' ){
          navigateTo('/plans');
        } else if(activityContext.activity !== ' ') {
          getSubGroupTriggerFunc(subscriptionFilter.startCursor, subscriptionFilter.endCursor, subscriptionFilter.query, subscriptionFilter.action);
          showAppOption(true);
          loadStartOption(false);
        }
      }else{
        loadStartOption(true);
      }
      return ()=>{
        setOnPage(false);
      }
    },[activityContext])

  const deleteSubGroupData = {
    id:getsubscription.deleteid
  }
  const deleteSubGroupDataParam = JSON.stringify(deleteSubGroupData);
  const { deleteSubGroup, refetch:deleteSubGroupTrigger } = useAppQuery({ url: `/api/deletegroup/${deleteSubGroupDataParam}`,
    reactQueryOptions: {
      onSuccess: (response) => {
        deletepopupOptions({...deletepopup, deleting:false, start:false});
        getsubscriptionOptions({...getsubscription, deletedid:getsubscription.deleteid});
        getSubGroupTriggerFunc(subscriptionFilter.startCursor, subscriptionFilter.endCursor, subscriptionFilter.query, subscriptionFilter.action);
      },
      enabled:false
    }, 
  });

  
  useEffect(()=>{
    if( windowSize.current[0] < 776 ){
      setToggleMenu(!toggleMenu);
    }
  }, []);
  
  const toggle = () =>{
    setToggleMenu(!toggleMenu);
  }

  function deleteSellingPlanGroup(e){
    var targetElement = e.target;
    var index = targetElement.getAttribute('data-id');
    getsubscriptionOptions({...getsubscription, deleteid:index});
    deletepopupOptions({...deletepopup, start:true});
  }

  function editSellingPlanGroup(e){
    editGroupOptions({...editGroup, start:true});
    var groupId = e.target.getAttribute('data-id');
    navigateTo('/subscriptiongroup?id='+groupId);
  }

  function createGroupRedirect(){
    navigateTo('/subscriptiongroup');
  }

  function deleteSellingPlanGroupYes(){
    deleteSubGroupTrigger();
    deletepopupOptions({...deletepopup, deleting:true});
  }

  function deleteSellingPlanGroupNo(){
    deletepopupOptions({...deletepopup, start:false});
  }

  function paginationPrevPerform(e){
    var action = 'prev';
    if( subscriptionFilter.hasPreviousPage ){
      getSubGroupTriggerFunc(subscriptionFilter.startCursor, subscriptionFilter.endCursor, subscriptionFilter.query, 'prev');
    }
  }

  function paginationNextPerform(e){
    var action = 'next';
    if( subscriptionFilter.hasNextPage ){
      getSubGroupTriggerFunc(subscriptionFilter.startCursor, subscriptionFilter.endCursor, subscriptionFilter.query, 'next');
    }
  }

  function serchingPerform(e){
      var serchQuery = e.target.value;
      subscriptionFilterOptions({...subscriptionFilter, query:serchQuery});
  }

  function serchingPerformSubmit(e){
      e.preventDefault();
      getSubGroupTriggerFunc(subscriptionFilter.startCursor, subscriptionFilter.endCursor, subscriptionFilter.query, '');
  }

  return (
    <>
      {showApp?<>
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
                <h5 className="title">Subscription Groups</h5>
                <button type="button" onClick={createGroupRedirect}>Create Group</button>
              </div>
                {groupStatus=='create'?<>
                <div className="itgDashboardAction">
                  Subscription group is created successfully.
                </div>
                </>:<></>}
                {groupStatus=='update'?<>
                <div className="itgDashboardAction">
                Subscription group is updated successfully.
                </div>
                </>:<></>}
              <div className="itgAddSubSearchFormGroup">
                <form onSubmit={serchingPerformSubmit}>
                  <input type="text" name="query" placeholder="Search" className="input-area" value={subscriptionFilter.query} onChange={serchingPerform}/>
                  <button type="submit" className="btn primary-btn">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="18" 
                      height="18" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      className="feather feather-search">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                  </button>
                </form>
              </div>
              <div className="itgAddSubGroupData">
                { getsubscription.loading ? 
                   <>
                   {loadStart?<></>:<>
                     <div className="itg-product-loader">
                       <img src={loaderIcon} alt=""/>
                     </div>
                   </>}
                 </>
                : 
                  <>
                   { getsubscription.data.data.sellingPlanGroups.edges.length > 0 ? <>
                    <div className="itgAddSubGroupDataTable">
                      <div className="itgAddSubGroupDataHeader">
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Name</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Summary</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox">
                          <label>Product Count</label>
                        </div>
                        <div className="itgAddSubGroupDataTableBox"></div>
                      </div>
                      <div className="itgAddSubGroupDataContent">
                        {getsubscription.data.data.sellingPlanGroups.edges.map(function(object, i){
                          var productCounttext = object.node.productCount+' product';
                          if( object.node.productCount > 1 ){
                            productCounttext = object.node.productCount+' products';
                          }
                          var objectId = object.node.id.replace("gid://shopify/SellingPlanGroup/", "");
                          if( objectId == getsubscription.deletedid ){
                            return(
                              <div key={objectId}></div>
                            );
                          }else{
                            return(
                              <div key={objectId} className={groupId==objectId?"itgAddSubGroupDataContentRow":"itgAddSubGroupDataContentRow"}>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span className="product-title">
                                        {object.node.name}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span>
                                        {object.node.summary}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span>
                                        {productCounttext}
                                      </span>
                                  </div>
                                  <div className="itgAddSubGroupDataTableBox">
                                      <span className="itg-group-action">
                                          <button type="button" className="icon-btn-simple" data-id={objectId} onClick={editSellingPlanGroup}>
                                            <img src={editIcon} alt="" data-id={objectId}/>
                                          </button>
                                          <button type="button" className="icon-btn-simple" data-id={objectId} onClick={deleteSellingPlanGroup}>
                                            <img src={deleteIcon} alt="" data-id={objectId}/>
                                          </button>
                                      </span>
                                  </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                      <div className="itgAddSubGroupDataPagination">
                        <button type="button" onClick={paginationPrevPerform} data-action="prev" className={subscriptionFilter.hasPreviousPage?"pagination-btn":"pagination-btn disable"}><img src={chevronLeft} alt=""/></button>
                        <button type="button" onClick={paginationNextPerform} data-action="next" className={subscriptionFilter.hasNextPage?"pagination-btn":"pagination-btn disable"}><img src={chevronRight} alt=""/></button>
                      </div>
                    </div>
                   </> : <>
                   <div className="itgDataNorecordsParent">
                    <div className='itgDataNorecords'>
                      <div className="itgDataicon">
                        <img src={searchIcon} alt="" />
                      </div>
                      <h4>No Records Found</h4>
                    </div> 
                    </div> 
                   </> }
                </> }
              </div>
              { deletepopup.start ? <>
                <div className="itgProPlanConfirmation">
                    <div className="itgProPlanConfirmationInner">
                        { deletepopup.deleting ? <>
                          <div className="itg-product-loader">
                            <img src={loaderIcon} alt=""/>
                          </div>
                        </> : <>
                          <h5 className="title">Kindly please confirm to delete this plan</h5>
                          <div className="itgProPlanConfirmationAction">
                              <button type="button" className="btn" onClick={deleteSellingPlanGroupYes}>Yes</button>
                              <button type="button" className="btn" onClick={deleteSellingPlanGroupNo}>No</button>
                          </div>
                        </> }
                    </div>
                </div>
              </> : <>
              </> }
            </div>
          </div>
        </div>
      </>:<>
          <div className="itg-main-loader active">
              <img src={loaderIcon} alt=""/>
          </div>
      </>}
    </>
  );
}
