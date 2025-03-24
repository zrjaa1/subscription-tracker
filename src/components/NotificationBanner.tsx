import React from 'react';
import { Bell, X } from 'lucide-react';
import { format } from 'date-fns';
import type { Subscription } from '../lib/supabase';

type NotificationBannerProps = {
  subscription: Subscription;
  onDismiss: () => void;
};

export function NotificationBanner({ subscription, onDismiss }: NotificationBannerProps) {
  const today = new Date();
  const cancellationDate = new Date(subscription.cancellation_date!);
  const isPastDue = today > cancellationDate;

  return (
    <div className={`${isPastDue ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'} border-l-4 p-4 mb-4`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Bell className={`h-5 w-5 ${isPastDue ? 'text-red-400' : 'text-yellow-400'}`} />
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm ${isPastDue ? 'text-red-700' : 'text-yellow-700'}`}>
            {isPastDue ? (
              <>
                <span className="font-medium">Past due:</span> Cancel{' '}
                <span className="font-medium">{subscription.name}</span> immediately! Was due on{' '}
                {format(cancellationDate, 'MMMM d, yyyy')}
              </>
            ) : (
              <>
                Cancel <span className="font-medium">{subscription.name}</span> today! Due date:{' '}
                {format(cancellationDate, 'MMMM d, yyyy')}
              </>
            )}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            onClick={onDismiss}
            className={`inline-flex ${isPastDue ? 'text-red-500 hover:text-red-600' : 'text-yellow-500 hover:text-yellow-600'}`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}