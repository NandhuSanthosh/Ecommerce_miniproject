function formatDate(inputDate) {
  const options = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };

  // Parse the input date string
  const date = new Date(inputDate);

  // Format the date using the specified options
  const formattedDate = date.toLocaleString('en-US', options);

  // Get the AM/PM indicator
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  // Combine the formatted date and AM/PM indicator
  return `${formattedDate}, ${ampm}`;
}

// Example usage:
const inputDate = "2023-09-24T20:35:53.726Z";
const formattedDate = formatDate(inputDate);
console.log(formattedDate); 