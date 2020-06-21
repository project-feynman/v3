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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

/**
 * TODO: currently fails to detect iPad Safari
 */
export function isIosSafari () {
  return navigator.userAgent.match(/iP(od|hone|ad)/) &&
    navigator.userAgent.match(/AppleWebKit/) &&
    !navigator.userAgent.match(/(Cr|Fx|OP)iOS/)
}