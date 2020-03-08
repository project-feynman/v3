export const displayDate = function (dateString) { 
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
} 

export const getRandomId = function () {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}