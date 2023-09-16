console.log(userAddress)
console.log(order)


let currAddressContainer, currentPaymentMethodContainer;
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
    div.querySelector('input').addEventListener('click', currentAddressUpdater(div));
    if(index == 0){
        currAddressContainer = div;
        div.classList.add('current')
        div.querySelector('input').checked = true
    }
    return div
}

function currentAddressUpdater(div){
    return ()=>{
        div.classList.add('current');
        currAddressContainer.classList.remove('current');
        currAddressContainer = div;
    }
}


function config(){
    injectUserAddress();
    injectInsightDetails();
    paymentMethodConfig();
}

function paymentMethodConfig(){
    const paymentMethodBtns = document.querySelectorAll('[name = payment-method]')
    paymentMethodBtns.forEach( x => {
        x.addEventListener('click', (e)=>{
            const inptField = e.target
            inptField.parentElement.classList.add('current')
            if(currentPaymentMethodContainer){
                currentPaymentMethodContainer.classList.remove('current');
            }
            currentPaymentMethodContainer = inptField.parentElement;
        })
    })
}

async function placeOrderHandler(){
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
    if(!paymentMethod) {
        alert("Please select one payment method.")
        return;
    }
    else if(paymentMethod == 'online-payment'){
        const orderId = await createOrder();
        await showPaymentModal(orderId, addressId);
    }
    else{
        completeCheckout(addressId, paymentMethod)
    }
    
}

function completeCheckout(addressId, paymentMethod){
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
}

async function createOrder(){
    return await fetch("http://localhost:3000/payment/create_order", {
        "method": "POST", 
        "headers": {
            "Content-Type" : "application/json"
        }, 
        "body": JSON.stringify({
            amount: order.totalPrice
        })
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            return data.orderId
        }
        else{
            return false;
        }
    })
}

function showPaymentModal(orderId, addressId){
    var options = {
                "key": "rzp_test_9QykuCGBKbX49p", // Enter the Key ID generated from the Dashboard
                "amount": order.totalPrice, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                "currency": "INR",
                "name": order.userCredential,
                "description": "Test Transaction",
                "image": "",
                "order_id": orderId , //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                "handler": function (response) {
                    alert(response.razorpay_payment_id);
                    alert(response.razorpay_order_id);
                    alert(response.razorpay_signature)
                    verifyPayment(response, addressId);
                },
                "notes": {
                    "address": "Razorpay Corporate Office"
                },
                "theme": {
                    "color": "#252b1b"
                }
            };
        var rzp1 = new Razorpay(options);

        rzp1.on('payment.failed', function (response) {
            alert(response.error.code);
            alert(response.error.description);
            alert(response.error.source);
            alert(response.error.step);
            alert(response.error.reason);
            alert(response.error.metadata.order_id);
            alert(response.error.metadata.payment_id);
        });
        rzp1.open();
}

function verifyPayment(response, addressId){
    fetch("http://localhost:3000/payment/verify", {
        method: "POST", 
        headers: {
            "Content-Type" : "application/json"
        }, 
        body: JSON.stringify({response})
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess)
        completeCheckout(addressId, "Online-Payment")
        else
        alert("Something went wrong.")
    })
}


placeOrderBtn.addEventListener('click', placeOrderHandler)

config();