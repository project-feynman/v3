/**
 * Displays the date in the user's local time
 * 
 * @param {String} dateString  an ISO string
 * @returns a human readable form of the date e.g. March 24th 5:46
 */
export const displayDate = function (dateString, format = {
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'utc',
}) 
{ 
  const deserializedDate = new Date(dateString)
  let currentTimeZoneOffset = deserializedDate.getTimezoneOffset() * 60000;
  return new Date(deserializedDate - currentTimeZoneOffset).toLocaleDateString(
    'en-US',
    format
  );
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