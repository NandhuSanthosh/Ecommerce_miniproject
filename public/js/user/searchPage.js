let currentProductSet = [{
    "_id": "64eb5b4324966b11356b34c4",
    "name": "ANC 30 Hour Playback",
    "actualPrice": 2299,
    "discount": 15,
    "isFreeDelivery": true,
    "warranty": 1,
    "images": [
        "https://res.cloudinary.com/dh1e66m8m/image/upload/v1693294912/1693294905998.png",
        "https://res.cloudinary.com/dh1e66m8m/image/upload/v1693309402/1693309395347.png"
    ],
    "currentPrice": 29545
}];

function render(){
    const resultContainer = document.querySelector("#result-product-container")
    resultContainer.innerHTML = "";
    currentProductSet.forEach( (x, index)=>{
        const productCard = createProductTile(x);
        console.log(productCard);
        resultContainer.append(productCard);
    })
}

function createProductTile(product){
    const element = `<div class="image_container">
                    <img src="${product.images[0]}" alt="">
                </div>
                <div class="details p-3">
                    <div class="product-name">
                        <a href="/product_details/${product._id}">
                            ${product.name}
                        </a> 
                    </div>
                    <div class="rating"></div>
                    <div class="prices d-flex gap-2">
                        <div class="currentprice">₹${product.currentPrice.toLocaleString()}</div>
                        <div class="actualprice">M.R.P: ₹${product.actualPrice.toLocaleString()}</div>
                        <div class="discount">(${product.discount}% off)</div>
                    </div>
                    <div class="spacalities_brand">
                        <div class="brand">Brand: Sony</div>
                        <div class="freedelivery">Free Delivery</div>
                        <div class="warranty">2 Year Warranty   </div>
                    </div>
                </div>`

    const container = document.createElement('div');
    container.classList.add("product_container", "d-flex", "mb-3")
    container.innerHTML =element
    return container;
}


function configure(){
    console.log('here');
    productSearch = document.getElementById('productSearch')
    console.log(productSearch);
   productSearch.addEventListener('click', getData) 
}

function getData(e){
    const searchKey = productSearchInput.value;
    
    if(searchKey && searchKey != ""){
        const url = `http://localhost:3000/search_product?searchKey=${searchKey}&p=0`
        fetch(url)
        .then( response => response.json())
        .then( data => {
            currentProductSet = data;
            render();
        })
    }
}

configure();