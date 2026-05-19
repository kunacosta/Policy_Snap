'use client';

import { ComparisonData, CoverageItem, PolicyData } from '@/types/policy';
import { useImageDataUrl } from '@/lib/useImageDataUrl';

const BANNER_PATH = '/onyxx-banner-black.png';

interface Props {
  data: ComparisonData;
  agentName: string;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}

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

const BLACK   = '#000000';
const GREEN   = '#1D9E75';
const NAVY    = '#1A2E4A';
const TEXT    = '#111111';
const MUTED   = '#6B7280';
const DIVIDER = '2px solid #E2E8F0';

const ROW_GRID: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr' };

function LogoLock() {
  return (
    <div style={{
      position:      'absolute',
      bottom:        0,
      right:         0,
      background:    'rgba(29,158,117,0.9)',
      borderRadius:  '3px',
      padding:       '2px 5px',
      display:       'flex',
      alignItems:    'center',
      gap:           '3px',
      pointerEvents: 'none',
    }}>
      <svg width="7" height="8" viewBox="0 0 24 24" fill="white" aria-hidden="true">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      <span style={{ fontSize: '6px', color: 'white', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Locked</span>
    </div>
  );
}

const EDITABLE_SPAN: React.CSSProperties = {
  outline:      'none',
  borderBottom: `1px dashed ${GREEN}`,
  cursor:       'text',
  minWidth:     '40px',
  display:      'inline-block',
};

function EditableSpan({
  value, field, isEditing, onEdit, style, label,
}: {
  value: string;
  field: string;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
  style?: React.CSSProperties;
  label?: string;
}) {
  if (!isEditing) return <span style={style}>{value}</span>;
  return (
    <span
      role="textbox"
      aria-label={label || field}
      aria-multiline="false"
      contentEditable
      suppressContentEditableWarning
      onBlur={e => onEdit?.(field, e.currentTarget.textContent || '')}
      style={{ ...style, ...EDITABLE_SPAN }}
    >
      {value}
    </span>
  );
}

// ── Section: Insurer header strip ───────────────────────────────────
function InsurerHeader({
  policy, side, isRight, isEditing, onEdit,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isRight: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  return (
    <div style={{
      background:   isRight ? NAVY : GREEN,
      padding:      '10px 18px',
      borderRight:  isRight ? 'none' : '1px solid rgba(255,255,255,0.15)',
    }}>
      <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
        {isRight ? 'Policy B' : 'Policy A'}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
        <EditableSpan
          value={val(policy.insurerName, isRight ? 'Policy B Insurer' : 'Policy A Insurer')}
          field={`${side}.insurerName`}
          label={`${isRight ? 'B' : 'A'} insurer name`}
          isEditing={isEditing}
          onEdit={onEdit}
          style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}
        />
      </div>
    </div>
  );
}

// ── Section: Key figures (2×2) ─────────────────────────────────────
function KeyFigures({
  policy, side, isRight, isSumWinner, isPremiumWinner, isEditing, onEdit,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isRight: boolean;
  isSumWinner: boolean;
  isPremiumWinner: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const metrics = [
    { lbl: 'Sum Assured',      value: val(policy.sumAssured),    field: 'sumAssured',    accent: GREEN,     bg: '#F0FDF8', lblColor: '#1D9E75', valColor: '#1D9E75', winner: isSumWinner },
    { lbl: 'Annual Premium',   value: val(policy.annualPremium), field: 'annualPremium', accent: '#F59E0B', bg: '#FFFBEB', lblColor: '#F59E0B', valColor: '#B45309', winner: isPremiumWinner },
    { lbl: 'Effective Date',   value: val(policy.effectiveDate), field: 'effectiveDate', accent: '#3B82F6', bg: '#EFF6FF', lblColor: '#3B82F6', valColor: '#1D4ED8', winner: false },
    { lbl: 'Expiry / Renewal', value: val(policy.expiryDate),    field: 'expiryDate',    accent: '#EF4444', bg: '#FEF2F2', lblColor: '#EF4444', valColor: '#B91C1C', winner: false },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      borderRight: isRight ? 'none' : DIVIDER,
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding:      '10px 14px',
          borderTop:    `3px solid ${m.accent}`,
          borderRight:  i % 2 === 0 ? '1px solid #E2E8F0' : 'none',
          borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none',
          background:   m.winner ? 'rgba(29,158,117,0.12)' : m.bg,
          position:     'relative',
        }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: m.lblColor, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
            {m.lbl}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: m.valColor, lineHeight: 1.2, wordBreak: 'break-word' }}>
            <EditableSpan
              value={m.value}
              field={`${side}.${m.field}`}
              label={`${isRight ? 'B' : 'A'} ${m.lbl.toLowerCase()}`}
              isEditing={isEditing}
              onEdit={onEdit}
              style={{ fontSize: '13px', fontWeight: 800, color: m.valColor }}
            />
          </div>
          {m.winner && (
            <div style={{
              position: 'absolute', top: 4, right: 6,
              fontSize: '7px', fontWeight: 800, color: GREEN,
              letterSpacing: '0.5px', textTransform: 'uppercase',
            }}>✓ Better</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Section: Policy details (2×2) ──────────────────────────────────
function PolicyDetails({
  policy, side, isRight, isEditing, onEdit,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isRight: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const fields = [
    { lbl: 'Insured Name',  value: val(policy.insuredName),     field: 'insuredName'  },
    { lbl: 'Policy Number', value: val(policy.policyNumber),    field: 'policyNumber' },
    { lbl: 'Policy Type',   value: val(policy.policyType),      field: 'policyType'   },
    { lbl: 'Deductible',    value: val(policy.deductible, '—'), field: 'deductible'   },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      borderRight: isRight ? 'none' : DIVIDER,
    }}>
      {fields.map((fd, i) => (
        <div key={i} style={{
          padding:      '8px 14px',
          borderRight:  i % 2 === 0 ? '1px solid #E2E8F0' : 'none',
          borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none',
        }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
            {fd.lbl}
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>
            <EditableSpan
              value={fd.value}
              field={`${side}.${fd.field}`}
              label={`${isRight ? 'B' : 'A'} ${fd.lbl.toLowerCase()}`}
              isEditing={isEditing}
              onEdit={onEdit}
              style={{ fontSize: '11px', fontWeight: 700, color: TEXT }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section: Coverage table (shared 6-col table for perfect row alignment) ──
type CovRow = { item: CoverageItem | null; index: number };

function padCoverage(items: CoverageItem[], target: number): CovRow[] {
  const real: CovRow[] = items.slice(0, target).map((item, index) => ({ item, index }));
  while (real.length < target) real.push({ item: null, index: real.length });
  return real;
}

function CoverageCell({
  row, side, kind, isRight, isEditing, onEdit,
}: {
  row: CovRow;
  side: 'policyA' | 'policyB';
  kind: 'name' | 'limit' | 'note';
  isRight: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const tdBase: React.CSSProperties = {
    padding:      '6px 8px',
    borderBottom: '1px solid #F1F5F9',
    verticalAlign: 'top',
  };

  if (row.item === null) {
    const muted = { ...tdBase, color: '#CBD5E1', fontSize: kind === 'limit' ? '11px' : kind === 'name' ? '10px' : '9px', fontWeight: kind === 'limit' ? 800 : kind === 'name' ? 600 : 400, textAlign: kind === 'limit' ? 'right' as const : 'left' as const };
    return <td style={muted}><span>—</span></td>;
  }

  const item = row.item;
  const f = `${side}.coverageItems.${row.index}`;
  const sideLbl = isRight ? 'B' : 'A';

  if (kind === 'name') {
    return (
      <td style={{ ...tdBase, fontSize: '10px', fontWeight: 600, color: TEXT }}>
        <EditableSpan
          value={item.name}
          field={`${f}.name`}
          label={`${sideLbl} coverage ${row.index + 1} name`}
          isEditing={isEditing}
          onEdit={onEdit}
          style={{ fontSize: '10px', fontWeight: 600, color: TEXT }}
        />
        {item.explain && (
          <div style={{ fontSize: '8px', color: MUTED, lineHeight: 1.4, marginTop: '2px', fontWeight: 500 }}>
            <EditableSpan
              value={item.explain}
              field={`${f}.explain`}
              label={`${sideLbl} coverage ${row.index + 1} explanation`}
              isEditing={isEditing}
              onEdit={onEdit}
              style={{ fontSize: '8px', color: MUTED, fontWeight: 500 }}
            />
          </div>
        )}
      </td>
    );
  }

  if (kind === 'limit') {
    return (
      <td style={{ ...tdBase, fontSize: '11px', fontWeight: 800, color: GREEN, textAlign: 'right' }}>
        <EditableSpan
          value={item.limit}
          field={`${f}.limit`}
          label={`${sideLbl} coverage ${row.index + 1} limit`}
          isEditing={isEditing}
          onEdit={onEdit}
          style={{ fontSize: '11px', fontWeight: 800, color: GREEN }}
        />
      </td>
    );
  }

  // kind === 'note'
  return (
    <td style={{ ...tdBase, fontSize: '9px', color: '#64748B' }}>
      <EditableSpan
        value={item.note || '—'}
        field={`${f}.note`}
        label={`${sideLbl} coverage ${row.index + 1} note`}
        isEditing={isEditing}
        onEdit={onEdit}
        style={{ fontSize: '9px', color: '#64748B' }}
      />
    </td>
  );
}

function CoverageSection({
  data, isEditing, onEdit,
}: {
  data: ComparisonData;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const aRaw = (data.policyA.coverageItems || []).filter(Boolean);
  const bRaw = (data.policyB.coverageItems || []).filter(Boolean);
  const target = Math.min(8, Math.max(aRaw.length, bRaw.length));

  if (target === 0) {
    return (
      <div style={{ padding: '14px 18px', borderBottom: DIVIDER }}>
        <p style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic', margin: 0 }}>
          No coverage details extracted for either policy.
        </p>
      </div>
    );
  }

  const aRows = padCoverage(aRaw, target);
  const bRows = padCoverage(bRaw, target);

  const headerCellBase: React.CSSProperties = {
    padding:       '6px 8px',
    fontSize:      '8px',
    fontWeight:    700,
    color:         '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    borderBottom:  '1px solid #E2E8F0',
    background:    '#F1F5F9',
  };
  const midDivider: React.CSSProperties = { borderRight: DIVIDER };

  return (
    <div style={{ padding: '12px 14px 14px', borderBottom: DIVIDER }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
        <div style={{ width: '3px', height: '12px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
        <span style={{ fontSize: '8px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1px' }}>
          Coverage &amp; Riders
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: '21%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '17%' }} />
          <col style={{ width: '21%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...headerCellBase, textAlign: 'left' }}>A · Coverage</th>
            <th style={{ ...headerCellBase, textAlign: 'right' }}>Limit</th>
            <th style={{ ...headerCellBase, textAlign: 'left', ...midDivider }}>Remarks</th>
            <th style={{ ...headerCellBase, textAlign: 'left' }}>B · Coverage</th>
            <th style={{ ...headerCellBase, textAlign: 'right' }}>Limit</th>
            <th style={{ ...headerCellBase, textAlign: 'left' }}>Remarks</th>
          </tr>
        </thead>
        <tbody>
          {aRows.map((aRow, i) => {
            const bRow = bRows[i];
            const stripe = i % 2 === 0 ? '#ffffff' : '#FAFBFC';
            return (
              <tr key={i} style={{ background: stripe }}>
                <CoverageCell row={aRow} side="policyA" kind="name"  isRight={false} isEditing={isEditing} onEdit={onEdit} />
                <CoverageCell row={aRow} side="policyA" kind="limit" isRight={false} isEditing={isEditing} onEdit={onEdit} />
                <td style={{ padding: 0, borderBottom: '1px solid #F1F5F9', verticalAlign: 'top', ...midDivider }}>
                  <CoverageCell row={aRow} side="policyA" kind="note" isRight={false} isEditing={isEditing} onEdit={onEdit} />
                </td>
                <CoverageCell row={bRow} side="policyB" kind="name"  isRight={true} isEditing={isEditing} onEdit={onEdit} />
                <CoverageCell row={bRow} side="policyB" kind="limit" isRight={true} isEditing={isEditing} onEdit={onEdit} />
                <CoverageCell row={bRow} side="policyB" kind="note"  isRight={true} isEditing={isEditing} onEdit={onEdit} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Section: Benefits + Exclusions (4 columns: A-ben, A-exc, B-ben, B-exc) ──
function BenefitsExclusions({
  policy, side, isRight, isEditing, onEdit,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isRight: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const benefits   = (policy.keyBenefits || []).filter(Boolean).slice(0, 4);
  const exclusions = (policy.exclusions  || []).filter(Boolean).slice(0, 4);
  const sideLbl    = isRight ? 'B' : 'A';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      borderRight: isRight ? 'none' : DIVIDER,
    }}>
      <div style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
          <div style={{ width: '3px', height: '12px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: '8px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1px' }}>Key Benefits</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {benefits.length > 0 ? benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span aria-label="Covered" style={{ color: GREEN, fontWeight: 800, fontSize: '11px', lineHeight: 1.5, flexShrink: 0 }}>✓</span>
              <EditableSpan value={b} field={`${side}.keyBenefits.${i}`} label={`${sideLbl} benefit ${i + 1}`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }} />
            </div>
          )) : <p style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>None extracted.</p>}
        </div>
      </div>
      <div style={{ padding: '10px 14px', background: '#FFFBFB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
          <div style={{ width: '3px', height: '12px', background: '#DC2626', borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: '8px', fontWeight: 800, color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '1px' }}>Exclusions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {exclusions.length > 0 ? exclusions.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span aria-label="Not covered" style={{ color: '#DC2626', fontWeight: 800, fontSize: '11px', lineHeight: 1.5, flexShrink: 0 }}>✕</span>
              <EditableSpan value={e} field={`${side}.exclusions.${i}`} label={`${sideLbl} exclusion ${i + 1}`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }} />
            </div>
          )) : <p style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>None extracted.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Section: Claims info ───────────────────────────────────────────
function ClaimsInfo({
  policy, side, isRight, isEditing, onEdit,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isRight: boolean;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}) {
  const sideLbl    = isRight ? 'B' : 'A';
  const claimStep1 = val(policy.claimStep1, '1. Notify insurer immediately');
  const claimStep2 = val(policy.claimStep2, '2. Keep all receipts & reports');
  const claimStep3 = val(policy.claimStep3, '3. Submit within 30 days');

  return (
    <div style={{
      padding:     '10px 14px',
      background:  '#F8FAFC',
      borderRight: isRight ? 'none' : DIVIDER,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Claims Hotline</div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: TEXT, wordBreak: 'break-all' }}>
            <EditableSpan value={val(policy.claimsContact, 'Contact insurer')} field={`${side}.claimsContact`} label={`${sideLbl} claims contact`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', fontWeight: 700, color: TEXT }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Waiting Period</div>
          <div style={{ fontSize: '10px', fontWeight: 600, color: TEXT }}>
            <EditableSpan value={val(policy.waitingPeriod, 'Refer to policy')} field={`${side}.waitingPeriod`} label={`${sideLbl} waiting period`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', fontWeight: 600, color: TEXT }} />
          </div>
        </div>
      </div>
      <div style={{ marginTop: '8px' }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>How to Claim</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <EditableSpan value={claimStep1} field={`${side}.claimStep1`} label={`${sideLbl} claim step 1`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
          <EditableSpan value={claimStep2} field={`${side}.claimStep2`} label={`${sideLbl} claim step 2`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
          <EditableSpan value={claimStep3} field={`${side}.claimStep3`} label={`${sideLbl} claim step 3`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
        </div>
      </div>
    </div>
  );
}

export default function ComparisonDocument({ data, agentName, isEditing, onEdit }: Props) {
  const bannerSrc = useImageDataUrl(BANNER_PATH) ?? BANNER_PATH;
  const today = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  const aSum  = parseAmount(data.policyA.sumAssured);
  const bSum  = parseAmount(data.policyB.sumAssured);
  const aPrem = parseAmount(data.policyA.annualPremium);
  const bPrem = parseAmount(data.policyB.annualPremium);

  const aSumWinner  = aSum !== null && bSum !== null && aSum > bSum;
  const bSumWinner  = aSum !== null && bSum !== null && bSum > aSum;
  const aPremWinner = aPrem !== null && bPrem !== null && aPrem < bPrem;
  const bPremWinner = aPrem !== null && bPrem !== null && bPrem < aPrem;

  return (
    <div
      id="comparison-document"
      role="document"
      aria-label="Policy Comparison"
      style={{
        width:         '297mm',
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
        <div style={{ height: '50px', flexShrink: 0, position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bannerSrc}
            alt="Onyxx Tech"
            width={200}
            height={50}
            style={{ objectFit: 'contain', objectPosition: 'left center', height: '50px', width: 'auto' }}
          />
          {isEditing && <LogoLock />}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>
            POLICY COMPARISON
          </div>
          <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px', letterSpacing: '0.3px' }}>
            Insurance Coverage Comparison
          </div>
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', textAlign: 'right', flexShrink: 0 }}>
          <span style={{ fontWeight: 600 }}>Prepared by:</span> {agentName}
          <br />
          {today}
        </div>
      </div>

      {/* BODY — section-as-row layout */}

      {/* Row 1: Insurer header strip */}
      <div style={{ ...ROW_GRID, borderBottom: DIVIDER, flexShrink: 0 }}>
        <InsurerHeader policy={data.policyA} side="policyA" isRight={false} isEditing={isEditing} onEdit={onEdit} />
        <InsurerHeader policy={data.policyB} side="policyB" isRight={true}  isEditing={isEditing} onEdit={onEdit} />
      </div>

      {/* Row 2: Key figures */}
      <div style={{ ...ROW_GRID, borderBottom: DIVIDER, flexShrink: 0 }}>
        <KeyFigures policy={data.policyA} side="policyA" isRight={false} isSumWinner={aSumWinner} isPremiumWinner={aPremWinner} isEditing={isEditing} onEdit={onEdit} />
        <KeyFigures policy={data.policyB} side="policyB" isRight={true}  isSumWinner={bSumWinner} isPremiumWinner={bPremWinner} isEditing={isEditing} onEdit={onEdit} />
      </div>

      {/* Row 3: Policy details */}
      <div style={{ ...ROW_GRID, borderBottom: DIVIDER, flexShrink: 0 }}>
        <PolicyDetails policy={data.policyA} side="policyA" isRight={false} isEditing={isEditing} onEdit={onEdit} />
        <PolicyDetails policy={data.policyB} side="policyB" isRight={true}  isEditing={isEditing} onEdit={onEdit} />
      </div>

      {/* Row 4: Coverage & Riders — single shared 6-col table */}
      <CoverageSection data={data} isEditing={isEditing} onEdit={onEdit} />

      {/* Row 5: Benefits + Exclusions */}
      <div style={{ ...ROW_GRID, borderBottom: DIVIDER }}>
        <BenefitsExclusions policy={data.policyA} side="policyA" isRight={false} isEditing={isEditing} onEdit={onEdit} />
        <BenefitsExclusions policy={data.policyB} side="policyB" isRight={true}  isEditing={isEditing} onEdit={onEdit} />
      </div>

      {/* Row 6: Claims info */}
      <div style={{ ...ROW_GRID, borderBottom: DIVIDER, flexShrink: 0 }}>
        <ClaimsInfo policy={data.policyA} side="policyA" isRight={false} isEditing={isEditing} onEdit={onEdit} />
        <ClaimsInfo policy={data.policyB} side="policyB" isRight={true}  isEditing={isEditing} onEdit={onEdit} />
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
          {' '}This document is a simplified comparison and does not constitute the full insurance contract.{' '}
          Refer to the original policy documents for complete terms, conditions, and exclusions.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0, minWidth: 'max-content' }}>
          <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerSrc}
              alt="Onyxx Tech"
              width={120}
              height={30}
              style={{ objectFit: 'contain', objectPosition: 'right center', height: '28px', width: 'auto' }}
            />
            {isEditing && <LogoLock />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: GREEN, fontWeight: 600, whiteSpace: 'nowrap' }}>
              +60 11-3988-4927
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>|</span>
            <span style={{ fontSize: '10px', color: GREEN, fontWeight: 600, whiteSpace: 'nowrap' }}>
              @onyxtech26
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
