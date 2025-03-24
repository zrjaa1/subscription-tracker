import React from 'react';
import { X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Subscription } from '../lib/supabase';

type ExpenseDistributionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
};

export function ExpenseDistributionModal({ isOpen, onClose, subscriptions }: ExpenseDistributionModalProps) {
  if (!isOpen) return null;

  // Calculate monthly amount for each subscription
  const getMonthlyAmount = (sub: Subscription) => {
    switch (sub.frequency) {
      case 'monthly':
        return sub.amount;
      case 'yearly':
        return sub.amount / 12;
      case 'quarterly':
        return sub.amount / 3;
      case 'weekly':
        return sub.amount * 4.33;
      default:
        return sub.amount;
    }
  };

  // Helper function to capitalize first letter
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  // Group subscriptions by category and sum their monthly amounts
  const categoryData = subscriptions.reduce((acc, sub) => {
    const monthlyAmount = getMonthlyAmount(sub);
    acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categoryData).map(([name, value]) => ({
    name: capitalize(name),
    value: Number(value.toFixed(2)),
  }));

  // Custom colors for different categories
  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Expense Distribution</h2>
        
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value}`, 'Monthly Expense']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-lg">Summary</h3>
          {data.map((category, index) => (
            <div key={category.name} className="flex justify-between items-center">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span>{category.name}</span>
              </div>
              <span className="font-medium">${category.value}/mo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}