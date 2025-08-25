import request from 'request';
import { NextRequest, NextResponse } from 'next/server';

interface RouteParams {
  params: {
    url: string;
  };
}

function extractLink(url: string) {
  // Regular expression to match URLs with "www." or without any protocol
  const regex = /^(?:https?:\/\/)?(?:www\.)?(.*)/;

  // Extract the domain from the URL using regex
  const matches = url.match(regex);

  // If matches found, construct the link with "https://" prefix
  if (matches && matches.length > 1) {
    const domain = matches[1];
    return `https://${domain}`;
  }

  // If no matches found, return the original URL
  return url;
}

function extractHostAndPath(url: string): { host: string; path: string } {
  const regex = /^(?:https?:\/\/)?([^\/?#]+)(\/[^?#]*)?/;
  const matches = url.match(regex);

  if (matches && matches.length >= 2) {
    const host = matches[1];
    const path = matches[2] || '/'; // Default to '/' if path is not provided
    return { host, path };
  } else {
    throw new Error('Invalid URL format');
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { url } = params;

  console.log('Website URL', url);

  const requests = (website: string) => {
    // Return a promise for each request
    return new Promise((resolve, reject) => {
      // Perform the request asynchronously
      request({ url: website, followRedirect: false }, function (err, res, body) {
        if (err) {
          reject(err);
        } else {
          resolve(extractLink(extractHostAndPath(res.headers.location as string).host));
        }
      });
    });
  };

  const realWebsite = await requests(url);

  console.log(realWebsite);

  return NextResponse.json(realWebsite);
}
