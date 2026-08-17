'use client';

import { useEffect, useState } from 'react';
import { getSupabaseClient } from '@serviceflow/api';
import { useBusinessId } from '@/lib/useBusinessId';
import { LoadingRows, EmptyState, ErrorState } from '@/components/StateViews';

interface Room {
  id: string;
  kind: string;
  booking_id: string | null;
  bookings?: { booking_code: string; customers?: { full_name: string } };
}

interface Message {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
}

export default function AdminChatPage() {
  const { businessId, loading: bizLoading, error: bizError } = useBusinessId();
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [active, setActive] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    (async () => {
      try {
        const supabase = getSupabaseClient();
        const { data, error: qErr } = await supabase
          .from('chat_rooms')
          .select('*, bookings(booking_code, customers(full_name))')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false });
        if (qErr) throw qErr;
        setRooms(data as Room[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chats');
      }
    })();
  }, [businessId]);

  async function openRoom(room: Room) {
    setActive(room);
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('chat_messages').select('*').eq('chat_room_id', room.id).order('created_at');
    setMessages(data ?? []);

    supabase
      .channel(`admin_chat_${room.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_room_id=eq.${room.id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();
  }

  async function send() {
    if (!draft.trim() || !active) return;
    const supabase = getSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('chat_messages').insert({
      chat_room_id: active.id,
      sender_id: userData?.user?.id,
      body: draft.trim(),
    });
    setDraft('');
  }

  if (bizLoading) return <LoadingRows />;
  if (bizError) return <ErrorState message={bizError} />;
  if (error) return <ErrorState message={error} />;
  if (!rooms) return <LoadingRows />;

  return (
    <div className="grid h-[calc(100vh-3rem)] grid-cols-3 gap-4">
      <div className="col-span-1 space-y-2 overflow-y-auto">
        <h1 className="mb-2 text-xl font-semibold dark:text-offwhite">Chat</h1>
        {rooms.length === 0 ? (
          <EmptyState message="No conversations yet." />
        ) : (
          rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => openRoom(r)}
              className={`w-full rounded-lg p-3 text-left text-sm dark:text-offwhite ${active?.id === r.id ? 'bg-emerald-600/20' : 'glass'}`}
            >
              <p className="font-medium">{r.bookings?.customers?.full_name ?? 'Customer'}</p>
              <p className="text-xs text-graphite/50 dark:text-offwhite/50">{r.bookings?.booking_code}</p>
            </button>
          ))
        )}
      </div>

      <div className="col-span-2 flex flex-col rounded-xl glass p-4">
        {!active ? (
          <p className="m-auto text-sm text-graphite/50 dark:text-offwhite/50">Select a conversation</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm dark:text-offwhite">
                  {m.body}
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Type a reply…"
                className="flex-1 rounded-lg border border-graphite/20 bg-transparent px-3 py-2 text-sm dark:border-white/10 dark:text-offwhite"
              />
              <button onClick={send} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
