

function createTile(product){
    console.log(product)
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
    deleteBtn.addEventListener('click', deleteCartItem(product._id))


    return div
}


function deleteCartItem(productId){
    return ()=>{
        fetch("http://localhost:3000/wishlist/remove_from_wishList?productId="+productId, {
            method: "DELETE"
        })
        .then( response => response.json())
        .then( data => {
            if(data.isSuccess){
                updateProductList(productId);
                loader();
            }
            else{
                showModal(data.errorMessage)
            }
        })
    }
}

function updateProductList(productId){
    product = product.filter( x => {
        if(x._id == productId) return false;
        return true;
    })
}



function loader(){
    const container = document.getElementById('products-container');
    container.innerHTML = ""
    
    const productList = product;
    if(productList.length == 0){
        document.querySelector('.noProductMessage').classList.remove('d-none')
    }
    else{
        document.querySelector('.noProductMessage').classList.add('d-none')
    }
    productList.forEach( (x)=> {
        container.append( createTile(x) )
    })
}


function showModal(message){
    $('#exampleModal').modal();
    document.getElementById('modelContent').innerHTML = message
}

window.onload = loader;
