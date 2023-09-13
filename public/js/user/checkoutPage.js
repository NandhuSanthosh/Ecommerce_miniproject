console.log(userAddress)
console.log(order)

function injectUserAddress(){
    const addressContainer = document.querySelector('.address-list');
    addressContainer.innerHTML = ""
    userAddress.forEach( (x, index) => {
        addressContainer.append(createUserAddressTile(x, index))
    })
}

function injectInsightDetails(){
    let total = order.totalPrice;
    document.querySelector('.payable').innerHTML = '₹' + order.totalPrice.toLocaleString();
    if(order.isFreeDelivery){
        document.querySelector('.delivery-charge').innerHTML = order.deliveryCharge
        document.querySelector('.delivery-charge').classList.add('cross')
    }
    else
        total += order?.deliveryCharge;

    const discountPercentage = Math.floor(order.discount / ((order.totalPrice+order.discount) / 100))
    document.querySelector('.total .amount').innerHTML = '₹' + total.toLocaleString()
    document.querySelector('.discount-figure').innerHTML = order.discount.toLocaleString();
    document.querySelector('.discount-percentage').innerHTML = discountPercentage
}

function createUserAddressTile(x, index){
    const template = `
                        <input type="radio" name="address" class="mt-2" value=${x._id}>
                        <div class="address-content">
                            <p><span class="fw-bold">${x.fullName}</span> ${x.addressLine1 + " " + x.addressLine2 + " " + x.state + " " + x.pincode + " Phone Number: " + x.mobileNumber}
                            <button class="btn btn-link">Edit Address</button>
                            </p>
                        </div>`

    const div = document.createElement('div')
    div.classList.add('address', 'd-flex', 'align-items-start', 'gap-2', 'mb-2')
    div.innerHTML = template;
    if(index == 0){
        div.classList.add('current')
        div.querySelector('input').checked = true
    }
    return div
}


function config(){
    injectUserAddress();
    injectInsightDetails();
}

function placeOrderHandler(){
    // collect data
    // collect address id
    const addressList = document.getElementsByName('address')
    let addressId;
    addressList.forEach( x => {
        if(x.checked) addressId = x.value;
    })
    const paymentMethodList = document.getElementsByName('payment-method')
    let paymentMethod;
    paymentMethodList.forEach( x => {
        if(x.checked) paymentMethod = x.value
    })
    // collect payment method id
    console.log(order)
    if(!paymentMethod) alert("Please select one payment method.")
    else
    fetch("http://localhost:3000/order/complete_order/" + order._id, {
        method: "PATCH", 
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            addressId,
            paymentMethod
        })
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            alert("Order sucessfully placed.")
            location.assign(data.redirect);
        }
        else{
            alert(data.isFailure);
        }
    })
    // post
}

placeOrderBtn.addEventListener('click', placeOrderHandler)

config();