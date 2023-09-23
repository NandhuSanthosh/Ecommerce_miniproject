
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const cancelationOptions = ["I found a better deal elsewhere.", "I no longer need the product.", "I ordered the wrong item by mistake.", "The estimated delivery time is too long."]
const returnOptions = ["The item arrived in a damaged or defective condition.", "The product received does not match the one ordered.", "The product did not meet the expected quality or performance standards.", "The product is missing components or accessories."]

let currentFilter = "orders"

function createOrderTile(order){
    const template = createOrderTemplate(order)

    const div = document.createElement('div');
    div.innerHTML = template;

    // populating products in the order tile
    const productListContainer = div.querySelector('.product-details')
    order.products.forEach( x => {
        productListContainer.insertAdjacentHTML('beforeend' ,createProductTile(x.product))
    })

    // required elements
    const toggleCancelFormBtn = div.querySelector('.toggle-cancel-form');
    const toggleReturnBtn = div.querySelector('.return-button');
    const cancelReturnBtn = div.querySelector('.cancel-return');
    const cancelSubmitBtn = div.querySelector(".submitCancelationBtn");
    const returnSubmitBtn = div.querySelector('.submitReturnBtn')
    const cancelBtn = div.querySelector(".cancel-return")
    const complete_order_btn = div.querySelector('.complete_order_btn')
    console.log(complete_order_btn)
    
    // adding eventlisteners
    toggleCancelFormBtn.addEventListener('click', toggleFormHandler(div.querySelector('.cancel-form')))
    toggleReturnBtn.addEventListener('click', toggleFormHandler(div.querySelector('.return-form')))
    cancelSubmitBtn.addEventListener('click', removeOrderHandler(order._id, div))
    returnSubmitBtn.addEventListener('click', returnOrderHandler(order._id, div))
    cancelBtn.addEventListener('click', cancelReturnHandler(order._id, div))
    complete_order_btn.addEventListener('click', ()=> {
        location.assign("http://localhost:3000/order/get_checkout_page/"+order._id)
    })


    // configuation function
    resetControllerButtons(order.status, toggleCancelFormBtn, toggleReturnBtn, cancelReturnBtn, complete_order_btn)
    configureForm(div, cancelSubmitBtn, div.querySelector('.cancelation-reason-input-field'), "cancelation-options", div.querySelector('.cancelation-options'), cancelationOptions)
    configureForm(div, returnSubmitBtn, div.querySelector('.return-reason-input-field'), "return-options", div.querySelector('.return-options'), returnOptions)
    return div;
}


function createOrderTemplate(order){
    const totalPrice = order.payable.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let {orderPlacedDate, deliveryExtimate} = orderStageFormatter(order)
    const address = order.userAddressId 

    const template = `
     <div class="order-item-container mb-3">
                                        <div class="section-one p-2">
                                            <div class="section-content">
                                                <div class="d-flex justify-content-between">
                                                    <div class="d-flex gap-lg-5 gap-md-4 gap-sm-3 gap-3">
                                                        <div class="order-date">
                                                            <div>
                                                                <span>ORDER PLACED</span>
                                                            </div>
                                                            <div class="section-value">
                                                                <span>${orderPlacedDate}</span>
                                                            </div>
                                                        </div>
                                                        <div class="total-price">
                                                            <div>
                                                                <span>TOTAL PRICE</span>
                                                            </div>
                                                            <div  class="section-value">
                                                                <span>₹${totalPrice}</span>
                                                            </div>
                                                        </div>
                                                        <div class="ship-to">
                                                            <div>
                                                                <span>SHIP TO</span>
                                                            </div>
                                                            <div  class="section-value position-relative show-detials-on-hover">
                                                                <span class="link">${typeof address == 'object' ? address.fullName : "undefined"}</span>

                                                                <div class="position-absolute address-details-container">
                                                                    <div class="position-relative address-details">
                                                                        <span class="fw-bold">${typeof address == 'object' ? address.fullName : "undefined"}</span>
                                                                        <p>${typeof address == 'object' ? address.addressLine1 + ", "  + address.addressLine2 + ", " +
                                                                        address.state + ", " + address.pincode + ", " +
                                                                        address.mobileNumber : "undefined"}
                                                                        India</p>

                                                                        <div class="arrow">

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="section-two p-2">
                                            <div>
                                                <div class="header py-2 ps-1 ${order.status == "Dispatched" ? "text-success" : ""}">
                                                    ${order.status == "Dispatched" ? deliveryExtimate : order.status}
                                                </div>
                                                <div class="product-details">
                                                    
                                                </div>
                                                <div class='d-flex justify-content-end'> 
                                                        <button class='toggle-cancel-form'>
                                                            <span >Cancel Order</span>
                                                        </button>
                                                        
                                                </div>
                                                <div class="d-flex justify-content-end">
                                                    <button class="complete_order_btn">Complete order</button>
                                                </div>
                                                <div class='d-flex justify-content-end'>
                                                    <button class='return-button'>Return Product</button>
                                                </div>
                                                <div class='d-flex justify-content-end'>
                                                    <button class='cancel-return'>Cancel Return</button>
                                                </div>

                                                <div class="cancel-form d-none">
                                                    <div>
                                                        <p class="fw-bold">Select the reason for the order cancelation.</p>
                                                    </div>
                                                    <ul class="cancelation-options list-group list-group-flush">
                                                        
                                                    </ul>
                                                    <input type="text" placeholder="Enter the cancelation reason" class="mb-2 cancelation-reason-input-field d-none form-control">
                                                    <button class="btn btn-primary submitCancelationBtn" disabled> Submit </button>
                                                </div>

                                                <div class="return-form d-none">
                                                    <div>
                                                        <p class="fw-bold">Select the reason for the returning the product.</p>
                                                    </div>
                                                    <ul class="return-options list-group list-group-flush">
                                                        
                                                    </ul>
                                                    <input type="text" placeholder="Enter the reason for returning the product" class="mb-2 return-reason-input-field d-none form-control">
                                                    <button class="btn btn-primary submitReturnBtn" disabled> Submit </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`

    return template;
}

