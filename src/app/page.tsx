'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PolicyData, validatePolicyData } from '@/types/policy';
import { saveToHistory, getHistory, HistoryEntry } from '@/lib/history';
import HowToUseModal from '@/components/HowToUseModal';

const NOTEBOOKLM_PROMPT = `Extract information from this insurance policy document and return ONLY a JSON object with these exact fields:

{
  "policyNumber": "string or null",
  "insuredName": "string or null",
  "insurerName": "string or null",
  "policyType": "string or null (e.g. Life Insurance, Medical Card, Investment-Linked Policy (ILP))",
  "sumAssured": "string or null (basic death/life sum assured only, e.g. RM 100,000)",
  "annualPremium": "string or null (e.g. RM 3,600 per year)",
  "effectiveDate": "string or null (DD MMM YYYY)",
  "expiryDate": "string or null (DD MMM YYYY - use latest expiry date)",
  "deductible": "string or null (e.g. RM 500 per policy year - medical plans only)",
  "coverageItems": [
    { "name": "coverage name", "limit": "limit or amount", "note": "short note or null" }
  ],
  "keyBenefits": ["up to 6 short benefit strings"],
  "exclusions": ["up to 5 short exclusion strings"],
  "waitingPeriod": "string or null",
  "claimsContact": "string or null",
  "extractionNotes": "string or null"
}

IMPORTANT - coverageItems must have up to 10 items in this order:

RIDERS FIRST (check Endorsement 219 / Table of Supplementary Benefits):
  - Critical Illness Rider (IL CIBR): name="Critical Illness Benefit", limit=CI sum assured, note="Lump sum on CI diagnosis"
  - Premium Waiver Rider (IL PWE): name="Premium Waiver", limit=annual premium waived, note="Waived on TPD or critical illness"
  - Hospital Cash Rider (IL HB): name="Hospital Cash Benefit", limit=daily rate, note="Daily cash on top of medical card"
  - Accident Rider (IL CABX): name="Accident Benefit", limit=sum assured, note="Accidental death or disability"
  - Any other riders in the supplementary benefits table

THEN MEDICAL CARD ITEMS (Overall Annual Limit, Room & Board, ICU, Surgical Fees, etc.)

RULES:
- insurerName: company name with Bhd/Berhad/Insurance/Life/Takaful/Assurance
- insuredName: person after "Insured:", "Life Assured:", "Policyholder:"
- policyNumber: after "Policy No." or "Certificate No."
- All amounts: include RM prefix
- Dates: DD MMM YYYY
- Missing values: use null, never invent

Return ONLY the JSON object. Nothing else.`

function describePolicyError(obj: unknown): string {
  if (!obj || typeof obj !== 'object')
    return 'Response must be a JSON object starting with {';
  const d = obj as Record<string, unknown>;
  if (!Array.isArray(d.coverageItems))
    return '"coverageItems" array is missing — the response may have been cut off. Copy it again from NotebookLM.';
  if (!Array.isArray(d.keyBenefits))
    return '"keyBenefits" array is missing — copy the full response.';
  if (!Array.isArray(d.exclusions))
    return '"exclusions" array is missing — copy the full response.';
  const known = ['policyNumber','insuredName','insurerName','policyType','sumAssured','annualPremium','effectiveDate','expiryDate'];
  const found = known.filter(f => f in d);
  if (found.length < 3)
    return `JSON doesn't look like a policy — found only: ${found.length ? found.join(', ') : 'none of the expected fields'}. Make sure you used the correct prompt.`;
  return 'Unexpected JSON format — try re-running the prompt in NotebookLM.';
}

function formatHistoryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

