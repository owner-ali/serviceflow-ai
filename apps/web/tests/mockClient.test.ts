import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabaseClient } from '../../../packages/api/src/mockClient';
import { demoData, DEMO_BUSINESS_ID } from '../../../packages/api/src/demoData';

describe('mock Supabase client (Demo Mode)', () => {
  let client: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    client = createMockSupabaseClient();
  });

  it('filters rows with .eq()', async () => {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('business_id', DEMO_BUSINESS_ID);
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThan(0);
    expect(data!.every((b: any) => b.business_id === DEMO_BUSINESS_ID)).toBe(true);
  });

  it('resolves nested embeds using the <table>_id convention', async () => {
    const { data } = await client
      .from('bookings')
      .select('*, technicians(id, rating, users(full_name))')
      .eq('id', 'bk-1')
      .single();

    expect(data.technicians).toBeTruthy();
    expect(data.technicians.rating).toBeGreaterThan(0);
    expect(data.technicians.users.full_name).toBe('Ahmed R.');
  });

  it('.single() returns an error when no row matches', async () => {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', 'does-not-exist')
      .single();
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it('.maybeSingle() returns null without an error when no row matches', async () => {
    const { data, error } = await client
      .from('bookings')
      .select('*')
      .eq('id', 'does-not-exist')
      .maybeSingle();
    expect(data).toBeNull();
    expect(error).toBeNull();
  });

  it('inserts a row and makes it immediately queryable', async () => {
    const before = demoData.services.length;
    const { data, error } = await client
      .from('services')
      .insert({ business_id: DEMO_BUSINESS_ID, name: 'Test Service', starting_price: 42, is_active: true })
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.name).toBe('Test Service');
    expect(demoData.services.length).toBe(before + 1);

    const { data: fetched } = await client.from('services').select('*').eq('id', data.id).single();
    expect(fetched.name).toBe('Test Service');
  });

  it('updates matching rows via .update().eq()', async () => {
    await client.from('services').update({ is_active: false }).eq('id', 'svc-1');
    const { data } = await client.from('services').select('*').eq('id', 'svc-1').single();
    expect(data.is_active).toBe(false);
    // restore for other tests relying on seed state
    await client.from('services').update({ is_active: true }).eq('id', 'svc-1');
  });

  it('supports count/head queries used for dashboard stat cards', async () => {
    const { count, error } = await client
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', DEMO_BUSINESS_ID);
    expect(error).toBeNull();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThan(0);
  });

  it('emits realtime events to subscribed channels on insert', async () => {
    const received: any[] = [];
    const channel = client
      .channel('test-channel')
      .on('postgres_changes', { table: 'chat_messages' }, (payload: any) => received.push(payload))
      .subscribe();

    await client.from('chat_messages').insert({ chat_room_id: 'room-1', sender_id: 'demo-user-admin', body: 'hello' });

    expect(received.length).toBe(1);
    expect(received[0].new.body).toBe('hello');

    client.removeChannel(channel);
  });

  it('demo auth always resolves a signed-in user', async () => {
    const { data } = await client.auth.getUser();
    expect(data.user?.user_metadata.business_id).toBe(DEMO_BUSINESS_ID);

    const signIn = await client.auth.signInWithPassword({ email: 'anyone@example.com', password: 'anything' });
    expect(signIn.error).toBeNull();
    expect(signIn.data.user).toBeTruthy();
  });
});
