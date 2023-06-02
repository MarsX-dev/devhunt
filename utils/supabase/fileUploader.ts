import axios from 'axios';
import { File } from 'buffer';

export default async ({ files, options }: { files: File | Blob; options?: string }) => {
  var formdata = new FormData();

  const fileName = (files as File).name.replaceAll(' ', '-') + Date.now();
  formdata.append('image', files as any, fileName);

  try {
    const { data } = await axios.post('https://www.marsx.dev/api/UploadFile', formdata);
    return { file: getCdnImageUrl(data.file.url, options) };
  } catch (err) {
    console.log(err);
  }
};

//Then we need to do a simple helper

function getCdnImageUrl(url: string, options?: string) {
  return (
    url.replace(/\'/g, "\\'").replace('https://marscode.s3.eu-north-1.amazonaws.com/assets/img', 'https://mars-images.imgix.net') +
    '?auto=compress&fit=max' +
    (options ? `&${options}` : '')
  );
}
