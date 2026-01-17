import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';

/**
 * GET: 检查用户是否已完成引导
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ hasCompletedOnboarding: false }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // 查找用户
    const user = await db.collection("users").findOne({
      email: session.user.email,
    });

    if (!user) {
      // 如果用户不存在，返回未完成
      return NextResponse.json({ hasCompletedOnboarding: false }, { status: 200 });
    }

    // 检查 hasCompletedOnboarding 字段
    const hasCompletedOnboarding = user.hasCompletedOnboarding === true;

    return NextResponse.json({
      hasCompletedOnboarding,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json({ hasCompletedOnboarding: false }, { status: 200 });
  }
}

/**
 * POST: 标记用户已完成引导
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // 更新用户的 hasCompletedOnboarding 字段
    const result = await db.collection("users").findOneAndUpdate(
      {
        email: session.user.email,
      },
      {
        $set: {
          hasCompletedOnboarding: true,
          onboardingCompletedAt: new Date(),
        },
      },
      {
        returnDocument: 'after',
      }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hasCompletedOnboarding: true,
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}


