import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { modifyTransaction } from '@/lib/transaction';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    await dbConnect();
    
    // Validate that the transaction belongs to the user
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Validate input
    if (!body.item || !body.amount || !body.category || !body.type || !body.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!['expense', 'income'].includes(body.type)) {
      return NextResponse.json({ error: 'Invalid transaction type' }, { status: 400 });
    }
    
    const updated = await Transaction.findByIdAndUpdate(
      id,
      {
        $set: {
          item: body.item,
          amount: body.amount,
          category: body.category,
          type: body.type,
          date: new Date(body.date),
        }
      },
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = req.headers.get('X-User-Id');
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await dbConnect();
    const result = await Transaction.findOneAndDelete({ _id: id, userId });

    if (!result) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

