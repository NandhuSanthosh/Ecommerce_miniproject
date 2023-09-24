const a = new Promise((res, rej)=>{res()});
console.log(a);
a.then( ()=> {
    console.log("wtf")
})