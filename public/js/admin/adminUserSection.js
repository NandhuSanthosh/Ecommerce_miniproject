class UserHandlers {
  constructor() {
    this.defaultEndPoint = baseUrl + "admin/get_users?dummy:dummy";
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    this.currentUserSet = [];
    // this.searchButtonConfig();
    this.configureButton();
  }

  async render() {
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint);
    this.currentUserSet = data;
    this.populateUserTable(data);

    this.configurePagination(totalCount);
  }

  configureButton() {
    userSearchInput.addEventListener("keydown", (e) => {
      if (e.key == "Enter") {
        this.searchUserHandler();
      }
    });
    userSearchButton.addEventListener(
      "click",
      this.searchUserHandler.bind(this)
    );
    document
      .querySelector(".cancel-search-btn.user")
      .addEventListener("click", this.removeSearch.bind(this));
  }

  searchUserHandler() {
    const key = userSearchInput.value;
    console.log(key);
    const url = "http://localhost:3000/admin/search_user?searchKey=" + key;
    this.dataFetchApiEndPoint = url;
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.isSuccess) {
          this.populateUserTable(data.data);
          this.configurePagination(data.totalCount);
          document
            .querySelector(".cancel-search-btn.user")
            .classList.remove("d-none");
        } else {
          showModel(data.errorMessage);
        }
      });
  }

  async removeSearch() {
    this.dataFetchApiEndPoint = this.defaultEndPoint;
    const { data, totalCount } = await fetchData(this.dataFetchApiEndPoint, 0);
    this.currentUserSet = data;
    this.populateUserTable(data);
    document.querySelector(".cancel-search-btn.user").classList.add("d-none");
    this.configurePagination(totalCount);
  }

  // PAGINATION
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
      console.log(this.dataFetchApiEndPoint);
      const data = await fetchData(
        this.dataFetchApiEndPoint + `&pno=${count - 1}`
      );
      this.currentUserSet = data.data;
      console.log(data);
      this.configurePagination(data.totalCount, count);
      this.populateUserTable(this.currentUserSet, count - 1);
    };
  }

  populateUserTable(data, count = 0) {
    userTableBody.innerHTML = "";
    if (data.length) {
      data.forEach((value, index) => {
        console.log(count * 10 + index, count, index);
        const userTile = this.createUserTile(value, count * 10 + index);
        userTableBody.append(userTile);
      });
    } else {
      // display no user
    }
  }

  createUserTile(value, index) {
    let tableRow = document.createElement("tr");

    let credentailsCol;
    if (value.credentials.email) {
      credentailsCol = `<td>${value.credentials.email}</td>`;
    } else {
      credentailsCol = `<td>${value.credentials.mobile.number}</td>`;
    }

    tableRow.innerHTML = `
                <th scope="row">${index + 1}</th>
                    <td>${value.name}</td>
                    ${credentailsCol}
                <td>${value.isBlocked}</td>`;

    const buttonCol = document.createElement("td");
    const button = document.createElement("button");
    button.classList.add("btn", "btn-light");
    button.innerHTML = "Details";
    button.addEventListener("click", this.renderIndividualUserDetails(value));

    buttonCol.append(button);
    tableRow.append(buttonCol);

    return tableRow;
  }

  renderIndividualUserDetails(value) {
    return () => {
      // fetch user address using the id
      this.updateModalData(value);
      this.displayUserDetails();
    };
  }

  updateModalData(value) {
    userDetailsName.innerHTML = value.name;
    userDetailsCredentials.innerHTML = value.credentials.email
      ? value.credentials.email
      : value.credentials.mobile.countryCode +
        "  " +
        value.credentials.mobile.number;

    fetch("http://localhost:3000/admin/complete_userDetails/" + value._id)
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          const addressesContainer = document.querySelector(
            ".addressesContainer"
          );
          addressesContainer.innerHTML = "";
          if (data.user.address.length > 0) {
            data.user.address.forEach((x) => {
              addressesContainer.append(this.creaateUserModalAddressTile(x));
            });
          } else {
            addressesContainer.innerHTML =
              "<p style='text-align:center'>User doesn't update address.<p>";
          }
        } else {
          showModel(data.errorMessage);
        }
      });
    this.updateBlockButton(value.isBlocked);
    removeExcessiveEventListeners(blockUser);
    blockUser.addEventListener(
      "click",
      this.blockUserEvent(value._id, value.isBlocked)
    );
  }

  creaateUserModalAddressTile(address) {
    const template = `<div><span class="address-fullname">${
      address.fullName
    }</span></div>
            <div><span class="address-firstLine address-line">${
              address.addressLine1
            }</span></div>
            <div><span class="address-secondLine address-line">${
              address.addressLine2
            }</span></div>
            <div><span class="address-thridLine address-line">${
              address.state + " " + address.pincode
            }  India</span></div>
            <div><span class="address-phoneNumber address-line" >${
              address.mobileNumber
            }</span></div>`;
    const addressContainer = document.createElement("div");
    addressContainer.classList.add(
      "addressContainer",
      "p-2",
      "p-md-3",
      "p-lg-4",
      "mb-3"
    );
    addressContainer.innerHTML = template;
    return addressContainer;
  }

  blockUserEvent(id, isBlocked) {
    return () => {
      const status = confirm("Do you want to block this user");
      if (status) {
        // request to block user
        const url = "http://localhost:3000/admin/block_user";
        fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: id,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.isSuccess) {
              this.updateBlockButton(!isBlocked);
              this.updateCurrentUserList(id, !isBlocked);
              this.populateUserTable(this.currentUserSet);
              showModel(data.status);
            } else {
              this.showModel(data.errorMessage);
            }
          });
      }
    };
  }

  updateBlockButton(isBlocked) {
    blockUser.innerHTML = isBlocked ? "Unblock" : "Block";
  }

  updateCurrentUserList(id, isBlocked) {
    this.currentUserSet.forEach((x) => {
      if (x._id == id) x.isBlocked = isBlocked;
    });
  }

  displayUserDetails() {
    $("#userDetailsModal").modal();
  }
}
