// Define two date strings
const date1String = "2023-09-12";
const date2String = "2023-08-06";

// Convert the date strings to Date objects
const date1 = new Date(date1String);
const date2 = new Date(date2String);

// Calculate the time difference in milliseconds
const timeDifference = date1 - date2;

// Convert the time difference to days
const daysDifference = timeDifference / (1000 * 3600 * 24);

console.log(`The difference between the two dates is ${daysDifference} days.`);
