import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
  userId: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  item: string;
  date: Date;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['expense', 'income'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  item: { type: String, required: true },
  date: { type: Date, default: Date.now },
}, {
  timestamps: true, // This handles createdAt and updatedAt automatically
});

// Compound indexes for common query patterns
TransactionSchema.index({ userId: 1, date: -1 }); // For listing transactions
TransactionSchema.index({ userId: 1, type: 1, date: -1 }); // For stats queries
TransactionSchema.index({ userId: 1, category: 1, date: -1 }); // For category filtering
TransactionSchema.index({ userId: 1, date: 1, item: 1, amount: 1, category: 1, type: 1 }); // For duplicate checking

// Check if the model is already defined to prevent compilation errors in watch mode
const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;

