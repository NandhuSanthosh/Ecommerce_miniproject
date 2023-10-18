class RenderHandlers {
  constructor() {
    this.defaultEndPoint = baseUrl + "admin/orders/get_all_orders?dummy:dummy";
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    this.currentOrderSet = [];
    this.configureButton();
    this.orderStates = [];
  }

  async render() {
    console.log(this.dataFetchApiEndPoint);
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint);
    this.currentOrderSet = data;
    this.populateOrderTable(data);

    this.configurePagination(totalCount);
  }

  populateOrderTable(data, count = 0) {
    orderTableBody.innerHTML = "";
    if (data.length) {
      data.forEach((value, index) => {
        const userTile = this.createOrderTile(value, count * 10 + index);
        orderTableBody.append(userTile);
      });
    } else {
      // display no user
    }
  }

  createOrderTile(order, index) {
    const template = `
                <td>${index + 1}</td>
                <td>
                    <div class="product-container">
                    </div>
                </td>
                <td>
                    <div class="user-credential">
                        <div class="credential-container">${
                          order.userCredential
                        }</div>
                    </div>
                </td>
                <td class="">
                    <div class="total-price">
                        <div class="price-container ">₹${order.payable.toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}</div>
                    </div>
                </td>
                <td>
                    <div class="status">
                        <div class="status-conatiner">${order.status}</div>
                    </div>
                </td>
                <td>
                    <div class="details-btn-container">
                        <button class="btn btn-secondary details-btn" >Details</button>
                    </div>
                </td>
                `;

    const tr = document.createElement("tr");
    tr.innerHTML = template;

    order.products.forEach((x) => {
      const tile = this.createProductTile(x);
      tr.querySelector(".product-container").insertAdjacentHTML(
        "beforeend",
        tile
      );
    });

    tr.querySelector(".details-btn").addEventListener(
      "click",
      this.displayOrderDetailsModal(order)
    );
    return tr;
  }

  displayOrderDetailsModal(order) {
    return async () => {
      // fetch details
      const { data } = await fetchData(
        "http://nandhu.shop/admin/orders/complete_order_details/" + order._id
      );
      if (data) {
        this.populateModalOrder(data);
        this.displayModalOrder();
        // clear eventlisteners
        removeExcessiveEventListeners(updateExpectedDeliveryDate);
        updateExpectedDeliveryDate.addEventListener(
          "click",
          this.updateExceptedDeliveryDate(data)
        );
        // add event listener
      }
    };
  }

  updateExceptedDeliveryDate(order) {
    return () => {
      const expectedDateField = document.getElementById("datepicker");
      const dateObj = new Date(order.extimatedDeliveryDate);
      const selectedDateObj = this.createDateObject(expectedDateField.value);

      if (this.isSameDate(dateObj, selectedDateObj)) {
        showModel("You didn't change the value of the extimated date.");
      } else {
        fetch(
          "http://nandhu.shop/admin/orders/update_estimated_delivery_date?id=" +
            order._id +
            "&newExtimatedDate=" +
            selectedDateObj.toISOString(),
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
          .then((response) => response.json())
          .then((data) => {
            if (data.isSuccess) {
              showModel("Date sucessfully updated");
              // udpate currentOrder set
              this.updateCurrentOrderSet(
                order._id,
                selectedDateObj.toISOString()
              );
              // update
            } else {
              showModel(data.errorMessage);
            }
          });
      }
    };
  }
  updateCurrentOrderSet(id, date) {
    this.currentOrderSet.every((x) => {
      if (x._id == id) {
        x.extimatedDeliveryDate = date;
        return false;
      }
      return true;
    });
  }
  createDateObject(dateString) {
    var dateComponents = dateString.split("-");

    // Create a Date object using the components (note that months are zero-based)
    var year = parseInt(dateComponents[2]);
    var month = parseInt(dateComponents[1]) - 1; // Subtract 1 to adjust for zero-based months
    var day = parseInt(dateComponents[0]);

    var dateObject = new Date(year, month, day);
    dateObject.setHours(23, 59, 59, 999);
    return dateObject;
  }

  isSameDate(date1, date2) {
    if (
      date1.getDate() == date2.getDate() &&
      date1.getMonth() == date2.getMonth() &&
      date1.getFullYear() == date2.getFullYear()
    )
      return true;
    return false;
  }

  async populateModalOrder(data) {
    console.log(data);
    orderModal.querySelector(".user-name").innerHTML =
      data.userId?.name || "not found";
    orderModal.querySelector(".user-credential").innerHTML =
      data.userCredential || "not found";

    if (data.userAddressId) {
      orderModal.querySelector(".user-address .user-name").innerHTML =
        data.userAddressId?.fullName;
      orderModal.querySelector(".user-address .actual-address").innerHTML =
        data.userAddressId?.addressLine1 +
        ", " +
        data.userAddressId?.addressLine2 +
        ", " +
        data.userAddressId?.state;
    } else {
      orderModal.querySelector(".user-address .user-name").innerHTML =
        "Not updated";
      orderModal.querySelector(".user-address .actual-address").innerHTML = "";
    }
    orderModal.querySelector(".user-address .mobile").innerHTML =
      data.userAddressId?.mobileNumber || "Not found";

    orderModal.querySelector(".products-container").innerHTML = "";
    orderModal.querySelector(".product-invoiceContainer").innerHTML = "";
    data.products.forEach((x) => {
      orderModal
        .querySelector(".products-container")
        .insertAdjacentHTML("beforeend", this.createModalProductTile(x));
      orderModal
        .querySelector(".product-invoiceContainer")
        .insertAdjacentHTML("beforeend", this.createModalInsightProductTile(x));
    });

    orderModal.querySelector(".delivery-charge").innerHTML =
      "₹ " + data.delivery.deliveryCharge;
    if (data.delivery.isFreeDelivery) {
      orderModal
        .querySelector(".delivery-charge")
        .classList.add("text-decoration-line-through");
    } else {
      orderModal
        .querySelector(".delivery-charge")
        .classList.remove("text-decoration-line-through");
    }

    orderModal.querySelector(".total-price").innerHTML =
      "₹ " +
      data.payable.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    orderModal.querySelector(".payment-method-type").innerHTML =
      data.paymentDetail?.method || "Pending";

    orderModal.querySelector(".create-at-date").innerHTML = this.dateFormat(
      data.orderCreateAt
    );

    this.datePicker(data.extimatedDeliveryDate);

    if (this.orderStates.length == 0) {
      const { data } = await fetchData(
        "http://nandhu.shop/admin/orders/get_orderstages"
      );
      this.orderStates = data;
    }

    orderModal.querySelector(".dropdown-menu").innerHTML = "";
    this.orderStates.forEach((x) => {
      if (x != data.status)
        orderModal
          .querySelector(".dropdown-menu")
          .append(this.createOptionsTile(x, data._id));
    });

    const reasonSpan = document.querySelector(".current-state-reason");
    const reasonSpanContainer = document.querySelector(
      ".current-order-state-reason"
    );

    const x = data.status;
    if (
      x == "Canceled" ||
      x == "Return Request Processing" ||
      x == "Return Request Granded" ||
      x == "Return Request Completed"
    ) {
      reasonSpanContainer.classList.remove("d-none");
      if (x == "Canceled") {
        console.log(data.cancelation);
        reasonSpan.innerHTML = data.cancelation.cancelationReason;
      } else {
        reasonSpan.innerHTML = data.returned.returnReason;
      }
    } else {
      reasonSpanContainer.classList.add("d-none");
    }

    document.querySelector(".reason-input").classList.add("d-none");

    document.querySelector(".current-state").innerHTML = data.status;
    dropdownMenuButton.innerHTML = data.status;
  }

  createOptionsTile(x, orderId) {
    const button = document.createElement("button");
    button.classList.add("dropdown-item");
    button.innerHTML = x;
    button.addEventListener("click", this.changeStateHandler(x, orderId));
    return button;
  }

  changeStateHandler(x, orderId) {
    return () => {
      console.log(x);
      dropdownMenuButton.innerHTML = x;
      const reasonInput = document.querySelector(".reason-input");
      let stateUpdateBtn = document.querySelector(".state-update-btn");
      stateUpdateBtn = removeExcessiveEventListeners(stateUpdateBtn);

      if (
        x == "Canceled" ||
        x == "Return Request Processing" ||
        x == "Return Request Granted" ||
        x == "Return Completed"
      ) {
        reasonInput.classList.remove("d-none");
        reasonInput.value = "";
        reasonInput.addEventListener("input", this.reasonInputEventListener);
        stateUpdateBtn.addEventListener(
          "click",
          this.updateStateHandler(x, orderId, true)
        );
        stateUpdateBtn.disabled = true;
      } else {
        reasonInput.classList.add("d-none");
        stateUpdateBtn.disabled = false;
        stateUpdateBtn.addEventListener(
          "click",
          this.updateStateHandler(x, orderId)
        );
      }
    };
  }

  reasonInputEventListener(e) {
    let stateUpdateBtn = document.querySelector(".state-update-btn");
    if (e.target.value.length >= 10) {
      stateUpdateBtn.disabled = false;
    } else {
      stateUpdateBtn.disabled = true;
    }
  }

  updateStateHandler(x, orderId, reason) {
    return () => {
      let url =
        "http://nandhu.shop/admin/orders/update_status?id=" +
        orderId +
        "&status=" +
        x;
      if (reason)
        url += "&cancelReason=" + document.querySelector(".reason-input").value;
      fetch(url, {
        method: "PATCH",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.isSuccess) {
            showModel("State sucessfully updated");
            this.updateCurrentOrderSetStateUpdate(data.data);
            this.populateModalOrder(data.data);
            this.populateOrderTable(this.currentOrderSet);
          } else {
            showModel(data.errorMessage);
          }
        });
    };
  }

  updateCurrentOrderSetStateUpdate(data) {
    this.currentOrderSet.every((x) => {
      if (x._id == data._id) {
        x.status = data.status;
        return false;
      }
      return true;
    });
  }

  dateFormat(date) {
    var inputDate = new Date(date);
    var day = inputDate.getDate();
    var month = inputDate.getMonth() + 1; // Adding 1 because months are zero-based
    var year = inputDate.getFullYear();

    var formattedDate =
      (day < 10 ? "0" : "") +
      day +
      "-" +
      (month < 10 ? "0" : "") +
      month +
      "-" +
      year;

    return formattedDate;
  }

  createModalInsightProductTile(product) {
    console.log(product);
    const template = `
        <div class="product-invoice d-flex justify-content-between">
                <div>
                    <span class="fw-500"> <span class="brand-model">${
                      product.product.brand + " " + product.product.modelName
                    }</span> : <span></span>
                </div>
            <div class="color-black">
                <span class="color-light">(${product.quantity} * ( ${
      product.price
    } - ${product.coupon.discount})) </span><span class="fs-18 fw-500">₹
                    ${(product.payable * product.quantity).toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}</span>
            </div>

        </div>`;

    return template;
  }

  createModalProductTile(product) {
    const template = `
            <div class="product d-flex gap-2 mb-2">
                <div class="image-order-modal border">
                    <img class="" width="60px" src="${product.product.images[0]}"
                        alt="">
                </div>
                <div class="name">
                    <a href="http://nandhu.shop/product_details/${product.product._id}"
                        class="responsive-text minimize-3">
                        ${product.productName}
                    </a>
                </div>
            </div>`;
    return template;
  }

  createProductTile(product) {
    const template = `<div class="productDiv d-flex gap-2 mb-2">
                        <div class="image-container">
                            <img width="50px" src="${
                              product.product.images
                                ? product.product.images[0]
                                : ""
                            }" alt="">
                        </div>
                        <div class="name-container responsive-text minimize">${
                          product.productName
                        }</div>
                    </div>`;

    // return template;
    return template;
  }

  configurePagination(length, currentButton = 1) {
    this.renderPaginationButtons(length, currentButton);
  }
  renderPaginationButtons(length, currentButton) {
    let pageCount = Math.ceil(length / 10);
    const paginationButtonList = document.getElementById(
      "pagination-group-list"
    );
    paginationButtonList.innerHTML = "";
    if (pageCount < 2) {
      return;
    }
    paginationButtonList.classList.remove("d-none");

    paginationButtonList.append(
      this.createPaginationTile(
        "Previous",
        false,
        currentButton == 1,
        this.paginationHandler(currentButton - 1)
      )
    );

    if (currentButton >= 2) {
      paginationButtonList.append(this.createPaginationTile(1));
      if (currentButton > 2) paginationButtonList.append("...");
    }

    for (let i = currentButton; i <= pageCount && i < currentButton + 3; i++) {
      paginationButtonList.append(
        this.createPaginationTile(i, i == currentButton)
      );
    }

    if (currentButton <= pageCount - 3) {
      paginationButtonList.append("...");
      paginationButtonList.append(this.createPaginationTile(pageCount));
    }

    paginationButtonList.append(
      this.createPaginationTile(
        "Next",
        false,
        currentButton == pageCount,
        this.paginationHandler(currentButton + 1)
      )
    );
  }
  createPaginationTile(count, status, isDisabled, callback) {
    const li = document.createElement("li");
    li.classList.add("page-item");
    if (status) li.classList.add("active");
    li.innerHTML = `<a class="page-link" href="#">${count}</a>`;
    if (isDisabled) li.querySelector("a").classList.add("disabled");
    else
      li.addEventListener("click", callback || this.paginationHandler(count));
    return li;
  }
  paginationHandler(count) {
    return async () => {
      const data = await fetchData(
        this.dataFetchApiEndPoint + `&pno=${count - 1}`
      );
      this.currentOrderSet = data.data;
      this.configurePagination(data.totalCount, count);
      this.populateOrderTable(this.currentOrderSet, count - 1);
    };
  }
  configureButton() {
    orderSearchInput.addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        this.searchOrderHandler();
      }
    });
    orderSearchButton.addEventListener(
      "click",
      this.searchOrderHandler.bind(this)
    );
    document
      .querySelector(".cancel-search-btn.order")
      .addEventListener("click", this.removeSearch.bind(this));
  }

  searchOrderHandler() {
    const key = orderSearchInput.value;
    const url =
      "http://nandhu.shop/admin/orders/search_order?searchKey=" + key;
    this.dataFetchApiEndPoint = url;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          this.populateOrderTable(data.data);
          this.configurePagination(data.totalCount);
          document
            .querySelector(".cancel-search-btn.order")
            .classList.remove("d-none");
        } else {
          showModel(data.errorMessage);
        }
      });
  }

  async removeSearch() {
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    console.log(this.dataFetchApiEndPoint);
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint, 0);
    this.currentOrderSet = data;
    this.populateOrderTable(data);
    document.querySelector(".cancel-search-btn.order").classList.add("d-none");
    this.configurePagination(totalCount);
  }

  displayModalOrder() {
    $("#orderModal").modal();
  }

  datePicker(defaultDate) {
    // Initialize the date picker with a date range restriction
    var datePickerInput = document.getElementById("datepicker");
    const defaultDateObj = new Date(defaultDate);
    let startDate = new Date();
    let endDate;
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 10);
    }

    datePickerInput.value =
      defaultDateObj.getDate() +
      "-" +
      (defaultDateObj.getMonth() + 1 < 10
        ? `0${defaultDateObj.getMonth() + 1}`
        : defaultDateObj.getMonth() + 1) +
      "-" +
      defaultDateObj.getFullYear();
    // datePickerInput.value = defaultDateObj;
    // Initialize the date picker using the .datepicker() method
    $(datePickerInput).datepicker({
      format: "dd-mm-yyyy",
      startDate: startDate,
      endDate: endDate,
      autoclose: true, // Close the date picker when a date is selected
      defaultViewDate: {
        year: defaultDateObj.getFullYear(),
        month: defaultDateObj.getMonth(),
        day: defaultDateObj.getDate(),
      },
    });
  }
}
