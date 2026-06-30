export const getRelativeMediaUrl = (url) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    // Return only the path and query string (e.g., "/media/file.pdf")
    return urlObj.pathname + urlObj.search;
  } catch {
    // If it's already a relative URL, it will throw an error in new URL(), so return as is
    return url;
  }
};
