
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const cancelationOptions = ["I found a better deal elsewhere.", "I no longer need the product.", "I ordered the wrong item by mistake.", "The estimated delivery time is too long."]


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
    const returnBtn = div.querySelector('.return-button');
    const cancelReturnBtn = div.querySelector('.cancel-return');
    
    // adding eventlisteners
    toggleCancelFormBtn.addEventListener('click', toggleFormHandler(div.querySelector('.cancel-form')))
    div.querySelector('.submitCancelationBtn').addEventListener('click', removeOrderHandler(order._id, div))
    
    // configuation function
    resetControllerButtons(order.status, toggleCancelFormBtn, returnBtn, cancelReturnBtn)
    configureCancelationForm(div, order._id)
    return div;
}

function createOrderTemplate(order){
    const totalPrice = order.totalPrice.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                                                <div class='d-flex justify-content-end'>
                                                    <button class='return-button'>Return</button>
                                                </div>
                                                <div class='d-flex justify-content-end'>
                                                    <button class='cancel-return'>Cancel Return</button>
                                                </div>

                                                <div class="cancel-form d-none">
                                                    <div>
                                                        <p class="fw-bold">Select the reason for the order cancelation</p>
                                                    </div>
                                                    <ul class="cancelation-options list-group list-group-flush">
                                                        
                                                    </ul>
                                                    <input type="text" placeholder="Enter the cancelation reason" class="mb-2 cancelation-reason-input-field d-none form-control">
                                                    <button class="btn btn-primary submitCancelationBtn" disabled> Submit </button>
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

function configureCancelationForm(div, orderId){
    cancelationOptions.forEach( (x, index)=>{
        div.querySelector('.cancelation-options').append(createOptionTile(x, "cancelation-options", index, optionSelectEvent(div.querySelector(".submitCancelationBtn"), div.querySelector('.cancelation-reason-input-field'))))
    })
    div.querySelector('.cancelation-options').append(createOptionTile("Other", "cancelation-options", cancelationOptions.length, showInputField))

    function showInputField(){
        div.querySelector(".submitCancelationBtn").disabled = true;
        const inputField = div.querySelector('.cancelation-reason-input-field')
        inputField.classList.remove('d-none')
        inputField.addEventListener('input', (e)=> {
            console.log(e.target.value.length)
            if(e.target.value.length >= 10){
                div.querySelector(".submitCancelationBtn").disabled = false;
            }
            else{
                div.querySelector(".submitCancelationBtn").disabled = true;
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


function resetControllerButtons(status, removeBtn, returnBtn, cancelReturnBtn){
    removeBtn.classList.add('d-none')
    returnBtn.classList.add('d-none')
    cancelReturnBtn.classList.add('d-none')
    if(["Order Pending", "Preparing to Dispatch", "Dispatched", "Out for Delivery"].includes(status)){
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
        const status = confirm("Do you really want to cancel this order!")
        if(status){

            const reason = findReason("cancelation-options", container);
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
                    updateOrderList(orderId)
                    loader()
                }
                else{
                    alert(data.errorMessage)
                    // show failure
                }
            })
        }
    }
}

function findReason(name, container){
    const radioButtons = container.querySelectorAll(`[name="${name}"]`);
    let selectedButton; 
    console.log(radioButtons)
    for(let x of radioButtons){
        if(x.checked){
            selectedButton = x;
            break;
        }
    }
    
    let reason = cancelationOptions[selectedButton.value];
    if(!reason){
        return container.querySelector('.cancelation-reason-input-field').value;
    }
    else{
        return reason;
    }
}

function updateOrderList(orderId){
    userOrders.every( x => {
        if(x._id == orderId){
            x.status = "Canceled"
            return false;
        }
        return true;
    })
}


function loader(orders = userOrders){
    const userOrderList = document.querySelector('.order-list');
    const orderCountElement = document.querySelector('.order-count');
    orderCountElement.innerHTML = orders.length
    userOrderList.innerHTML = ""
    orders.forEach( x => {
        userOrderList.append(createOrderTile(x));
        
    })
}
loader();