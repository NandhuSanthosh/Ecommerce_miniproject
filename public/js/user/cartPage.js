

function createTile(product, quantity, index){
    const template = `
            <div class=" product_container position-relative  cart-product-tile-container mb-3">

                <div class="d-flex flex-sm-row mb-5 mb-sm-0">
                    <div class="image_container d-flex">
                        <img src="${product.images[0]}" class="cart-image" alt="">
                    </div>
                    <div class="details px-3 pt-3">
                        <div class="product-name">
                            <a href="/product_details/${product._id}" class="product-link">
                                <p class="cart-product-name mb-1">
                                    ${product.name}
                                </p>
                            </a>
        
                        </div>
                        <div class="rating"></div>
                        <div class="prices d-flex gap-2">
                            <div class="currentprice">₹${(+product.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                        <div class="spacalities_brand">
                            <div class="freedelivery">${product.freeDelivery ? "Free Delivery" : ""}</div>
                            <div class="warranty">${product.warranty} Year Warranty </div>
                        </div>
                        <div class="cart-btn-responsive-position d-flex align-items-center mt-2 mb-2 gap-3">
                        <div class='position-relative'>
                            <div class="incre-decre-btn">
                                <button class="item-count-reduce">-</button>
                                <div class='product-count'>${quantity}</div>
                                <button class="item-count-increment">+</button>
                            </div>
                            <div class="increment-btn-tooltip incrementBtnTooltip d-none">
                                <div class="position-relative ">
                                    Maximum quantity reached.
                                    <div class="left-arrow">
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="vertical-line"></div>
                            <div>
                                <button class="btn btn-link delete-btn">Delete</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>`

            

    const div = document.createElement('div')
    div.innerHTML = template;

    const deleteBtn = div.querySelector('.delete-btn');
    const reduceBtn = div.querySelector('.item-count-reduce')
    const increBtn = div.querySelector('.item-count-increment')
    const productCount = div.querySelector('.product-count')
    deleteBtn.addEventListener('click', deleteCartItem(product._id, loader))

    reduceBtn.addEventListener('click', editCartItem(  -1, productCount, reduceValidator, product, index, increBtn))
    increBtn.addEventListener('click', editCartItem( +1, productCount, incrementValidator, product, index, increBtn))
    if( quantity == product.stock){
        increBtn.disabled = true;
        addLimitReachedToolTip(increBtn, true)
    }

    return div
}

function addLimitReachedToolTip(btn, isAdd){
    if(isAdd){
        btn.addEventListener('mouseover', addToolTip);
        btn.addEventListener('mouseout', removeToolTip)
    }
    else{
        btn.removeEventListener('mouseover', addToolTip)
        btn.removeEventListener('mouseout', removeToolTip)
    }
    
}
function addToolTip(){
    const toolTip = document.querySelector('.incrementBtnTooltip')
    toolTip.classList.remove('d-none')
}

function removeToolTip(){
    const toolTip = document.querySelector('.incrementBtnTooltip')
    toolTip.classList.add('d-none')
}

function editCartItem(quantity, productCount, validation, productList, index, increBtn){
    return ()=>{
        const ogQuantity = product.products[index].quantity
        const newCount = ogQuantity + quantity

        if(validation(ogQuantity, productList.stock)){
            requestCartUpdate(productList._id, newCount)
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    productCount.innerHTML = newCount

                    if(newCount == 0){
                        // 
                        updateProductListDelete(productList._id);
                        loader();
                        return;
                    }
                    if( newCount == productList.stock){
                        increBtn.disabled = true;
                        addLimitReachedToolTip(increBtn, true)
                    }
                    else{
                        addLimitReachedToolTip(increBtn, false)
                        increBtn.disabled = false;
                    }
                    if(newCount != 0){
                        product.products[index].quantity = newCount;
                    }

                    const insights = getInsight();
                    udpateInsight(insights);
                }
                else{
                    showModal(data.errorMessage)
                }
            })
        }
        else{
            console.log("Something went wrong")
        }
    }
}

function reduceValidator(value){
    if(value > 0) return true;
}
function incrementValidator(value, stock){
    if(value < stock) return true
}

function deleteCartItem(prodcutId, rerender) {
    return ()=>{
        requestCartUpdate(prodcutId, 0)
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                showModal("Product sucessfully deleted from your cart.");
                updateProductListDelete(prodcutId);
                rerender();
            }
            else{
                showModal(data.errorMessage)
            }
        })
    }
}

function updateProductListDelete(productId) {
    const productList = product.products;
    product.products = productList.filter( x => {
        if(x.productId._id != productId){ 
            return true};
    })
}

function requestCartUpdate(productId, quantity){
    return fetch("http://localhost:3000/add_routes", {
        method: "POST", 
        headers: {
            "Content-Type" : "application/json"
        },
        body: JSON.stringify({
            productId, 
            quantity 
        })
    })
}



function loader(){
    const container = document.getElementById('products-container');
    container.innerHTML = ""
    
    const productList = product.products;
    if(productList.length == 0){
        document.querySelector('.cart-insight-container').classList.add('d-none')
        document.querySelector('.noProductMessage').classList.remove('d-none')
    }
    else{
        document.querySelector('.cart-insight-container').classList.remove('d-none')
        document.querySelector('.noProductMessage').classList.add('d-none')
    }
    productList.forEach( (x, index)=> {
        container.append( createTile(x.productId, x.quantity, index) )
    })
    const insights = getInsight();
    udpateInsight(insights);
}

function udpateInsight(insights){
    const container = document.querySelector('.cart-insight-container')
    if(insights.isFreeDeliveryEligible){
        container.querySelector('.freeDeliveryEligilityText').innerHTML = "Your order is eligible for FREE Delivery" ;
        container.querySelector('.tick').classList.remove('d-none')
        container.querySelector('.cross').classList.add('d-none')
        container.querySelector('.free-delivery-status').classList.remove('failure')
        container.querySelector('.free-delivery-status').classList.add('success')
    }
    else{
        container.querySelector('.tick').classList.add('d-none')
        container.querySelector('.cross').classList.remove('d-none')
        container.querySelector('.free-delivery-status').classList.add('failure')
        container.querySelector('.free-delivery-status').classList.remove('success')
        container.querySelector('.freeDeliveryEligilityText').innerHTML = "Your order is not eligible for FREE Delivery";
    }

    container.querySelector('.total-count').innerHTML = insights.count
    container.querySelector('.total-price').innerHTML = insights.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    container.querySelector('.total-discount').innerHTML = (insights.ogTotal - insights.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

}

function getInsight(){
    const insightDetails = {
        isFreeDeliveryEligible: true,
        count : 0, 
        total : 0, 
        ogTotal : 0,
    };
    product.products.forEach( x => {
        insightDetails.isFreeDeliveryEligible &&= x.productId.isFreeDelivery
        insightDetails.count += x.quantity;
        insightDetails.total += x.productId.currentPrice * x.quantity, 
        insightDetails.ogTotal += x.productId.actualPrice * x.quantity
    })


    return insightDetails;
}


function showModal(message){
    $('#exampleModal').modal();
    document.getElementById('modelContent').innerHTML = message
}

loader();