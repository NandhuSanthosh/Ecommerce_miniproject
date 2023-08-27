const userTableBody = document.getElementById('userTableBody')
const userDetailModalCloseButton = document.getElementById('modalCloseBtn');
const baseUrl = "http://localhost:3000/"


function removeExcessiveEventListeners(blockUser){
    var old_element = blockUser
    var new_element = old_element.cloneNode(true);
    old_element.parentNode.replaceChild(new_element, old_element);
}

class RenderMethods{
    constructor(){
        this.renderDashboard = renderDashboardFunction
        this.renderUser = new UserHandlers();       
        this.renderCategories = new CategoryHandler();
    }
    renderProducts(){
        console.log("render products");
    }
    renderOrders(){
        console.log("render orders");
    }
    renderSellers(){
        console.log("render sellers");
    }

}

function  renderDashboardFunction() {  
}

async function fetchData(url){
    if(url){
        let response = await fetch(url);
        let data = await response.json()
        if(data.isSuccess){
            return data.data
        }
        else{
            showModel(data.errorMessage)
        }
    }
    else{
        showModel("Something went wrong")
    }
}

// shows a model with custom message
function showModel(message){
    modelContent.innerHTML = message
    $("#exampleModal").modal();
}





