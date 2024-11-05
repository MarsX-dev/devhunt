export default function addHttpsToUrl(url: string) {
  // Trim any leading or trailing whitespace
  url = url.trim();

  // Check if the URL already starts with 'http://' or 'https://'
  const pattern = /^(https?:\/\/)/i;

  if (pattern.test(url)) {
    return url;
  }

  // If URL starts with 'www.', prepend 'https://'
  if (url.startsWith('www.')) {
    return 'https://' + url;
  }

  // For cases like 'http//example.com', correct by replacing 'http//' with 'https://'
  const malformedProtocolPattern = /^http\/\//i;
  if (malformedProtocolPattern.test(url)) {
    url = url.replace(malformedProtocolPattern, 'https://');
    return url;
  }

  // If no protocol or 'www' is present, prepend 'https://'
  return 'https://' + url;
}
