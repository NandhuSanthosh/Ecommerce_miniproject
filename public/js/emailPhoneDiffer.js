const countryCodeValueField = document.getElementById("country-code-value");

let countryCodes;
async function getAllCountryCode() {
  if (!countryCodes) {
    countryCodes = await fetch(
      "http://localhost:3000/utility/countryCodes"
    ).then((data) => data.json());
  }
  return countryCodes;
}

emailMobileInputField.addEventListener("input", () => {
  console.log(isMobile);
  if (isMobile(emailMobileInputField.value)) {
    displayCountryCode();
  } else {
    removeCountryCode();
  }
});

async function displayCountryCode() {
  countryCodeValueField.classList.remove("d-none");
  const countryCodes = await getAllCountryCode();
  for (let i = 0; i < countryCodes.length; i++) {
    let options = document.createElement("option");
    options.innerHTML = `${countryCodes[i].name} ${countryCodes[i].code}`;
    options.value = `${countryCodes[i].code}`;
    countryCodeValueField.append(options);
  }
}

async function removeCountryCode() {
  countryCodeValueField.classList.add("d-none");
}

function getCountryCode() {
  return countryCodeValueField.value;
}
