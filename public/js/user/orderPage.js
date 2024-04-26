const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const cancelationOptions = [
  "I found a better deal elsewhere.",
  "I no longer need the product.",
  "I ordered the wrong item by mistake.",
  "The estimated delivery time is too long.",
];
const returnOptions = [
  "The item arrived in a damaged or defective condition.",
  "The product received does not match the one ordered.",
  "The product did not meet the expected quality or performance standards.",
  "The product is missing components or accessories.",
];

let currentFilter = "orders";

function createOrderTile(order) {
  const template = createOrderTemplate(order);

  const div = document.createElement("div");
  div.innerHTML = template;

  // populating products in the order tile
  const productListContainer = div.querySelector(".product-details");
  order.products.forEach((x) => {
    productListContainer.insertAdjacentHTML(
      "beforeend",
      createProductTile(x.product)
    );
  });

  // required elements
  const toggleCancelFormBtn = div.querySelector(".toggle-cancel-form");
  const toggleReturnBtn = div.querySelector(".return-button");
  const cancelReturnBtn = div.querySelector(".cancel-return");
  const cancelSubmitBtn = div.querySelector(".submitCancelationBtn");
  const returnSubmitBtn = div.querySelector(".submitReturnBtn");
  const cancelBtn = div.querySelector(".cancel-return");
  const complete_order_btn = div.querySelector(".complete_order_btn");
  const invoiceDownloadBtn = div.querySelector(".download-invoice");

  // adding eventlisteners
  toggleCancelFormBtn.addEventListener(
    "click",
    toggleFormHandler(div.querySelector(".cancel-form"))
  );
  toggleReturnBtn.addEventListener(
    "click",
    toggleFormHandler(div.querySelector(".return-form"))
  );
  cancelSubmitBtn.addEventListener("click", removeOrderHandler(order._id, div));
  returnSubmitBtn.addEventListener("click", returnOrderHandler(order._id, div));
  cancelBtn.addEventListener("click", cancelReturnHandler(order._id, div));
  complete_order_btn.addEventListener("click", () => {
    location.assign(
       "/order/get_checkout_page/" + order._id
    );
  });
  invoiceDownloadBtn.addEventListener("click", () => {
    downloadInvoice(order._id);
  });

  // configuation function
  resetControllerButtons(
    order.status,
    toggleCancelFormBtn,
    toggleReturnBtn,
    cancelReturnBtn,
    complete_order_btn
  );
  configureForm(
    div,
    cancelSubmitBtn,
    div.querySelector(".cancelation-reason-input-field"),
    "cancelation-options",
    div.querySelector(".cancelation-options"),
    cancelationOptions
  );
  configureForm(
    div,
    returnSubmitBtn,
    div.querySelector(".return-reason-input-field"),
    "return-options",
    div.querySelector(".return-options"),
    returnOptions
  );
  return div;
}

