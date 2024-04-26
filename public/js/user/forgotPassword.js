const forgotPasswordBtn = document.getElementById("FPEmailSubmitBtn");
const emailInput = document.getElementById("forgotPasswordEmal");

forgotPasswordBtn.addEventListener("click", forgotPasswordHandler);
emailInput.addEventListener("input", credentailInputEvent(emailMobile));

function forgotPasswordHandler(e) {
  e.preventDefault();
  // validate
  // take value
  const { status, value } = credentailInputEvent(emailMobile)();
  const credentail = {};
  if (isNaN(value[0])) {
    credentail.email = value;
  } else {
    credentail.mobile = value;
  }
  if (status) {
    const url = getRequestUrl();
    console.log(url);
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credentail }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.isSuccess) {
          showModel(
            "You will receive an email containing a secure link that can be used to reset your password."
          );
        } else {
          showModel(data.errorMessage);
        }
      });
  } else {
    showModel("The credential that you provided is not valid.");
  }
}
function credentailInputEvent(field) {
  return () => {
    const value = extractValue(field);
    let status = false;
    if (isNaN(value[0]) || associate == "admin") {
      status = validateEmail(field, value);
    } else {
      status = validateMobile(field, value);
      console.log(status);
    }
    if (status) {
      forgotPasswordBtn.disabled = false;
    } else {
      forgotPasswordBtn.disabled = true;
    }
    return { status, value };
  };
}

function getRequestUrl() {
  if (associate == "admin") {
    return  "/admin/forgot_password";
  } else {
    return  "/forgot_password";
  }
}

function extractValue(container) {
  return container.querySelector("input").value;
}
