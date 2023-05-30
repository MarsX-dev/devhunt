export default function validateURL(url: string) {
  // Regular expression pattern for URL validation
  var pattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)*$/i

  // Test the URL against the pattern
  return pattern.test(url)
}
