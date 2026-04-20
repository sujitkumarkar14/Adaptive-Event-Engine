import React, { useState } from 'react';
import { StarkButton, StarkInput } from '../components/common/StarkComponents';
import { useEntryStore } from '../store/entryStore';
import { translateAlertText, type AlertLang } from '../services/translationClient';
import { buildConciergeAssistanceReply } from '../lib/conciergeAssistance';

export const Concierge = () => {
  const { state } = useEntryStore();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuery = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const draft = buildConciergeAssistanceReply(query.trim());
      const translated = await translateAlertText(draft, state.preferredContentLanguage as AlertLang);
      setAnswer(translated);
    } catch {
      setAnswer(
        'We could not translate that right now. Check your connection and try again. Your question was not sent to a live agent.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Concierge</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Language assistance (typed questions)
        </p>
      </div>

      <div
        className="border-2 border-outline-variant bg-surface-container-lowest p-4 mb-8"
        role="region"
        aria-label="Voice input unavailable"
      >
        <p className="text-sm font-bold text-on-surface normal-case tracking-normal leading-relaxed">
          Voice input is not available in this browser build — there is no speech recognition. Type your question below;
          answers use Cloud Translation into your selected language.
        </p>
      </div>

      <div className="mt-auto space-y-4 border-t-[1px] border-outline-variant pt-8">
        <StarkInput
          label="Ask for directions or assistance"
          placeholder="e.g. Where is the nearest step-free gate?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <StarkButton fullWidth onClick={handleQuery} disabled={loading}>
          {loading ? 'Translating…' : 'Submit (Cloud Translation)'}
        </StarkButton>
        {answer ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-4 font-bold text-lg text-on-surface border-2 border-outline-variant p-4 bg-surface-container-lowest"
          >
            {answer}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default Concierge;
