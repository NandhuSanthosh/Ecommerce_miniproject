class CategoryHandler{ 
    constructor(){
        this.defaultEndPoint = baseUrl + "admin/get_categories?dummy:dummy" 
        this.dataFetchApiEndPoint = this.defaultEndPoint;
        this.currentCategorySet = [];
        this.addButtonConfiguration();
    }
    async render(){
        const {data, totalCount} = await fetchData(this.dataFetchApiEndPoint);
        this.currentCategorySet = data;
        this.populateCategoryTable(data)

        this.configurePagination(totalCount)
    }

    // PAGINATION 
    configurePagination(length, currentButton = 1){
        this.renderPaginationButtons(length, currentButton)
    }
    renderPaginationButtons(length, currentButton){
        let pageCount = Math.ceil(length / 10);
        const paginationButtonList = document.getElementById('pagination-group-list')
        paginationButtonList.innerHTML = "";
        console.log(pageCount)
        if(pageCount < 2){
            return;
        }
        paginationButtonList.classList.remove('d-none')

        paginationButtonList.append(this.createPaginationTile('Previous', false, currentButton == 1, this.paginationHandler(currentButton-1)))

        if(currentButton >= 2){
            paginationButtonList.append(this.createPaginationTile(1));
            if(currentButton > 2)
            paginationButtonList.append('...')
        }
        
        for(let i = currentButton; i<=pageCount && i < currentButton+3; i++){
            paginationButtonList.append(this.createPaginationTile(i, i==currentButton));
        }

        if(currentButton <= pageCount - 3){
            paginationButtonList.append('...');
            paginationButtonList.append(this.createPaginationTile(pageCount))
        }

        paginationButtonList.append(this.createPaginationTile('Next', false, currentButton == pageCount, this.paginationHandler(currentButton+1)))
    }
    createPaginationTile(count, status, isDisabled, callback){
        const li = document.createElement('li');
        li.classList.add("page-item");
        if(status) li.classList.add("active")
        li.innerHTML = `<a class="page-link" href="#">${count}</a>`
        if(isDisabled)
            li.querySelector('a').classList.add('disabled');
        else
            li.addEventListener('click', callback || this.paginationHandler(count))
        return li
    }
    paginationHandler(count){
        return async()=>{
            const data =await fetchData(this.dataFetchApiEndPoint + `&pno=${count-1}`);
            this.currentCategorySet = data.data;
            this.configurePagination(data.totalCount, count);
            this.populateCategoryTable(this.currentCategorySet, count -1)
        }
    }



    addButtonConfiguration(){
        console.log(addCategoryModal);
        newCategoryBtn.addEventListener('click', this.addButtonEvent.bind(this))
        addCategoryBtn.addEventListener('click', this.addCategoryEvent.bind(this))

        categorySearchInput.addEventListener('keydown', (e)=>{
            if(e.key == "Enter"){
                this.searchProductHandler();
            }
        })

        userSearchButton.addEventListener('click', this.searchProductHandler.bind(this))
        document.querySelector('.cancel-search-btn.category').addEventListener('click', this.removeSearch.bind(this))
    }

    searchProductHandler(){
        const key = categorySearchInput.value;
        console.log(key)
        const url = "http://localhost:3000/admin/search_category?searchKey=" + key
        this.dataFetchApiEndPoint = url
        fetch(url)
        .then( response => response.json())
        .then( data => {
            console.log(data)
            if(data.isSuccess){
                this.populateCategoryTable(data.data)
                this.configurePagination(data.totalCount)
                document.querySelector('.cancel-search-btn.category').classList.remove('d-none')
            }
            else{
                showModel(data.errorMessage)
            }
        })
    }

    async removeSearch(){
        this.dataFetchApiEndPoint = this.defaultEndPoint;
        const {data, totalCount} = await fetchData(this.dataFetchApiEndPoint, 0);
        this.currentCategorySet = data;
        this.populateCategoryTable(data)
        document.querySelector('.cancel-search-btn.category').classList.add('d-none')
        this.configurePagination(totalCount);
    }


    addButtonEvent(){
        this.displayCategoryAdd();
    }

    async addCategoryEvent(){
        // verify that all the necessary fields are there
        const cate = addCategory.value;
        const desc = addDescription.value;
        const offerValue = offer.value;
        const url = "http://localhost:3000/admin/create_category";
        try {
            if(cate == "" || desc == "") {
                const errorMessage = `Please provide all the necessary information : ${!cate ? "category " : ""} ${!desc? "discription" : ""} `
                throw new Error(errorMessage)
            }
            const response = await fetch(url, {
                method: "post", 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category : cate, 
                    description: desc, 
                    offer : offerValue
                })
            })
            const data = await response.json()
                
            if(!data.isSuccess){
                throw new Error("ERROR: " + data.errorMessage);
            }
            else{
                showModel("Category successfully created");
                this.updateCurrentCategoryListAdd(data.createdCategory)
                this.populateCategoryTable(this.currentCategorySet)
            }
            
        } catch (error) {
            showModel(error.message)
        }
    }
    
    updateCurrentCategoryListAdd(newCategory){
        this.currentCategorySet.push(newCategory);
    }

    populateCategoryTable(data, count = 0){
        categoryTableBody.innerHTML = ''
        if(data.length){
            data.forEach( (value, index)=>{
                const userTile = this.createCategoryTile(value, count * 10 + index);
                categoryTableBody.append(userTile)
            })
        }
        else{   
            // display no user
        }
    }

    createCategoryTile(value, index){

        let tableRow = document.createElement('tr')
        tableRow.innerHTML = `
                <th scope="row">${index+1}</th>
                    <td>${value.category}</td>
                    <td>${value.offer? `${value.offer}%` : "0%"}</td>`

        const tdTag = document.createElement('td');
        tdTag.innerHTML = `<p class="responsive-text minimize category-description">${value.description}</p>`
        tdTag.querySelector('p').addEventListener('click', this.setTextExtendFeature)


        const buttonCol = document.createElement('td')
        const button = document.createElement('button')
        button.classList.add("btn", "btn-light", "me-2");
        button.innerHTML = "Details";
        button.addEventListener('click', this.renderIndividualCategoryDetails(value))
        buttonCol.append(button)
        tableRow.append(tdTag)
        tableRow.append(buttonCol)
        return tableRow
    }

    setTextExtendFeature(){
        this.classList.toggle('minimize');
    }

    renderIndividualCategoryDetails(value){
        return ()=>{
            this.updateModalData(value);
            this.displayCategoryDetails();
        }
    }

    updateModalData(value){
        category.value = value.category
        description.value = value.description
        offer_details.value = value.offer || 0

        removeExcessiveEventListeners(deleteCategoryBtn)
        removeExcessiveEventListeners(updateCategoryBtn)
        removeExcessiveEventListeners(category)
        removeExcessiveEventListeners(description)
        removeExcessiveEventListeners(offer_details)
        
        category.addEventListener('input', this.updateUpdateBtn(value))
        description.addEventListener('input', this.updateUpdateBtn(value))
        offer_details.addEventListener('input', this.updateUpdateBtn(value))
        

        
        deleteCategoryBtn.addEventListener('click', this.deleteCategoryEvent(value._id));
        updateCategoryBtn.classList.add('disabled')
        updateCategoryBtn.addEventListener('click', this.updateCategoryEvent(value));
    }

    updateUpdateBtn(value){
        return ()=>{
            if(!this.validateUpdateCategoryValues(value)){
                updateCategoryBtn.classList.add("disabled")
            }
            else{
                updateCategoryBtn.classList.remove('disabled')
            }
        }
    }

    validateUpdateCategoryValues(value){
            if(!value.offer){
                value.offer = 0;
            }
            if((category.value == value.category && description.value == value.description && offer_details.value == value.offer) || (category.value == "" || description.value == "" || offer_details.value == "")){
                return false;
            }
            return true;
    }



    updateCategoryEvent(value){
        return ()=>{
            let status = this.validateUpdateCategoryValues(value)
            const url = "http://localhost:3000/admin/update_category/" + value._id

            try {
                if(!status) throw new Error("Please enter valid values.")
                fetch(url, {
                    method: "PATCH", 
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        diff: {
                            category: category.value,
                            description: description.value,
                            offer: offer_details.value,
                        }
                    })
                })
                .then( response => response.json())
                .then( data => {
                    if(data.isSuccess){
                        // show modal
                        showModel("Category Successfully updated")
                        this.updateCurrentCategoryListUpdate(data.category)
                        this.populateCategoryTable(this.currentCategorySet);
                        // update currentList
                        // rerender
                    }
                    else{
                        throw new Error(data.errorMessage)
                    }
                })
            } catch (error) {
                showModel("Error: ", error.message)
            }
        }
    }

    updateCurrentCategoryListUpdate(value){
        for(let i = 0; i<this.currentCategorySet.length; i++){
            if(this.currentCategorySet[i]._id == value._id){
                this.currentCategorySet[i] = value
                break;
            }
        }
    }

    deleteCategoryEvent(id){
        return ()=>{
            const status = confirm("Do you really want to delete the category, this action cannot be undone.");
            if(status){
                const url = "http://localhost:3000/admin/delete_category";
                fetch(url, {
                    method: "delete", 
                    headers: {
                        'Content-Type': 'application/json'
                    }, 
                    body: JSON.stringify({
                        id
                    })
                })
                .then( response => response.json())
                .then( data => {
                    if(data.isSuccess){
                        this.updateCurrentCategoryListDelete(id)
                        this.populateCategoryTable(this.currentCategorySet)
                        showModel("Category Deleted")
                    }
                    else{
                        showModel(data.errorMessage);
                    }
                })
                .catch( e=> {
                    showModel(e.message)
                })
            }
        }
    }
    
    updateCurrentCategoryListDelete(id){
        this.currentCategorySet = this.currentCategorySet.filter( x => {
            if(x._id != id) {
                return true;
            }
            else{
                return false;
            }
        })
    }

    // searchButtonConfig(){
    //     categorySearchInput.addEventListener('keypress', (event)=>{  
    //         if(event.key == "Enter"){
    //             this.searchCategory();
    //         }
    //     })
    // }

    // searchCategory(){
    //     const searchKey = categorySearchInput.value.toLowerCase();
    //     if(!searchKey){
    //         this.populateCategoryTable(this.currentCategorySet)
    //     }
    //     else{
    //         const newCategorySet = this.currentCategorySet.filter( value => {
    //             if(value.category.toLowerCase().includes(searchKey)) return true;
    //             if(value.description.includes(searchKey)) return true;
    //             return false;
    //         })
    //         this.populateCategoryTable(newCategorySet)
    //     }
    // }

    displayCategoryDetails(){
        $("#categoryDetailsModal").modal();
    }

    displayCategoryAdd(){
        $("#addCategoryModal").modal();
    }


    patchCategoryEvent(){
        // collect data
        // send fetch request
    }
}