function downloadInvoice(orderId) {
  fetch( "/order/get_invoice?orderId=" + orderId, {
    method: "get",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        const { order, invoiceNumber } = data;
        const date = formatDate(new Date());
        var props = {
          outputType: jsPDFInvoiceTemplate.OutputType.Save,
          returnJsPDFDocObject: true,
          fileName: "Invoice 2021",
          orientationLandscape: false,
          compress: true,
          logo: {
            src:  "/accets/userHeaderLogo.jpeg",
            type: "PNG", //optional, when src= data:uri (nodejs case)
            width: 30.33, //aspect ratio = width/height
            height: 20.66,
            margin: {
              top: 0, //negative or positive num, from the current position
              left: 0, //negative or positive num, from the current position
            },
          },
          stamp: {
            inAllPages: true, //by default = false, just in the last page
            src: "https://raw.githubusercontent.com/edisonneza/jspdf-invoice-template/demo/images/qr_code.jpg",
            type: "JPG", //optional, when src= data:uri (nodejs case)
            width: 20, //aspect ratio = width/height
            height: 20,
            margin: {
              top: 0, //negative or positive num, from the current position
              left: 0, //negative or positive num, from the current position
            },
          },
          business: {
            name: "Fortnite Web store",
            address: "Kazhakuttam, North Trivandrum, Kerala",
            phone: "+91 6238973581",
            email: "forniteWebStore@gmail.com",
            email_1: "nandhusanthosh87@gmail.com",
            website: "www.fornite.com",
          },
          contact: {
            label: "Invoice issued for:",
            name: order.userAddressId.name,
            address: order.userAddressId.addressLine1,
            phone: order.userAddressId.mobileNumber,
          },
          invoice: {
            label: "Invoice #: ",
            num: invoiceNumber,
            invGenDate: "Invoice Date: " + date,
            headerBorder: false,
            tableBodyBorder: false,
            header: [
              {
                title: "#",
                style: {
                  width: 10,
                },
              },
              {
                title: "Title",
                style: {
                  width: 70,
                },
              },
              { title: "Price" },
              { title: "Discount" },
              { title: "Quantity" },
              { title: "Total" },
            ],
            table: Array.from(order.products, (item, index) => [
              index + 1,
              item.product.brand + " " + item.product.modelName,
              item.price,
              item.price - item.payable,
              item.quantity,
              item.price * item.quantity,
            ]),
            additionalRows: [
              {
                col1: "Total:",
                col2: order.totalPrice,
                style: {
                  fontSize: 14, //optional, default 12
                },
              },
              {
                col1: "Discount:",
                col2: order.discount,
                style: {
                  fontSize: 10, //optional, default 12
                },
              },
              {
                col1: "SubTotal:",
                col2: order.payable,
                style: {
                  fontSize: 10, //optional, default 12
                },
              },
            ],
          },
          footer: {
            text: "The invoice is created on a computer and is valid without the signature and stamp.",
          },
          pageEnable: true,
          pageLabel: "Page ",
        };
        var pdfObject = jsPDFInvoiceTemplate.default(props);
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

function formatDate(date) {
  // Get the date components
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = date.getFullYear();

  // Get the time components
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  // Create the formatted date string
  const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

  return formattedDate;
}

function createOrderTemplate(order) {
  const totalPrice = order.payable.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  let { orderPlacedDate, deliveryExtimate } = orderStageFormatter(order);
  const address = order.userAddressId;

  const template = `
     <div class="order-item-container mb-3">
                                        <div class="section-one p-2">
                                            <div class="section-content">
                                                <div class="d-flex justify-content-between">
                                                    <div class="d-flex justify-content-between w-100">
                                                            <div class="d-flex gap-lg-5 gap-md-4 gap-sm-3 gap-3">
                                                                <div class="order-date">
                                                                    <div>
                                                                        <span>ORDER PLACED</span>
                                                                    </div>
                                                                    <div class="section-value">
                                                                        <span>${orderPlacedDate}</span>
                                                                    </div>
                                                                </div>
                                                                <div class="total-price">
                                                                    <div>
                                                                        <span>TOTAL PRICE</span>
                                                                    </div>
                                                                    <div  class="section-value">
                                                                        <span>₹${totalPrice}</span>
                                                                    </div>
                                                                </div>
                                                                <div class="ship-to">
                                                                    <div>
                                                                        <span>SHIP TO</span>
                                                                    </div>
                                                                    <div  class="section-value position-relative show-detials-on-hover">
                                                                        <span class="link">${
                                                                          typeof address ==
                                                                          "object"
                                                                            ? address.fullName
                                                                            : "undefined"
                                                                        }</span>

                                                                        <div class="position-absolute address-details-container">
                                                                            <div class="position-relative address-details">
                                                                                <span class="fw-bold">${
                                                                                  typeof address ==
                                                                                  "object"
                                                                                    ? address.fullName
                                                                                    : "undefined"
                                                                                }</span>
                                                                                <p>${
                                                                                  typeof address ==
                                                                                  "object"
                                                                                    ? address.addressLine1 +
                                                                                      ", " +
                                                                                      address.addressLine2 +
                                                                                      ", " +
                                                                                      address.state +
                                                                                      ", " +
                                                                                      address.pincode +
                                                                                      ", " +
                                                                                      address.mobileNumber
                                                                                    : "undefined"
                                                                                }
                                                                                India</p>

                                                                                <div class="arrow">

                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <div class="invoice-download">
                                                                    <div>
                                                                        <button class='btn btn-link download-invoice'>Download invoice</button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="section-two p-2">
                                            <div>
                                                <div class="header py-2 ps-1 ${
                                                  order.status == "Dispatched"
                                                    ? "text-success"
                                                    : ""
                                                }">
                                                    ${
                                                      order.status ==
                                                      "Dispatched"
                                                        ? deliveryExtimate
                                                        : order.status
                                                    }
                                                </div>
                                                <div class="product-details">
                                                    
                                                </div>
                                                <div class='d-flex justify-content-end'> 
                                                        <button class='toggle-cancel-form'>
                                                            <span >Cancel Order</span>
                                                        </button>
                                                        
                                                </div>
                                                <div class="d-flex justify-content-end">
                                                    <button class="complete_order_btn">Complete order</button>
                                                </div>
                                                <div class='d-flex justify-content-end'>
                                                    <button class='return-button'>Return Product</button>
                                                </div>
                                                <div class='d-flex justify-content-end'>
                                                    <button class='cancel-return'>Cancel Return</button>
                                                </div>

                                                <div class="cancel-form d-none">
                                                    <div>
                                                        <p class="fw-bold">Select the reason for the order cancelation.</p>
                                                    </div>
                                                    <ul class="cancelation-options list-group list-group-flush">
                                                        
                                                    </ul>
                                                    <input type="text" placeholder="Enter the cancelation reason" class="mb-2 cancelation-reason-input-field d-none form-control">
                                                    <button class="btn btn-primary submitCancelationBtn" disabled> Submit </button>
                                                </div>

                                                <div class="return-form d-none">
                                                    <div>
                                                        <p class="fw-bold">Select the reason for the returning the product.</p>
                                                    </div>
                                                    <ul class="return-options list-group list-group-flush">
                                                        
                                                    </ul>
                                                    <input type="text" placeholder="Enter the reason for returning the product" class="mb-2 return-reason-input-field d-none form-control">
                                                    <button class="btn btn-primary submitReturnBtn" disabled> Submit </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>`;

  return template;
}

function orderStageFormatter(order) {
  let orderPlacedDate, deliveryExtimate;
  if (order.orderCreateAt) {
    // orderPlaced date fomatting
    const orderCreateAt = new Date(order.orderCreateAt);
    const day = orderCreateAt.getUTCDate();
    const month = orderCreateAt.getUTCMonth();
    const year = orderCreateAt.getUTCFullYear();
    orderPlacedDate = `${day} ${monthNames[month]} ${year}`;

    // delivery extimated date formatting
    const today = new Date();
    const extimatedDeliveryDate = new Date(order.extimatedDeliveryDate);
    const timeDifference = extimatedDeliveryDate - today;
    const daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));
    if (daysDifference == 0) {
      deliveryExtimate = "Arriving Today";
    } else if (daysDifference == 1) {
      deliveryExtimate = "Arriving Tomorrow";
    } else if (daysDifference <= 7) {
      const dayIndex = extimatedDeliveryDate.getUTCDay();
      deliveryExtimate = "Arriving " + daysOfWeek[dayIndex];
    } else {
      const extimateDay = orderCreateAt.getUTCDate();
      const extimateMonth = orderCreateAt.getUTCMonth();
      const extimateYear = orderCreateAt.getUTCFullYear();
      deliveryExtimate = `${extimateDay} ${monthNames[extimateMonth]} ${extimateYear}`;
    }
  }

  return { orderPlacedDate, deliveryExtimate };
}

function configureForm(div, button, reasonField, name, list, optionList) {
  optionList.forEach((x, index) => {
    list.append(
      createOptionTile(x, name, index, optionSelectEvent(button, reasonField))
    );
  });
  list.append(
    createOptionTile("Other", name, cancelationOptions.length, showInputField)
  );

  function showInputField() {
    button.disabled = true;
    reasonField.classList.remove("d-none");
    reasonField.addEventListener("input", (e) => {
      if (e.target.value.length >= 10) {
        button.disabled = false;
      } else {
        button.disabled = true;
      }
    });
  }
}

function createOptionTile(x, name, index, callback) {
  const li = document.createElement("li");
  li.classList.add("list-group-item");
  const template = `
        <input type="radio" name="${name}" id="${name}-option-${index}" value="${index}">
        <label for="option-${index}">${x}</label>`;

  li.innerHTML = template;
  li.querySelector(`#${name}-option-${index}`).addEventListener(
    "click",
    callback
  );
  return li;
}

function optionSelectEvent(button, field) {
  return () => {
    button.disabled = false;
    field.classList.add("d-none");
  };
}

function toggleFormHandler(form) {
  return () => {
    if (form.classList.contains("d-none")) {
      form.classList.remove("d-none");
    } else {
      form.classList.add("d-none");
    }
  };
}

function resetControllerButtons(
  status,
  removeBtn,
  returnBtn,
  cancelReturnBtn,
  completeBtn
) {
  removeBtn.classList.add("d-none");
  returnBtn.classList.add("d-none");
  cancelReturnBtn.classList.add("d-none");
  completeBtn.classList.add("d-none");
  if (status == "Order Pending") {
    completeBtn.classList.remove("d-none");
  } else if (
    ["Preparing to Dispatch", "Dispatched", "Out for Delivery"].includes(status)
  ) {
    removeBtn.classList.remove("d-none");
  } else if (["Delivered"].includes(status)) {
    returnBtn.classList.remove("d-none");
  } else if (
    ["Return Request Processing", "Return Request Granted"].includes(status)
  ) {
    cancelReturnBtn.classList.remove("d-none");
  }
}

function createProductTile(product) {
  const template = `
    <div class="d-flex gap-2 gap-md-4 mb-2">
        <div class="image-container">
            <img width="100px" height="100px" src="${product.images[0]}" alt="">
        </div>
        <div>
            <div class="name-container">
                <span>
                    <a href="${"../product_details/" + product._id}">
                        ${product.name}
                    </a>
                </span>
            </div>
        </div>
    </div>`;

  return template;
}

function removeOrderHandler(orderId, container) {
  return () => {
    const reason = findReason(
      "cancelation-options",
      container,
      container.querySelector(".cancelation-reason-input-field")
    );
    const url =  `/order/delete_order?id=${orderId}&cancelReason=${reason}`;
    fetch(url, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Order sucessfully cancelled",
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          updateOrderList(orderId, "Canceled");
          loader();
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: data.errorMessage,
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          // show failure
        }
      });
  };
}

