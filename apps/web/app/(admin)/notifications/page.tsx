'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface NotificationRow {
  id: string;
  channel: string;
  status: string;
  title: string;
  body: string | null;
  created_at: string;
}

const CHANNEL_ICON: Record<string, string> = {
  push: '📱',
  email: '✉️',
  whatsapp: '💬',
  sms: '📟',
  in_app: '🔔',
};

export default function NotificationsPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [notifications, setNotifications] = useState<NotificationRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: qErr } = await supabase
          .from('notifications')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(100);
        if (qErr) throw qErr;
        setNotifications(data as NotificationRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
    })();
  }, [businessId]);

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!notifications) return <LoadingRows />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold dark:text-offwhite">Notifications</h1>
      {notifications.length === 0 ? (
        <EmptyState message="No notifications sent yet." />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="glass flex items-start gap-3 rounded-xl p-4 dark:text-offwhite">
              <span className="text-lg">{CHANNEL_ICON[n.channel] ?? '🔔'}</span>
              <div className="flex-1">
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-sm text-graphite/60 dark:text-offwhite/60">{n.body}</p>}
                <p className="mt-1 text-xs text-graphite/40 dark:text-offwhite/40">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-white/5 px-2 py-1 text-xs capitalize">{n.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
