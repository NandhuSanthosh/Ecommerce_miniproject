const a = ['one', 'two', 'three', 'four', 'five']
const b = ['one', 'two', 'three', 'four', 'five']

function isSame(a, b){
    return a.reduce( (acc, x) => {
        console.log(x , b.includes(x))
        return acc && b.includes(x)
    }, true)
}

console.log(isSame(a, b))