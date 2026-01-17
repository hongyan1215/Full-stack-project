import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// Fixed 8 categories that all users get
const DEFAULT_CATEGORIES = [
  { id: 'category-1', name: 'Activity', color: '#1e3a5f' },
  { id: 'category-2', name: 'Deadline', color: '#c9a227' },
  { id: 'category-3', name: 'Work', color: '#2c5282' },
  { id: 'category-4', name: 'Life', color: '#64748b' },
  { id: 'category-5', name: 'Category 5', color: '#ef4444' },
  { id: 'category-6', name: 'Category 6', color: '#10b981' },
  { id: 'category-7', name: 'Category 7', color: '#8b5cf6' },
  { id: 'category-8', name: 'Category 8', color: '#f59e0b' },
];

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.email || 'guest';

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Get user-specific categories (including overrides for default categories)
    const userCategories = await db.collection("categories").find({ 
      userId: userId 
    }).toArray();

    // Create a map to merge defaults with user overrides
    const categoryMap = new Map<string, any>();
    
    // Start with default categories
    DEFAULT_CATEGORIES.forEach(cat => {
      categoryMap.set(cat.id, { ...cat });
    });
    
    // Override with user categories (including default category overrides)
    userCategories.forEach(cat => {
      const catData = {
        id: cat.defaultCategoryId || cat._id.toString(),
        name: cat.name,
        color: cat.color,
        userId: cat.userId,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
        defaultCategoryId: cat.defaultCategoryId,
      };
      // If it's an override for a default category, replace the default
      if (cat.defaultCategoryId) {
        categoryMap.set(cat.defaultCategoryId, catData);
      } else {
        // It's a custom category
        categoryMap.set(cat._id.toString(), catData);
      }
    });

    return NextResponse.json(Array.from(categoryMap.values()));
  } catch (e) {
    console.error('Error fetching categories:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Categories cannot be created - fixed 8 categories only
  return NextResponse.json({ error: 'Categories cannot be created. Only the 8 default categories are available.' }, { status: 400 });
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { id, name } = data;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Only allow updating name, not color
    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check if it's one of the fixed categories
    if (!DEFAULT_CATEGORIES.some(cat => cat.id === id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");

    // Check if user already has an override
    const existingOverride = await db.collection("categories").findOne({
      userId: session.user.email,
      defaultCategoryId: id,
    });

    const defaultCategory = DEFAULT_CATEGORIES.find(c => c.id === id)!;
    const updateData: any = {
      name: name.trim(),
      color: defaultCategory.color, // Always use the default color, cannot be changed
      updatedAt: new Date(),
    };

    if (existingOverride) {
      // Update existing override (only name, color stays the same)
      await db.collection("categories").updateOne(
        { _id: existingOverride._id, userId: session.user.email },
        { $set: updateData }
      );
      const updated = await db.collection("categories").findOne({ _id: existingOverride._id });
      if (!updated) {
        return NextResponse.json({ error: 'Category not found after update' }, { status: 404 });
      }
      return NextResponse.json({
        id: updated.defaultCategoryId || updated._id.toString(),
        name: updated.name,
        color: updated.color,
        userId: updated.userId,
        defaultCategoryId: updated.defaultCategoryId,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      });
    } else {
      // Create new override
      const override = {
        name: name.trim(),
        color: defaultCategory.color, // Use default color
        userId: session.user.email,
        defaultCategoryId: id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = await db.collection("categories").insertOne(override);
      const created = await db.collection("categories").findOne({ _id: result.insertedId });
      if (!created) {
        return NextResponse.json({ error: 'Category not found after creation' }, { status: 404 });
      }
      return NextResponse.json({
        id: created.defaultCategoryId || created._id.toString(),
        name: created.name,
        color: created.color,
        userId: created.userId,
        defaultCategoryId: created.defaultCategoryId,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      });
    }
  } catch (e) {
    console.error('Error updating category:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  // Categories cannot be deleted
  return NextResponse.json({ error: 'Categories cannot be deleted' }, { status: 400 });
}

