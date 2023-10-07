
// var canMakeArithmeticProgression = function(arr) {
//     let min = arr[0], max = arr[0];
//     const map = {};
//     for(let i = 0; i<arr.length; i++){
//         map[arr[i]] = 1;
//         if(arr[i] < min) min = arr[i]
//         if(arr[i] > max) max = arr[i];
//     }

//     const diff = (max - min)/ (arr.length - 1);

//     if(diff == 0 && max == min) return true;
//     // if(diff == 0 && max != min) return false;
//     for(let i = min; i<=max; i+=diff){
//         if(!map[i]) return false;
//     };
//     return true;
// };

var canMakeArithmeticProgression = function(arr) {
    let min = arr[0], max = arr[0];
    for(let i = 0; i<arr.length; i++){
        if(arr[i] < min) min = arr[i]
        if(arr[i] > max) max = arr[i];
    }

    const diff = (max - min)/ (arr.length - 1);
    console.log(diff)

    if(diff == 0 && max == min) return true;

    for(let i = 0; i<arr.length; i++){
        const expectedValue = min + (i * diff)
        if(arr[i] != expectedValue){
            if((arr[i]-min)%diff == 0){
                const index = (arr[i] - min) / diff;
                if(index >= i || arr[i] == arr[index]) return false;
                [arr[i], arr[index]] = [arr[index], arr[i]]
                i--;
            }
            else{
                return false;
            }
        }
    }
    return true;
};

console.log(canMakeArithmeticProgression([-68,-96,-12,-40,16]))
// console.log(canMakeArithmeticProgression([1,10,10,10,19]))

