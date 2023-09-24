window.onload = loader();
let currentWindowBtn, currentWindowContainer;
let searchResult; 

function loader(){
    document.querySelector('.add_money_btn').addEventListener('click', addMoneyHandler)
    document.querySelector('.send_money_btn').addEventListener('click', sendMoneyHandler)
    document.querySelector('.transaction_history_btn').addEventListener('click', transactionHistoryHandler)

    // search user
    user_search_btn.addEventListener('click', findUser)
    user_search_input.addEventListener('keydown', (e  )=>{
        if(e.key == "Enter") findUser();
    })

    // add money
    add_money_input.addEventListener('input', (e) => {
        if(e.target.value > 100000){
            e.target.value = parseInt(e.target.value / 10);
        }
        const decimalPlaceCount = e.target.value.split('.')[1]?.length || 0
        if(decimalPlaceCount >= 2){
            e.target.value = Math.floor(parseFloat(e.target.value) * 100) / 100
        }
    })
    pay_btn.addEventListener('click', pay_money)

    select_this_user_btn.addEventListener('click', ()=>{
        input_send_amount_container.classList.remove('d-none')
    })
    continue_payment_btn.addEventListener('click', sendToUserHandler)
}

function changeWindow(btn, header, container){
        btn.classList.add("active");
        if(currentWindowBtn) currentWindowBtn.classList.remove('active');
        currentWindowBtn = btn

        container.classList.remove('d-none');
        if(currentWindowContainer) currentWindowContainer.classList.add('d-none');
        currentWindowContainer = container

        document.querySelector('.operation_header').innerHTML = header
        document.querySelector('.operationContainer').classList.remove('d-none')
}

function addMoneyHandler(e){
    let container = document.querySelector('.addMoney')
    changeWindow(e.target, "Add Money", container)
}
function sendMoneyHandler(e){
    let container = document.querySelector('.sendMoney')
    changeWindow(e.target, "Send Money", container)
}
function transactionHistoryHandler(e){
    let container = document.querySelector('.transactionHistory')
    changeWindow(e.target, "Transaction History", container)
}

function findUser(){
    const credential = user_search_input.value;
    const isValidCredential = validateEmail(credential) || validateMobile(credential);

    if(isValidCredential){
        fetch("http://localhost:3000/wallet/find_user?userCredential=" + credential)
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                console.log(data.data)
                searchResult = data.data;
                document.querySelector('.user_tile').classList.remove('d-none')
                document.querySelector('.details .user_name').innerHTML = data.data.name
                document.querySelector('.details .user_credential').innerHTML = credential
            }
            else{
                document.querySelector('.user_tile').classList.add('d-none')
                alert(data.errorMessage)
            }
        })
    }
    else{
        alert("Not a valid credential.")
    }

    function validateEmail(email){
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
            return true;
        } 
        return false;
    }

    function validateMobile(mobile){
        const phoneRegex = /^[6789]\d{9}$/;
        if(phoneRegex.test(mobile)){
            return true;
        }
        return false;
    }
}

async function pay_money() {
    const amount = parseFloat(add_money_input.value);
    const orderId = await createOrder(amount);
    if(orderId){
       showPaymentModal(orderId, amount)
    }
}

async function createOrder(amount){
    return await fetch("http://localhost:3000/wallet/create_payment_order", {
        "method": "POST", 
        "headers": {
            "Content-Type" : "application/json"
        }, 
        "body": JSON.stringify({
            amount: amount
        })
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            return data.orderId
        }
        else{
            alert(data.errorMessage)
            return false;
        }
    })
    .catch( error => {
        console.log(error)
    })
}

function showPaymentModal(orderId, amount){
    var options = {
            "key": "rzp_test_9QykuCGBKbX49p", // Enter the Key ID generated from the Dashboard
            "amount": amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
            "currency": "INR",
            "name": credential,
            "description": "Test Transaction",
            "image": "",
            "order_id": orderId , //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
            "handler": function (response) {
                verifyPayment(response, amount);
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

function verifyPayment(response, amount){
    fetch("http://localhost:3000/wallet/verify_payment", {
        method: "POST", 
        headers: {
            "Content-Type" : "application/json"
        }, 
        body: JSON.stringify({
            response,
            amount,
        })
    })
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            alert("Money sucessfully added to your wallet!");
            balance = data.data
            wallet_balance.innerHTML = data.data.toLocaleString(undefined, { minimumFractionDigits: 2,maximumFractionDigits: 2,})
        }
        else{
            alert(data.errorMessage)
        }
    })
}


function sendToUserHandler(){
    const amount = parseFloat(sendToUserInput.value);
    if(amount > balance) 
        document.querySelector('.insufficient-fund-error').classList.remove('invisible');
    else{
        console.log("wtf")
        document.querySelector('.insufficient-fund-error').classList.add('invisible');
        fetch("http://localhost:3000/wallet/send-to-user", {
            method: "POST", 
            headers: {
                "Content-Type" : "application/json"
            }, 
            body: JSON.stringify({
                receiverID: searchResult._id, 
                amount, 
            })
        })
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                console.log(data.data.toLocaleString(undefined, { minimumFractionDigits: 2,maximumFractionDigits: 2}))
                wallet_balance.innerHTML = data.data.toLocaleString(undefined, { minimumFractionDigits: 2,maximumFractionDigits: 2})
                console.log(wallet_balance)
                alert("Money sucessfully send to the user.")
            }
            else{
                alert(data.errorMessage)
            }
        })
    }
}