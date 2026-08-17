// ServiceFlow AI — Demo Mode mock Supabase client
//
// Implements just enough of the supabase-js query builder (.from().select().eq()
// .order().limit().single()/.maybeSingle(), .insert(), .update(), .channel()
// realtime, .auth) for every page in apps/web to work against in-memory data,
// with zero Supabase project required. Activated by NEXT_PUBLIC_DEMO_MODE=true
// in client.ts — nothing here runs unless that flag is set.

import { demoData, demoUser, BOOKING_STATUS_FLOW } from './demoData';

type Row = Record<string, any>;

function uuid() {
  return 'demo-' + Math.random().toString(36).slice(2, 10);
}

// ---- lightweight pub/sub for realtime simulation ---------------------------
// Any insert/update through the mock client emits here; every subscribed
// MockChannel for that table receives it. This is what makes chat, bookings,
// invoices, etc. all "live" locally in demo mode — not just the scripted
// booking-status auto-advance below.
const listeners: Record<string, Set<(payload: { new: Row; old: Row | null }) => void>> = {};

function emit(table: string, payload: { new: Row; old: Row | null }) {
  listeners[table]?.forEach((cb) => cb(payload));
}

// ---- select-string embed parser -------------------------------------------
// Parses "*, technicians(id, rating, users(full_name))" into a list of
// embedded table names to resolve, recursively. Plain columns are ignored —
// the mock always returns full rows, which is a harmless superset for a demo.
interface Embed {
  table: string;
  nested: Embed[];
}

function parseEmbeds(selectStr: string): Embed[] {
  const embeds: Embed[] = [];
  let depth = 0;
  let token = '';
  const tokens: string[] = [];
  for (const ch of selectStr) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      tokens.push(token.trim());
      token = '';
      continue;
    }
    token += ch;
  }
  if (token.trim()) tokens.push(token.trim());

  for (const t of tokens) {
    const match = t.match(/^(\w+)\((.*)\)$/s);
    if (match) {
      embeds.push({ table: match[1], nested: parseEmbeds(match[2]) });
    }
  }
  return embeds;
}

// Our schema consistently names foreign keys `<singular>_id` — e.g. bookings.technician_id
// points at technicians.id. Stripping a trailing 's' from the embedded table name
// gives us the FK field to look up, which covers every join this app performs.
function fkFieldFor(table: string): string {
  const singular = table.endsWith('ies') ? table.slice(0, -3) + 'y' : table.replace(/s$/, '');
  return `${singular}_id`;
}

function resolveEmbeds(row: Row, embeds: Embed[]): Row {
  const result = { ...row };
  for (const embed of embeds) {
    const fk = fkFieldFor(embed.table);
    const table = demoData[embed.table];
    if (!table) continue;
    const match = row[fk] != null ? table.find((r) => r.id === row[fk]) : null;
    result[embed.table] = match ? resolveEmbeds(match, embed.nested) : null;
  }
  return result;
}

// ---- filter application ----------------------------------------------------
type Filter = { col: string; op: 'eq' | 'gte' | 'lte' | 'not-null'; val?: any };

function applyFilters(rows: Row[], filters: Filter[]): Row[] {
  return rows.filter((r) =>
    filters.every((f) => {
      if (f.op === 'eq') return r[f.col] === f.val;
      if (f.op === 'gte') return r[f.col] != null && r[f.col] >= f.val;
      if (f.op === 'lte') return r[f.col] != null && r[f.col] <= f.val;
      if (f.op === 'not-null') return r[f.col] != null;
      return true;
    })
  );
}

// ---- query builder ----------------------------------------------------------
class MockQueryBuilder implements PromiseLike<{ data: any; error: any; count?: number }> {
  private filters: Filter[] = [];
  private selectStr = '*';
  private countOpts: { count?: string; head?: boolean } | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private limitN: number | null = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;

  constructor(private table: string) {}

