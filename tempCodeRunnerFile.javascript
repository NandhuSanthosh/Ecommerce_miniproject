const products = [{
    name: "one", 
    pos: 1
},{
    name: "two", 
    pos: 2
},{
    name: "four", 
    pos: 4
},{
    name: "three", 
    pos: 3
},]

console.log(products.sort( function(a,b ){
    return a.pos - b.pos
}))