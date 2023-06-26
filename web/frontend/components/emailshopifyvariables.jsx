import { loaderIcon, editIcon, closeIcon  } from "../assets";
export function Variables(props){
    return(
        <>
            <div className={ props.variableModel ? "itgModel itgModelShow" : "itgModel itgModelHide" } >
                <div className="itgModelWrapper preview">
                    <div className="itgModelHead">
                        <h6 className="itgVariablePreviewText">Variables</h6>
                        <div onClick={props.variableModelFunction} className="itgVariablePreviewClose">
                            <img src={closeIcon} alt="" />
                        </div>
                    </div>
                    <div className="itgModelIn">
                        <table className="easySubVariblesTable">
                            <tbody>
                                <tr>
                                    <th>&#60;defaulteasystyle&#62;</th>
                                    <td>Default email Stylesheet</td>
                                </tr>
                                <tr>
                                    <th>&#60;shop&#62;</th>
                                    <td>Name of your store.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressName&#62;</th>
                                    <td>The name for the customer.</td>
                                </tr>
                                <tr>
                                    <th>&#60;subscriptionContractId&#62;</th>
                                    <td>Subscription ID with "subscription" lable and "#" prefix</td>
                                </tr>
                                <tr>
                                    <th>&#60;nextBillingDate&#62;</th>
                                    <td>Next date for the payment schedule.</td>
                                </tr>
                                <tr>
                                    <th>&#60;subscriptionContractStatus&#62;</th>
                                    <td>Subscription status</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}