'use client';

import Image from 'next/image';
import { PolicyData } from '@/types/policy';

interface Props {
  data: PolicyData;
  agentName: string;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
}

function val(v: string | null | undefined, fallback = 'N/A') {
  return v && v.trim() ? v.trim() : fallback;
}

const BLACK = '#000000';
const GREEN = '#1D9E75';
const TEXT  = '#111111';

const EDITABLE_SPAN: React.CSSProperties = {
  outline:      'none',
  borderBottom: `1px dashed ${GREEN}`,
  cursor:       'text',
  minWidth:     '40px',
  display:      'inline-block',
};

function SectionHeading({ title, color = TEXT }: { title: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ width: '3px', height: '14px', background: GREEN, borderRadius: '2px', flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
        {title}
      </span>
    </div>
  );
}

function EditableSpan({
  value,
  field,
  isEditing,
  onEdit,
  style,
  label,
}: {
  value: string;
  field: string;
  isEditing?: boolean;
  onEdit?: (field: string, value: string) => void;
  style?: React.CSSProperties;
  label?: string;
}) {
  if (!isEditing) {
    return <span style={style}>{value}</span>;
  }
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

export default function PolicyDocument({ data, agentName, isEditing, onEdit }: Props) {
  const today = new Date().toLocaleDateString('en-MY', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const coverageItems = (data.coverageItems || []).filter(Boolean).slice(0, 6);
  const benefits      = (data.keyBenefits  || []).filter(Boolean).slice(0, 5);
  const exclusions    = (data.exclusions   || []).filter(Boolean).slice(0, 5);

  const claimStep1 = val(data.claimStep1, '1. Notify insurer immediately');
  const claimStep2 = val(data.claimStep2, '2. Keep all receipts & reports');
  const claimStep3 = val(data.claimStep3, '3. Submit within 30 days');

  return (
    <div
      id="policy-document"
      role="document"
      aria-label="Policy Summary"
      style={{
        width:       '210mm',
        minHeight:   '297mm',
        background:  '#ffffff',
        boxShadow:   '0 8px 48px rgba(0,0,0,0.13)',
        display:     'flex',
        flexDirection: 'column',
        fontFamily:  'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
        color:       TEXT,
        overflow:    'hidden',
      }}
    >

      {/* ══ HEADER BAND ══════════════════════════════════════════ */}
      <div style={{
        background:     BLACK,
        padding:        '18px 28px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '20px',
        flexShrink:     0,
      }}>
        <div style={{ height: '44px', flexShrink: 0 }}>
          <Image
            src="/onyxx-banner-black.png"
            alt="Onyxx Tech"
            width={180}
            height={44}
            style={{ objectFit: 'contain', objectPosition: 'left center', height: '44px', width: 'auto' }}
          />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', lineHeight: 1 }}>
            POLICY SUMMARY
          </div>
          <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '5px', letterSpacing: '0.3px' }}>
            Insurance Coverage Overview
          </div>
        </div>
      </div>

      {/* ══ INSURER + PREPARED BY STRIP ══════════════════════════ */}
      <div style={{
        background:     BLACK,
        padding:        '10px 28px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
        borderTop:      '1px solid #1a1a1a',
      }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.1px' }}>
          <EditableSpan
            value={val(data.insurerName, 'Insurance Company')}
            field="insurerName"
            label="Insurer name"
            isEditing={isEditing}
            onEdit={onEdit}
          />
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.65)', textAlign: 'right' }}>
          <span style={{ fontWeight: 600 }}>Prepared by:</span> {agentName}&nbsp;&nbsp;·&nbsp;&nbsp;{today}
        </div>
      </div>

      {/* ══ POLICY DETAILS GRID ══════════════════════════════════ */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:                 '0',
        borderBottom:        '1px solid #E2E8F0',
        flexShrink:          0,
      }}>
        {[
          { lbl: 'Name of Insured', value: val(data.insuredName),  field: 'insuredName',  label: 'Insured name'  },
          { lbl: 'Policy Number',   value: val(data.policyNumber), field: 'policyNumber', label: 'Policy number' },
          { lbl: 'Policy Type',     value: val(data.policyType),   field: 'policyType',   label: 'Policy type'   },
          { lbl: 'Insurer',         value: val(data.insurerName),  field: 'insurerName',  label: 'Insurer'       },
        ].map((f, i) => (
          <div key={i} style={{
            padding:      '11px 28px',
            borderRight:  i % 2 === 0 ? '1px solid #E2E8F0' : 'none',
            borderBottom: i < 2 ? '1px solid #E2E8F0' : 'none',
            background:   '#ffffff',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.9px', marginBottom: '4px' }}>
              {f.lbl}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: TEXT, lineHeight: 1.3 }}>
              <EditableSpan
                value={f.value}
                field={f.field}
                label={f.label}
                isEditing={isEditing}
                onEdit={onEdit}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ══ KEY FIGURES ══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', flexShrink: 0 }}>
        {[
          { lbl: 'Sum Assured',      value: val(data.sumAssured),    field: 'sumAssured',    label: 'Sum assured',    accent: '#1D9E75', bg: '#F0FDF8', lblColor: '#1D9E75', valColor: '#1D9E75' },
          { lbl: 'Annual Premium',   value: val(data.annualPremium), field: 'annualPremium', label: 'Annual premium', accent: '#F59E0B', bg: '#FFFBEB', lblColor: '#F59E0B', valColor: '#B45309' },
          { lbl: 'Effective Date',   value: val(data.effectiveDate), field: 'effectiveDate', label: 'Effective date', accent: '#3B82F6', bg: '#EFF6FF', lblColor: '#3B82F6', valColor: '#1D4ED8' },
          { lbl: 'Expiry / Renewal', value: val(data.expiryDate),    field: 'expiryDate',    label: 'Expiry date',    accent: '#EF4444', bg: '#FEF2F2', lblColor: '#EF4444', valColor: '#B91C1C' },
        ].map((m, i) => (
          <div key={i} style={{
            padding:      '14px 18px',
            borderTop:    `4px solid ${m.accent}`,
            borderRight:  i < 3 ? '1px solid #E2E8F0' : 'none',
            borderBottom: '2px solid #E2E8F0',
            background:   m.bg,
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: m.lblColor, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>
              {m.lbl}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: m.valColor, lineHeight: 1.2, wordBreak: 'break-word', hyphens: 'none' }}>
              <EditableSpan
                value={m.value}
                field={m.field}
                label={m.label}
                isEditing={isEditing}
                onEdit={onEdit}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ══ COVERAGE SCHEDULE ════════════════════════════════════ */}
      <div style={{ padding: '16px 28px 14px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <SectionHeading title="Coverage Schedule" />
        {coverageItems.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F1F5F9' }}>
                <th style={{ padding: '7px 12px', textAlign: 'left',  fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #E2E8F0' }}>
                  Coverage / Benefit
                </th>
                <th style={{ padding: '7px 12px', textAlign: 'right', fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #E2E8F0', width: '35%' }}>
                  Limit / Amount
                </th>
                <th style={{ padding: '7px 12px', textAlign: 'left',  fontSize: '9px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px', borderBottom: '1px solid #E2E8F0', width: '30%' }}>
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody>
              {coverageItems.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#FAFBFC' }}>
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: TEXT, borderBottom: '1px solid #F1F5F9' }}>
                    <EditableSpan
                      value={item.name}
                      field={`coverageItems.${i}.name`}
                      label={`Coverage item ${i + 1} name`}
                      isEditing={isEditing}
                      onEdit={onEdit}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 800, color: GREEN, textAlign: 'right', borderBottom: '1px solid #F1F5F9', fontVariantNumeric: 'tabular-nums' }}>
                    <EditableSpan
                      value={item.limit}
                      field={`coverageItems.${i}.limit`}
                      label={`Coverage item ${i + 1} limit`}
                      isEditing={isEditing}
                      onEdit={onEdit}
                    />
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '11px', color: '#64748B', borderBottom: '1px solid #F1F5F9' }}>
                    <EditableSpan
                      value={item.note || '—'}
                      field={`coverageItems.${i}.note`}
                      label={`Coverage item ${i + 1} note`}
                      isEditing={isEditing}
                      onEdit={onEdit}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>No coverage details extracted.</p>
        )}
      </div>

      {/* ══ KEY BENEFITS + EXCLUSIONS ════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flexGrow: 1, borderBottom: '1px solid #E2E8F0' }}>

        {/* Benefits */}
        <div style={{ padding: '16px 28px', borderRight: '1px solid #E2E8F0' }}>
          <SectionHeading title="Key Benefits" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {benefits.length > 0 ? benefits.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span aria-label="Covered" style={{ color: GREEN, fontWeight: 800, fontSize: '13px', lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                <EditableSpan
                  value={b}
                  field={`keyBenefits.${i}`}
                  label={`Key benefit ${i + 1}`}
                  isEditing={isEditing}
                  onEdit={onEdit}
                  style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}
                />
              </div>
            )) : <p style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>None extracted.</p>}
          </div>
        </div>

        {/* Exclusions */}
        <div style={{ padding: '16px 28px', background: '#FFFBFB' }}>
          <SectionHeading title="Exclusions / Not Covered" color="#B91C1C" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {exclusions.length > 0 ? exclusions.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span aria-label="Not covered" style={{ color: '#DC2626', fontWeight: 800, fontSize: '13px', lineHeight: 1.5, flexShrink: 0 }}>✕</span>
                <EditableSpan
                  value={e}
                  field={`exclusions.${i}`}
                  label={`Exclusion ${i + 1}`}
                  isEditing={isEditing}
                  onEdit={onEdit}
                  style={{ fontSize: '12px', color: '#334155', lineHeight: 1.6 }}
                />
              </div>
            )) : <p style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic' }}>None extracted.</p>}
          </div>
        </div>
      </div>

      {/* ══ CLAIMS INFO ══════════════════════════════════════════ */}
      <div style={{
        padding:             '13px 28px',
        background:          '#F8FAFC',
        borderBottom:        '1px solid #E2E8F0',
        display:             'grid',
        gridTemplateColumns: '1fr 1.5fr 0.9fr',
        gap:                 '16px',
        flexShrink:          0,
      }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
            Claims Hotline
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: TEXT, wordBreak: 'break-all' }}>
            <EditableSpan
              value={val(data.claimsContact, 'Contact insurer')}
              field="claimsContact"
              label="Claims contact"
              isEditing={isEditing}
              onEdit={onEdit}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
            Waiting Period
          </div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: TEXT, lineHeight: 1.5 }}>
            <EditableSpan
              value={val(data.waitingPeriod, 'Refer to policy')}
              field="waitingPeriod"
              label="Waiting period"
              isEditing={isEditing}
              onEdit={onEdit}
            />
          </div>
        </div>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '5px' }}>
            How to Claim
          </div>
          <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7, fontWeight: 500, display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <EditableSpan value={claimStep1} field="claimStep1" label="Claim step 1" isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7, fontWeight: 500 }} />
            <EditableSpan value={claimStep2} field="claimStep2" label="Claim step 2" isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7, fontWeight: 500 }} />
            <EditableSpan value={claimStep3} field="claimStep3" label="Claim step 3" isEditing={isEditing} onEdit={onEdit} style={{ fontSize: '11px', color: '#475569', lineHeight: 1.7, fontWeight: 500 }} />
          </div>
        </div>
      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <div style={{
        background:     BLACK,
        borderTop:      `3px solid ${GREEN}`,
        padding:        '12px 28px',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        gap:            '24px',
        flexShrink:     0,
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, minWidth: 0 }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>For reference only.</span>
          {' '}This document is a simplified summary and does not constitute the full insurance contract.{' '}
          Refer to the original policy document and certificate for complete terms, conditions, and exclusions.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', flexShrink: 0, minWidth: 'max-content' }}>
          <Image
            src="/onyxx-banner-black.png"
            alt="Onyxx Tech"
            width={120}
            height={30}
            style={{ objectFit: 'contain', objectPosition: 'right center', height: '30px', width: 'auto' }}
          />
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap' }}>
            Prepared by:{' '}
            <span style={{ color: '#ffffff', fontWeight: 600 }}>{agentName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
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
