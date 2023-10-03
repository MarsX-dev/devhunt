import axios from 'axios';
import { type File } from 'buffer';

export default async ({ files, options }: { files: File | Blob; options?: string }) => {
  const formdata = new FormData();

  const fileName = Date.now() + (files as File).name.replaceAll(' ', '-');
  formdata.append('image', files as any, fileName);

  try {
    const { data } = await axios.post('https://www.marsx.dev/api/UploadFile', formdata);
    return { file: getCdnImageUrl(data.file.url, options) };
  } catch (err) {
    console.log(err);
  }
};

// Converts asset url into a imgix url to have better pages loading speed
function getCdnImageUrl(url: string, options?: string) {
  return (
    url.replace(/'/g, "\\'")
      .replace('https://marscode.s3.eu-north-1.amazonaws.com/assets/img', 'https://mars-images.imgix.net') +
    '?auto=compress&fit=max' +
    (options ? `&${options}` : '')
  );
}
