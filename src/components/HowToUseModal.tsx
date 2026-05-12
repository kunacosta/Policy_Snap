'use client';

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    n: '1',
    title: 'Enter your name and copy the prompt',
    body: 'Type your name as the agent — it appears on the poster. Then click Copy Prompt to copy the extraction instructions.',
  },
  {
    n: '2',
    title: 'Open NotebookLM and upload your PDF',
    body: 'Go to notebooklm.google.com → sign in with Google → New Notebook → upload the insurance PDF. Then paste the copied prompt into the chat and press Enter. Wait for the full JSON response to appear.',
  },
  {
    n: '3',
    title: 'Paste the response and generate',
    body: 'Copy the entire JSON response from NotebookLM — it starts with { and ends with }. Paste it into the box on this page, then click Generate Poster.',
  },
];

export default function HowToUseModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to use PolicySnap"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:        'fixed',
        inset:           0,
        background:      'rgba(0,0,0,0.75)',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        zIndex:          200,
        padding:         '16px',
      }}
    >
      <div style={{
        background:   '#161616',
        border:       '1px solid #2a2a2a',
        borderRadius: '12px',
        width:        '100%',
        maxWidth:     '520px',
        overflow:     'hidden',
        boxShadow:    '0 24px 64px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '18px 20px 14px',
          borderBottom:   '1px solid #2a2a2a',
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>How to use PolicySnap</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>3 steps — takes about 2 minutes</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close guide"
            style={{ background: 'transparent', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Steps */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {steps.map(s => (
            <div key={s.n} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width:          '28px',
                height:         '28px',
                borderRadius:   '50%',
                background:     '#1D9E75',
                color:          '#000000',
                fontSize:       '13px',
                fontWeight:     800,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                flexShrink:     0,
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.6 }}>{s.body}</div>
              </div>
            </div>
          ))}

          {/* Tip */}
          <div style={{
            background:   '#111',
            border:       '1px solid #2a2a2a',
            borderRadius: '8px',
            padding:      '10px 14px',
            fontSize:     '12px',
            color:        '#64748B',
            lineHeight:   1.6,
          }}>
            <span style={{ color: '#1D9E75', fontWeight: 700 }}>Tip: </span>
            If NotebookLM cuts off the response, scroll down and ask it to &quot;continue the JSON from where you left off&quot;, then combine both parts before pasting.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 20px 20px' }}>
          <button
            onClick={onClose}
            style={{
              width:        '100%',
              padding:      '11px',
              borderRadius: '8px',
              background:   '#1D9E75',
              color:        '#000000',
              fontSize:     '13px',
              fontWeight:   700,
              border:       'none',
              cursor:       'pointer',
            }}
          >
            Got it, let&apos;s go
          </button>
        </div>

      </div>
    </div>
  );
}
