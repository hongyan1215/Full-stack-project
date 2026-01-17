import { auth } from '@/auth';
import clientPromise from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

// Fixed 8 categories mapping
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

// Map old category values to new category IDs
const OLD_CATEGORY_MAP: Record<string, string> = {
  'routine': 'category-1',
  'assignment': 'category-2',
  'activity': 'category-3',
  'other': 'category-4',
  // If old category was a custom category ID, map to category-1 as default
};

// Map old color values to closest category (optional, for events without category)
const COLOR_TO_CATEGORY_MAP: Record<string, string> = {
  '#1e3a5f': 'category-1',
  '#c9a227': 'category-2',
  '#2c5282': 'category-3',
  '#64748b': 'category-4',
  '#ef4444': 'category-5',
  '#10b981': 'category-6',
  '#8b5cf6': 'category-7',
  '#f59e0b': 'category-8',
};

/**
 * Migrate MongoDB data to new format
 * POST /api/migrate
 * 
 * This endpoint:
 * 1. Migrates events: maps old categories to new category IDs, removes color from regular events
 * 2. Migrates categories: converts old custom categories to default category overrides
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");
    const userId = session.user.email;

    const results = {
      eventsMigrated: 0,
      eventsSkipped: 0,
      categoriesMigrated: 0,
      categoriesSkipped: 0,
      errors: [] as string[],
    };

    // ============================================
    // 1. Migrate Events
    // ============================================
    try {
      const events = await db.collection("events").find({ userId }).toArray();
      
      for (const event of events) {
        try {
          const updates: any = {};
          let needsUpdate = false;

          // Determine event type if not set
          if (!event.eventType) {
            // Default to 'event' if not a schedule event
            updates.eventType = 'event';
            needsUpdate = true;
          }

          // Handle category migration for regular events (not schedule events)
          if (event.eventType !== 'schedule') {
            // If event has old category format, map it
            if (event.category) {
              const oldCategory = event.category;
              if (OLD_CATEGORY_MAP[oldCategory]) {
                updates.category = OLD_CATEGORY_MAP[oldCategory];
                needsUpdate = true;
              } else if (!oldCategory.startsWith('category-')) {
                // Old custom category ID, map to category-1
                updates.category = 'category-1';
                needsUpdate = true;
              }
            } else if (event.color && COLOR_TO_CATEGORY_MAP[event.color]) {
              // If no category but has color, try to map color to category
              updates.category = COLOR_TO_CATEGORY_MAP[event.color];
              needsUpdate = true;
            } else if (!event.category) {
              // No category at all, default to category-1
              updates.category = 'category-1';
              needsUpdate = true;
            }

            // Note: color removal will be handled in the update query
          }

          if (needsUpdate) {
            const updateQuery: any = { $set: {} };
            
            // Add all updates except $unset
            Object.keys(updates).forEach(key => {
              if (key !== '$unset') {
                updateQuery.$set[key] = updates[key];
              }
            });
            
            // Remove color from regular events
            if (event.eventType !== 'schedule' && event.color && 'color' in event) {
              updateQuery.$unset = { color: 1 };
            }
            
            await db.collection("events").updateOne(
              { _id: event._id },
              updateQuery
            );
            results.eventsMigrated++;
          } else {
            results.eventsSkipped++;
          }
        } catch (error) {
          results.errors.push(`Error migrating event ${event._id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error processing events: ${error instanceof Error ? error.message : String(error)}`);
    }

    // ============================================
    // 2. Migrate Categories
    // ============================================
    try {
      const categories = await db.collection("categories").find({ userId }).toArray();
      
      for (const category of categories) {
        try {
          // If category already has defaultCategoryId, it's already in new format
          if (category.defaultCategoryId) {
            results.categoriesSkipped++;
            continue;
          }

          // If category ID matches one of the default categories, convert to override
          const defaultCategory = DEFAULT_CATEGORIES.find(cat => cat.id === category.id || category._id.toString() === cat.id);
          if (defaultCategory) {
            // This is a default category, convert to override format
            await db.collection("categories").updateOne(
              { _id: category._id },
              {
                $set: {
                  defaultCategoryId: defaultCategory.id,
                  color: defaultCategory.color, // Ensure color matches default
                  updatedAt: new Date(),
                },
                $unset: {
                  id: '', // Remove old id field if it exists
                }
              }
            );
            results.categoriesMigrated++;
          } else {
            // Old custom category - map to category-1 as default
            // First, check if user already has a category-1 override
            const existingOverride = await db.collection("categories").findOne({
              userId,
              defaultCategoryId: 'category-1',
            });

            if (existingOverride) {
              // Update existing override with the old category's name if it's more descriptive
              // Or just delete the old custom category
              await db.collection("categories").deleteOne({ _id: category._id });
              results.categoriesMigrated++;
            } else {
              // Create new override for category-1 with old category's name
              await db.collection("categories").updateOne(
                { _id: category._id },
                {
                  $set: {
                    defaultCategoryId: 'category-1',
                    name: category.name || 'Activity',
                    color: DEFAULT_CATEGORIES[0].color,
                    updatedAt: new Date(),
                  },
                  $unset: {
                    id: '',
                  }
                }
              );
              results.categoriesMigrated++;
            }
          }
        } catch (error) {
          results.errors.push(`Error migrating category ${category._id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error processing categories: ${error instanceof Error ? error.message : String(error)}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results,
    });
  } catch (e) {
    console.error('Migration error:', e);
    return NextResponse.json(
      { error: 'Migration failed', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

/**
 * Get migration status
 * GET /api/migrate
 */
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calendar-app");
    const userId = session.user.email;

    // Count events that might need migration
    const eventsNeedingMigration = await db.collection("events").countDocuments({
      userId,
      $or: [
        { category: { $in: ['routine', 'assignment', 'activity', 'other'] } },
        { category: { $exists: false } },
        { color: { $exists: true }, eventType: { $ne: 'schedule' } },
      ]
    });

    // Count categories that might need migration
    const categoriesNeedingMigration = await db.collection("categories").countDocuments({
      userId,
      defaultCategoryId: { $exists: false },
    });

    return NextResponse.json({
      needsMigration: eventsNeedingMigration > 0 || categoriesNeedingMigration > 0,
      eventsNeedingMigration,
      categoriesNeedingMigration,
    });
  } catch (e) {
    console.error('Migration status error:', e);
    return NextResponse.json(
      { error: 'Failed to check migration status', details: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