export default function UploadPage() {
  const router = useRouter();
  const [agentName, setAgentName] = useState('');
  const [pastedResponse, setPastedResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('agentName');
    if (saved) setAgentName(saved);

    // Show guide on first visit
    if (!localStorage.getItem('policysnap_guide_seen')) {
      setShowGuide(true);
    }

    // Load summary history
    setHistory(getHistory().filter(h => h.type === 'summary').slice(0, 3));
  }, []);

  const handleCloseGuide = () => {
    setShowGuide(false);
    localStorage.setItem('policysnap_guide_seen', '1');
  };

  const handleAgentNameChange = (v: string) => {
    setAgentName(v);
    localStorage.setItem('agentName', v);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(NOTEBOOKLM_PROMPT);
      } else {
        const el = document.createElement('textarea');
        el.value = NOTEBOOKLM_PROMPT;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try { document.execCommand('copy'); } finally { document.body.removeChild(el); }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError('Could not copy. Please select the text above and copy it manually.');
    }
  };

  const handleGenerate = () => {
    setError(null);
    if (!agentName.trim()) { setError('Please enter your name.'); return; }
    if (!pastedResponse.trim()) { setError('Please paste the NotebookLM response.'); return; }

    let parsed: PolicyData;
    try {
      const cleaned = pastedResponse
        .replace(/^```json\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found — make sure you copied the full response.');
      const candidate = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      if (!validatePolicyData(candidate)) {
        throw new Error(describePolicyError(candidate));
      }
      parsed = candidate;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse the response. Make sure you copied the full JSON from NotebookLM.');
      return;
    }

    const name = agentName.trim();
    sessionStorage.setItem('policyData', JSON.stringify(parsed));
    sessionStorage.setItem('agentName', name);
    localStorage.setItem('agentName', name);
    localStorage.removeItem('policyDataDraft');

    const label = [parsed.insuredName, parsed.insurerName].filter(Boolean).join(' · ') || 'Policy';
    saveToHistory({ type: 'summary', label, agentName: name, data: parsed });

    router.push('/poster');
  };

  const handleLoadHistory = (entry: HistoryEntry) => {
    sessionStorage.setItem('policyData', JSON.stringify(entry.data));
    sessionStorage.setItem('agentName', entry.agentName);
    router.push('/poster');
  };

  return (
    <>
      <HowToUseModal open={showGuide} onClose={handleCloseGuide} />

      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-2xl flex flex-col gap-8">

          {/* Header */}
          <div className="flex flex-col items-center gap-3">
            <Image src="/onyxx-symbol.png" alt="Onyxx" width={48} height={48} className="object-contain" />
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#ffffff' }}>
              Policy<span style={{ color: 'var(--green)' }}>Snap</span>
            </h1>
            <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
              Generate a clean policy summary poster from NotebookLM
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--green)' }}>
                Powered by Onyxx Tech
              </p>
              <button
                onClick={() => setShowGuide(true)}
                aria-label="How to use"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--muted)',
                  borderRadius: '50%',
                  width: 22, height: 22,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >?</button>
            </div>
          </div>

          {/* Step 1 - Agent name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: '#e5e5e5' }}>
              Step 1 — Your name (agent)
            </label>
            <input
              type="text"
              value={agentName}
              onChange={e => handleAgentNameChange(e.target.value)}
              placeholder="e.g. Ahmad bin Ali"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: '#1a1a1a', border: '1px solid var(--border)', color: '#ffffff' }}
            />
          </div>

          {/* Step 2 - Copy prompt */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: '#e5e5e5' }}>
              Step 2 — Copy this prompt and paste it into NotebookLM
            </label>
            <div
              className="rounded-lg p-4 text-xs font-mono overflow-auto max-h-48 select-all"
              style={{
                background: '#111111',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {NOTEBOOKLM_PROMPT}
            </div>
            <button
              onClick={handleCopy}
              className="self-start flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition"
              style={{
                background: copied ? '#1D9E75' : 'transparent',
                color: copied ? '#000000' : '#e5e5e5',
                border: `1px solid ${copied ? '#1D9E75' : 'var(--border)'}`,
              }}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Prompt
                </>
              )}
            </button>
          </div>

          {/* Step 3 - Paste response */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" style={{ color: '#e5e5e5' }}>
              Step 3 — Paste NotebookLM&apos;s response here
            </label>
            <textarea
              value={pastedResponse}
              onChange={e => { setPastedResponse(e.target.value); setError(null); }}
              placeholder={'Paste the JSON response from NotebookLM here...\n\n{\n  "policyNumber": "...",\n  ...\n}'}
              rows={10}
              className="w-full rounded-lg px-4 py-3 text-sm font-mono outline-none resize-none"
              style={{
                background: '#1a1a1a',
                border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
                color: '#ffffff',
              }}
            />
            {error && (
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            )}
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            className="w-full py-3 rounded-lg text-sm font-bold transition"
            style={{ background: 'var(--green)', color: '#000000' }}
          >
            Generate Poster
          </button>

          {/* Compare button */}
          <button
            onClick={() => router.push('/compare')}
            className="w-full py-3 rounded-lg text-sm font-semibold transition"
            style={{ background: 'transparent', color: '#e5e5e5', border: '1px solid var(--border)' }}
          >
            Compare Two Policies
          </button>

          {/* Recent history */}
          {history.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Recent Posters
              </p>
              {history.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-lg px-4 py-3 gap-3"
                  style={{ background: '#1a1a1a', border: '1px solid var(--border)' }}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold truncate" style={{ color: '#e5e5e5' }}>{entry.label}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{formatHistoryDate(entry.date)}</span>
                  </div>
                  <button
                    onClick={() => handleLoadHistory(entry)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-md shrink-0 transition"
                    style={{ background: 'transparent', border: '1px solid var(--border)', color: '#e5e5e5' }}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
