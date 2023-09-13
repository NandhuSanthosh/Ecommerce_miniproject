const date = "2023-09-18T19:47:08.908Z"
var inputDate = new Date(date);
console.log(inputDate)
var day = inputDate.getDate();
var month = inputDate.getMonth() + 1; // Adding 1 because months are zero-based
var year = inputDate.getFullYear();

console.log(day, month, year)