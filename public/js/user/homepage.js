

async function loader(){
    const topSectionUrl = "http://localhost:3000/highlights/get_top_section"
    const highlights = await fetchHighlights(topSectionUrl);
    if(highlights){
        const section = createSection(highlights);
        document.querySelector("main").innerHTML = "";
        document.querySelector("main").append(section);
    }
    const fillerContent = await fetchHighlights("http://localhost:3000/highlights/get_highlights")
    fillerContent.forEach( x => {
        const section = createSection(x);
        document.querySelector("main").append(section);
    })
}

loader();

function  fetchHighlights(url){
    return fetch(url)
    .then( response => response.json())
    .then( data => {
        if(data.isSuccess){
            return data.data;
        }
        else{
            alert(data.errorMessage)
        }
    })
}

function createSection(highlights){
    const section = document.createElement('section');
    section.classList.add('container-fluid', 'my-5');

    section.innerHTML = `
    <div class="sectionHeader px-5">
        <h3 class="fw-bold">${highlights.highlight}</h3>
    </div>`

    const productContainer = document.createElement('div');
    productContainer.classList.add("productSection" ,"scroll-hidden", "px-5")
    highlights.products.map( x =>  {
        productContainer.append(createProductTileOne(x));
    })

    section.append(productContainer)
    return section;
}

function createProductTileOne(product){
    console.log(product)
    let price = product.actualPrice / 100 * (100 - (product.category?.offer || 0 + product.discount))
    if(price < 0) price = 0;
    let discount = product.category?.offer || 0 + product.discount;
    if(discount > 100) discount = 100;

    const template = 
    `<a href="${"http://localhost:3000/product_details/" + product._id}" class="product_link">
            <div class="product-image-container">
                <img width="100%" src="${product.images[0]}" alt="">
            </div>
            <div class="details-container p-3">
                <div class="details-row-one"></div>
                <div class="details-row-two d-flex justify-content-between align-items-center">
                    <div class="product-details">
                        <div class="product-name">
                            ${product.brand + " " + product.modelName}
                        </div>
                        <div class="product-price-details">
                            <span class="payable-price">$${price}</span>
                            <span class="line-through og-price">$${product.actualPrice}</span>
                        </div>
                        <div>
                            <span class="proudct-discount">${discount}% off</span>
                        </div>
                    </div>
                    <div class="btn-container">
                        <button class="addToCart-btn">Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
    </a>`

    const productContainer = document.createElement('div');
    productContainer.classList.add("product-container");
    productContainer.innerHTML = template;
    return productContainer;
}