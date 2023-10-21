function fibo(n){
    let time = new Date();
    
    if(n <= 2) return 1;

    let first = 1, second = 1;

    for(let i = 3; i<=n; i++){
        let temp = first + second;
        first = second;
        second = temp;
    }


    return second;
}

console.log(fibo(10))