function orderStageFormatter(order){
    let orderPlacedDate, deliveryExtimate;
    if(order.orderCreateAt){
        // orderPlaced date fomatting
        const orderCreateAt = new Date(order.orderCreateAt)
        const day = orderCreateAt.getUTCDate();
        const month = orderCreateAt.getUTCMonth();
        const year = orderCreateAt.getUTCFullYear();
        orderPlacedDate = `${day} ${monthNames[month]} ${year}`
        
        // delivery extimated date formatting
        const today = new Date();
        const extimatedDeliveryDate = new Date(order.extimatedDeliveryDate)
        const timeDifference =  extimatedDeliveryDate - today;
        const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
        if(daysDifference == 0){
            deliveryExtimate = "Arriving Today"
        }
        else if(daysDifference == 1){
            deliveryExtimate = "Arriving Tomorrow"
        }
        else if(daysDifference <= 7){
            const dayIndex = extimatedDeliveryDate.getUTCDay();
            deliveryExtimate = "Arriving " + daysOfWeek[dayIndex];
        }
        else{
            const extimateDay = orderCreateAt.getUTCDate();
            const extimateMonth = orderCreateAt.getUTCMonth();
            const extimateYear = orderCreateAt.getUTCFullYear();
            deliveryExtimate = `${extimateDay} ${monthNames[extimateMonth]} ${extimateYear}`
        }
    }  

    return {orderPlacedDate, deliveryExtimate}
}

function configureForm(div, button, reasonField, name, list, optionList){
    console.log(list)
    optionList.forEach( (x, index)=>{
        list.append(createOptionTile(x, name, index, optionSelectEvent(button, reasonField)))
    })
    list.append(createOptionTile("Other", name, cancelationOptions.length, showInputField))

    function showInputField(){
        button.disabled = true;
        reasonField.classList.remove('d-none')
        reasonField.addEventListener('input', (e)=> {
            console.log(e.target.value.length)
            if(e.target.value.length >= 10){
                button.disabled = false;
            }
            else{
                button.disabled = true;
            }
        })
    }
}


function createOptionTile(x, name, index,  callback){
    const li = document.createElement('li');
    li.classList.add("list-group-item");
    console.log(index)
    const template = `
        <input type="radio" name="${name}" id="${name}-option-${index}" value="${index}">
        <label for="option-${index}">${x}</label>`

    li.innerHTML = template;
    li.querySelector(`#${name}-option-${index}`).addEventListener('click', callback)
    return li;
}

function optionSelectEvent(button, field){
    return ()=>{
            button.disabled = false;
            field.classList.add('d-none')
    }
}


function toggleFormHandler(form){
    return ()=>{
        if(form.classList.contains("d-none")){
            form.classList.remove("d-none")
        }
        else{
            form.classList.add('d-none')
        }
    }
}