function returnOrderHandler(orderId, container) {
  return () => {
    const reason = findReason(
      "return-options",
      container,
      container.querySelector(".return-reason-input-field")
    );
    const url =  `/order/return_order?id=${orderId}&returnReason=${reason}`;
    fetch(url, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          Swal.fire({
            icon: "success",
            title: "Returned",
            text: "Order return request sucessfully send.",
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          updateOrderList(orderId, "Return Request Processing");
          loader();
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: data.errorMessage,
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          // show failure
        }
      });
  };
}

function cancelReturnHandler(orderId) {
  return () => {
    const status = confirm("Do you really want to cancel the return request.");
    if (!status) return;

    const url =  `/order/cancel_return?id=${orderId}`;
    fetch(url, {
      method: "PATCH",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          Swal.fire({
            icon: "success",
            title: "Request Canceled!",
            text: "Order return request is canceled.",
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          updateOrderList(orderId, "Delivered");
          loader();
        } else {
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: data.errorMessage,
            // footer: '<a href="">Why do I have this issue?</a>'
          });
          // show failure
        }
      });
  };
}

function findReason(name, container, inputField) {
  const radioButtons = container.querySelectorAll(`[name="${name}"]`);
  let selectedButton;
  for (let x of radioButtons) {
    if (x.checked) {
      selectedButton = x;
      break;
    }
  }

  let reason = cancelationOptions[selectedButton.value];
  if (!reason) {
    return inputField.value;
  } else {
    return reason;
  }
}

