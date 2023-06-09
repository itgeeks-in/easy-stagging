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
                                    <th>&#60;orderName&#62;</th>
                                    <td>Typically this is a unique name followed by the order_number. Example: #1004</td>
                                </tr>
                                <tr>
                                    <th>&#60;shop&#62;</th>
                                    <td>Name of your store.</td>
                                </tr>
                                <tr>
                                    <th>&#60;nextBillingDate&#62;</th>
                                    <td>The next date for the payment schedule.</td>
                                </tr>
                                <tr>
                                    <th>&#60;total&#62;</th>
                                    <td>Total of the order (subtotal + shipping cost - shipping discount + tax).</td>
                                </tr>
                                <tr>
                                    <th>&#60;currency&#62;</th>
                                    <td>For the currency</td>
                                </tr>
                                <tr>
                                    <th>&#60;shipping&#62;</th>
                                    <td>The shipping price.</td>
                                </tr>
                                <tr>
                                    <th>&#60;subtotal&#62;</th>
                                    <td>Sum of the order's line-item prices after any line-item discount or cart discount has been deducted. The subtotal doesn't include taxes (unless taxes are included in the prices), shipping costs, or tips.</td>
                                </tr>
                                <tr>
                                    <th>&#60;tax&#62;</th>
                                    <td>The combined taxes of all the items in the order.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressName&#62;</th>
                                    <td>The name for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressAddress1&#62;</th>
                                    <td>The Address 1 for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressAddress2&#62;</th>
                                    <td>The Address 2 for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressZip&#62;</th>
                                    <td>The Zip Code for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressCity&#62;</th>
                                    <td>The City for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressProvince_code&#62;</th>
                                    <td>The Province Code for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;shippingAddressCountry&#62;</th>
                                    <td>The Country for the shipping address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressName&#62;</th>
                                    <td>The name for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressAddress1&#62;</th>
                                    <td>The Address 1 for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressAddress2&#62;</th>
                                    <td>The Address 2 for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressZip&#62;</th>
                                    <td>The Zip Code for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressCity&#62;</th>
                                    <td>The City for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressProvince_code&#62;</th>
                                    <td>The Province Code for the billing address.</td>
                                </tr>
                                <tr>
                                    <th>&#60;billingAddressCountry&#62;</th>
                                    <td>The Country for the billing address.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    )
}