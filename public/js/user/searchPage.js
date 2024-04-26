let currentProductSet = product;
const filteredList = product.data.map((x) => x._id);
let filter = {
  brandFilter: [],
  discountFilter: 0,
  priceFilter: {
    starting: 0,
    ending: "Infinity",
  },
  deliveryFilter: false,
};

function render(products = product) {
  currentProductSet = products;
  console.log("the current product set is from render: ", currentProductSet)
  const resultContainer = document.querySelector("#result-product-container");
  const noProductContainer = document.querySelector(".no-result-container");

  resultContainer.innerHTML = "";
  
  if (products.data.length) {
    resultContainer.classList.remove("d-none");
    noProductContainer.classList.add("d-none");
    products.data.forEach((x, index) => {
      const productCard = createProductTile(x);
      resultContainer.append(productCard);
    });
  } else {
    resultContainer.classList.add("d-none");
    noProductContainer.classList.remove("d-none");
  }
}

function createProductTile(product) {
  // console.log(product)
  let ar = findPayable(product)
  console.log(ar)
  


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
                        <div class="currentprice">₹${product.payable.toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}</div>
                        <div class="actualprice">M.R.P: ₹${product.actualPrice.toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}</div>
                        <div class="discount">(${product.finalDiscount}% off)</div>
                    </div>
                    <div class="spacalities_brand">
                        <div class="brand">Brand: Sony</div>
                        <div class="freedelivery">Free Delivery</div>
                        <div class="warranty">2 Year Warranty   </div>
                    </div>
                </div>`;

  const container = document.createElement("div");
  container.classList.add("product_container", "d-flex", "mb-3");
  container.innerHTML = element;
  return container;
}

function configure() {
  productSearch = document.getElementById("productSearch");
  productSearch.addEventListener("click", getData);
  render();
  populateBrandFilter();
  filterEventListenerAdder();
}

function populateBrandFilter() {
  const brands = [];
  currentProductSet.data.map((x) => {
    let brand = formatString(x.brand);
    if (brands.indexOf(brand) === -1) {
      brands.push(brand);
    }
  });
  console.log(brands)
  const brandContainer = document.querySelector(".brand-filter-container");
  // appending brands
  brands.forEach((x) => {
    const tile = document.createElement("div");
    const template = `
            <input name="brand" id="${x.toLowerCase()}" type="checkbox" aria-label="Checkbox for following text input">
            <label for="${x.toLowerCase()}">${x}</label>`;
    tile.innerHTML = template;
    brandContainer.append(tile);
  })
}

function getData(e) {
  const searchKey = productSearchInput.value;

  if (searchKey && searchKey != "") {
    const url = `${process.env.URL}/get_search_result?searchKey=${searchKey}&p=0`;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        currentProductSet = data;
        render();
      });
  }
}


function filterEventListenerAdder(){
  // brand filter
  const brandFields = document.querySelectorAll('[name="brand"]');
  brandFields.forEach( (x) => {
    x.addEventListener("change", (e)=>{
      if(e.target.checked) filter.brandFilter.push(e.target.id)
      else filter.brandFilter = filter.brandFilter.filter( x => x != e.target.id)
      updateFilter();

    })
  })
  
  // price filter configuration
  const priceFilters = document.querySelectorAll('[name="price"]');
  priceFilters.forEach((x) => {
    x.addEventListener("change", (e) => {
      const starting = Number(e.target.dataset.start);
      let ending = Number(e.target.dataset.end);
      if(ending == Infinity) ending = "Infinity"

      filter.priceFilter = {
        starting,
        ending,
      };
      updateFilter();
    });
  });
  
  // pay on delivery filter
  const payOnDelivery = document.querySelector("#payOnDelivery");
  payOnDelivery.addEventListener("click", (e) => {
    if (payOnDelivery.checked) {
      filter.deliveryFilter = true;
    } else {
      filter.deliveryFilter = false;
    }
    updateFilter();
  });
  
  // discount filter configuration
  const discountFields = document.querySelectorAll('[name="discount"]');
  discountFields.forEach((x) => {
    x.addEventListener("change", (e) => {
      filter.discountFilter = e.target.value;
      updateFilter();
    });
  });
  
  // availability filter configuration
  const availabilityField = document.querySelector("#stockOnly");
  availabilityField.addEventListener("change", (e) => {
    filter.availabilityFilter = e.target.checked;
    updateFilter();
  });
  
  
}

// price sort configuration
const priceSortFields = document.querySelectorAll('[name="priceSort"]');
priceSortFields.forEach((x) => {
  x.addEventListener("change", sortProduct);
})


// sort the current product list
function sortProduct(){
  let sortingFunc;

  let status;
  for(let x of priceSortFields){
      if(x.checked) {
          status = x.value;
          break;
      }
  }


  if(!status){
    render();
    return;
  }
  console.log("This is the sort status from sort function: ", status)
  if (status == "acc") {
    sortingFunc = accPriceSort;
  } else {
    sortingFunc = decPriceSort;
  }

  console.log("the current product set is ", currentProductSet)
  render({ data: currentProductSet.data.sort(sortingFunc) });
}


// function to sort in assending order
function accPriceSort(a, b) {
  return findPayable(a) - findPayable(b);
}

// function to sort in decending order
function decPriceSort(a, b) {
  return findPayable(b) - findPayable(a);
}


// calculates the price and total discount of a product
function findPayable(a){
  if(a.payable) return a.payable;
  let categoryDiscount; 
  if(Array.isArray(a.category)){
    categoryDiscount = a.category[0].offer;
  }
  else{
    categoryDiscount = a.category?.offer || 0
  }
  let discount = categoryDiscount + a.discount;
  if (discount > 100) discount = 100;


  let price =
    (a.actualPrice / 100) *
    (100 - discount);
  if (price < 0) price = 0;
  price = Math.floor(price);
  a.payable = price;
  a.finalDiscount = discount;
  return price;
}

// fetch data from the server based on the filter
function updateFilter() {
  const searchKey = productSearchInput.value;
  fetch( "/fetch_filtered_result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filter, searchKey }),
  })
  .then((response) => response.json())
  .then((data) => {
    if (data.isSuccess) {
      console.log(data.products)
      currentProductSet.data = data.products;
      sortProduct();
      // render({data: data.products})
    } else {
      alert(data.errorMessage);
    }
  });
}

// format a string into a praticular format (eg: "abc" => "Abc")
function formatString(str) {
    // Ensure the string is not empty
    if (str.length === 0) {
        return str;
    }

    // Convert the first character to uppercase and the rest to lowercase
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

configure();
