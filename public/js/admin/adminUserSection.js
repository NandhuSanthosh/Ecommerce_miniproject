class UserHandlers{
    constructor(){
        this.dataFetchApiEndPoint = baseUrl + "admin/get_users"
        this.currentUserSet = [];
        this.searchButtonConfig();
    }

    async render(){
        const {data, totalCount} = await fetchData(this.dataFetchApiEndPoint);
        this.currentUserSet = data;
        this.populateUserTable(data)

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
            const data =await fetchData(this.dataFetchApiEndPoint + `?pno=${count-1}`);
            this.currentUserSet = data.data;
            this.configurePagination(data.totalCount, count);
            this.populateUserTable(this.currentUserSet)
        }
    }

    populateUserTable(data){
        userTableBody.innerHTML = ''
        if(data.length){
            data.forEach( (value, index)=>{
                const userTile = this.createUserTile(value, index);
                userTableBody.append(userTile)
            })
        }
        else{   
            // display no user
        }
    }

    createUserTile(value, index){
        let tableRow = document.createElement('tr')

        let credentailsCol;
        if(value.credentials.email){
            credentailsCol = `<td>${value.credentials.email}</td>`
        }
        else{
            credentailsCol = `<td>${value.credentials.mobile.number}</td>`
        }

        tableRow.innerHTML = `
                <th scope="row">${index}</th>
                    <td>${value.name}</td>
                    ${credentailsCol}
                <td>${value.isBlocked}</td>`

        const buttonCol = document.createElement('td')
        const button = document.createElement('button')
        button.classList.add("btn", "btn-light");
        button.innerHTML = "Details";
        button.addEventListener('click', this.renderIndividualUserDetails(value))


        buttonCol.append(button)
        tableRow.append(buttonCol)

        return tableRow
    }

    renderIndividualUserDetails(value){
        return ()=>{
            // fetch user address using the id
            this.updateModalData(value);
            this.displayUserDetails();
        }
    }

    updateModalData(value){
        userDetailsName.innterHTML = value.name
        userDetailsCredentials.innerHTML = value.credentials.email ? value.credentials.email : value.credentials.mobile.countryCode + "  " +    value.credentials.mobile.number

        this.updateBlockButton(value.isBlocked)
        removeExcessiveEventListeners(blockUser)
        blockUser.addEventListener('click', this.blockUserEvent(value._id, value.isBlocked));
    }

    blockUserEvent(id, isBlocked){
        return ()=>{
            const status = confirm("Do you want to block this user")
            if(status){
                // request to block user
                const url = "http://localhost:3000/admin/block_user";
                fetch(url, {
                    method: "PATCH", 
                    headers: {
                        'Content-Type': 'application/json'
                    }, 
                    body: JSON.stringify({
                        userId: id
                    })
                })
                .then( response => response.json())
                .then( data => {
                    if(data.isSuccess){
                        this.updateBlockButton(!isBlocked)
                        this.updateCurrentUserList(id, !isBlocked)
                        this.populateUserTable(this.currentUserSet)
                        showModel(data.status)
                    }
                    else{
                        this.showModel(data.errorMessage)
                    }
                })
            }
        }
    }

    updateBlockButton(isBlocked){
        blockUser.innerHTML = isBlocked ? "Unblock" : "Block"
    }

    updateCurrentUserList(id, isBlocked){
        this.currentUserSet.forEach( x => {
            if(x._id == id) x.isBlocked = isBlocked
        })
    }

    searchButtonConfig(){
        userSearchInput.addEventListener('keypress', (event)=>{  
            if(event.key == "Enter"){
                this.searchUser();
            }
        })
    }

    searchUser(){
        const searchKey = userSearchInput.value.toLowerCase();
        if(!searchKey){
            this.populateUserTable(this.currentUserSet);
        }
        else{
            const newUserSet = this.currentUserSet.filter( value => {
                if(value.name.toLowerCase().includes(searchKey)) return true;
                if(value.credentials.email?.includes(searchKey)) return true;
                if(value.credentials.mobile?.number.includes(searchKey)) return true;
                return false;
            })
            this.populateUserTable(newUserSet)
        }
    }

    displayUserDetails(){
        $("#userDetailsModal").modal();
    }
}


