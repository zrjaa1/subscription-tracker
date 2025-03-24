import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription } from '../lib/supabase';

type UpcomingRenewalsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
};

export function UpcomingRenewalsModal({ isOpen, onClose, subscriptions }: UpcomingRenewalsModalProps) {
  const [showAll, setShowAll] = useState(false);

  if (!isOpen) return null;

  const sortedSubscriptions = subscriptions
    .filter(sub => sub.next_billing_date)
    .map(sub => ({
      ...sub,
      daysUntil: Math.ceil(
        (new Date(sub.next_billing_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    }))
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const upcomingSubscriptions = sortedSubscriptions.filter(sub => sub.daysUntil <= 7 && sub.daysUntil >= -1);
  const laterSubscriptions = sortedSubscriptions.filter(sub => sub.daysUntil > 7);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
        
        <h2 className="text-2xl font-bold mb-6">Upcoming Renewals</h2>
        
        <div className="overflow-y-auto flex-1">
          {/* Next 7 Days Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Next 7 Days</h3>
            <div className="divide-y divide-gray-200">
              {upcomingSubscriptions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No renewals in the next 7 days.</p>
              ) : (
                upcomingSubscriptions.map(sub => (
                  <SubscriptionRow key={sub.id} subscription={sub} />
                ))
              )}
            </div>
          </div>

          {/* Later Subscriptions Section */}
          {laterSubscriptions.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-4"
              >
                <span className="text-lg font-semibold">Later Renewals</span>
                {showAll ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              
              {showAll && (
                <div className="divide-y divide-gray-200">
                  {laterSubscriptions.map(sub => (
                    <SubscriptionRow key={sub.id} subscription={sub} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type SubscriptionRowProps = {
  subscription: Subscription & { daysUntil: number };
};

function SubscriptionRow({ subscription: sub }: SubscriptionRowProps) {
  const billingDate = new Date(sub.next_billing_date!);
  
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{sub.name}</h3>
          <p className="text-sm text-gray-500">
            {sub.category} • {sub.frequency}
          </p>
          <p className={`text-sm ${sub.daysUntil <= 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
            {sub.daysUntil === 0
              ? 'Due today'
              : sub.daysUntil < 0
              ? `Overdue by ${Math.abs(sub.daysUntil)} days`
              : `Due in ${sub.daysUntil} days`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-gray-900">
            ${sub.amount.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500">
            {format(billingDate, 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  );
}