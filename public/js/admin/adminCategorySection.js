class CategoryHandler{
    constructor(){
        this.dataFetchApiEndPoint = baseUrl + "admin/get_categories"
        this.currentCategorySet = [];
        this.searchButtonConfig();
        this.addButtonConfiguration();
    }

    async render(){
        const data = await fetchData(this.dataFetchApiEndPoint);
        this.currentCategorySet = data;
        this.populateCategoryTable(data)
    }

    addButtonConfiguration(){
        console.log(addCategoryModal);
        newCategoryBtn.addEventListener('click', this.addButtonEvent.bind(this))
        addCategoryBtn.addEventListener('click', this.addCategoryEvent.bind(this))
    }

    addButtonEvent(){
        this.displayCategoryAdd();
    }

    addCategoryEvent(){
        // verify that all the necessary fields are there
        const cate = addCategory.value;
        const desc = addDescription.value;
        const url = "http://localhost:3000/admin/create_category";
        try {
            console.log(cate, desc);
            if(cate == "" || desc == "") {
                const errorMessage = `Please provide all the necessary information : ${!cate ? "category " : ""} ${!desc? "discription" : ""} `
                throw new Error(errorMessage)
            }
            console.log("the fuck");
            fetch(url, {
                method: "post", 
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category : cate, 
                    description: desc
                })
            })
            .then( response => response.json())
            .then( data => {
                console.log(data);
                if(!data.isSuccess){
                    throw new Error("ERROR: " + data.errorMessage);
                }
                else{
                    showModel("Category successfully created");
                    this.updateCurrentCategoryListAdd(data.createdCategory)
                    this.populateCategoryTable(this.currentCategorySet)
                }
            })
            
        } catch (error) {
            showModel(error.message)
        }
    }
    
    updateCurrentCategoryListAdd(newCategory){
        this.currentCategorySet.push(newCategory);
    }

    populateCategoryTable(data){
        categoryTableBody.innerHTML = ''
        if(data.length){
            data.forEach( (value, index)=>{
                const userTile = this.createCategoryTile(value, index);
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
                    <td>${value.category}</td>`

        const tdTag = document.createElement('td');
        tdTag.innerHTML = `<p class="responsive-text minimize">${value.description}</p>`
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

        removeExcessiveEventListeners(deleteCategoryBtn)
        removeExcessiveEventListeners(updateCategoryBtn)
        removeExcessiveEventListeners(category)
        removeExcessiveEventListeners(description)
        
        category.addEventListener('input', this.updateUpdateBtn(value))
        description.addEventListener('input', this.updateUpdateBtn(value))

        
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
            if((category.value == value.category && description.value == value.description) || (category.value == "" || description.value == "")){
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
                            description: description.value
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

    searchButtonConfig(){
        categorySearchInput.addEventListener('keypress', (event)=>{  
            if(event.key == "Enter"){
                this.searchCategory();
            }
        })
    }

    searchCategory(){
        const searchKey = categorySearchInput.value.toLowerCase();
        if(!searchKey){
            this.populateCategoryTable(this.currentCategorySet)
        }
        else{
            const newCategorySet = this.currentCategorySet.filter( value => {
                if(value.category.toLowerCase().includes(searchKey)) return true;
                if(value.description.includes(searchKey)) return true;
                return false;
            })
            this.populateCategoryTable(newCategorySet)
        }
    }

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