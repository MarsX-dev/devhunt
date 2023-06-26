export default function addHttpsToUrl(url: string) {
  const pattern = /^https:\/\//;
  if (!pattern.test(url)) {
    url = 'https://' + url;
  }
  return url;
}
