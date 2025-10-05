import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production, this will use the serverless function
    // In development, you can still use the external backend if needed
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Use the serverless function
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/backend/health`);
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // In development, use the external backend
      const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${BACKEND_URL}/health`);
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Backend service unavailable' },
      { status: 503 }
    );
  }
}
