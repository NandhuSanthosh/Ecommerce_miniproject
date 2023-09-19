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

function removeExcessiveEventListeners(blockUser){
    var old_element = blockUser
    var new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);
    return new_element;
}

function injectInsightDetails(order){
    document.querySelector('.without-discounts').innerHTML = '₹' + order.totalPrice.toLocaleString();
    document.querySelector('.discount').innerHTML = '₹' + order.discount.toLocaleString();
    document.querySelector('.delivery-charge').innerHTML = order.delivery.deliveryCharge
    if(order.delivery.isFreeDelivery){
        document.querySelector('.free-delivery-container').classList.remove("d-none")
        document.querySelector('.free-delivery').innerHTML = `- ${order.delivery.deliveryCharge}`
    }


    const discount = order.totalPrice - order.payable
    const discountPercentage = Math.floor(discount / ((order.totalPrice) / 100));
    document.querySelector('.total .amount').innerHTML = '₹' + order.payable.toLocaleString()
    document.querySelector('.discount-figure').innerHTML = discount.toLocaleString();
    document.querySelector('.discount-percentage').innerHTML = discountPercentage


    removeExcessiveEventListeners(document.querySelector('.apply-coupen-btn'))
    removeExcessiveEventListeners(document.querySelector('.remove-coupen-btn'))
    document.querySelector('.apply-coupen-btn').addEventListener('click', applyCoupenCode(order._id))
    document.querySelector('.remove-coupen-btn').addEventListener('click', removeCoupenCode(order._id))

    document.querySelector('.coupen-input').classList.add('d-none')
    document.querySelector('.apply-coupen-btn').classList.add('d-none')
    document.querySelector('.coupen-code-success').classList.add('d-none')
    document.querySelector('.coupen-input').classList.add('d-none')

    document.querySelector('.coupen-input-show-btn').addEventListener('click', ()=>{
        document.querySelector('.coupen-input').classList.remove('d-none')
        document.querySelector('.apply-coupen-btn   ').classList.remove('d-none')
    })

    document.querySelector('.coupen-input').addEventListener('input', (e)=>{
        console.log(e.target.value.length)
        e.target.value = e.target.value.toUpperCase();
        if(e.target.value.length >= 5){
            document.querySelector('.apply-coupen-btn').disabled = false;
        }
        else
        document.querySelector('.apply-coupen-btn').disabled = true;
    })

    if(order.coupon.code){
        document.querySelector('.coupon-discount-info').classList.remove('d-none')
        addCouponAppliedInfo(order.coupon)
    }
    else{
        document.querySelector('.coupen-input-show-button').classList.remove('d-none')
        document.querySelector('.remove-coupen-btn').classList.add('d-none')
    }
}

function applyCoupenCode(orderId){
    return (e)=>{
        const couponCode = document.querySelector('.coupen-input').value;
        const status = /^\S+$/.test(couponCode);
        if(!status){
            alert("Not a valid coupen")
            return;
        }

        fetch("http://localhost:3000/order/apply_coupon?orderId=" + orderId, {
            method: "PATCH", 
            headers: {
                "Content-Type" : "application/json"
            },
            body: JSON.stringify({
                couponCode
            })
        })
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                console.log(data.data)
                order = data.data;
                injectInsightDetails(order)
            }
            else{
                alert(data.errorMessage)
            }
        })
    }
}

function addCouponAppliedInfo(coupon){
    document.querySelector('.coupen-input-show-button').classList.add('d-none')
    document.querySelector('.remove-coupen-btn').classList.remove('d-none')
    document.querySelector('.coupen-code-success').classList.remove('d-none');
    document.querySelector('.coupen-input').classList.add('d-none')
    document.querySelector('.coupon-discount-info').classList.remove('d-none')
    document.querySelector('.coupon-discount').innerHTML = coupon.discountAmount.toLocaleString()
    document.querySelector('.apply-coupen-btn').classList.add('d-none')
    console.log(coupon.code)
    document.querySelector('.coupen_code').innerHTML = coupon.code;
}


function removeCoupenCode(orderId) {
    return (e)=>{
        fetch("http://localhost:3000/order/remove_coupon?orderId=" + orderId, {
            method: "PATCH", 
        })
        .then( response => response.json() )
        .then( data => {
            if(data.isSuccess){
                console.log(data.data)
                order = data.data;
                injectInsightDetails(order)
            }
            else{
                alert(data.errorMessage)
            }
        })
    }
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
    injectInsightDetails(order);
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
            amount: order.payable
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