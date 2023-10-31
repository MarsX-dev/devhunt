import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: 'We are testing something out' });
}
