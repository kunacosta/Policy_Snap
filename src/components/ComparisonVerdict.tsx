'use client';

import { ComparisonData, PolicyData } from '@/types/policy';
import { useImageDataUrl } from '@/lib/useImageDataUrl';

const BANNER_PATH = '/onyxx-banner-black.png';

interface Props {
  data: ComparisonData;
  agentName: string;
}

const BLACK = '#000000';
const GREEN = '#1D9E75';
const NAVY  = '#1A2E4A';
const TEXT  = '#111111';
const MUTED = '#6B7280';

function val(v: string | null | undefined, fallback = 'N/A') {
  return v && v.trim() ? v.trim() : fallback;
}

function parseAmount(s: string | null | undefined): number | null {
  if (!s) return null;
  const digits = s.replace(/[^\d.]/g, '');
  if (!digits) return null;
  const n = parseFloat(digits);
  return isNaN(n) ? null : n;
}

function formatRM(n: number): string {
  return `RM ${n.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;
}

type Reason = { text: string; impact: number };

function computeVerdict(a: PolicyData, b: PolicyData): {
  winner: 'A' | 'B' | 'tied';
  reasonsA: Reason[];
  reasonsB: Reason[];
} {
  const reasonsA: Reason[] = [];
  const reasonsB: Reason[] = [];

  const aSum  = parseAmount(a.sumAssured);
  const bSum  = parseAmount(b.sumAssured);
  if (aSum !== null && bSum !== null && aSum !== bSum) {
    const diff = Math.abs(aSum - bSum);
    const txt  = `${formatRM(diff)} higher sum assured`;
    if (aSum > bSum) reasonsA.push({ text: txt, impact: diff });
    else             reasonsB.push({ text: txt, impact: diff });
  }

  const aPrem = parseAmount(a.annualPremium);
  const bPrem = parseAmount(b.annualPremium);
  if (aPrem !== null && bPrem !== null && aPrem !== bPrem) {
    const diff = Math.abs(aPrem - bPrem);
    const txt  = `${formatRM(diff)} cheaper per year`;
    if (aPrem < bPrem) reasonsA.push({ text: txt, impact: diff * 5 });
    else               reasonsB.push({ text: txt, impact: diff * 5 });
  }

  const aCov = (a.coverageItems || []).length;
  const bCov = (b.coverageItems || []).length;
  if (aCov !== bCov) {
    const diff = Math.abs(aCov - bCov);
    const txt  = `Covers ${diff} more benefit${diff > 1 ? 's' : ''}`;
    if (aCov > bCov) reasonsA.push({ text: txt, impact: diff * 30000 });
    else             reasonsB.push({ text: txt, impact: diff * 30000 });
  }

  const aExc = (a.exclusions || []).length;
  const bExc = (b.exclusions || []).length;
  if (aExc !== bExc) {
    const diff = Math.abs(aExc - bExc);
    const txt  = `${diff} fewer exclusion${diff > 1 ? 's' : ''}`;
    if (aExc < bExc) reasonsA.push({ text: txt, impact: diff * 15000 });
    else             reasonsB.push({ text: txt, impact: diff * 15000 });
  }

  const aBen = (a.keyBenefits || []).length;
  const bBen = (b.keyBenefits || []).length;
  if (aBen !== bBen) {
    const diff = Math.abs(aBen - bBen);
    const txt  = `${diff} extra key benefit${diff > 1 ? 's' : ''}`;
    if (aBen > bBen) reasonsA.push({ text: txt, impact: diff * 10000 });
    else             reasonsB.push({ text: txt, impact: diff * 10000 });
  }

  reasonsA.sort((x, y) => y.impact - x.impact);
  reasonsB.sort((x, y) => y.impact - x.impact);

  let winner: 'A' | 'B' | 'tied' = 'tied';
  if (reasonsA.length > reasonsB.length) winner = 'A';
  else if (reasonsB.length > reasonsA.length) winner = 'B';
  else if (reasonsA.length > 0) {
    const aTotal = reasonsA.reduce((s, r) => s + r.impact, 0);
    const bTotal = reasonsB.reduce((s, r) => s + r.impact, 0);
    if (aTotal > bTotal) winner = 'A';
    else if (bTotal > aTotal) winner = 'B';
  }

  return { winner, reasonsA, reasonsB };
}

type DiffRow = { label: string; aValue: string; bValue: string; aWins: boolean; bWins: boolean };

function buildDiffRows(a: PolicyData, b: PolicyData): DiffRow[] {
  const rows: DiffRow[] = [];

  const addNumeric = (label: string, aStr: string | null | undefined, bStr: string | null | undefined, higherWins: boolean) => {
    const aV = val(aStr, '—');
    const bV = val(bStr, '—');
    if (aV === bV) return;
    const aN = parseAmount(aStr);
    const bN = parseAmount(bStr);
    let aWins = false, bWins = false;
    if (aN !== null && bN !== null && aN !== bN) {
      if (higherWins) { aWins = aN > bN; bWins = bN > aN; }
      else            { aWins = aN < bN; bWins = bN < aN; }
    }
    rows.push({ label, aValue: aV, bValue: bV, aWins, bWins });
  };

  const addPlain = (label: string, aStr: string | null | undefined, bStr: string | null | undefined) => {
    const aV = val(aStr, '—');
    const bV = val(bStr, '—');
    if (aV === bV) return;
    rows.push({ label, aValue: aV, bValue: bV, aWins: false, bWins: false });
  };

  addNumeric('Sum Assured',    a.sumAssured,    b.sumAssured,    true);
  addNumeric('Annual Premium', a.annualPremium, b.annualPremium, false);
  addPlain('Policy Type',      a.policyType,    b.policyType);
  addPlain('Deductible',       a.deductible,    b.deductible);
  addPlain('Effective Date',   a.effectiveDate, b.effectiveDate);
  addPlain('Expiry / Renewal', a.expiryDate,    b.expiryDate);
  addPlain('Waiting Period',   a.waitingPeriod, b.waitingPeriod);

  const aItems = a.coverageItems || [];
  const bItems = b.coverageItems || [];
  if (aItems.length !== bItems.length) {
    rows.push({
      label: 'Coverage Items',
      aValue: `${aItems.length} item${aItems.length === 1 ? '' : 's'}`,
      bValue: `${bItems.length} item${bItems.length === 1 ? '' : 's'}`,
      aWins: aItems.length > bItems.length,
      bWins: bItems.length > aItems.length,
    });
  }

  const aExc = (a.exclusions || []).length;
  const bExc = (b.exclusions || []).length;
  if (aExc !== bExc) {
    rows.push({
      label: 'Exclusions',
      aValue: `${aExc} listed`,
      bValue: `${bExc} listed`,
      aWins: aExc < bExc,
      bWins: bExc < aExc,
    });
  }

  return rows;
}

function uniqueCoverage(primary: PolicyData, other: PolicyData): string[] {
  const otherNames = new Set((other.coverageItems || []).map(c => c.name.toLowerCase().trim()));
  return (primary.coverageItems || [])
    .filter(c => c.name && !otherNames.has(c.name.toLowerCase().trim()))
    .map(c => c.name);
}

export default function ComparisonVerdict({ data, agentName }: Props) {
  const bannerSrc = useImageDataUrl(BANNER_PATH) ?? BANNER_PATH;
  const today = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  const { winner, reasonsA, reasonsB } = computeVerdict(data.policyA, data.policyB);
  const diffRows = buildDiffRows(data.policyA, data.policyB);

  const winnerLabel = winner === 'tied' ? 'Tied — review details' :
                      winner === 'A' ? val(data.policyA.insurerName, 'Policy A')
                                     : val(data.policyB.insurerName, 'Policy B');
  const winnerReasons = winner === 'A' ? reasonsA : winner === 'B' ? reasonsB : [];
  const top3 = winnerReasons.slice(0, 3);

  const onlyInA = uniqueCoverage(data.policyA, data.policyB).slice(0, 6);
  const onlyInB = uniqueCoverage(data.policyB, data.policyA).slice(0, 6);

  return (
    <div
      id="comparison-verdict"
      role="document"
      aria-label="Policy Verdict"
      style={{
        width:         '297mm',
        minHeight:     '210mm',
        background:    '#ffffff',
        boxShadow:     '0 8px 48px rgba(0,0,0,0.13)',
        display:       'flex',
        flexDirection: 'column',
        fontFamily:    'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
        color:         TEXT,
        overflow:      'hidden',
      }}
    >

      {/* HEADER */}
      <div style={{
        background:     BLACK,
        padding:        '14px 24px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '16px',
        flexShrink:     0,
      }}>
        <div style={{ height: '50px', flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerSrc}
            alt="Onyxx Tech"
            width={200}
            height={50}
            style={{ objectFit: 'contain', objectPosition: 'left center', height: '50px', width: 'auto' }}
          />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>
            POLICY VERDICT
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', letterSpacing: '0.3px' }}>
            Recommendation Scorecard
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontWeight: 600 }}>Prepared by:</span> {agentName}
          <br />
          {today}
        </div>
      </div>

      {/* VERDICT BANNER */}
      <div style={{
        padding:       '28px 32px',
        background:    winner === 'tied' ? '#F8FAFC' : '#F0FDF8',
        borderBottom:  '2px solid #E2E8F0',
        flexShrink:    0,
      }}>
        <div style={{
          fontSize:      '10px',
          fontWeight:    800,
          color:         MUTED,
          textTransform: 'uppercase',
          letterSpacing: '2px',
          marginBottom:  '8px',
        }}>
          {winner === 'tied' ? 'Result' : 'Recommended'}
        </div>
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        '14px',
          marginBottom: top3.length > 0 ? '18px' : 0,
        }}>
          {winner !== 'tied' && (
            <div style={{
              width:           '44px',
              height:          '44px',
              borderRadius:    '50%',
              background:      GREEN,
              color:           '#ffffff',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '24px',
              fontWeight:      900,
              flexShrink:      0,
            }}>
              {winner}
            </div>
          )}
          <div style={{
            fontSize:   '32px',
            fontWeight: 900,
            color:      winner === 'tied' ? NAVY : '#0F5C46',
            lineHeight: 1.1,
            letterSpacing: '-0.5px',
          }}>
            {winnerLabel}
          </div>
        </div>

        {top3.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginTop: '10px' }}>
            {top3.map((r, i) => (
              <div key={i} style={{
                background:    '#ffffff',
                border:        `1px solid ${GREEN}`,
                borderLeft:    `4px solid ${GREEN}`,
                borderRadius:  '6px',
                padding:       '14px 16px',
              }}>
                <div style={{
                  fontSize:      '9px',
                  fontWeight:    800,
                  color:         GREEN,
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom:  '6px',
                }}>
                  Reason {i + 1}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: TEXT, lineHeight: 1.35 }}>
                  {r.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KEY DIFFERENCES TABLE */}
      <div style={{ padding: '20px 32px', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: '3px', height: '14px', background: GREEN, borderRadius: '2px' }} />
          <span style={{ fontSize: '10px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            Key Differences
          </span>
        </div>

        {diffRows.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #E2E8F0', width: '28%' }}>
                  Metric
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 800, color: GREEN, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #E2E8F0', width: '36%' }}>
                  {val(data.policyA.insurerName, 'Policy A')}
                </th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 800, color: NAVY, textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #E2E8F0', width: '36%' }}>
                  {val(data.policyB.insurerName, 'Policy B')}
                </th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#FAFBFC' }}>
                  <td style={{ padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: TEXT, borderBottom: '1px solid #F1F5F9' }}>
                    {row.label}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #F1F5F9', background: row.aWins ? 'rgba(29,158,117,0.08)' : 'transparent', color: row.aWins ? GREEN : TEXT }}>
                    {row.aValue}
                    {row.aWins && <span style={{ fontSize: '9px', fontWeight: 800, marginLeft: '6px', color: GREEN }}>✓</span>}
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 700, borderBottom: '1px solid #F1F5F9', background: row.bWins ? 'rgba(29,158,117,0.08)' : 'transparent', color: row.bWins ? GREEN : TEXT }}>
                    {row.bValue}
                    {row.bWins && <span style={{ fontSize: '9px', fontWeight: 800, marginLeft: '6px', color: GREEN }}>✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '11px', color: MUTED, fontStyle: 'italic' }}>
            Both policies match on key metrics. Review the detailed comparison for finer differences.
          </p>
        )}

        {/* COVERAGE GAPS */}
        {(onlyInA.length > 0 || onlyInB.length > 0) && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <div style={{ width: '3px', height: '14px', background: '#F59E0B', borderRadius: '2px' }} />
              <span style={{ fontSize: '10px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                Coverage Gaps
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  Only in {val(data.policyA.insurerName, 'Policy A')}
                </div>
                {onlyInA.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: TEXT, lineHeight: 1.6 }}>
                    {onlyInA.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '10px', color: MUTED, fontStyle: 'italic', margin: 0 }}>No unique items.</p>
                )}
              </div>
              <div style={{ padding: '12px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  Only in {val(data.policyB.insurerName, 'Policy B')}
                </div>
                {onlyInB.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10px', color: TEXT, lineHeight: 1.6 }}>
                    {onlyInB.map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                ) : (
                  <p style={{ fontSize: '10px', color: MUTED, fontStyle: 'italic', margin: 0 }}>No unique items.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        background:     BLACK,
        borderTop:      `3px solid ${GREEN}`,
        padding:        '10px 24px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '20px',
        flexShrink:     0,
      }}>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>For reference only.</span>
          {' '}This recommendation is a simplified view and does not constitute professional advice or the full insurance contract.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, minWidth: 'max-content' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerSrc}
              alt="Onyxx Tech"
              width={120}
              height={30}
              style={{ objectFit: 'contain', objectPosition: 'right center', height: '28px', width: 'auto' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: GREEN, fontWeight: 600, whiteSpace: 'nowrap' }}>+60 11-3988-4927</span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>|</span>
            <span style={{ fontSize: '10px', color: GREEN, fontWeight: 600, whiteSpace: 'nowrap' }}>@onyxtech26</span>
          </div>
        </div>
      </div>

    </div>
  );
}
