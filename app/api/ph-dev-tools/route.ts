import axios from 'axios';
import { NextResponse } from 'next/server';
import request from 'request';

export async function GET() {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);

  const PH_ACCESS_TOKEN = process.env.PH_ACCESS_TOKEN;

  const config = {
    headers: {
      Authorization: `Bearer ${PH_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };

  const body = {
    query: `query { posts(order: VOTES, topic: "developer-tools", postedAfter: "${new Date(oneWeekAgo).toISOString()}") {
        edges{
          cursor
          node{
            id
            name
            description
            url
            slug
            tagline
            votesCount
            website
            productLinks {
                url
            }
            thumbnail {
                url
              }
          }
        }
      }
    }`,
  };

  const {
    data: {
      data: {
        posts: { edges },
      },
    },
  } = await axios.post('https://api.producthunt.com/v2/api/graphql', body, config);
  return NextResponse.json({ posts: edges.slice(0, 10) });
}
