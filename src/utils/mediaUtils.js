export const getRelativeMediaUrl = (url) => {
  if (!url) return '';
  // Return the URL as-is. 
  // The backend now provides absolute URLs in production, so we don't need to strip the domain.
  return url;
};
