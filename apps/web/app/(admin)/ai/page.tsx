'use client';

import { useState } from 'react';
import { getSupabaseClient, askBusinessAssistant } from '@serviceflow/api';

const SUGGESTED_QUESTIONS = [
  'How many bookings do we have today?',
  'Which technician is performing best?',
  'What was revenue this month?',
  'Which services are growing?',
  'Which customers haven\u2019t returned?',
  'Show me delayed jobs.',
];

export default function AiAssistantPage() {
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState<{ q: string; a: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function ask(q: string) {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const { data: userData } = await supabase.auth.getUser();
      const businessId = (userData?.user?.user_metadata as { business_id?: string })?.business_id;
      const token = sessionData?.session?.access_token;
      if (!businessId || !token) throw new Error('Not authenticated');

      const result = await askBusinessAssistant(
        { question: q, business_id: businessId },
        process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL!,
        token
      );
      setAnswers((prev) => [{ q, a: result.answer }, ...prev]);
    } catch (err) {
      setAnswers((prev) => [
        { q, a: `Couldn't get an answer: ${err instanceof Error ? err.message : 'unknown error'}` },
        ...prev,
      ]);
    } finally {
      setLoading(false);
      setQuestion('');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold dark:text-offwhite">AI Business Assistant</h1>

      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="glass rounded-full px-3 py-1.5 text-xs dark:text-offwhite hover:bg-white/10"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) ask(question.trim());
        }}
        className="flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your business…"
          className="flex-1 rounded-lg border border-graphite/20 bg-transparent px-4 py-2 text-sm dark:text-offwhite dark:border-white/10"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>

      <div className="space-y-3">
        {answers.map((entry, i) => (
          <div key={i} className="glass rounded-xl p-4 dark:text-offwhite">
            <p className="text-xs text-graphite/50 dark:text-offwhite/50">{entry.q}</p>
            <p className="mt-1 text-sm">{entry.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
