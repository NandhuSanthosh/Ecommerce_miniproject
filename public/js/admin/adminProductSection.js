class ProductHandlers{
    constructor(){
        // they dummy query parameters are added so that the pagination link doesn't break
        this.defaultEndPoint = baseUrl + "admin/get_products" + "?dummy=dummy"
        this.dataFetchApiEndPoint = this.defaultEndPoint
        this.currentProductSet = [];
        this.cropperArray = [];
        this.category = [];
        // this.searchButtonConfig();
    }
    async render(){
        const {data, totalCount} = await fetchData(this.dataFetchApiEndPoint, 0);
        this.currentProductSet = data;
        this.populateProductTable(data)
        this.configureButton();

        console.log(totalCount)
        this.configurePagination(totalCount);

    }

    configurePagination(length, currentButton = 1){
        this.renderPaginationButtons(length, currentButton)
    }

    renderPaginationButtons(length, currentButton){
        console.log(length, currentButton);
        let pageCount = Math.ceil(length / 10);
        const paginationButtonList = document.getElementById('pagination-group-list')
        if(pageCount < 2){
            paginationButtonList.classList.add("d-none")
            return;
        }
        paginationButtonList.classList.remove('d-none')
        paginationButtonList.innerHTML = "";

        paginationButtonList.append(this.createPaginationTile('Previous', false, currentButton == 1, this.paginationHandler(currentButton-1)))

        if(currentButton >= 2){
            paginationButtonList.append(this.createPaginationTile(1));
            if(currentButton > 2)
            paginationButtonList.append('...')
        }
        
        for(let i = currentButton; i<=pageCount && i < i+3; i++){
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
            const url = this.dataFetchApiEndPoint + `&pno=${count-1}`
            console.log(url)
            const data =await fetchData(url);
            this.currentProductSet = data.data;
            this.configurePagination(data.totalCount, count);
            this.populateProductTable(this.currentProductSet, count)
        }
    }

    configureButton(){
        addProductBtn.addEventListener('click', this.addProductBtnEvent);
        productSearchInput.addEventListener('keydown', (e)=>{
            if(e.key == "Enter"){
                this.searchProductHandler();
            }
        })
        productSearchButton.addEventListener('click', this.searchProductHandler.bind(this))
        document.querySelector('.cancel-search-btn.product').addEventListener('click', this.removeSearch.bind(this))
    }   

    async removeSearch(){
        this.dataFetchApiEndPoint = this.defaultEndPoint;
        const {data, totalCount} = await fetchData(this.dataFetchApiEndPoint, 0);
        this.currentProductSet = data;
        this.populateProductTable(data)
        document.querySelector('.cancel-search-btn.product').classList.add('d-none')
        this.configurePagination(totalCount);
    }

    searchProductHandler(){
        const key = productSearchInput.value;
        console.log(key)
        const url = "http://localhost:3000/admin/search_product?searchKey=" + key
        this.dataFetchApiEndPoint = url
        fetch(url)
        .then( response => response.json())
        .then( data => {
            console.log(data)
            if(data.isSuccess){
                this.populateProductTable(data.data)
                this.configurePagination(data.totalCount)
                document.querySelector('.cancel-search-btn.product').classList.remove('d-none')
            }
            else{
                showModel(data.errorMessage)
            }
        })
    }

    populateProductTable(data, si = 1){
        console.log(data)
        si -= 1;
        productTableBody.innerHTML = ''
        if(data.length){
            data.forEach( (value, index)=>{
                const userTile = this.createProductTile(value, si * 10 + index);
                productTableBody.append(userTile)
            })
        }
        else{   
            // display no product
        }
    }
    async getAllCategory(){
        if(!this.category.length)
            this.category = await fetchData("http://localhost:3000/admin/get_categories")
        console.log(this.category)
        return this.category;
        
    }


    // add product button event
    addProductBtnEvent = ()=>{
            // fetch user address using the id
        this.updateModalData({}, "Create Product", "add");
        this.displayProductModal();
    }


    // add product
    addProductHandler = async()=>{
        // collect all the valus
        let formData;
        let i = 0;

        if(this.category.length == 0){
            await this.getAllCategory();
        }

        let requestHelper = ()=>{

            i++;
            if(i != this.cropperArray.length){
                return;
            }
            
            const url = "http://localhost:3000/admin/create_product";
            fetch(url, {
                method: "POST", 
                // headers: {
                //     'Content-Type': 'application/json'
                // },
                body: formData
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    showModel("Product successfully careated");
                    this.updateCurrentProductCreate(data.newProduct)
                    this.populateProductTable(this.currentProductSet)
                    this.hideProductModal();
                }
                else{
                    showModel(data.errorMessage)
                }
            })
        }

        let getAllCroppedImages = ()=>{
            this.cropperArray.forEach(x => {
                let croppedCanvas = x.getCroppedCanvas();
                croppedCanvas?.toBlob((blob) => {
                    formData.append("images", blob); // "croppedImage.png" is the desired filename
                    requestHelper();
                }, "image/png");
            })
        }

        const {value} =  this.getAllUpdatedValue({});
        console.log(value)
        const {status, error} = this.checkProductRequiredFields(value);
        if(status){
            formData = this.convertToFormData(value);
            getAllCroppedImages();
        }
        else{
            showModel(error)
        }

        
    }
    convertToFormData(value){
        value = JSON.stringify(value);
        const formData = new FormData();
        formData.append("productDetails", value);
        return formData;
    }
    checkProductRequiredFields(value){
        if(!(value.name && value.brand && value.modelName && value.actualPrice && (value.discount || value.currentPrice))){
            return {status: false, error: "Error: Please enter all required fields"};
        }
        if(value.currentPrice <= 0 || value.actualPrice <= 0 ){
            return {status: false, error: "Error: Please check the price fields and retry. Price values cannot be negative"};
        }
        if(typeof value.currentPrice == 'String' || typeof value.actualPrice == "String")
        if(value.currentPrice > value.actualPrice){
            console.log(value.currentPrice, vlaue.actualPrice)
            return {status: false, error: "Error: Current price cannot be greater than actual price!"}
        }
        if(value.discount < 0 ||value.discount > 100){
            return {status: false, error: "Error: Discount have to be in the range 0 to 100"}
        }
        return {status: true}
    }

    // update product
    updateProductHandler(currentValue){
        // get all the changed value
        return ()=>{
            const {status, value} =this.getAllUpdatedValue(currentValue);
            console.log(value)
            if(status){
                const url = "http://localhost:3000/admin/update_product";
                const body = {
                    id: currentValue._id, 
                    updateObject: value
                }
                fetch(url, {
                    method: "PATCH",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                })
                .then( response => response.json())
                .then( data => {
                    if(data.isSuccess){
                        showModel("Product Update Sucessful")
                        console.log(data);
                        this.updateCurrentProductUpdate(data.data);
                        this.populateProductTable(this.currentProductSet)
                    }
                    else{
                        showModel(data.errorMessage)
                    }
                })
            }
            else{
                showModel("No value were updated")
            }
        }
    }

    // delete image
    deleteImageEvent(id, src, imageCont){
        return ()=>{
            const url = "http://localhost:3000/admin/delete_image/" + id
            fetch(url, {
                method: "PATCH", 
                headers: {
                    'Content-Type': 'application/json'
                }, 
                body: JSON.stringify({
                    src
                })
            })
            .then( response => response.json())
            .then( data => {
                if(data.isSuccess){
                    imageCont.remove();
                    this.updateCurrentProductImageDelete(id, src)
                    showModel("Image sucess fully deleted");
                }
                else{
                    showModel(data.errorMessage)
                }
            })
        }
    }

    // delete product
    deleteProductEvent(id){
        // request to delete
        return ()=>{
            const url = "http://localhost:3000/admin/delete_product/" + id 
            fetch(url, {
                method: "DELETE"
            })
            .then(response => response.json())
            .then( data => {
                if(data.isSuccess){
                    this.updateCurrentProductDelete(id);
                    this.populateProductTable(this.currentProductSet)
                    showModel("Product successfully deleted")
                }
                else{
                    showModel(data.errorMessage)
                }
            })
        }
    }



    // this is used in both in update product and add product
    getAllUpdatedValue(value){

        const updateObject = [{
            field: product_name, 
            value: value.name, 
            name: "name"
        }, {
            field: product_brand, 
            value: value.brand,
            name: "brand"
        }, {
            field: product_model, 
            value: value.modelName, 
            name: "modelName"
        }, {
            field: product_color, 
            value: value.color,
            name: "color"
        }, {
            field: product_actualPrice, 
            value: value.actualPrice,
            name: "actualPrice"
        }, {
            field: product_currentPrice, 
            value: value.currentPrice,
            name: "currentPrice"
        }, {
            field: product_discount, 
            value: value.discount, 
            name: "discount"
        }, {
            field: product_replacement, 
            value: value.replacement, 
            name: "replacement"
        }, {
            field: product_warranty, 
            value: value.warranty,
            name: "warranty"
        }, {
            field: product_category, 
            value: value.category, 
            name: "category"
        }, {
            field: product_quantity, 
            value: value.stock, 
            name: "stock"
        }]

        const checkBoxObject = [{
            field: product_isFreeDelivery, 
            value: value.isFreeDelivery, 
            name: "isFreeDelivery"
        }, {
            field: product_isPayOnDelivery, 
            value: value.isPayOnDelivery,
            name: "isPayOnDelivery"
        }]

        const updatedValues = {};
        let isUpdated = false;
        updateObject.forEach( x => {
            if(x.field.value != x.value && x.field.value != "" && x.field.value != 'undefined'){
                isUpdated = true;
                console.log(x.name, x.field.value)
                updatedValues[x.name] = x.field.value
            }
        })

        checkBoxObject.forEach(x => {
            if(x.value != undefined && x.field.checked != x.value){
                isUpdated = true;
                updatedValues[x.name] = x.field.checked
            }
        })

        this.getAllAboutThisProduct(updatedValues, value.aboutThisItem);
        console.log(updatedValues)
        if(value.currentPrice){
            if(isNaN(value.currentPrice))
            value.currentPrice = Number(value.currentPrice)
        }
        if(value.actualPrice){
            if(isNaN(value.actualPrice))
            value.actualPrice = Number(value.actualPrice)
        }

        return {status: isUpdated, value: updatedValues};
    }

    getAllAboutThisProduct(value, ogValue){
        // value.aboutThisItem = [];
        // Array.from(aboutProdcutList.children).forEach( x => {
        //     if(x.value.length >= 35){
        //         value.aboutThisItem.push(x.value)
        //     }
        // })
        // console.log(value)
        const newValue = [];
        Array.from(aboutProdcutList.children).forEach( x => {
            if(x.value.length >= 35){
                // value.aboutThisItem.push(x.value)
                newValue.push(x.value);
            }
        })
        
        if(!ogValue || !ogValue.length){
            value.aboutThisItem = newValue;
        }
        else{
            console.log(newValue, ogValue)
            if(ogValue.length == newValue.length){
                ogValue.forEach( x => {
                    console.log(newValue.includes(x))
                    if(!newValue.includes(x)){
                        value.aboutThisItem = newValue;
                        return;
                    }
                })
            }
            else{
                value.aboutThisItem = newValue;
            }
        }
    }
    

    // adding a new image to a product
    imageInputEvent = ()=>{
        this.destroyCooper();
        imagePreviewContainer.innerHTML = "";


        if(imageInput.files.length){
            for(let x in imageInput.files){
                if(!isNaN(x)){
                    addImageBtn.classList.remove('disabled')
                    const previewContainer = this.createPreviewTile(imageInput.files[x]);
                    imagePreviewContainer.append(previewContainer);
                    const previewImage = previewContainer.querySelector('img');
                    previewImage.classList.add('preview_image')
                    this.createCropper(previewImage);
                }
            }
        }
        else{
            addImageBtn.classList.add('disabled')
        }
    }
    addSingleImageEvent(id, ){
        return ()=>{
            const formData = new FormData();
            const croppedCanvas = this.cropperArray[0].getCroppedCanvas();
            croppedCanvas?.toBlob((blob) => {

                    formData.append("image", blob, "croppedImage.png"); // "croppedImage.png" is the desired filename
                    const url = "http://localhost:3000/admin/add_image/" + id
                    fetch(url, {
                        method: "PATCH",
                        body: formData,
                    })
                    .then(response => response.json())
                    .then(data => {
                        if(data.isSuccess){
                            const currUser = this.updateCurrentProductImageAdd(id, data.data);
                            this.renderIndividualUserDetails(currUser)()
                            
                            this.resetInput();
                            showModel("Image sucessfully added.")
                        }
                        else{
                            // show error modal
                        }
                    });
            }, "image/png");

        }
    }





    // cropper related
    destroyCooper(){
        this.cropperArray.forEach( x => {
            x.destroy();
        })
        this.cropperArray = [];
    }
    createCropper(previewImage){
        let cropper = new Cropper(previewImage, {
            aspectRatio: 1 / 1,
            zoomable: false,
        });
        this.cropperArray.push(cropper);
    }






    // create tile 
    createImageTile(src, id){
        const imageCont = document.createElement('div');
        imageCont.classList.add('m-2', 'rounded-border', "overflow-hidden")
        imageCont.innerHTML = `
        <img src="${src}" class="w-100"/>
        <button class="btn btn-danger">Delete</button>`
        let button = imageCont.querySelector('button');
        button.classList.add('m-1')
        button.type = 'button'
        button = removeExcessiveEventListeners(button);
        button.addEventListener('click', this.deleteImageEvent(id, src, imageCont))
        return imageCont;
    }
    createPreviewTile(f){
        const imageConatiner = document.createElement('div');
        imageConatiner.classList.add("m-2")
        imageConatiner.classList.add('imageConatiner')
        const url = URL.createObjectURL(f)
        imageConatiner.innerHTML = `<img src="${url}" />`
        return imageConatiner;
    }
    createProductTile(value, index){
        let tableRow = document.createElement('tr')
        tableRow.innerHTML = `
                <th scope="row">${index+1}</th>
                    <td><p class="responsive-text minimize">${value.name}</p></td>
                    <td>${value.brand}</td>
                    <td>${value.actualPrice}</td>
                    <td>${value.discount}</td>
                    <td>${value.currentPrice ? value.currentPrice : null}</td>`

        const tdTag = tableRow.querySelector('td > p');
        tdTag.addEventListener('click', this.setTextExtendFeature)

        const buttonCol = document.createElement('td')
        const button = document.createElement('button')
        button.classList.add("btn", "btn-light");
        button.innerHTML = "Details";
        button.addEventListener('click', this.renderIndividualUserDetails(value))


        buttonCol.append(button)
        tableRow.append(buttonCol)

        return tableRow
    }
    createProductTile(value, index){
        let tableRow = document.createElement('tr')
        tableRow.innerHTML = `
                <th scope="row">${index+1}</th>
                    <td><p class="responsive-text minimize">${value.name}</p></td>
                    <td>${value.brand}</td>
                    <td>${value.actualPrice}</td>
                    <td>${value.discount}</td>
                    <td>${value.currentPrice ? value.currentPrice : null}</td>`

        const tdTag = tableRow.querySelector('td > p');
        tdTag.addEventListener('click', this.setTextExtendFeature)

        const buttonCol = document.createElement('td')
        const button = document.createElement('button')
        button.classList.add("btn", "btn-light");
        button.innerHTML = "Details";
        button.addEventListener('click', this.renderIndividualUserDetails(value))


        buttonCol.append(button)
        tableRow.append(buttonCol)

        return tableRow
    }
    createCategoryTile(category){
        const option = document.createElement('option');
        option.innerHTML = category.category
        option.value = category._id
        return option;
    }


    // updates currentProductSet after specific operation
    updateCurrentProductImageDelete(id, src){
        this.currentProductSet.forEach( (x, index) => {
            if(x._id == id){
                this.currentProductSet[index].images =  x.images.filter( url => {
                    if(url != src) {
                        return true;
                    }
                })
            }
        })
    }
    updateCurrentProductDelete(id){
        this.currentProductSet = this.currentProductSet.filter( (x) => {
            if(x._id != id) return true;
        })
    }
    updateCurrentProductImageAdd(id, src){
        let curr; 
        this.currentProductSet.forEach( x => {
            if(x._id == id){
                x.images.push(src)
                curr = x;
            }
        })
        return curr;
    }
    updateCurrentProductUpdate(updatedData){
        this.currentProductSet.forEach( (x, index) => {
            if(x._id == updatedData._id){
                this.currentProductSet[index] = updatedData;
            }
        })
    }
    updateCurrentProductCreate(newProduct){
        this.currentProductSet.push(newProduct)
    }



    // display and update details modal
    renderIndividualUserDetails(value){
        return ()=>{
            // fetch user address using the id
            this.updateModalData(value, "Product Details", "view");
            this.displayProductModal();
        }
    }

    async updateModalData(value, heading, purpose){
        modalheader.innerHTML = heading

        this.updateFieldValue(value);
        const category = await this.getAllCategory();

        const buttonsWithEvent = [addProduct, updateProduct, deleteProduct, imageInput, addImageBtn, add_about]
        buttonsWithEvent.forEach( x => {
            removeExcessiveEventListeners(x);
        })
        
        this.resetInputFieldValue();
        imagePreviewContainer.innerHTML = ""

        aboutProdcutList.innerHTML = ""
        imageInput.addEventListener('input', this.imageInputEvent);
        add_about.addEventListener('click', this.addAboutFieldHandler.bind(this)())
        if(purpose== "view"){
            this.hideButton(addProduct)
            this.showButton(deleteProduct)
            this.showButton(updateProduct)
            this.showButton(addImageBtn)
            deleteProduct.addEventListener('click', this.deleteProductEvent(value._id))
            this.updateImageModel(value);

            imageInput.multiple = false;
            addImageBtn.addEventListener('click', this.addSingleImageEvent(value._id))
            updateProduct.addEventListener('click', this.updateProductHandler(value))
            
            let categoryId;
            if(value.category.length){
                categoryId = value.category[0]._id;
            }
            else if(value.category){
                categoryId = value.category._id;
            }
            this.injectCategory(category.data, categoryId);
            value.aboutThisItem.forEach(x => {
                this.addAboutFieldHandler(x)()
            })
        }
        else{
            // add and configure add button
            this.showButton(addProduct)
            this.hideButton(deleteProduct)
            this.hideButton(updateProduct)
            this.hideButton(addImageBtn)

            this.updateImageModel({})
            imageInput.multiple = true;
            addProduct.addEventListener('click', this.addProductHandler);
            this.injectCategory(category.data);

        }
    }

    addAboutFieldHandler(value){
        return()=>{
            const input = document.createElement('textarea');
            input.classList.add("form-control", "input-field")
            input.value = value || ""
            aboutProdcutList.append(input)
        }
    }

    updateFieldValue(value){
        const updateObject = [{
            field: product_name, 
            value: value.name
        }, {
            field: product_brand, 
            value: value.brand
        }, {
            field: product_model, 
            value: value.modelName
        }, {
            field: product_color, 
            value: value.color
        }, {
            field: product_actualPrice, 
            value: value.actualPrice
        }, {
            field: product_currentPrice, 
            value: value.currentPrice
        }, {
            field: product_discount, 
            value: value.discount
        }, {
            field: product_replacement, 
            value: value.replacement
        }, {
            field: product_warranty, 
            value: value.warranty
        }, {
            field: product_quantity, 
            value: value.stock
        }]

        const checkBoxObject = [{
            field: product_isFreeDelivery, 
            value: value.isFreeDelivery
        }, {
            field: product_isPayOnDelivery, 
            value: value.isPayOnDelivery
        }]
        
        updateObject.forEach(x => helper(x))
        checkBoxObject.forEach(x => checkBoxUpdater(x))

        // update the value appropriately
        function helper({field, value}){
            if(value) field.value = value
            else {
                field.value = ""
                field.placeholder = "Enter data"
            }
        }

        function checkBoxUpdater({field, value}){
            field.checked = value;
        }

    }

    injectCategory(categoryList, id){
        console.log(product_category)
        product_category.innerHTML = "";
        product_category.append(this.createCategoryTile({category: "Choose category", value: ""}))
        console.log(categoryList)
        categoryList.forEach(curr => {
            const tile = this.createCategoryTile(curr)
            if(curr._id == id){
                tile.selected = true;
            }
            product_category.append(tile);
        })
    }

    displayProductModal(){
        $("#productModal").modal();
    }
    
    hideProductModal(){
        $('#productModal').modal('hide');
    }

    updateImageModel(value){
        imageConatiner.innerHTML = ""

        value.images?.forEach(x => {
            const imageTile = this.createImageTile(x, value._id);
            imageConatiner.append(imageTile)
        })
    }

    setTextExtendFeature(){
        this.classList.toggle('minimize');
    }

    hideButton(button){
        button.classList.add('d-none')
    }

    showButton(button){
        button.classList.remove('d-none')
    }

    resetInputFieldValue(){
        imageInput.value = ""
    }

    resetInput(){
        addImageBtn.classList.add('disabled');
    }
}


