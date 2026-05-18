'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PolicyData, validatePolicyData } from '@/types/policy';
import { saveToHistory, getHistory, HistoryEntry } from '@/lib/history';
import HowToUseModal from '@/components/HowToUseModal';

const NOTEBOOKLM_PROMPT = `Extract data from this Malaysian insurance policy and return ONLY a JSON object:

{
  "policyNumber": "string or null",
  "insuredName": "string or null",
  "insurerName": "string or null (include Bhd/Berhad/Insurance/Life/Takaful/Assurance)",
  "policyType": "string or null",
  "sumAssured": "string or null (RM prefix)",
  "annualPremium": "string or null (RM prefix)",
  "effectiveDate": "DD MMM YYYY or null",
  "expiryDate": "DD MMM YYYY or null",
  "deductible": "string or null",
  "coverageItems": [
    {
      "name": "exact product name as printed",
      "limit": "amount with RM prefix",
      "note": "short remark or null",
      "category": "one of 13 below",
      "explain": "≤15-word plain English, or null if generic"
    }
  ],
  "keyBenefits": ["up to 6 strings"],
  "exclusions": ["up to 5 strings"],
  "waitingPeriod": "string or null",
  "claimsContact": "string or null"
}

ORDER: riders first (Endorsement 219 / Supplementary Benefits table), then medical card items. Max 10 coverageItems total.

CATEGORIES (lowercase_with_underscores):
- medical_card: hospitalization, room & board, annual limits
- critical_illness: lump-sum on CI diagnosis
- early_critical_illness: early-stage CI partial payout
- premium_waiver: waives premium on TPD/CI/death
- hospital_cash: daily cash benefit
- personal_accident: PA rider
- death_benefit: basic death/term life
- tpd: Total & Permanent Disability
- disability_income: monthly income replacement
- savings_endowment: ILP, endowment, savings
- juvenile_child: child/maternity riders
- takaful_specific: Shariah variants (i-prefix, -i suffix, takafulink)
- other: fallback

EXAMPLES (use to classify unknown names by analogy):
- "PRUMillion Med 2.0" → medical_card | "Hospitalisation with RM8m annual limit, no lifetime cap"
- "A-Plus Multi CriticalCare" → critical_illness | "Multi-claim critical illness up to three diagnoses"
- "A-Plus Early CriticalCare" → early_critical_illness | "Early-stage critical illness partial lump sum"
- "Sun Maxi Med-i" → takaful_specific | "Shariah-compliant medical with surplus sharing"
- "i-Hospital Care" → hospital_cash | "Daily hospital cash takaful benefit"
- "Living Extra" → premium_waiver | "Waives premium on diagnosis of listed illnesses"
- "Z-MedProtect" → medical_card | "Yearly renewable comprehensive medical insurance"
- "Room & Board" → medical_card | null  (generic name, no explain)
- "Critical Illness Benefit" → critical_illness | null  (generic)

NAMING PATTERNS (Malaysian insurer prefixes):
PRU- = Prudential | A-Plus / A-Life = AIA | Smart- / GREAT- / i-Great = Great Eastern
HLA / HLM / HL / i- = Hong Leong | Z- = Zurich | Sun- / -i suffix = Sun Life
FWD- = FWD | e- = Generali online | Manu- / MHSE = Manulife | takafulink = Etiqa Takaful

EXPLAIN RULE: proprietary product names get ≤15-word plain English. Generic names ("Room & Board", "Annual Limit", "Critical Illness Benefit") use explain: null.

RULES: insuredName follows "Insured:" / "Life Assured:" / "Policyholder:". policyNumber follows "Policy No." or "Certificate No.". Missing values = null, never invent.

Return ONLY the JSON. Nothing else.`

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

      <div className="min-h-screen flex flex-col items-center px-4 py-12" style={{ background: 'var(--bg)', overflowY: 'auto', height: '100vh', touchAction: 'pan-y' }}>
        <div className="w-full max-w-2xl flex flex-col gap-8 my-auto">

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
