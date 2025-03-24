import React, { useState, useEffect } from 'react';
import { Mail, CreditCard, Bell, PieChart, Plus, Pencil } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';
import type { Subscription } from './lib/supabase';
import { AuthModal } from './components/AuthModal';
import { AddSubscriptionModal } from './components/AddSubscriptionModal';
import { EditSubscriptionModal } from './components/EditSubscriptionModal';
import { NotificationBanner } from './components/NotificationBanner';
import { ExpenseDistributionModal } from './components/ExpenseDistributionModal';
import { UpcomingRenewalsModal } from './components/UpcomingRenewalsModal';
import { format, isSameDay, isAfter, startOfToday } from 'date-fns';

function App() {
  const [session, setSession] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [showRenewalsModal, setShowRenewalsModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNotifications, setDismissedNotifications] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchSubscriptions();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchSubscriptions();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchSubscriptions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('next_billing_date', { ascending: true });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    if (sub.frequency === 'monthly') return sum + sub.amount;
    if (sub.frequency === 'yearly') return sum + (sub.amount / 12);
    if (sub.frequency === 'quarterly') return sum + (sub.amount / 3);
    if (sub.frequency === 'weekly') return sum + (sub.amount * 4.33);
    return sum;
  }, 0);

  const upcomingRenewals = subscriptions.filter(sub => {
    if (!sub.next_billing_date) return false;
    const daysUntilBilling = Math.ceil(
      (new Date(sub.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilBilling <= 7;
  }).length;

  const upcomingCancellations = subscriptions.filter(sub => {
    if (!sub.cancellation_date || dismissedNotifications.includes(sub.id)) return false;
    const today = startOfToday();
    const cancellationDate = new Date(sub.cancellation_date);
    return isSameDay(today, cancellationDate) || isAfter(today, cancellationDate);
  });

  const dismissNotification = (subscriptionId: string) => {
    setDismissedNotifications(prev => [...prev, subscriptionId]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      <AddSubscriptionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubscriptionAdded={fetchSubscriptions}
      />
      {editingSubscription && (
        <EditSubscriptionModal
          isOpen={true}
          onClose={() => setEditingSubscription(null)}
          onSubscriptionUpdated={fetchSubscriptions}
          subscription={editingSubscription}
        />
      )}
      <ExpenseDistributionModal
        isOpen={showDistributionModal}
        onClose={() => setShowDistributionModal(false)}
        subscriptions={subscriptions}
      />
      <UpcomingRenewalsModal
        isOpen={showRenewalsModal}
        onClose={() => setShowRenewalsModal(false)}
        subscriptions={subscriptions}
      />
      
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">SubTracker</h1>
            </div>
            {!session ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Sign In
              </button>
            ) : (
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-gray-600 hover:text-gray-800"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Track Your Subscriptions Automatically
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your email and let us detect and manage your subscriptions for you.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cancellation Notifications */}
            {upcomingCancellations.map(subscription => (
              <NotificationBanner
                key={subscription.id}
                subscription={subscription}
                onDismiss={() => dismissNotification(subscription.id)}
              />
            ))}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <div className="col-span-3 flex space-x-4 mb-6">
                <button className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                  <Mail className="h-5 w-5" />
                  <span>Connect Email</span>
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center space-x-2 bg-white text-gray-700 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Manually</span>
                </button>
              </div>

              {/* Stats */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Total Monthly</h3>
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  ${totalMonthly.toFixed(2)}
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Active Subscriptions</h3>
                  <button
                    onClick={() => setShowDistributionModal(true)}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    title="View expense distribution"
                  >
                    <PieChart className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{subscriptions.length}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Upcoming Renewals</h3>
                  <button
                    onClick={() => setShowRenewalsModal(true)}
                    className="text-indigo-600 hover:text-indigo-700 transition-colors"
                    title="View all upcoming renewals"
                  >
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingRenewals}</p>
              </div>

              {/* Subscription List */}
              <div className="col-span-3 bg-white rounded-lg shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
                </div>
                {loading ? (
                  <div className="p-6 text-center text-gray-500">Loading...</div>
                ) : subscriptions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No subscriptions detected yet. Connect your email or add them manually.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {subscriptions.map((sub) => (
                      <div key={sub.id} className="p-6 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-lg font-medium text-gray-900">{sub.name}</h3>
                            {sub.notification_days && (
                              <Bell className="h-4 w-4 text-indigo-600" title={`Notifications enabled (${sub.notification_days} days before billing)`} />
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {sub.category} • {sub.frequency}
                          </p>
                          {sub.cancellation_date && (
                            <p className="text-sm text-yellow-600">
                              Cancel by: {format(new Date(sub.cancellation_date), 'MMM d, yyyy')}
                            </p>
                          )}
                          {sub.notes && (
                            <p className="text-sm text-gray-500 mt-1">{sub.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-lg font-medium text-gray-900">
                              ${sub.amount.toFixed(2)}
                            </p>
                            {sub.next_billing_date && (
                              <p className="text-sm text-gray-500">
                                Next: {format(new Date(sub.next_billing_date), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingSubscription(sub)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;