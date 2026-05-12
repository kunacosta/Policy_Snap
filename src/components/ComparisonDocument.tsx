'use client';

import Image from 'next/image';
import { ComparisonData, PolicyData } from '@/types/policy';

interface Props {
  data: ComparisonData;
  agentName: string;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}

function val(v: string | null | undefined, fallback = 'N/A') {
  return v && v.trim() ? v.trim() : fallback;
}

const BLACK = '#000000';
const GREEN = '#1D9E75';
const NAVY  = '#1A2E4A';
const TEXT  = '#111111';
const DIVIDER = '2px solid #E2E8F0';

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

function PolicyColumn({
  policy,
  side,
  isEditing,
  onEdit,
  isRight,
}: {
  policy: PolicyData;
  side: 'policyA' | 'policyB';
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
  isRight?: boolean;
}) {
  const f = (field: string) => `${side}.${field}`;
  const coverageItems = (policy.coverageItems || []).filter(Boolean).slice(0, 8);
  const benefits      = (policy.keyBenefits  || []).filter(Boolean).slice(0, 4);
  const exclusions    = (policy.exclusions   || []).filter(Boolean).slice(0, 4);
  const borderRight   = isRight ? undefined : DIVIDER;

  const claimStep1 = val(policy.claimStep1, '1. Notify insurer immediately');
  const claimStep2 = val(policy.claimStep2, '2. Keep all receipts & reports');
  const claimStep3 = val(policy.claimStep3, '3. Submit within 30 days');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRight }}>

      {/* Insurer header strip */}
      <div style={{
        background: isRight ? NAVY : GREEN,
        padding: '10px 18px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
      }}>
        <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '3px' }}>
          {isRight ? 'Policy B' : 'Policy A'}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
          <EditableSpan
            value={val(policy.insurerName, isRight ? 'Policy B Insurer' : 'Policy A Insurer')}
            field={f('insurerName')}
            label={`${isRight ? 'B' : 'A'} insurer name`}
            isEditing={isEditing}
            onEdit={onEdit}
            style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}
          />
        </div>
      </div>

      {/* Key figures: 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: DIVIDER, flexShrink: 0 }}>
        {[
          { lbl: 'Sum Assured',    value: val(policy.sumAssured),    field: 'sumAssured',    accent: GREEN,     bg: '#F0FDF8', lblColor: '#1D9E75', valColor: '#1D9E75' },
          { lbl: 'Annual Premium', value: val(policy.annualPremium), field: 'annualPremium', accent: '#F59E0B', bg: '#FFFBEB', lblColor: '#F59E0B', valColor: '#B45309' },
          { lbl: 'Effective Date', value: val(policy.effectiveDate), field: 'effectiveDate', accent: '#3B82F6', bg: '#EFF6FF', lblColor: '#3B82F6', valColor: '#1D4ED8' },
          { lbl: 'Expiry / Renewal', value: val(policy.expiryDate), field: 'expiryDate',    accent: '#EF4444', bg: '#FEF2F2', lblColor: '#EF4444', valColor: '#B91C1C' },
        ].map((m, i) => (
          <div key={i} style={{
            padding: '10px 14px',
            borderTop: `3px solid ${m.accent}`,
            borderRight: i % 2 === 0 ? '1px solid #E2E8F0' : 'none',
            borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none',
            background: m.bg,
          }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: m.lblColor, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
              {m.lbl}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: m.valColor, lineHeight: 1.2, wordBreak: 'break-word' }}>
              <EditableSpan
                value={m.value}
                field={f(m.field)}
                label={`${isRight ? 'B' : 'A'} ${m.lbl.toLowerCase()}`}
                isEditing={isEditing}
                onEdit={onEdit}
                style={{ fontSize: '13px', fontWeight: 800, color: m.valColor }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Policy details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: DIVIDER, flexShrink: 0 }}>
        {[
          { lbl: 'Insured Name',  value: val(policy.insuredName),  field: 'insuredName'  },
          { lbl: 'Policy Number', value: val(policy.policyNumber), field: 'policyNumber' },
          { lbl: 'Policy Type',   value: val(policy.policyType),   field: 'policyType'   },
          { lbl: 'Deductible',    value: val(policy.deductible, '—'), field: 'deductible' },
        ].map((fd, i) => (
          <div key={i} style={{
            padding: '8px 14px',
            borderRight: i % 2 === 0 ? '1px solid #E2E8F0' : 'none',
            borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none',
          }}>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
              {fd.lbl}
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>
              <EditableSpan
                value={fd.value}
                field={f(fd.field)}
                label={`${isRight ? 'B' : 'A'} ${fd.lbl.toLowerCase()}`}
                isEditing={isEditing}
                onEdit={onEdit}
                style={{ fontSize: '11px', fontWeight: 700, color: TEXT }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Coverage schedule */}
      <div style={{ padding: '12px 14px', borderBottom: DIVIDER, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{ width: '3px', height: '12px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
          <span style={{ fontSize: '8px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1px' }}>
            Coverage &amp; Riders
          </span>
        </div>
        {coverageItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                {['Coverage / Benefit', 'Limit', 'Remarks'].map((h, i) => (
                  <th key={i} style={{
                    padding: '5px 8px',
                    textAlign: i === 1 ? 'right' : 'left',
                    fontSize: '8px', fontWeight: 700, color: '#64748B',
                    textTransform: 'uppercase', letterSpacing: '0.7px',
                    borderBottom: '1px solid #E2E8F0',
                    width: i === 0 ? '45%' : i === 1 ? '28%' : '27%',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coverageItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#FAFBFC' }}>
                  <td style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 600, color: TEXT, borderBottom: '1px solid #F1F5F9' }}>
                    <EditableSpan value={item.name} field={f(`coverageItems.${i}.name`)} label={`${isRight ? 'B' : 'A'} coverage ${i + 1} name`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', fontWeight: 600, color: TEXT }} />
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 800, color: GREEN, textAlign: 'right', borderBottom: '1px solid #F1F5F9' }}>
                    <EditableSpan value={item.limit} field={f(`coverageItems.${i}.limit`)} label={`${isRight ? 'B' : 'A'} coverage ${i + 1} limit`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', fontWeight: 800, color: GREEN }} />
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: '9px', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                    <EditableSpan value={item.note || '—'} field={f(`coverageItems.${i}.note`)} label={`${isRight ? 'B' : 'A'} coverage ${i + 1} note`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '9px', color: '#64748B' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>No coverage details extracted.</p>
        )}
      </div>

      {/* Benefits + Exclusions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: DIVIDER, flexGrow: 1 }}>
        <div style={{ padding: '10px 14px', borderRight: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
            <div style={{ width: '3px', height: '12px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
            <span style={{ fontSize: '8px', fontWeight: 800, color: TEXT, textTransform: 'uppercase', letterSpacing: '1px' }}>Key Benefits</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {benefits.length > 0 ? benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span aria-label="Covered" style={{ color: GREEN, fontWeight: 800, fontSize: '11px', lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                <EditableSpan value={b} field={f(`keyBenefits.${i}`)} label={`${isRight ? 'B' : 'A'} benefit ${i + 1}`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }} />
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
                <EditableSpan value={e} field={f(`exclusions.${i}`)} label={`${isRight ? 'B' : 'A'} exclusion ${i + 1}`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#334155', lineHeight: 1.5 }} />
              </div>
            )) : <p style={{ fontSize: '10px', color: '#94A3B8', fontStyle: 'italic' }}>None extracted.</p>}
          </div>
        </div>
      </div>

      {/* Claims info */}
      <div style={{ padding: '10px 14px', background: '#F8FAFC', borderBottom: DIVIDER, flexShrink: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Claims Hotline</div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: TEXT, wordBreak: 'break-all' }}>
              <EditableSpan value={val(policy.claimsContact, 'Contact insurer')} field={f('claimsContact')} label={`${isRight ? 'B' : 'A'} claims contact`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', fontWeight: 700, color: TEXT }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>Waiting Period</div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: TEXT }}>
              <EditableSpan value={val(policy.waitingPeriod, 'Refer to policy')} field={f('waitingPeriod')} label={`${isRight ? 'B' : 'A'} waiting period`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', fontWeight: 600, color: TEXT }} />
            </div>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>How to Claim</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <EditableSpan value={claimStep1} field={f('claimStep1')} label={`${isRight ? 'B' : 'A'} claim step 1`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
            <EditableSpan value={claimStep2} field={f('claimStep2')} label={`${isRight ? 'B' : 'A'} claim step 2`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
            <EditableSpan value={claimStep3} field={f('claimStep3')} label={`${isRight ? 'B' : 'A'} claim step 3`} isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.6, fontWeight: 500 }} />
          </div>
        </div>
      </div>

    </div>
  );
}

export default function ComparisonDocument({ data, agentName, isEditing, onEdit }: Props) {
  const today = new Date().toLocaleDateString('en-MY', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div
      id="comparison-document"
      role="document"
      aria-label="Policy Comparison"
      style={{
        width:       '297mm',
        minHeight:   '210mm',
        background:  '#ffffff',
        boxShadow:   '0 8px 48px rgba(0,0,0,0.13)',
        display:     'flex',
        flexDirection: 'column',
        fontFamily:  'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
        color:       TEXT,
        overflow:    'hidden',
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
          <Image
            src="/onyxx-banner-black.png"
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

      {/* TWO-COLUMN BODY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexGrow: 1 }}>
        <PolicyColumn policy={data.policyA} side="policyA" isEditing={isEditing} onEdit={onEdit} />
        <PolicyColumn policy={data.policyB} side="policyB" isEditing={isEditing} onEdit={onEdit} isRight />
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
            <Image
              src="/onyxx-banner-black.png"
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
