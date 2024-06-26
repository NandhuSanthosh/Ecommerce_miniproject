const navToggleBtn = document.querySelector(".nav-toggle");
const leftSection = document.querySelector(".left-section");

const myDetailsBtn = document.getElementById("my_details_btn");
const forgotPasswordBtn = document.getElementById("forgot_password_btn");

const contentContainer = document.querySelector(".content");
const myDetailsContent = document.querySelector(".myDetailsContent");
const editAddressContent = document.querySelector(".editAddressContent");
const forgotPasswordContent = document.querySelector(".passwordContent");

const addressesContainer = document.querySelector(".addressesContainer");

const buttonListContainer = document.querySelector(".button-list");

const validateObject = [
  {
    name: "fullName",
    field: addressFullName,
    validateFunction: validateFullName,
  },
  {
    name: "mobileNumber",
    field: addressMobile,
    validateFunction: validatePhoneNumber,
  },
  {
    name: "pincode",
    field: addressPincode,
    validateFunction: validatePinCode,
  },
  {
    name: "addressLine1",
    field: addressAddressLine1,
    validateFunction: validate,
  },
  {
    name: "addressLine2",
    field: addressAddressLine2,
    validateFunction: validate,
  },
  {
    name: "landmark",
    field: addressLandmark,
    validateFunction: validate,
  },
  {
    name: "state",
    field: addressState,
    validateFunction: validateIndianState,
  },
];

function validateFullName(fullName) {
  var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
  if (regName.test(fullName)) {
    return { isValid: true };
  }
  return { isValid: false, error: "Name is not valid" };
}
function validatePhoneNumber(number) {
  const indianPhoneNumberRegex = /^[6789]\d{9}$/;
  if (indianPhoneNumberRegex.test(number)) {
    return { isValid: true };
  }
  return { isValid: false, error: "Phone number is not valid" };
}
function validatePinCode(pincode) {
  const indianPINCodeRegex = /^[1-9][0-9]{5}$/;
  if (indianPINCodeRegex.test(pincode)) {
    return { isValid: true };
  }
  return { isValid: false, error: "Pincode is not valid" };
}
function validate(address) {
  const trimmedAddress = address.trim();
  if (trimmedAddress.length === 0) {
    return { isValid: false, error: "Address not valid" };
  }
  return { isValid: true };
}
function validateIndianState(state) {
  // List of valid Indian states
  const validStates = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ];

  // Convert the input to title case for comparison
  const formattedState = state
    .trim()
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Check if the input matches a valid state
  if (validStates.includes(formattedState)) {
    return { isValid: true };
  }
  return { isValid: false, error: "State is not valid" };
  return;
}
function removeExcessiveEventListeners(blockUser) {
  var old_element = blockUser;
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);
  return new_element;
}

class Button {
  constructor(text, action) {
    this.text = text;
    this.action = action;
    this.next = null;
  }
}

class ButtonList {
  constructor(container) {
    this.curr = null;
    this.container = container;
    this.length = 0;
  }

  addButton(button) {
    if (this.curr) {
      button.next = this.curr;
      this.curr = button;
      this.length++;
    } else {
      console.log("curr is null");
    }
  }

  addRootButton(button) {
    this.curr = button;
    this.length = 1;
  }

  renderButtonList() {
    this.container.innerHTML = "";
    const helper = (curr, length) => {
      if (!curr) return;
      helper(curr.next);
      this.container.append(this.createContainer(curr, length - 1));
      if (length != this.length) {
        const span = document.createElement("span");
        span.style.fontSize = "22px";
        span.classList.add("ms-2", "me-2");
        span.innerHTML = "/";
        this.container.append(span);
      }
    };
    helper(this.curr, this.length);
  }

  createContainer(curr) {
    const span = document.createElement("span");
    span.innerHTML = curr.text;
    span.classList.add("button-list-btn");
    span.addEventListener("click", this.btnEventAdder(curr, curr.action));
    return span;
  }

  btnEventAdder(curr, action) {
    return () => {
      // pop buttons
      this.removeButtons(curr);
      action();
      this.renderButtonList();
    };
  }

