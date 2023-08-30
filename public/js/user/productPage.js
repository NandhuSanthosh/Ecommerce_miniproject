
function injectData(){
    product_name.innerHTML = product.name;
    product_brand.innerHTML = product.brand;
    product_discount.innerHTML = `-${product.discount}%`;
    product_actualPrice.innerHTML = `₹${product.actualPrice.toLocaleString()}`;
    product_currentPrice.innerHTML = `₹${product.currentPrice.toLocaleString()}`;


    updateSpacality(product);
    updateAboutThisItem(product)

    magnifying_img.src = product.images[0];
    for(let i = 0; i<product.images.length && i<5; i++){
        image_list.append(createImageTile(product.images[i]))
    }
}

function createImageTile(src){
    `<div><img src="https://res.cloudinary.com/dh1e66m8m/image/upload/v1693309402/1693309395347.png"
                                class="small_img col col-lg-12"></div>`
    const container = document.createElement('div');
    const image = document.createElement('img');
    image.src = src;
    image.classList.add("small_img",  "col" ,"col-lg-12")
    container.append(image);
    container.addEventListener('click', updatePrimaryImage(src))
    return container;
}

function updatePrimaryImage(src){
    return function(){
        magnifying_img.src = src;
    }
}

function updateSpacality(product){
    const {replacement, warranty, isPayOnDelivery, isFreeDelivery} = product
    if(!replacement && warranty && isPayOnDelivery && isFreeDelivery) {
        // remove the container div
        document.querySelector('.spacialities-container').classList.add('d-none')
    }
    else{
        if(replacement){
            product_replacement.innerHTML = replacement;
        }
        else{
            hide(product_replacement)
        }

        if(warranty){
            product_warranty.innerHTML = warranty
        }
        else{
            hide(product_warranty)
        }

        if(!isPayOnDelivery){
            hide(product_payOnDelivery)
        }
        if(!isFreeDelivery){
            hide(product_isFreeDelivery)
        }
    }

    function hide(field){
        field.parentElement.parentElement.classList.add('d-none')
        field.parentElement.parentElement.classList.remove('d-flex')
    }
}

function updateAboutThisItem(product){
    const {aboutThisItem} = product;
    if(aboutThisItem?.length == 0){
        about_this_item.classList.add('d-none')
    }
    else{
        const first = about_this_item.querySelector('.first')
        const second = about_this_item.querySelector('.second');
        updateHelper(first, second, aboutThisItem);
    }


    function updateHelper(first, second, aboutThisItem){
        aboutThisItem.forEach( (x, index)=>{
            const detailsLi = createTile(x);
            if(index % 2){
                first.append(detailsLi)
            }
            else{
                second.append(detailsLi)
            }
        })
    }

    function createTile(detail){
        const li = document.createElement('li');
        li.innerHTML = `<p>${detail}</p>`
        return li;
    }
}


injectData()
