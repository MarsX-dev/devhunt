import axios from 'axios';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    slug: string;
  };
}

// http://api-v2-docs.producthunt.com.s3-website-us-east-1.amazonaws.com/query/post/

export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = params;
  const PH_ACCESS_TOKEN = process.env.PH_ACCESS_TOKEN;

  if (!PH_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'ProductHunt access token not configured' }, { status: 500 });
  }

  const config = {
    headers: {
      Authorization: `Bearer ${PH_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const body = {
    query: `query { post(slug: "${slug}") {
        name
        description
        url
        slug
        tagline
        website
        productLinks {
            url
        }
        thumbnail {
            url
        }
        media {
            url
            type
        }
    } }`,
  };

  try {
    const response = await axios.post('https://api.producthunt.com/v2/api/graphql', body, config);

    const { data } = response.data;

    if (!data.post) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: data.post });
  } catch (error) {
    console.error('Error fetching ProductHunt product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}