  removeButtons(button, curr = this.curr) {
    if (!curr) {
      return;
    }
    if (curr == button) {
      return;
    }
    this.curr = this.curr.next;
    this.removeButtons(button);
  }

  buttonEvent(clickedBtn, curr) {
    if (curr == clickedBtn) {
      clickedBtn.action();
    }
    this.curr = curr.next;
    this.buttonEvent(curr);
  }

  pop() {
    this.curr = this.curr.next;
    this.renderButtonList();
    this.curr.action();
  }
}

class Settings {
  constructor() {
    this.buttonList = new ButtonList(buttonListContainer);
    this.currentPage = null;
    this.currentAddress = {};
    this.config();
    this.onLoadFunction();
  }

  onLoadFunction() {
    myDetailsBtn.click();
  }

  config() {
    navToggleBtn.addEventListener("click", this.navToggleBtnEvent);
    myDetailsBtn.addEventListener(
      "click",
      this.addRootBtnEvent("My Details", this.myDetailsBtnEvent)
    );
    forgotPasswordBtn.addEventListener(
      "click",
      this.addRootBtnEvent("Change Password", this.forgotPasswordBtnEvent)
    );

    username.addEventListener("input", this.userNameFieldEvent);
    addAddressBtn.addEventListener(
      "click",
      this.editRemoveEventAdder("Add Address", this.addAddressBtnEvent)
    );
    createNewAddressBtn.addEventListener(
      "click",
      this.addAddressEventHandler.bind(this)
    );
    editCancelBtn.addEventListener(
      "click",
      this.addressEditCancelBtn.bind(this, this.addAddressBtnEvent)
    );

    nameUpdateBtn.addEventListener("click", this.updateNameEvent.bind(this));

    currentPassword.addEventListener(
      "input",
      this.validateNewPassword.bind(this)(false)
    );
    newPassword.addEventListener(
      "input",
      this.validateNewPassword.bind(this)(true)
    );
    confirmNewPassword.addEventListener(
      "input",
      this.updateConfirmPassword.bind(this)
    );
    changePasswordBtn.addEventListener(
      "click",
      this.changePasswordHandler.bind(this)
    );
  }
  changePasswordHandler() {
    const currPass = currentPassword.value;
    const newPass = newPassword.value;

    fetch( "/change_password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        currentPassword: currPass,
        newPassword: newPass,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          showModal("Password successfully changed");
          reset(currentPassword);
          reset(newPassword);
          reset(confirmNewPassword);
          function reset(field) {
            field.value = "";
            field.classList.remove("success");
          }
          const instructionList = document.querySelector(
            ".passwordInstructionsList"
          );
          const childElements = Array.from(instructionList.children);
          childElements.forEach((x) => {
            x.classList.remove("success");
          });
        } else {
          showModal(data.errorMessage);
        }
      });
  }

  validateNewPassword(isNewPassword) {
    return (e) => {
      const status = this.passwordValidate(e.target, isNewPassword);
      if (status) {
        if (isNewPassword) this.updateConfirmPassword();
        e.target.classList.add("success");
        e.target.classList.remove("error");
      } else {
        e.target.classList.remove("success");
        e.target.classList.add("error");
      }
      this.resetPasswordChangeBtn();
    };
  }
  updateConfirmPassword(e) {
    if (confirmNewPassword.value.trim() == "") return;
    if (this.validateConfirmPassword()) {
      confirmNewPassword.classList.remove("error");
      confirmNewPassword.classList.add("success");
    } else {
      confirmNewPassword.classList.add("error");
      confirmNewPassword.classList.remove("success");
    }
    this.resetPasswordChangeBtn();
  }

  validateConfirmPassword(e) {
    return newPassword.value == confirmNewPassword.value;
  }

  passwordValidate(field, isNewPassword) {
    const password = field.value.trim();
    const minLength = /.{8,}/;
    const upperCase = /[A-Z]/;
    const specialCharacter = /[^a-zA-Z0-9]/;
    const number = /\d/;

    let status = true;

    status = validate(minLength, "minLength") && status;
    status = validate(upperCase, "uppercase") && status;
    status = validate(specialCharacter, "specialCharacter") && status;
    status = validate(number, "number") && status;

    return status;

    function validate(regexString, className) {
      if (regexString.test(password)) {
        if (isNewPassword) setSuccess(document.querySelector("." + className));
        return true;
      } else {
        if (isNewPassword) setFailure(document.querySelector("." + className));
        return false;
      }
    }

    function setSuccess(field) {
      field.classList.add("success");
      field.classList.remove("error");
    }
    function setFailure(field) {
      field.classList.remove("success");
      field.classList.add("error");
    }
  }
  resetPasswordChangeBtn() {
    const confirmPasswordStatus = this.validateConfirmPassword();
    const currentPasswordStatus = this.passwordValidate(currentPassword);
    const newPasswordStatus = this.passwordValidate(newPassword);
    if (newPasswordStatus && confirmPasswordStatus && currentPasswordStatus) {
      changePasswordBtn.disabled = false;
    } else {
      changePasswordBtn.disabled = true;
    }
    // changePasswordBtn
  }

  updateNameEvent() {
    const newName = username.value.trim();
    // request
    fetch( "/update_name", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: newName }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          userDetails.name = newName;
          nameUpdateBtn.classList.add("disabled");
          showModal("Name sucessfully updated!");
        } else {
          showModal(data.errorMessage);
        }
      });
    // show success
    // show failure
  }

  addAddressBtnEvent() {
    this.updateView(editAddressContent);
    this.udpateFormValue({});
    editUpdateBtn.classList.add("d-none");
    createNewAddressBtn.classList.remove("d-none");
  }

  addAddressEventHandler() {
    const { isValid, updatedFields, error } =
      this.findUpdatedFieldsNewAddress();
    if (isValid) {
      // request
      const body = { addressDetails: updatedFields };
      fetch( "/add_address", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.isSuccess) {
            showModal("New address created");
            this.updateAddressesNewAddress(data.newAddress);
            myDetailsBtn.click();
          } else {
            showModal(data.errorMessage);
          }
        });
    } else {
      const errorString = error.reduce((acc, x) => acc + x + "<br>", "");
      showModal(errorString);
    }
  }
  updateAddressesNewAddress(newAddress) {
    addresses.push(newAddress);
  }
  findUpdatedFieldsNewAddress() {
    let isStatus = true;
    const errorArray = [];
    const result = validateObject.reduce((acc, x) => {
      const result = x.validateFunction(x.field.value);
      if (result.isValid) acc[x.name] = x.field.value;
      else {
        isStatus = false;
        errorArray.push(result.error);
      }
      return acc;
    }, {});
    if (isStatus) {
      return { isValid: true, updatedFields: result };
    } else {
      return { isValid: false, error: errorArray };
    }
  }

  addressEditUpdateBtn(id) {
    return async () => {
      const { isValid, updatedFields } = this.findUpdatedFields();
      if (isValid) {
        const body = { updatedData: updatedFields };
        await fetch( "/edit_address/" + id, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.isSuccess) {
              // show success
              showModal("Address updated succesfully");
              // update modal
              this.updateAddressesEdit(data.data);
              // rerender
            } else {
              showModal(data.errorMessage);
              // show failure
            }
          });
      } else {
        showModal(
          "Check the verify the fields you just updated, some data is invalid."
        );
      }
    };
  }

  updateAddressesEdit(data) {
    addresses = addresses.map((x) => {
      if (x._id == data._id) {
        return data;
      }
      return x;
    });
  }

  findUpdatedFields() {
    let isStatus = true;
    const errorArray = [];
    const result = validateObject.reduce((acc, x) => {
      if (x.field.value != this.currentAddress[x.name]) {
        const result = x.validateFunction(x.field.value);
        if (result.isValid) acc[x.name] = x.field.value;
        else {
          isStatus = false;
          errorArray.push(errorArray.error);
        }
      }
      return acc;
    }, {});
    if (isStatus) {
      return { isValid: true, updatedFields: result };
    } else {
      return { isValid: false, error: errorArray.error };
    }
  }

  renderAddress() {
    addressesContainer.innerHTML = "";
    addresses.forEach((x) => {
      addressesContainer.append(this.createAddressTile(x));
    });
    // addressesContainer.append(this.createAddAddressTile());
  }

  createAddressTile(address) {
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
            }</span></div>
            <div class="mt-3">
                <button class="btn address-editBtn" >Edit</button>
                <button class="btn address-removeBtn">Remove</button>
            </div>`;
    const addressContainer = document.createElement("div");
    addressContainer.classList.add(
      "addressContainer",
      "p-2",
      "p-md-3",
      "p-lg-4",
      "mb-3"
    );
    addressContainer.innerHTML = template;
    addressContainer
      .querySelector(".address-editBtn")
      .addEventListener(
        "click",
        this.editRemoveEventAdder(
          "Edit Address",
          this.editAddressBtnEvent,
          address
        )
      );
    addressContainer
      .querySelector(".address-removeBtn")
      .addEventListener("click", this.removeAddressBtnEvent(address._id));
    return addressContainer;
  }

  removeAddressBtnEvent(id) {
    return async () => {
      const status = confirm("Do you really want to delete the address.");
      if (status) {
        fetch( "/delete_address/" + id, {
          method: "DELETE",
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.isSuccess) {
              showModal("Address Deleted!");
              this.udpateAddresses(id);
              this.renderAddress();
            } else {
              showModal(data.errorMessage);
            }
          });
      }
    };
  }
  udpateAddresses(id) {
    addresses = addresses.filter((x) => x._id != id);
  }
  editRemoveEventAdder(text, handler, address) {
    return () => {
      const button = new Button(text, handler.bind(this));
      this.buttonList.addButton(button);
      this.buttonList.renderButtonList();
      handler.bind(this)(address);
    };
  }

  editAddressBtnEvent(address) {
    this.updateView(editAddressContent);
    this.udpateFormValue(address);
    editUpdateBtn.classList.remove("d-none");
    createNewAddressBtn.classList.add("d-none");
  }

  udpateFormValue(address = this.currentAddress) {
    addressFullName.value = address.fullName || "";
    addressMobile.value = address.mobileNumber || "";
    addressPincode.value = address.pincode || "";
    addressAddressLine1.value = address.addressLine1 || "";
    addressAddressLine2.value = address.addressLine2 || "";
    addressLandmark.value = address.landmark || "";
    addressState.value = address.state || "";
    this.currentAddress = address || "";

    removeExcessiveEventListeners(editUpdateBtn);
    editUpdateBtn.addEventListener(
      "click",
      this.addressEditUpdateBtn.bind(this)(address._id)
    );
  }

  addressEditCancelBtn() {
    this.updateView(myDetailsContent);
    this.buttonList.pop();
  }

  userNameFieldEvent(e) {
    const inputValue = e.target.value.trim();
    if (
      inputValue == userDetails.name ||
      !validateFullName(inputValue).isValid
    ) {
      nameUpdateBtn.classList.add("disabled");
    } else {
      nameUpdateBtn.classList.remove("disabled");
    }
  }

  addRootBtnEvent(text, callback) {
    return () => {
      const button = new Button(text, callback.bind(this));
      this.buttonList.addRootButton(button);
      this.buttonList.renderButtonList();
      callback.bind(this)();
    };
  }

  myDetailsBtnEvent() {
    this.updateView(myDetailsContent);
    this.renderAddress();
    this.resetButtons(myDetailsBtn);
  }
  resetButtons(button) {
    sidebarBtnList.querySelector(".curr").classList.remove("curr");
    button.classList.add("curr");
  }

  forgotPasswordBtnEvent() {
    this.updateView(forgotPasswordContent);
    this.resetButtons(forgotPasswordBtn);
  }

  updateView(newPage) {
    if (this.currentPage == newPage) return false;
    this.currentPage?.classList.add("d-none");
    newPage.classList.remove("d-none");
    this.currentPage = newPage;
  }

  navToggleBtnEvent() {
    if ([...leftSection.classList].includes("d-none")) {
      leftSection.classList.remove("d-none");
    } else {
      leftSection.classList.add("d-none");
    }
  }
}

function showModal(message) {
  $("#generalModal").modal();
  document
    .getElementById("generalModal")
    .querySelector(".modal-body").innerHTML = message;
}

const config = new Settings();
