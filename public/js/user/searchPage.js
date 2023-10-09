let currentProductSet = product
const filteredList = product.data.map(x => x._id);

function render(currentProductSet = product){
    const resultContainer = document.querySelector("#result-product-container")
    resultContainer.innerHTML = "";
    currentProductSet.data.forEach( (x, index)=>{
        const productCard = createProductTile(x);
        resultContainer.append(productCard);
    })
}

function createProductTile(product){
    // console.log(product)
    let price = product.actualPrice / 100 * (100 - ((product.category?.offer || 0) + product.discount))
    if(price < 0) price = 0;
    price = Math.floor(price)
    let discount = (product.category?.offer || 0) + product.discount;
    if(discount > 100) discount = 100;

    console.log((product.category?.offer || 0) + product.discount, product.category?.offer || 0, product.discount)
    
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
                        <div class="currentprice">₹${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="actualprice">M.R.P: ₹${product.actualPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="discount">(${discount}% off)</div>
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
    productSearch = document.getElementById('productSearch')
    productSearch.addEventListener('click', getData) 
    render()
    populateBrandFilter()
}

function populateBrandFilter(){
    const brands = [];
    currentProductSet.data.map( x => {
        if(brands.indexOf(x.brand) === -1) {
            brands.push(x.brand);
        }
    })
    const brandContainer = document.querySelector('.brand-filter-container');
    // appending brands
    brands.forEach( x => {
        const tile = document.createElement('div')
        const template = `
            <input name="brand" id="${x.toLowerCase()}" type="checkbox" aria-label="Checkbox for following text input">
            <label for="${x.toLowerCase()}">${x}</label>`
        tile.innerHTML = template
        brandContainer.append(tile)
    })

    // adding event listeners
    const brandFilters = Array.from(brandContainer.querySelectorAll('[name="brand"]'))
    brandFilters.forEach(x =>{
        x.addEventListener('click', ()=>{
            let currSelected = brandFilters.filter(x => x.checked)
            let selectedBrands = currSelected.map( x => x.getAttribute('id'))
            console.log(selectedBrands)
            if(selectedBrands.length){
                let currData = {data: currentProductSet.data.filter( x => {
                    return selectedBrands.includes(x.brand.toLowerCase())
                })}
                // currData = currData.filter( x => {
                //     filteredList.includes(x._id);
                // })

                render(currData)
            }
            else{
                render(currentProductSet)
            }
        })
    })
}


function getData(e){
    const searchKey = productSearchInput.value;
    
    if(searchKey && searchKey != ""){
        const url = `http://localhost:3000/get_search_result?searchKey=${searchKey}&p=0`
        fetch(url)
        .then( response => response.json())
        .then( data => {
            currentProductSet = data;
            render();
        })
    }
}

// price filter configuration
const priceFilters = document.querySelectorAll('[name="price"]')
priceFilters.forEach( x => {
    x.addEventListener('change', e => {
        const starting = Number(e.target.dataset.start)
        const ending = Number(e.target.dataset.end);
        render( {data : currentProductSet.data.filter(x => {
            return x.currentPrice >= starting && x.currentPrice <= ending
        })})
    })
})

// free delivery configuration
const freeDelivery = document.querySelector('#payOnDelivery');
freeDelivery.addEventListener('click', (e)=>{
    if(freeDelivery.checked){
        console.log('here')
        render( {data: currentProductSet.data.filter( x => {
            return x.isFreeDelivery
        })})
    }
    else{
        render();
    }
})

// discount filter configuration
const discountFields = document.querySelectorAll('[name="discount"]')
discountFields.forEach( x => {
    x.addEventListener('change', ()=>{
        // console.log(currentProductSet)
        render( {data: currentProductSet.data.filter( product => {
            const discount = product.category?.offer || 0 + product.discount;
            console.log(discount)
            return discount >= x.value
        })})
    })
})

// availability filter configuration
const availabilityField = document.querySelector('#stockOnly');
availabilityField.addEventListener('change', (e)=>{
    if(availabilityField.checked){
        console.log({data: currentProductSet.data.filter( x => {
            return x.stock
        })})
        render( {data: currentProductSet.data.filter( x => {
            return x.stock
        })})
    }
})

// price sort configuration
const priceSortFields = document.querySelectorAll('[name="priceSort"]')
priceSortFields.forEach( x => {
    x.addEventListener('change', (e)=>{
        let sortingFunc;
        if(e.target.value == 'acc'){
            sortingFunc = accPriceSort;
        }
        else{
            sortingFunc = decPriceSort;
        }

        render( {data: currentProductSet.data.sort(sortingFunc)})
    })

    function accPriceSort(a, b){
        return a.currentPrice - b.currentPrice
    }
    function decPriceSort(a, b){
        return b.currentPrice - a.currentPrice
    }
})


configure();