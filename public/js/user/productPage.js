addTOCartBtn.addEventListener("click", addToCartEventHandler);
buyButton.addEventListener("click", buyEventListener);
document
  .querySelector(".wish_list_btn")
  .addEventListener("click", addToWishListHandler);

function addToWishListHandler() {
  fetch(
    process.env.URL + "/wishlist/add_to_wishList?productId=" + product._id
  )
    .then((response) => {
      if (response.redirected) {
        Swal.fire({
          title: "User Login Error?",
          text: "Looks like you are not logged in, login to complete the operation!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Login",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = response.url;
          } else {
            return;
          }
        });
      }
      return response.json();
    })
    .then((data) => {
      if (!data.isSuccess) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.errorMessage,
          // footer: '<a href="">Why do I have this issue?</a>'
        });
      } else {
        if (data.isAdded) {
          document.querySelector(".heart").classList.add("is-active");
        } else {
          document.querySelector(".heart").classList.remove("is-active");
        }
      }
    });
}

function buyEventListener() {
  const productId = product._id;
  const quantity = quantitySelector.value;

  const body = {
    products: [
      {
        product: productId,
        productName: product.name,
        price: product.currentPrice,
        quantity,
      },
    ],
  };

  console.log(body);

  fetch(process.env.URL + "/order/post_checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (response.redirected) {
        Swal.fire({
          title: "User Login Error?",
          text: "Looks like you are not logged in, login to complete the operation!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Login",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = response.url;
          } else {
            return;
          }
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log(data);
      if (data.isSuccess) {
        location.assign(data.redirect);
      } else {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.errorMessage,
          // footer: '<a href="">Why do I have this issue?</a>'
        });
      }
    });
}

function addToCartEventHandler() {
  const quantity = quantitySelector.value;
  const productId = product._id;

  // request
  fetch(process.env.URL + "/add_routes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      quantity,
      productId,
    }),
  })
    .then((response) => {
      if (response.redirected) {
        Swal.fire({
          title: "User Login Error?",
          text: "Looks like you are not logged in, login to complete the operation!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Login",
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = response.url;
          } else {
            return;
          }
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        // showModel
        console.log("this is data : ", data);
        Swal.fire({
          icon: "success",
          title: "Product added to Cart.",
          // footer: '<a href="">Why do I have this issue?</a>'
        });
      } else {
        // showModel("no done")
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: data.errorMessage,
          // footer: '<a href="">Why do I have this issue?</a>'
        });
      }
    });
  // show success
  // show failure
}

function injectData() {
  let price =
    (product.actualPrice / 100) *
    (100 - ((product.category?.offer || 0) + product.discount));
  if (price < 0) price = 0;
  price = Math.floor(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let discount = product.discount + (product.category?.offer || 0);
  if (discount > 100) discount = 100;

  console.log(product.category);
  product_name.innerHTML = product.name;
  product_brand.innerHTML = product.brand;
  product_discount.innerHTML = `-${discount}%`;
  product_actualPrice.innerHTML = `₹${product.actualPrice.toLocaleString()}`;
  product_currentPrice.innerHTML = `₹${price.toLocaleString()}`;

  updateSpacality(product);
  updateAboutThisItem(product);
  updateQuantity(product.stock);

  magnifying_img.src = product.images[0];
  for (let i = 0; i < product.images.length && i < 5; i++) {
    image_list.append(createImageTile(product.images[i]));
  }

  if (isInWishList) {
    document.querySelector(".heart").classList.add("is-active");
  }
}

function createImageTile(src) {
  `<div><img src="https://res.cloudinary.com/dh1e66m8m/image/upload/v1693309402/1693309395347.png"
                                class="small_img col col-lg-12"></div>`;
  const container = document.createElement("div");
  const image = document.createElement("img");
  image.src = src;
  image.classList.add("small_img", "m-2", "m-sm-1");
  container.append(image);
  container.addEventListener("click", updatePrimaryImage(src));
  return container;
}

function updatePrimaryImage(src) {
  return function () {
    magnifying_img.src = src;
  };
}

function updateSpacality(product) {
  const { replacement, warranty, isPayOnDelivery, isFreeDelivery } = product;
  if (!replacement && warranty && isPayOnDelivery && isFreeDelivery) {
    // remove the container div
    document.querySelector(".spacialities-container").classList.add("d-none");
  } else {
    if (replacement) {
      product_replacement.innerHTML = replacement;
    } else {
      hide(product_replacement);
    }

    if (warranty) {
      product_warranty.innerHTML = warranty;
    } else {
      hide(product_warranty);
    }

    if (!isPayOnDelivery) {
      hide(product_payOnDelivery);
    }
    if (!isFreeDelivery) {
      hide(product_isFreeDelivery);
    }
  }

  function hide(field) {
    field.parentElement.parentElement.classList.add("d-none");
    field.parentElement.parentElement.classList.remove("d-flex");
  }
}

function updateAboutThisItem(product) {
  const { aboutThisItem } = product;
  if (aboutThisItem?.length == 0) {
    about_this_item.classList.add("d-none");
  } else {
    const first = about_this_item.querySelector(".first");
    const second = about_this_item.querySelector(".second");
    updateHelper(first, second, aboutThisItem);
  }

  function updateHelper(first, second, aboutThisItem) {
    aboutThisItem.forEach((x, index) => {
      const detailsLi = createTile(x);
      if (index % 2 == 0) {
        first.append(detailsLi);
      } else {
        second.append(detailsLi);
      }
    });
  }

  function createTile(detail) {
    const li = document.createElement("li");
    li.innerHTML = `<p>${detail}</p>`;
    return li;
  }
}

function updateQuantity(stock) {
  if (!stock) {
    stock = 1;
  }
  console.log(stock);
  for (let i = 1; i <= stock; i++)
    quantitySelector.insertAdjacentHTML(
      "beforeend",
      `<option value=${i}>${i}</option>`
    );
}

injectData();
