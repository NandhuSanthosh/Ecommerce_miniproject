const number = 1000;
const formattedNumber = number.toLocaleString('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

console.log(formattedNumber); 