function resetControllerButtons(status, removeBtn, returnBtn, cancelReturnBtn, completeBtn){
    removeBtn.classList.add('d-none')
    returnBtn.classList.add('d-none')
    cancelReturnBtn.classList.add('d-none')
    completeBtn.classList.add('d-none')
    if(status == "Order Pending"){
        completeBtn.classList.remove("d-none");
    }
    else if([ "Preparing to Dispatch", "Dispatched", "Out for Delivery"].includes(status)){
        removeBtn.classList.remove('d-none')
    }
    else if(["Delivered"].includes(status)){
        returnBtn.classList.remove('d-none')
    }
    else if(["Return Request Processing", "Return Request Granted"].includes(status)){
        cancelReturnBtn.classList.remove('d-none')
    }
}

function createProductTile(product){
    const template = `
    <div class="d-flex gap-2 gap-md-4 mb-2">
        <div class="image-container">
            <img width="100px" height="100px" src="${product.images[0]}" alt="">
        </div>
        <div>
            <div class="name-container">
                <span>
                    <a href="${"../product_details/" + product._id}">
                        ${product.name}
                    </a>
                </span>
            </div>
        </div>
    </div>`

    return template
    
}

function removeOrderHandler(orderId, container){
    return ()=>{

            const reason = findReason("cancelation-options", container, container.querySelector('.cancelation-reason-input-field'));
            console.log(reason)
            const url = `http://localhost:3000/order/delete_order?id=${orderId}&cancelReason=${reason}`
            fetch(url, {
                method: "DELETE"
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    alert("Order sucessfully cancelled");
                    console.log(data)
                    updateOrderList(orderId, "Canceled")
                    loader()
                }
                else{
                    alert(data.errorMessage)
                    // show failure
                }
            })
    }
}

function returnOrderHandler(orderId, container){
    return ()=>{
            const reason = findReason("return-options", container,  container.querySelector('.return-reason-input-field'));
            console.log(reason)
            const url = `http://localhost:3000/order/return_order?id=${orderId}&returnReason=${reason}`
            fetch(url, {
                method: "PATCH"
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    alert("Order return request sucessfully send.");
                    console.log(data)
                    updateOrderList(orderId, "Return Request Processing")
                    loader()
                }
                else{
                    alert(data.errorMessage)
                    // show failure
                }
            })
    }
}

function cancelReturnHandler(orderId){
    return ()=>{
            const status = confirm("Do you really want to cancel the return request.")
            if(!status) return;

            const url = `http://localhost:3000/order/cancel_return?id=${orderId}`
            fetch(url, {
                method: "PATCH"
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    alert("Order return request is canceled.");
                    console.log(data)
                    updateOrderList(orderId, "Delivered")
                    loader()
                }
                else{
                    alert(data.errorMessage)
                    // show failure
                }
            })
    }
}

function findReason(name, container, inputField){
    console.log(container, name)
    const radioButtons = container.querySelectorAll(`[name="${name}"]`);
    let selectedButton; 
    for(let x of radioButtons){
        console.log(x)
        if(x.checked){
            selectedButton = x;
            break;
        }
    }
    
    console.log(selectedButton.value)
    let reason = cancelationOptions[selectedButton.value];
    if(!reason){
        console.log(inputField)
        return inputField.value;
    }
    else{
        return reason;
    }
}

function updateOrderList(orderId, state){
    userOrders.every( x => {
        if(x._id == orderId){
            x.status = state
            return false;
        }
        return true;
    })
}


function loader(orders = userOrders){
    
    populateOrderList(orders)

    filter_order.addEventListener('click', ()=> {
        if(currentFilter == "orders") return;
        populateOrderList(orders)
        currentFilter = "orders";
    })

    filter_buyAgain.addEventListener( 'click',  () => {
        if(currentFilter == "buyAgain") return;
        populateOrderList( orders.filter( x => {
            if(x.status == "Delivered") return true;
        }))   
        currentFilter = "buyAgain";
    })

    filter_notYetShipped.addEventListener('click', ()=>{
        if(currentFilter == "notYetShipped") return;
        populateOrderList( orders.filter( x => {
            if(["Order Pending", "Preparing to Dispatch"].includes(x.status)) return true;
        }))
        currentFilter = "notYetShipped";
    })

    filter_cancelOrder.addEventListener('click', ()=>{
        if(currentFilter == "canceled") return;
        populateOrderList( orders.filter( x => {
            if(x.status == "Canceled") return true;
        }))
        currentFilter = "canceled"
    })
}

function populateOrderList(orders){
    const orderCountElement = document.querySelector('.order-count');
    orderCountElement.innerHTML = orders.length
    const userOrderList = document.querySelector('.order-list');
    userOrderList.innerHTML = ""
    orders.forEach( x => {
        userOrderList.append(createOrderTile(x));
    })
}
loader();