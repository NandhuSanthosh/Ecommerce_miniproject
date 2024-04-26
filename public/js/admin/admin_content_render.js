const userTableBody = document.getElementById("userTableBody");
const userDetailModalCloseButton = document.getElementById("modalCloseBtn");
const baseUrl =  "/";

function removeExcessiveEventListeners(blockUser) {
  var old_element = blockUser;
  var new_element = old_element.cloneNode(true);
  old_element.parentNode.replaceChild(new_element, old_element);
  return new_element;
}

class RenderMethods {
  constructor() {
    this.renderDashboard = {
      render: renderDashboardFunction,
    };
    this.renderUser = new UserHandlers();
    this.renderCategories = new CategoryHandler();
    this.renderProducts = new ProductHandlers();
    this.renderOrders = new RenderHandlers();
    this.renderCoupon = new CoupenHandlers();
  }
  renderSellers() {
    console.log("render sellers");
  }
}

function renderDashboardFunction() {
  const paginationButtonList = document.getElementById("pagination-group-list");
  paginationButtonList.classList.add("d-none");
}

async function fetchData(url) {
  if (url) {
    let response = await fetch(url);
    let data = await response.json();
    if (data.isSuccess) {
      return { data: data.data, totalCount: data.totalCount };
    } else {
      showModel(data.errorMessage);
    }
  } else {
    showModel("Something went wrong");
  }
}

// shows a model with custom message
function showModel(message) {
  modelContent.innerHTML = message;
  $("#exampleModal").modal();
}
