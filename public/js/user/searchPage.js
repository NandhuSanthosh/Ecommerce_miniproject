let currentProductSet = product
console.log(totalProducts)

function render(){
    const resultContainer = document.querySelector("#result-product-container")
    resultContainer.innerHTML = "";
    console.log(currentProductSet)
    currentProductSet.data.forEach( (x, index)=>{
         const productCard = createProductTile(x);
        console.log(productCard);
        resultContainer.append(productCard);
    })
}

function createProductTile(product){
    console.log(product.images[0])
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
    productSearch.addEventListener('click', getData) 
    render()
}



function getData(e){
    const searchKey = productSearchInput.value;
    
    if(searchKey && searchKey != ""){
        const url = `http://localhost:3000/get_search_result?searchKey=${searchKey}&p=0`
        console.log(url)
        fetch(url)
        .then( response => response.json())
        .then( data => {
            currentProductSet = data;
            render();
        })
    }
}

configure();