function updateOrderList(orderId, state) {
  userOrders.every((x) => {
    if (x._id == orderId) {
      x.status = state;
      return false;
    }
    return true;
  });
}

function loader(orders = userOrders) {
  populateOrderList(orders);
  populateRecomendations();

  filter_order.addEventListener("click", () => {
    if (currentFilter == "orders") return;
    populateOrderList(orders);
    currentFilter = "orders";
  });

  filter_buyAgain.addEventListener("click", () => {
    if (currentFilter == "buyAgain") return;
    populateOrderList(
      orders.filter((x) => {
        if (x.status == "Delivered") return true;
      })
    );
    currentFilter = "buyAgain";
  });

  filter_notYetShipped.addEventListener("click", () => {
    if (currentFilter == "notYetShipped") return;
    populateOrderList(
      orders.filter((x) => {
        if (["Order Pending", "Preparing to Dispatch"].includes(x.status))
          return true;
      })
    );
    currentFilter = "notYetShipped";
  });

  filter_cancelOrder.addEventListener("click", () => {
    if (currentFilter == "canceled") return;
    populateOrderList(
      orders.filter((x) => {
        if (x.status == "Canceled") return true;
      })
    );
    currentFilter = "canceled";
  });
}

function populateRecomendations() {
  fetch( "/highlights/get_top_section")
    .then((response) => response.json())
    .then((data) => {
      if (data.isSuccess) {
        const recomentedProducts = data.data.products;
        const recomentedContainer = document.querySelector(
          ".recomented-container .products-container"
        );
        recomentedProducts.map((product) => {
          recomentedContainer.append(createRecomentedProductTile(product));
        });
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

function createRecomentedProductTile(product) {
  let price =
    (product.actualPrice / 100) *
    (100 - ((product.category?.offer || 0) + product.discount));
  if (price < 0) price = 0;
  price = Math.floor(price).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const div = document.createElement("div");
  div.classList.add("product", "row", "gap-2", "mb-3", "col", "col-md-12");
  const template = `
    <div class="rec-img-cont col-12 col-md-4">
        <img src="${product.images[0]}" alt="">
    </div>
    <div class="rec-details-cont col">
        <a href="${process.env.URL}+/product_details/${product._id}">
            <div class="name">${product.name}</div>
        </a>
        <div class="price fw-bold">₹ ${price}</div>
    </div>`;
  div.innerHTML = template;
  return div;
}

function populateOrderList(orders) {
  const orderCountElement = document.querySelector(".order-count");
  orderCountElement.innerHTML = orders.length;
  const userOrderList = document.querySelector(".order-list");
  userOrderList.innerHTML = "";
  orders.forEach((x) => {
    userOrderList.append(createOrderTile(x));
  });
}
loader();
