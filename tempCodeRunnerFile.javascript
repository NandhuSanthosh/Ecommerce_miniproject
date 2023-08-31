async function a(){
    
}

try {
    a()
    .then( ()=>{
        throw new Error();
    })
    .catch((e)=>{
        throw e
    })
} catch (error) {
    console.log('wtf');
}