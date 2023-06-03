export default (url: string) => {
  // Regular expression pattern to match YouTube video URLs
  var pattern =
    /(?:https?:\/\/(?:www\.)?)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=|user\/(?:[\w#]+\/)+))([^\s&?]+)/;
  var match = url.match(pattern);
  if (match && match[1]) {
    return 'https://www.youtube.com/embed/' + match[1];
  }
  return null;
};
