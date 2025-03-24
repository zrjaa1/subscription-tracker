import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import type { Subscription } from '../lib/supabase';

type EditSubscriptionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionUpdated: () => void;
  subscription: Subscription;
};

export function EditSubscriptionModal({ isOpen, onClose, onSubscriptionUpdated, subscription }: EditSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(!!subscription.notification_days);
  const [formData, setFormData] = useState({
    name: subscription.name,
    amount: subscription.amount.toString(),
    frequency: subscription.frequency,
    category: subscription.category,
    next_billing_date: subscription.next_billing_date || '',
    notification_days: subscription.notification_days?.toString() || '',
    notes: subscription.notes || '',
    cancellation_date: subscription.cancellation_date || '',
  });

  if (!isOpen) return null;

  // Sanitize text input to prevent SQL injection
  const sanitizeText = (text: string) => {
    return text.replace(/[<>{}()'";]/g, '');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          ...formData,
          amount: parseFloat(formData.amount),
          notification_days: enableNotifications ? parseInt(formData.notification_days) : null,
          notes: formData.notes ? sanitizeText(formData.notes) : null,
          cancellation_date: formData.cancellation_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;
      
      toast.success('Subscription updated successfully');
      onSubscriptionUpdated();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Edit Subscription</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Subscription Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              step="1"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">
              Billing Frequency
            </label>
            <select
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="entertainment">Entertainment</option>
              <option value="productivity">Productivity</option>
              <option value="utilities">Utilities</option>
              <option value="shopping">Shopping</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="next_billing_date" className="block text-sm font-medium text-gray-700">
              Next Billing Date
            </label>
            <input
              type="date"
              id="next_billing_date"
              value={formData.next_billing_date}
              onChange={(e) => setFormData({ ...formData, next_billing_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enable_notifications"
                checked={enableNotifications}
                onChange={(e) => {
                  setEnableNotifications(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, notification_days: '' });
                  } else {
                    setFormData({ ...formData, notification_days: '7' });
                  }
                }}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="enable_notifications" className="ml-2 block text-sm font-medium text-gray-700">
                Enable Billing Notifications
              </label>
            </div>
            
            {enableNotifications && (
              <div>
                <label htmlFor="notification_days" className="block text-sm font-medium text-gray-700">
                  Notify Days Before
                </label>
                <input
                  type="number"
                  id="notification_days"
                  value={formData.notification_days}
                  onChange={(e) => setFormData({ ...formData, notification_days: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  min="1"
                  required={enableNotifications}
                />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              rows={3}
              placeholder="Add any notes about this subscription..."
            />
          </div>

          <div>
            <label htmlFor="cancellation_date" className="block text-sm font-medium text-gray-700">
              Cancellation Reminder Date (optional)
            </label>
            <input
              type="date"
              id="cancellation_date"
              value={formData.cancellation_date}
              onChange={(e) => setFormData({ ...formData, cancellation_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Set a date to be reminded to cancel this subscription
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update Subscription'}
          </button>
        </form>
      </div>
    </div>
  );
}