  select(str?: string, opts?: { count?: string; head?: boolean }) {
    if (str) this.selectStr = str;
    if (opts) this.countOpts = opts;
    return this;
  }
  eq(col: string, val: any) { this.filters.push({ col, op: 'eq', val }); return this; }
  gte(col: string, val: any) { this.filters.push({ col, op: 'gte', val }); return this; }
  lte(col: string, val: any) { this.filters.push({ col, op: 'lte', val }); return this; }
  not(col: string, _op: string, _val: any) { this.filters.push({ col, op: 'not-null' }); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending !== false;
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  single() { this.singleMode = 'single'; return this._execute(); }
  maybeSingle() { this.singleMode = 'maybeSingle'; return this._execute(); }

  insert(payload: Row | Row[]) {
    const rows = (Array.isArray(payload) ? payload : [payload]).map((p) => ({
      id: uuid(),
      created_at: new Date().toISOString(),
      ...p,
    }));
    demoData[this.table] = demoData[this.table] || [];
    demoData[this.table].push(...rows);
    rows.forEach((row) => emit(this.table, { new: row, old: null }));
    return new MockInsertResult(rows);
  }

  update(payload: Row) {
    const table = this.table;
    return {
      eq: (col: string, val: any) => {
        const rows = (demoData[table] || []).filter((r) => r[col] === val);
        rows.forEach((r) => {
          const old = { ...r };
          Object.assign(r, payload);
          emit(table, { new: r, old });
        });
        return Promise.resolve({ data: rows, error: null });
      },
    };
  }

  private _execute() {
    let rows = applyFilters(demoData[this.table] || [], this.filters);

    if (this.countOpts?.head) {
      return Promise.resolve({ data: null, error: null, count: rows.length });
    }

    if (this.orderCol) {
      const col = this.orderCol;
      rows = [...rows].sort((a, b) => {
        const av = a[col], bv = b[col];
        if (av == null) return 1;
        if (bv == null) return -1;
        return this.orderAsc ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
      });
    }
    if (this.limitN != null) rows = rows.slice(0, this.limitN);

    const embeds = parseEmbeds(this.selectStr);
    const resolved = rows.map((r) => resolveEmbeds(r, embeds));

    if (this.singleMode === 'single') {
      return Promise.resolve({ data: resolved[0] ?? null, error: resolved[0] ? null : { message: 'Row not found' } });
    }
    if (this.singleMode === 'maybeSingle') {
      return Promise.resolve({ data: resolved[0] ?? null, error: null });
    }
    return Promise.resolve({ data: resolved, error: null });
  }

  // Makes `await supabase.from(x).select()...` work without an explicit .single().
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this._execute().then(onfulfilled as any, onrejected as any);
  }
}

class MockInsertResult implements PromiseLike<{ data: any; error: any }> {
  constructor(private rows: Row[]) {}
  select(_str?: string) { return this; }
  single() { return Promise.resolve({ data: this.rows[0] ?? null, error: null }); }
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve({ data: this.rows, error: null }).then(onfulfilled as any, onrejected as any);
  }
}

// ---- simulated realtime -----------------------------------------------------
// Every ~4s, advances one in-progress booking to its next status and fires the
// registered callback — this is what makes the demo dashboard/bookings page
// feel "live" without any real backend, matching the animated HTML preview.
class MockChannel {
  private callback: ((payload: { new: Row; old: Row | null }) => void) | null = null;
  private interval: ReturnType<typeof setInterval> | null = null;
  private table: string | null = null;

  constructor(_name: string) {}

  on(_event: string, config: { table: string }, callback: (payload: any) => void) {
    this.table = config.table;
    this.callback = callback;
    return this;
  }

  subscribe() {
    if (!this.table || !this.callback) return this;

    // Generic: any insert/update to this table (from anywhere in the app,
    // including this same tab) reaches this callback — this covers chat,
    // reviews, notifications, etc.
    listeners[this.table] = listeners[this.table] || new Set();
    listeners[this.table].add(this.callback);

    // Extra flavor for the dashboard/bookings pages specifically: auto-advance
    // a random in-progress booking every few seconds, so the demo feels alive
    // even with no one actively clicking around.
    if (this.table === 'bookings') {
      this.interval = setInterval(() => {
        const bookings = demoData.bookings as Row[];
        const active = bookings.filter(
          (b) => BOOKING_STATUS_FLOW.includes(b.status) && b.status !== 'paid'
        );
        if (!active.length) return;
        const pick = active[Math.floor(Math.random() * active.length)];
        const idx = BOOKING_STATUS_FLOW.indexOf(pick.status);
        if (idx >= 0 && idx < BOOKING_STATUS_FLOW.length - 1) {
          const old = { ...pick };
          pick.status = BOOKING_STATUS_FLOW[idx + 1];
          emit('bookings', { new: pick, old });
        }
      }, 4000);
    }
    return this;
  }

  unsubscribe() {
    if (this.interval) clearInterval(this.interval);
    if (this.table && this.callback) listeners[this.table]?.delete(this.callback);
  }
}

// ---- top-level mock client ---------------------------------------------------
export function createMockSupabaseClient() {
  return {
    from(table: string) {
      return new MockQueryBuilder(table);
    },
    auth: {
      getUser: async () => ({ data: { user: demoUser }, error: null }),
      getSession: async () => ({
        data: { session: { access_token: 'demo-access-token', user: demoUser } },
        error: null,
      }),
      signInWithPassword: async (_creds: { email: string; password: string }) => ({
        data: { user: demoUser, session: { access_token: 'demo-access-token', user: demoUser } },
        error: null,
      }),
      signOut: async () => ({ error: null }),
    },
    channel(name: string) {
      return new MockChannel(name);
    },
    removeChannel(channel: MockChannel) {
      channel.unsubscribe();
    },
  };
}
