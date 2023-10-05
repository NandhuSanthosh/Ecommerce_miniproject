console.log(userAddress)
console.log(order)

let walletBalance;

const validateObject = [{
    name: "fullName",
    field: addressFullName, 
    validateFunction: validateFullName
}, {
    name: "mobileNumber", 
    field: addressMobile, 
    validateFunction: validatePhoneNumber
}, {
    name: "pincode", 
    field: addressPincode, 
    validateFunction: validatePinCode
}, {
    name: "addressLine1", 
    field: addressAddressLine1,
    validateFunction: validate
}, {
    name: "addressLine2", 
    field: addressAddressLine2,
    validateFunction: validate
}, {
    name: "landmark", 
    field: addressLandmark,
    validateFunction: validate
}, {
    name: "state", 
    field: addressState,
    validateFunction: validateIndianState
}]

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
    document.querySelector('.coupon-discount-info').classList.add('d-none')

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

    addAddressBtn.addEventListener('click', addAddressEventHandler.bind(this))
}

function addAddressEventHandler(){
    const {isValid, updatedFields, error} = findUpdatedFieldsNewAddress();
    if(isValid){
        // request
        const body  = {addressDetails: updatedFields}
        fetch("http://localhost:3000/add_address", {
            method: "POST", 
            headers: {
                'Content-Type': 'application/json'
            }, 
            body: JSON.stringify(body)
        })
        .then (response => response.json())
        .then (data => {
            if(data.isSuccess){
                alert("New address created")
                console.log(data)
                userAddress.push(data.newAddress)
                injectUserAddress();
                address_collapse_btn.click()
            }
            else{
                alert(data.errorMessage)
            }
        })
    }
    else{
        const errorString = error.reduce( (acc, x) => acc + x + "\n", "")
        alert(errorString)
    }
}   


function findUpdatedFieldsNewAddress(){
    let isStatus = true;
    const errorArray = []
    const result = validateObject.reduce( (acc,x) => {
        const result = x.validateFunction(x.field.value)
        if(result.isValid)
            acc[x.name] = x.field.value
        else{
            isStatus = false;
            errorArray.push(result.error)
        }
        return acc;
    }, {})
    if(isStatus){
        return {isValid: true, updatedFields: result}
    }
    else{
        return {isValid: false, error: errorArray}
    }
}
function paymentMethodConfig(){
    //wallet balance update
    fetch("http://localhost:3000/wallet/get_balance")
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            walletBalance = data.data.balance
            document.querySelector('.wallet_balance').innerHTML = (data.data.balance || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        else{
            alert(data.errorMessage)
        }
    })

    // 
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
    else if(paymentMethod == 'wallet'){
        if(walletBalance < order.payable){
            return alert("Insufficient fund in wallet.")
        }
        completeCheckout(addressId, paymentMethod)
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
            alert(data.errorMessage);
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
                "key": "rzp_test_vL7wkDlMCiOlxh", // Enter the Key ID generated from the Dashboard
                "amount": order.totalPrice, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
                "currency": "INR",
                // "name": order.userCredential,
                "description": "Test Transaction",
                "image": "",
                "order_id": orderId , //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
                "handler": function (response) {
                    // alert(response.razorpay_payment_id);
                    // alert(response.razorpay_order_id);
                    // alert(response.razorpay_signature)
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



function validateFullName(fullName){
    var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
    if(regName.test(fullName)){
        return {isValid: true};
    }
    return {isValid: false, error: "Name is not valid"};
}
function validatePhoneNumber(number){
    const indianPhoneNumberRegex = /^[6789]\d{9}$/;
    if(indianPhoneNumberRegex.test(number)){
        return {isValid: true}
    }
    return {isValid: false, error: "Phone number is not valid"}
}
function validatePinCode(pincode){
    const indianPINCodeRegex = /^[1-9][0-9]{5}$/;
    if(indianPINCodeRegex.test(pincode)){
        return{isValid: true}
    }
    return {isValid: false, error: "Pincode is not valid"}
}
function validate(address) {
    const trimmedAddress = address.trim();
    if (trimmedAddress.length === 0) {
        return {isValid: false, error: "Address not valid"};
    }
    return {isValid: true};
}
function validateIndianState(state) {
    // List of valid Indian states
    const validStates = [
        "Andaman and Nicobar Islands",
        "Andhra Pradesh",
        "Arunachal Pradesh",
        "Assam",
        "Bihar",
        "Chandigarh",
        "Chhattisgarh",
        "Dadra and Nagar Haveli and Daman and Diu",
        "Delhi",
        "Goa",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu and Kashmir",
        "Jharkhand",
        "Karnataka",
        "Kerala",
        "Ladakh",
        "Lakshadweep",
        "Madhya Pradesh",
        "Maharashtra",
        "Manipur",
        "Meghalaya",
        "Mizoram",
        "Nagaland",
        "Odisha",
        "Puducherry",
        "Punjab",
        "Rajasthan",
        "Sikkim",
        "Tamil Nadu",
        "Telangana",
        "Tripura",
        "Uttar Pradesh",
        "Uttarakhand",
        "West Bengal",
    ];

    // Convert the input to title case for comparison
    const formattedState = state.trim().toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    // Check if the input matches a valid state
    if(validStates.includes(formattedState)){
        return {isValid: true}
    }
    return {isValid: false, error: "State is not valid"}
    return ;
}

placeOrderBtn.addEventListener('click', placeOrderHandler)

config();