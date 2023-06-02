import { useAppQuery } from "../hooks";
import { useNavigate } from 'react-router-dom';
export default function payConfirm(){
    const queryParameters = new URLSearchParams(window.location.search)
    const charge_id = queryParameters.get("charge_id")
    const navigateTo = useNavigate();

    const{ data }=useAppQuery({
        url:"/api/payment/confirm?charge_id="+charge_id,
        reactQueryOptions: {
            onSuccess: (data) => {
                navigateTo('/plans');
            },
        }, 
      },[]);
      
    return (
        <></>
    )
}