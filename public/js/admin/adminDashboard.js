const dashboardContainer = document.getElementById('dashboard-items')
const sidebarToggleButton = document.querySelector('.navbar-toggler')

const userSearchButton = document.getElementById('userSearchButton')
const userSearchInput = document.getElementById('userSearchInput')

let currentSelectedButton;
let currentActiveSection = document.querySelector('#adminDashboardContents [aria-current="page"]');




const renderMethod = new RenderMethods();
const dashboardItems = [{
        item: "Dashboard", 
        icon: "bi-bar-chart-fill",
        renderObject: renderMethod.renderDashboard, 
    }, {
        item: "Users", 
        icon: "bi-people-fill",
        renderObject: renderMethod.renderUser,
    }, {
        item: "Categories",
        icon: "bi-tags-fill",
        renderObject: renderMethod.renderCategories
    }, {
        item: "Products", 
        icon: "bi-box-seam-fill",
        renderObject: renderMethod.renderProducts
    }, {
        item: "Orders", 
        icon: "bi-cart-fill",
        renderObject: renderMethod.renderOrders
    }, {
        item: "Coupon",
        icon: "bi-c-circle-fill",
        renderObject: renderMethod.renderCoupon
    }
]




configure(dashboardItems);   


// renders the sidebar and setup toggleButton
function configure(dashboardItems){
    dashboardItems.forEach( (item, index) => {
        let button = createDashboardItemTile(item);
        if(index == 0){
            currentSelectedButton = button
            button.setAttribute('aria-current', "page")
        }
        dashboardContainer.append(button);
    })
    sidebarToggleButton.addEventListener('click', sidebarToggleEvenHandler)
}


function sidebarToggleEvenHandler(){
        if([...sidebarMenu.classList].includes('show')){
            sidebarMenu.classList.remove('show')
        }
        else
            sidebarMenu.classList.add('show')
}


function createDashboardItemTile(item){

    const aTag = document.createElement('a');
    aTag.classList.add("sidebar-buttons", 'py-2', 'ripple');
    aTag.addEventListener('click', sidebarButtonClickEvent(aTag, item))

    const iTag = document.createElement('i');
    iTag.classList.add('bi', 'ms-2', item.icon)
    aTag.append(iTag);

    const span = document.createElement('span');
    span.classList.add('ms-2')
    span.innerHTML = item.item
    aTag.append(span);

    return aTag;
}

function sidebarButtonClickEvent(button, item){
    return function(){

        currentSelectedButton?.removeAttribute('aria-current');
        currentActiveSection?.removeAttribute('aria-current')

        const newSection = document.getElementById(item.item);
        currentActiveSection = newSection
        currentSelectedButton = button;
        
        newSection.setAttribute("aria-current", "page");
        button.setAttribute('aria-current', "page")

        item.renderObject.render();
        sidebarToggleEvenHandler()
    }
}



 




