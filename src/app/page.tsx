'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PolicyData, validatePolicyData } from '@/types/policy';

const NOTEBOOKLM_PROMPT = `Extract information from this insurance policy document and return ONLY a JSON object with these exact fields:

{
  "policyNumber": "string or null",
  "insuredName": "string or null",
  "insurerName": "string or null",
  "policyType": "string or null (e.g. Life Insurance, Medical Card, Motor Insurance, Investment-Linked Policy)",
  "sumAssured": "string or null (include RM symbol, e.g. RM 500,000)",
  "annualPremium": "string or null (include RM and frequency, e.g. RM 2,400 per year)",
  "effectiveDate": "string or null (format: DD MMM YYYY, e.g. 01 Jan 2025)",
  "expiryDate": "string or null (format: DD MMM YYYY)",
  "coverageItems": [
    { "name": "coverage name", "limit": "limit or description", "note": "optional short note or null" }
  ],
  "keyBenefits": ["up to 5 short benefit strings"],
  "exclusions": ["up to 5 short exclusion strings — what is NOT covered"],
  "waitingPeriod": "string or null (e.g. 30 days for new illnesses)",
  "claimsContact": "string or null (phone number or email)",
  "extractionNotes": "string or null (note any missing or ambiguous info)"
}

FIELD GUIDANCE:
- insurerName: The name of the insurance COMPANY issuing this policy. Look for it in the document header, footer, or any line that says "issued by", "underwritten by", or shows a company name with "Bhd", "Berhad", "Insurance", "Life", "Takaful", or "Assurance".
- insuredName: The NAME OF THE PERSON being insured. Usually appears after "Insured:", "Life Assured:", "Policyholder:", or "Name:".
- policyNumber: Usually labelled "Policy No.", "Policy Number", "Certificate No.", or "No. Polisi".
- coverageItems: Extract up to 6 of the most important coverage items with their limits.
- keyBenefits: 3-5 short statements of what the policy covers well.
- exclusions: 3-5 critical things NOT covered that the client must know.
- All amounts: keep RM prefix (RM 500,000 not 500000).
- Dates: DD MMM YYYY format (e.g. 01 Jan 2025).
- If you cannot find something: use null, never invent values.

Return ONLY the JSON object. Nothing else.`;

export default function UploadPage() {
  const router = useRouter();
  const [agentName, setAgentName] = useState('');
  const [pastedResponse, setPastedResponse] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore agent name from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('agentName');
    if (saved) setAgentName(saved);
  }, []);

  const handleAgentNameChange = (v: string) => {
    setAgentName(v);
    localStorage.setItem('agentName', v);
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(NOTEBOOKLM_PROMPT);
      } else {
        // Fallback for Android WebView where clipboard API may be unavailable
        const el = document.createElement('textarea');
        el.value = NOTEBOOKLM_PROMPT;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try {
          document.execCommand('copy');
        } finally {
          document.body.removeChild(el);
        }
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
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('No JSON object found in pasted text');
      const candidate = JSON.parse(cleaned.slice(jsonStart, jsonEnd + 1));
      if (!validatePolicyData(candidate)) {
        throw new Error('JSON does not look like a policy — make sure you copied the full response');
      }
      parsed = candidate;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not parse the response. Make sure you copied the full JSON from NotebookLM.');
      return;
    }

    const name = agentName.trim();
    sessionStorage.setItem('policyData', JSON.stringify(parsed));
    sessionStorage.setItem('agentName', name);
    // Persist agent name and clear any stale draft from a previous session
    localStorage.setItem('agentName', name);
    localStorage.removeItem('policyDataDraft');
    router.push('/poster');
  };

  return (
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
          <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--green)' }}>
            Powered by Onyxx Tech
          </p>
        </div>

        {/* Step 1 — Agent name */}
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
            style={{
              background: '#1a1a1a',
              border: '1px solid var(--border)',
              color: '#ffffff',
            }}
          />
        </div>

        {/* Step 2 — Copy prompt */}
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

        {/* Step 3 — Paste response */}
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

      </div>
    </div>
  );
}
