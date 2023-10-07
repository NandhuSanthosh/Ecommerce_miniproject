var reformatDate = function(date) {
    const [day, month, year] = date.split(' ');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    let result = append("",year) + "-";
 
    const indexOfMonth = months.indexOf(month) + 1
    result = append(result, indexOfMonth) + "-"

    let dayString = day.length == 4 ? day[0] + day[1] : day[0];
    result = append(result, dayString)

    return result;
};


function append(result, value){
    return result + (value < 10 ? "0"+value : value)
}
console.log(reformatDate("5th Oct 2052"))