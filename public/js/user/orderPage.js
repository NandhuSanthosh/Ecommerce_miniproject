
const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];


function createOrderTile(order){
    console.log(order)
    const totalPrice = order.totalPrice.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                        });


    let orderPlacedDate, deliveryExtimate
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
                                                <div class='d-flex justify-content-end ${order.status == 'Canceled' ? "d-none" : ""}'> 
                                                    <button class='remove-button'>Cancel Order</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`

    const div = document.createElement('div');
    div.innerHTML = template;
    const productListContainer = div.querySelector('.product-details')
    order.products.forEach( x => {
        productListContainer.insertAdjacentHTML('beforeend' ,createProductTile(x.product))
    })

    const removeBtn = div.querySelector('.remove-button');
    removeBtn.addEventListener('click', removeOrderHandler(order._id));

    return div;
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

function removeOrderHandler(orderId){
    return ()=>{
        const status = confirm("Do you really want to cancel this order!")
        if(status){
            fetch("http://localhost:3000/order/delete_order/" + orderId, {
                method: "DELETE"
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    alert("Order sucessfully cancelled");
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

function updateOrderList(orderId){
    userOrders = userOrders.filter( x => {
        if(x._id == orderId) return false;
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