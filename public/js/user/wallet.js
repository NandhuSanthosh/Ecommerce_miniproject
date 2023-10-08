window.onload = loader();
let currentWindowBtn, currentWindowContainer;
let searchResult; 
let currentPage = 0;
let dataSet;

function loader(){
    document.querySelector('.add_money_btn').addEventListener('click', addMoneyHandler)
    document.querySelector('.send_money_btn').addEventListener('click', sendMoneyHandler)
    document.querySelector('.transaction_history_btn').addEventListener('click', transactionHistoryHandler)
    document.querySelector('.referal_btn').addEventListener('click', referalHandler )

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

    // send money
    select_this_user_btn.addEventListener('click', ()=>{
        input_send_amount_container.classList.remove('d-none')
    })
    continue_payment_btn.addEventListener('click', sendToUserHandler)

    // transaction history
    document.querySelector('.transaction-history .all_btn').addEventListener('click', (e)=>{
        document.querySelector('.transaction-history-btn-list-container .btn-link.active').classList.remove('active')
        e.target.classList.add("active")
        fetchAndDisplay()
    })
    document.querySelector('.transaction-history .send_btn').addEventListener('click', (e)=>{
        document.querySelector('.transaction-history-btn-list-container .btn-link.active').classList.remove('active')
        e.target.classList.add("active")
        fetchAndDisplay(0, "betweenUsers")
    })
    document.querySelector('.transaction-history .purchase_btn').addEventListener('click', (e)=>{
        document.querySelector('.transaction-history-btn-list-container .btn-link.active').classList.remove('active')
        e.target.classList.add("active")
        fetchAndDisplay(0, "purchase")
    })
    document.querySelector('.transaction-history .refund_btn').addEventListener('click', (e)=>{
        document.querySelector('.transaction-history-btn-list-container .btn-link.active').classList.remove('active')
        e.target.classList.add("active")
        fetchAndDisplay(0, "refund")
    })

    // referal
    document.querySelectorAll('.copy-to-clipboard').forEach( x => {
        x.addEventListener('click', (e)=>{
            navigator.clipboard.writeText(e.currentTarget.dataset.value);
            Swal.fire({
                position: "top",
                icon: 'success',
                title: 'Copied to clipboard!',
                showConfirmButton: false,
                timer: 1000
            }) 
        })
    })
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
    fetchAndDisplay();
}
function referalHandler(e){
    let container = document.querySelector('.referalContainer');
    changeWindow(e.target, "Referals", container)
    fetchReferalLink();
}

function fetchReferalLink(){
    fetch("http://localhost:3000/get_user_referals")
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            //  + " " + data.referalLink
            document.querySelector('.referalCode').innerHTML     = data.referalCode
            document.querySelector('.code-btn').dataset.value = data.referalCode
            document.querySelector('.invite-link-btn').dataset.value = data.referalLink
        }
        else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.errorMessage,
            })  
        }
    })
}

function fetchAndDisplay(pno = 0, currentWindow, e){
    
    fetch("http://localhost:3000/wallet/get_tansaction_history?pno="+pno+`${currentWindow ? "&currentWindow=" + currentWindow : ""}`)
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            console.log(data)
            document.querySelector('.transaction-history-list').innerHTML = ""
            if(data.totalCount){
                data.data.transactions.forEach( x => {
                    document.querySelector('.transaction-history-list').append(createTransactionTile(x))
                })
            }
            else{
                document.querySelector('.transaction-history-list').innerHTML = 
                `
                    <div class="d-flex justify-content-center mt-3">
                        No transactions here.
                    </div>
                `
            }
            currentPage = pno;  
            configurePagination(data.totalCount?.count, pno)
        }
        else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.errorMessage,
                // footer: '<a href="">Why do I have this issue?</a>'
            })
        }
    })
}


