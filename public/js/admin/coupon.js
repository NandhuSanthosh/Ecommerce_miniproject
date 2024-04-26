class CoupenHandlers {
  constructor() {
    this.defaultEndPoint = baseUrl + "admin/coupons" + "?dummy=dummy";
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    this.currentCouponSet = [];
    this.category = [];
    this.currentCategorySet;
    this.currentCouponCategory = [];
    this.pageNumber = 1;
  }
  async render() {
    console.log("here");
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint, 0);
    this.currentCouponSet = data;
    this.populateCoupenTable(data);
    this.configureButton();

    this.configurePagination(totalCount);

    const allCategories = await this.getAllCategory();
    allCategories.data.forEach((x) => {
      const option = document.createElement("option");
      option.value = x._id;
      option.innerHTML = x.category;
      coupon_category.append(option);
    });
  }

  configurePagination(length, currentButton = 1) {
    this.renderPaginationButtons(length, currentButton);
  }

  renderPaginationButtons(length, currentButton) {
    let pageCount = Math.ceil(length / 10);
    const paginationButtonList = document.getElementById(
      "pagination-group-list"
    );
    if (pageCount < 2) {
      paginationButtonList.classList.add("d-none");
      return;
    }
    paginationButtonList.classList.remove("d-none");
    paginationButtonList.innerHTML = "";

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

    for (let i = currentButton; i <= pageCount && i < i + 3; i++) {
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
      const url = this.dataFetchApiEndPoint + `&pno=${count - 1}`;
      console.log(url);
      const data = await fetchData(url);
      this.currentCouponSet = data.data;
      this.configurePagination(data.totalCount, count);
      this.populateCoupenTable(this.currentCouponSet, count);
    };
  }

  configureButton() {
    add_coupon_btn.addEventListener(
      "click",
      this.add_product_button_event.bind(this)
    );
    searchCouponInput.addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        this.searchCouponHandler();
      }
    });
    searchCouponBtn.addEventListener(
      "click",
      this.searchCouponHandler.bind(this)
    );
    document
      .querySelector(".cancel-search-btn.coupon")
      .addEventListener("click", this.removeSearch.bind(this));
    coupon_code.addEventListener("input", (e) => {
      const field = e.target;
      field.value = field.value.toUpperCase();
    });
    coupon_category.addEventListener("input", async (e) => {
      const x = e.target.value;
      if (!x) return;
      if (!this.currentCouponCategory.includes(x)) {
        let category;
        for (let item of this.category.data) {
          if (item._id == x) {
            category = item;
            break;
          }
        }

        this.currentCouponCategory.push(category._id);
        const div = document.createElement("div");
        div.classList.add("category-tile-container");
        div.innerHTML = `
                    <button type="button" class="btn-close" aria-label="Close"></button>
                    <span data-value="${x}">${category.category}</span>`;
        category_list_container.append(div);
      }
    });
  }

  async removeSearch() {
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint, 0);
    this.currentCouponSet = data;
    this.populateCoupenTable(data);
    document.querySelector(".cancel-search-btn.coupon").classList.add("d-none");
    this.configurePagination(totalCount);
  }

  searchCouponHandler() {
    const key = searchCouponInput.value;
    console.log(key);
    const url = process.env.URL + "/admin/search_coupon?searchKey=" + key;
    this.dataFetchApiEndPoint = url;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.isSuccess) {
          this.populateCoupenTable(data.data);
          this.configurePagination(data.totalCount);
          document
            .querySelector(".cancel-search-btn.coupon")
            .classList.remove("d-none");
        } else {
          showModel(data.errorMessage);
        }
      });
  }

  populateCoupenTable(data, si = this.pageNumber) {
    this.pageNumber = si;
    si -= 1;
    coupenTableBody.innerHTML = "";
    if (data.length) {
      data.forEach((value, index) => {
        const userTile = this.createCouponTile(value, si * 10 + index);
        coupenTableBody.append(userTile);
      });
    } else {
      // display no product
    }
  }

  async getAllCategory() {
    if (!this.category.length)
      this.category = await fetchData(
        process.env.URL + "/admin/get_all_categories"
      );
    console.log(this.category);
    return this.category;
  }

  createCouponTile(value, index) {
    let tableRow = document.createElement("tr");
    tableRow.innerHTML = `
                <th scope="row">${index + 1}</th>
                    <td><p class="responsive-text minimize">${
                      value.code
                    }</p></td>
                    <td>${
                      value.discount.discountType == "percentage-discount"
                        ? value.discount.percentage + " %"
                        : "₹" + value.discount.amount
                    }</td>
                    <td>${value.usedUsers?.length}</td>
                    <td>${value.isActive ? "Active" : "De-Active"}</td>`;

    const buttonCol = document.createElement("td");
    const button = document.createElement("button");
    button.classList.add("btn", "btn-light");
    button.innerHTML = "Details";
    button.addEventListener("click", this.renderIndividualUserDetails(value));

    buttonCol.append(button);
    tableRow.append(buttonCol);

    return tableRow;
  }

  add_product_button_event() {
    this.updateModalForAddCoupon();
    removeExcessiveEventListeners(create_coupon_btn);
    create_coupon_btn.addEventListener(
      "click",
      this.createCouponHandler.bind(this)
    );
    displayCouponModal();
  }

  // display and update details modal
  renderIndividualUserDetails(value) {
    return () => {
      this.updateModalData(value);
      displayCouponModal();
    };
  }

  async updateModalData(value) {
    couponModalHeader.innerHTML = "Coupon Details";
    this.updateFieldValue(value);
  }

  async createCouponHandler() {
    console.log("Here");
    const errorArray = [];
    let code = coupon_code.value;
    if (code.length <= 5 || !/^\S+$/.test(code))
      errorArray.push("Invalid coupon code");

    let discountType = coupon_discountType.value;
    if (
      discountType != "percentage-discount" &&
      discountType != "amount-discount"
    )
      errorArray.push("Invalid discount type");

    let discount = coupon_discount.value;
    let percentage, amount;
    if (
      !discount ||
      discount < 0 ||
      (discount > 100 && discountType == "percentage-discount")
    )
      errorArray.push("Invalid discount value");
    if (discountType == "percentage-discount") percentage = discount;
    else amount = discount;
    errorArray.push("Invalid discount field value.");

    let minSpend = coupon_minSpend.value;
    if (minSpend < 0)
      errorArray.push("Minimun Spend value should be positive.");

    let usageLimit = coupon_useageLimit.value;
    if (usageLimit < 0)
      errorArray.push("Usage limit should be positive or zero.");

    let expiry = this.createDateObj(coupon_expiry_date.value);

    const categories = this.currentCouponCategory;

    fetch(baseUrl + "admin/create_coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        discountType,
        percentage,
        amount,
        expiry,
        minSpend,
        usageLimit,
        categories,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        // console.log(data)
        if (data.isSuccess) {
          if (this.currentCouponSet.length < 10) {
            this.currentCouponSet.push(data.data);
            this.populateCoupenTable(this.currentCouponSet);
          }
          showModel("Coupon sucessfully added.");
        } else {
          showModel(data.errorMessage);
        }
        // if(data.isSuccess)
        // updateCouponSetCreate(data.)
      });
  }

  async updateModalForAddCoupon() {
    couponModalHeader.innerHTML = "Create Coupon";
    coupon_code.value = "";
    coupon_discountType.querySelector(`[value = ""]`).selected = true;
    coupon_discount.value = "";
    coupon_minSpend.value = "";
    coupon_useageLimit.value = "";
    coupon_expiry_date.value = "";
    coupon_numberOfUsed.parentElement.classList.add("d-none");
    user_container.classList.add("d-none");
    update_button.classList.add("d-none");
    activate_btn.classList.add("d-none");
    deactivate_btn.classList.add("d-none");
    create_coupon_btn.classList.remove("d-none");

    this.datePicker();
    category_list_container.innerHTML = "";
    this.currentCouponCategory = [];
  }
  async updateFieldValue(value) {
    console.log("here");
    coupon_code.value = value.code;
    coupon_discountType.querySelector(
      `[value = "${value.discount.discountType}"]`
    ).selected = true;
    coupon_discount.value =
      value.discount.discountType == "percentage-discount"
        ? value.discount.percentage
        : value.discount.amount;
    coupon_minSpend.value = value.minSpend;
    coupon_useageLimit.value = value.usageLimit;
    coupon_numberOfUsed.parentElement.classList.remove("d-none");
    update_button.classList.remove("d-none");
    create_coupon_btn.classList.add("d-none");
    coupon_numberOfUsed.value = value.numberOfCouponsUsed;

    this.currentCouponCategory = [];

    const categories = value.categories;
    category_list_container.innerHTML = "";
    if (categories.length) {
      categories.map((x) => {
        this.currentCouponCategory.push(x._id);
        const div = document.createElement("div");
        div.classList.add("category-tile-container");
        div.innerHTML = `
                <button type="button" class="btn-close" aria-label="Close"></button>
                <span data-value="${x.category}">${x.category}</span>`;
        div
          .querySelector("button")
          .addEventListener("click", removeCategory(x._id, div).bind(this));
        category_list_container.append(div);
      });
    }

    function removeCategory(id, div) {
      return function () {
        div.classList.add("d-none");
        this.currentCouponCategory = this.currentCouponCategory.filter((x) => {
          if (id != x) return true;
        });
        console.log(this.currentCouponCategory);
      };
    }

    const usedUsers = value.usedUsers;
    user_list_container.innerHTML = "";
    if (usedUsers.length) {
      user_container.classList.remove("d-none");
      usedUsers.map((x) => {
        const div = document.createElement("div");
        div.classList.add("user-tile-container");
        div.innerHTML = `
                <span>${
                  x.credentials.email || x.credentials.mobile.number
                }</span>`;
        user_list_container.append(div);
      });
    } else {
      user_container.classList.add("d-none");
    }

    this.datePicker(value.expiry);

    removeExcessiveEventListeners(activate_btn);
    activate_btn.addEventListener("click", () => {
      fetch(baseUrl + "admin/activate_coupon?couponId=" + value._id, {
        method: "PUT",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.isSuccess) {
            // show the other butotn
            activate_btn.classList.add("d-none");
            deactivate_btn.classList.remove("d-none");
            this.updateCouponSetisActive(true, value._id);
            this.populateCoupenTable(this.currentCouponSet);
            // update current data set
          } else {
            showModel(data.errorMessage);
          }
        });
    });

    removeExcessiveEventListeners(deactivate_btn);
    deactivate_btn.addEventListener("click", () => {
      console.log("wtf");
      fetch(baseUrl + "admin/diactivate_coupon?couponId=" + value._id, {
        method: "PUT",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.isSuccess) {
            // show the other butotn
            activate_btn.classList.remove("d-none");
            deactivate_btn.classList.add("d-none");
            this.updateCouponSetisActive(false, value._id);
            this.populateCoupenTable(this.currentCouponSet);
            // update current data set
          } else {
            showModel(data.errorMessage);
          }
        });
    });

    if (value.isActive) {
      activate_btn.classList.add("d-none");
      deactivate_btn.classList.remove("d-none");
    } else {
      deactivate_btn.classList.add("d-none");
      activate_btn.classList.remove("d-none");
    }

    removeExcessiveEventListeners(update_button);
    update_button.addEventListener("click", () => {
      const updatedFields = this.findALlUpdatedFields(value);
      if (updatedFields.isUpdated) {
        console.log(updatedFields.updates);
        fetch(baseUrl + "admin/update_coupon?couponId=" + value._id, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFields.updates),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.isSuccess) {
              this.currentCouponSet = this.currentCouponSet.map((x) => {
                if (data.data._id == x._id) return data.data;
                return x;
              });
              this.populateCoupenTable(this.currentCouponSet);
              showModel("Updated sucessfully.");
            } else {
              showModel(data.errorMessage);
            }
          });
      } else {
        showModel("No values were updated.");
      }
    });
  }

  findALlUpdatedFields(value) {
    let updatedFields = {
      isUpdated: false,
      updates: {},
    };

    if (value.code != coupon_code.value) {
      updatedFields.updates.code = coupon_code.value;
    }

    if (coupon_discountType.value != value.discount.discountType) {
      updatedFields.updates.discountType = coupon_discountType.value;
      updatedFields.updates.percentage = coupon_discount.value;
      updatedFields.updates.amount = coupon_discount.value;
    }

    if (
      coupon_discount.value !=
      (coupon_discountType.value == "percentage-discount"
        ? value.discount.percentage
        : value.discount.amount)
    ) {
      updatedFields.updates.percentage = coupon_discount.value;
      updatedFields.updates.amount = coupon_discount.value;
    }

    if (coupon_minSpend.value != value.minSpend) {
      updatedFields.updates.minSpend = coupon_minSpend.value;
    }

    if (coupon_useageLimit.value != value.usageLimit) {
      updatedFields.updates.usageLimit = coupon_useageLimit.value;
    }

    // console.log(this.currentCouponCategory, value.categories)
    if (
      !this.arrayEquals(
        this.currentCouponCategory,
        value.categories.map((x) => x._id)
      )
    ) {
      updatedFields.updates.categories = this.currentCouponCategory;
    }

    if (coupon_expiry_date.value != this.createFormatedDate(value.expiry)) {
      updatedFields.updates.expiry = this.createDateObj(
        coupon_expiry_date.value
      );
    }

    if (Object.keys(updatedFields.updates).length) {
      updatedFields.isUpdated = true;
    }

    return updatedFields;
  }

  updateCouponSetisActive(value, id) {
    this.currentCouponSet = this.currentCouponSet.map((x) => {
      if (x._id == id) {
        x.isActive = value;
      }
      return x;
    });
  }

  createFormatedDate(defaultDate) {
    if (!defaultDate) return "";
    const defaultDateObj = new Date(defaultDate);
    return (
      defaultDateObj.getDate() +
      "-" +
      (defaultDateObj.getMonth() + 1 < 10
        ? `0${defaultDateObj.getMonth() + 1}`
        : defaultDateObj.getMonth() + 1) +
      "-" +
      defaultDateObj.getFullYear()
    );
  }

  createDateObj(dateString) {
    if (!dateString || dateString == "") return;
    const parts = dateString.split("-");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1] - 1, 10); // Subtract 1 from the month since months are zero-indexed (0-11)
    const year = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day, 23, 59, 59, 999);
    return dateObj;
  }

  datePicker(defaultDate) {
    var datePickerInput = document.getElementById("coupon_expiry_date");

    let startDate = new Date();
    let endDate;
    if (!endDate) {
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 10);
    }

    const dateObj = {
      format: "dd-mm-yyyy",
      // startDate: startDate,
      // endDate: endDate,
      autoclose: true, // Close the date picker when a date is selected
    };
    if (defaultDate) {
      const defaultDateObj = new Date(defaultDate);
      dateObj.defaultViewDate = defaultDateObj;
      datePickerInput.value =
        defaultDateObj.getDate() +
        "-" +
        (defaultDateObj.getMonth() + 1 < 10
          ? `0${defaultDateObj.getMonth() + 1}`
          : defaultDateObj.getMonth() + 1) +
        "-" +
        defaultDateObj.getFullYear();
    }
    $(datePickerInput).datepicker(dateObj);
  }

  arrayEquals(c, d) {
    let a = [...c].sort();
    let b = [...d].sort();
    let status =
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((val, index) => val == b[index]);
    return status;
  }
}
