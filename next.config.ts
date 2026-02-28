import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = 'https://apitokodus.multigraharadhika.co.id/Admin/Box/boxModels';
  try {
    const res = await fetch(url);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch API', details: err }, { status: 500 });
  }
}