function configurePagination(count, currentPage){
    const pagination = document.querySelector(".pagination");

    if(!count || count <= 10) {
        pagination.classList.add('d-none')
        return;
    }
    else{
        pagination.classList.remove("d-none")
    }

    pagination.innerHTML = ""
    const pageCount = Math.floor(count / 10);

    const li = document.createElement('li')
    let template = `<li class="page-item ${currentPage == 0 ? "disabled" : ""}"><a class="page-link" href="#">Previous</a></li>`
    li.innerHTML = template
    if(currentPage != 0) {
        li.addEventListener('click', ()=>{
            fetchAndDisplay(currentPage - 1);
        })
    }
    pagination.append(li)

    for(let i = 0; i<=pageCount; i++){
        const li = document.createElement('li')
        let template = `<li class="page-item ${currentPage == i ? "active" : ""}"><a class="page-link" href="#">${i+1}</a></li>`
        li.innerHTML = template;
        li.addEventListener('click', ()=>{
            fetchAndDisplay(i);
        })
        pagination.append(li)
    }


    const nextLi = document.createElement('li')
    nextLi.innerHTML = `<li class="page-item ${currentPage == pageCount ? "disabled" : ""}"><a class="page-link" href="#">Next</a></li>`
    if(currentPage != pageCount){
        nextLi.addEventListener('click', ()=>{
            fetchAndDisplay(currentPage + 1);
        })
    }
    pagination.append(nextLi)
}

function createTransactionTile({transactions}){

    let userTransactionDoc = transactions;
    let transactionSpecificDoc = transactions.transactionId
    let details;

    if(transactionSpecificDoc.category == "addToWallet"){
        details = "Added money"
    }
    else if(transactionSpecificDoc.category == "refund"){
        details = "Refund from Fortnite"
    }
    else if(transactionSpecificDoc.category == "purchase"){
        details = "Paid to Purchase"
    }
    else if(transactionSpecificDoc.category == 'referal'){
        details = "Referal Reward"
    }
    else{
        details = userTransactionDoc.type == "credit" ? transactionSpecificDoc.senderID[0].name : transactionSpecificDoc.receiverID[0].name
    }

    console.log(details)
    let date = formatDate(transactionSpecificDoc.timestamp);
    const template = `
        <div class="d-flex justify-content-between">
            <div class="details">
                <div class="name">${details}</div>
                <div class="date">${date}</div>
            </div>
            <div class="amount ${userTransactionDoc.type == "credit" ? "text-success" : "text-danger"}">
                <div>${userTransactionDoc.type == "credit" ? "+" : "-"} ₹${transactionSpecificDoc.amount}</div>
            </div>
    </div>`

    const div = document.createElement('div')
    div.classList.add('transaction-tile', 'mb-3');
    div.innerHTML = template;
    return div;
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
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: data.errorMessage,
                    // footer: '<a href="">Why do I have this issue?</a>'
                })
            }
        })
    }
    else{
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: "Not a valid credential.",
            // footer: '<a href="">Why do I have this issue?</a>'
        })
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
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.errorMessage,
                // footer: '<a href="">Why do I have this issue?</a>'
            })
            return false;
        }
    })
    .catch( error => {
        console.log(error)
    })
}

function showPaymentModal(orderId, amount){
    var options = {
            "key": "rzp_test_vL7wkDlMCiOlxh", // Enter the Key ID generated from the Dashboard
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
            Swal.fire({
                position: "top",
                icon: 'Success',
                title: 'Money Credited...',
                text: "Money sucessfully added to your wallet!",
                // footer: '<a href="">Why do I have this issue?</a>'
            })
            balance = data.data
            wallet_balance.innerHTML = data.data.toLocaleString(undefined, { minimumFractionDigits: 2,maximumFractionDigits: 2,})
        }
        else{
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: data.errorMessage,
                // footer: '<a href="">Why do I have this issue?</a>'
            })
        }
    })
}


function sendToUserHandler(){
    const amount = parseFloat(sendToUserInput.value);
    if(amount > balance) 
        document.querySelector('.insufficient-fund-error').classList.remove('invisible');
    else{
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
                Swal.fire({
                    position: "top",
                    icon: 'success',
                    title: 'Send',
                    text: "Money sucessfully send to the user.",
                    // footer: '<a href="">Why do I have this issue?</a>'
                })
            }
            else{
                Swal.fire({

                    icon: 'error',
                    title: 'Oops...',
                    text: data.errorMessage,
                    // footer: '<a href="">Why do I have this issue?</a>'
                })
            }
        })
    }
}


function formatDate(inputDate) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  // Parse the input date string
  const date = new Date(inputDate);

  // Format the date using the specified options
  const formattedDate = date.toLocaleString('en-US', options);

  // Get the AM/PM indicator
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  // Combine the formatted date and AM/PM indicator
  return `${formattedDate}`;
}