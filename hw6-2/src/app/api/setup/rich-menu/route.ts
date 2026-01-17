import { NextRequest, NextResponse } from 'next/server';
import { setupRichMenu } from '@/lib/line';

export async function GET(req: NextRequest) {
  // In a real production app, secure this endpoint (e.g., check for a secret header)
  // const authHeader = req.headers.get('x-admin-secret');
  // if (authHeader !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // Determine the base URL of the deployed app to fetch the image
    // req.nextUrl.origin provides the current protocol + host
    const appUrl = req.nextUrl.origin;
    
    const richMenuId = await setupRichMenu(appUrl);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rich Menu configured and set as default.',
      richMenuId 
    });
  } catch (error: any) {
    console.error('Rich Menu Setup Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

