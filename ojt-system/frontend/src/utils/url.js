/**
 * Ensures that a given URL string is absolute (i.e. starts with http:// or https://).
 * If it doesn't have a protocol, it prefixes it with https://.
 * 
 * @param {string} url - The URL to validate/format
 * @returns {string} The formatted absolute URL
 */
export const ensureAbsoluteUrl = (url) => {
  if (!url) return '';
  const trimmed = url.trim();
  // Check if it already has a protocol (http:// or https://)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  // If it starts with //, prepend https:
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  // Otherwise, prepend https://
  return `https://${trimmed}`;
};
