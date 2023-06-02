document.addEventListener("DOMContentLoaded", () => {
    var checklabels = document.getElementsByClassName("easysubwidgetboxselectionoptionlabelclick");
    if( checklabels.length > 0 ){
        var inputVariantElemennt = document.querySelector('[name="id"]');
        const addToCartForm = document.querySelectorAll('form');
        if( addToCartForm.length > 0 ){
        addToCartForm.forEach((element,index) => {
            var addToCartFormSellingPlan = element.querySelectorAll('input[name="selling_plan"]');
            if( addToCartFormSellingPlan.length > 0 ){}else{
            var addToCartFormSellingPlanButton = element.querySelectorAll('[type="submit"]');
            if( addToCartFormSellingPlanButton.length > 0 ){
                var addToCartFormSellingPlanInput = element.querySelectorAll('[name="id"]');
                if( addToCartFormSellingPlanInput.length > 0 ){
                var checkVariantValue = addToCartFormSellingPlanInput[0].value;
                var addToCartFormSellingPlanCurrentInput = document.querySelectorAll('[name="easy_product_variants"]');
                if( addToCartFormSellingPlanCurrentInput.length > 0 ){
                    var currentVariantIds = addToCartFormSellingPlanCurrentInput[0].value;
                    currentVariantIds = currentVariantIds.split(",");
                    var find = 0;
                    currentVariantIds.forEach(function(value){
                    if( value == checkVariantValue ){
                        find = 1;
                        inputVariantElemennt = addToCartFormSellingPlanInput[0];
                    }
                    });
                    if( find == 1 ){
                    var sellingPlan = document.querySelectorAll('[name="easy_selling_plan"]');
                    var sellingPlanIdReq = sellingPlan[0].getAttribute('data-require');
                    var sellingPlanId = sellingPlan[0].value;
                    var addToCartFormSellingPlanElement = document.createElement("input");
                    addToCartFormSellingPlanElement.setAttribute("type", "hidden");
                    addToCartFormSellingPlanElement.setAttribute("name", "selling_plan");
                    if( sellingPlanIdReq == 'true' ){
                        addToCartFormSellingPlanElement.value=sellingPlanId;
                    }
                    element.appendChild(addToCartFormSellingPlanElement);
                    }
                }
                }
            }
            }
        });
        }
        var interval = window.setInterval(function(){easyCheckVariants(inputVariantElemennt)},500);
        function easyCheckVariants(element){ 
        var variantPrice = document.getElementById("easysubpricevariant-"+element.value);
        var orignalPrice = variantPrice.getAttribute('data-price');
        var discountPrice = variantPrice.getAttribute('data-subprice');
        var easysubpricelabels = document.querySelectorAll('.easysubwidgetboxselectionoptionprice');
        easysubpricelabels.forEach((element,index) => {
            var dataType = easysubpricelabels[index].getAttribute('data-type');
            if( dataType == 'sub' ){
                easysubpricelabels[index].innerText=discountPrice;
            }else{
                easysubpricelabels[index].innerText=orignalPrice;
            }
        });
        }
        for (var i = 0; i < checklabels.length; i++) {
            checklabels[i].addEventListener('click', checklabelAction, false);
        }
        function checklabelAction(){
            const allChecklabels = document.querySelectorAll('.easysubwidgetboxselectionoptionlabelclick');
            allChecklabels.forEach((element) => {
            element.classList.remove('checked');
            });
            this.classList.add('checked');
            var selection = this.getAttribute("data-purchase");
            var sellingPlan = document.querySelectorAll('[name="easy_selling_plan"]');
            var sellingPlanAdd = document.querySelectorAll('[name="selling_plan"]');
            var sellingPlanId = sellingPlan[0].value;
            sellingPlan.forEach((element,index) => {
            if( sellingPlan[index].tagName.toLowerCase() == 'select' ){
                sellingPlanId = sellingPlan[index].value;
            }else{
                if( sellingPlan[index].checked ){
                sellingPlanId = sellingPlan[index].value
                }
            }
            });
            if( selection == 'subscribe' ){
            const allCheckPlans = document.querySelectorAll('.easysubwidgetboxselectionoptionplans');
            allCheckPlans.forEach((element) => {
                element.style.display="block";
            });
            sellingPlanAdd[0].value=sellingPlanId;
            }else{
            const allCheckPlans = document.querySelectorAll('.easysubwidgetboxselectionoptionplans');
            allCheckPlans.forEach((element) => {
                element.style.display="none";
            });
            sellingPlanAdd[0].value="";
            }
        }
        var sellingPlan = document.querySelectorAll('[name="easy_selling_plan"]');
        for (var i = 0; i < sellingPlan.length; i++) {
            sellingPlan[i].addEventListener('change', sellingPlanChange, false);
        }
        function sellingPlanChange(){
        var sellingPlanValue = this.value;
        var sellingPlanAdd = document.querySelectorAll('[name="selling_plan"]');
        sellingPlanAdd[0].value=sellingPlanValue;
        }
    }
});