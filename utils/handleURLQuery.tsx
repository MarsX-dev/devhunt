export default function handleURLQuery(url: string) {
  // Check if the URL contains a query string
  if (url.includes('?')) {
    // Check if the URL already contains "ref=devhunt"
    if (url.includes('ref=devhunt')) {
      return url;
    } else {
      // Append "&ref=devhunt" to the URL
      return url + '&ref=devhunt';
    }
  } else {
    // If there is no query string, add "?ref=devhunt" to the URL
    return url + '?ref=devhunt';
  }
}
