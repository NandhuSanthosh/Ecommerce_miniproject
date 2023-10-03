/**
 * @param {number[]} nums
 * @param {number} n
 * @return {number[]}
 */
var shuffle = function(nums, n) {
    
    let currIndex = 1;
    let currNum = nums[currIndex];
    for(let i = 1; i<nums.length; i++){
        const target = findIndex(currIndex, n);
        console.log(currIndex)
        if(nums[target] < 0){
            currIndex++;
            currNum = nums[currIndex]
            i--; 
            continue;
        }
        const temp = nums[target]
        nums[target] = currNum * -1;
        currNum = temp;
        currIndex = target;

        console.log("current array " , nums)
    }
    console.log(nums)
};

function findIndex(index, n){
    if(index < n){
        return index * 2;
    }
    else{
        return (index - n) * 2 + 1;
    }
}

shuffle([1, 2, 3, 4, 5, 6, 7, 8], 4);