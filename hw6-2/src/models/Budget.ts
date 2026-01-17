import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBudget extends Document {
  userId: string;
  category: string; // 'Total' for overall budget, or specific category like 'Food'
  amount: number;
  period: 'monthly'; // Currently only supporting monthly
  updatedAt: Date;
}

const BudgetSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true }, // 'Total' or 'Food', 'Transport', etc.
  amount: { type: Number, required: true },
  period: { type: String, default: 'monthly', enum: ['monthly'] },
}, {
  timestamps: true,
});

// Compound index to ensure unique budget per user per category
BudgetSchema.index({ userId: 1, category: 1 }, { unique: true });

const Budget: Model<IBudget> = mongoose.models.Budget || mongoose.model<IBudget>('Budget', BudgetSchema);

export default Budget;


