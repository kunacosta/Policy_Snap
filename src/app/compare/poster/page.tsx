'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ComparisonData, PolicyData, CoverageItem } from '@/types/policy';
import ComparisonDocument from '@/components/ComparisonDocument';
import ComparisonVerdict from '@/components/ComparisonVerdict';

const LANDSCAPE_WIDTH_PX  = 1123; // 297mm at 96 dpi (landscape A4)
const LANDSCAPE_HEIGHT_PX = 794;  // 210mm at 96 dpi (landscape A4)

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

export default function ComparisonPosterPage() {
  const router = useRouter();
  const [data, setData] = useState<ComparisonData | null>(null);
  const [agentName, setAgentName] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ComparisonData | null>(null);
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [viewMode, setViewMode] = useState<'detail' | 'verdict'>('detail');
  const [zoom, setZoom] = useState(1);
  const [docSize, setDocSize] = useState({ w: LANDSCAPE_WIDTH_PX, h: LANDSCAPE_HEIGHT_PX });
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const documentRef       = useRef<HTMLDivElement>(null);
  const scaleRef          = useRef<HTMLDivElement>(null);
  const touchContainerRef = useRef<HTMLDivElement>(null);
  const zoomRef           = useRef(zoom);
  const fitZoomRef        = useRef(1);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }, []);

  /* ── Detect Capacitor ──────────────────────────────────────────── */
  useEffect(() => {
    type WinWithCap = Window & { Capacitor?: { isNativePlatform?: () => boolean } };
    const cap = (window as WinWithCap).Capacitor;
    setIsNativeApp(cap?.isNativePlatform?.() ?? false);
  }, []);

  /* ── Initial fit to screen width ───────────────────────────────── */
  useEffect(() => {
    const fitZoom = (window.innerWidth - 32) / LANDSCAPE_WIDTH_PX;
    fitZoomRef.current = fitZoom;
    setZoom(fitZoom);
    zoomRef.current = fitZoom;
  }, []);

  /* ── Keep zoom ref in sync ─────────────────────────────────────── */
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  /* ── Track natural document size so scrollbars match ───────────── */
  useEffect(() => {
    const el = documentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) {
        setDocSize({ w: rect.width, h: rect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  /* ── Load data from sessionStorage ────────────────────────────────── */
  useEffect(() => {
    const raw  = sessionStorage.getItem('comparisonData') || localStorage.getItem('comparisonDataDraft');
    const name = sessionStorage.getItem('agentName') || localStorage.getItem('agentName') || '';
    if (!raw) { router.replace('/compare'); return; }
    try {
      const parsed: ComparisonData = JSON.parse(raw);
      setData(parsed);
      setEditData(JSON.parse(JSON.stringify(parsed)));
      setAgentName(name);
    } catch {
      router.replace('/compare');
    }
  }, [router]);

  /* ── Pinch zoom + Ctrl-wheel zoom (no drag-to-pan; native scroll handles that) ── */
  useEffect(() => {
    const el = touchContainerRef.current;
    if (!el) return;

    const pointers = new Map<number, { x: number; y: number }>();
    const pinch = { startDist: 0, startZoom: 0 };
    const clamp = (z: number) => Math.min(5, Math.max(fitZoomRef.current, z));

    const ptDist = () => {
      const pts = Array.from(pointers.values());
      const dx = pts[0].x - pts[1].x;
      const dy = pts[0].y - pts[1].y;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onPointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        pinch.startDist = ptDist();
        pinch.startZoom = zoomRef.current;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinch.startDist > 0) {
        e.preventDefault();
        const newZoom = clamp(pinch.startZoom * ptDist() / pinch.startDist);
        zoomRef.current = newZoom;
        setZoom(newZoom);
      }
    };

    const onPointerEnd = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch.startDist = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      const newZoom = clamp(zoomRef.current * (1 - e.deltaY * 0.005));
      zoomRef.current = newZoom;
      setZoom(newZoom);
    };

    el.addEventListener('pointerdown',   onPointerDown);
    el.addEventListener('pointermove',   onPointerMove);
    el.addEventListener('pointerup',     onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);
    el.addEventListener('wheel',         onWheel, { passive: false });

    return () => {
      el.removeEventListener('pointerdown',   onPointerDown);
      el.removeEventListener('pointermove',   onPointerMove);
      el.removeEventListener('pointerup',     onPointerEnd);
      el.removeEventListener('pointercancel', onPointerEnd);
      el.removeEventListener('wheel',         onWheel);
    };
  }, [data]);

  /* ── Zoom button helpers ───────────────────────────────────────── */
  const applyZoom = (newZoom: number) => {
    newZoom = Math.min(5, Math.max(fitZoomRef.current, newZoom));
    zoomRef.current = newZoom;
    setZoom(newZoom);
  };

  const zoomIn    = () => applyZoom(Math.round((zoomRef.current + 0.25) * 100) / 100);
  const zoomOut   = () => applyZoom(Math.round((zoomRef.current - 0.25) * 100) / 100);
  const zoomReset = () => {
    const fitZoom = (window.innerWidth - 32) / LANDSCAPE_WIDTH_PX;
    fitZoomRef.current = fitZoom;
    zoomRef.current    = fitZoom;
    setZoom(fitZoom);
  };

  /* ── Field editing ─────────────────────────────────────────────────── */
  const handleEdit = (field: string, value: string) => {
    setEditData(prev => {
      if (!prev) return prev;

      const firstDot = field.indexOf('.');
      if (firstDot === -1) return prev;
      const side = field.slice(0, firstDot) as 'policyA' | 'policyB';
      const subField = field.slice(firstDot + 1);
      if (side !== 'policyA' && side !== 'policyB') return prev;

      const sideData = prev[side];
      const parts = subField.split('.');
      let updatedSide: PolicyData;

      if (parts[0] === 'coverageItems' && parts.length === 3) {
        const idx = parseInt(parts[1], 10);
        const sub = parts[2] as keyof CoverageItem;
        if (isNaN(idx) || sideData.coverageItems[idx] === undefined) return prev;
        const newItems = sideData.coverageItems.map((item, i) =>
          i === idx ? { ...item, [sub]: value } : item
        );
        updatedSide = { ...sideData, coverageItems: newItems };
      } else if (parts[0] === 'keyBenefits' && parts.length === 2) {
        const idx = parseInt(parts[1], 10);
        if (isNaN(idx) || sideData.keyBenefits[idx] === undefined) return prev;
        updatedSide = { ...sideData, keyBenefits: sideData.keyBenefits.map((b, i) => i === idx ? value : b) };
      } else if (parts[0] === 'exclusions' && parts.length === 2) {
        const idx = parseInt(parts[1], 10);
        if (isNaN(idx) || sideData.exclusions[idx] === undefined) return prev;
        updatedSide = { ...sideData, exclusions: sideData.exclusions.map((e, i) => i === idx ? value : e) };
      } else {
        updatedSide = { ...sideData, [subField]: value || null };
      }

      const next: ComparisonData = { ...prev, [side]: updatedSide };
      try { localStorage.setItem('comparisonDataDraft', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  /* ── Capture document as canvas ────────────────────────────────────── */
  const captureCanvas = async () => {
    if (!documentRef.current) throw new Error('Document not ready');

    const restoreFns: Array<() => void> = [];

    const editableEls = documentRef.current.querySelectorAll<HTMLElement>('[contenteditable]');
    editableEls.forEach(el => {
      const prev = {
        borderBottom: el.style.borderBottom,
        cursor:       el.style.cursor,
        display:      el.style.display,
        minWidth:     el.style.minWidth,
      };
      el.style.borderBottom = 'none';
      el.style.cursor       = '';
      el.style.display      = 'inline';
      el.style.minWidth     = '';
      restoreFns.push(() => {
        el.style.borderBottom = prev.borderBottom;
        el.style.cursor       = prev.cursor;
        el.style.display      = prev.display;
        el.style.minWidth     = prev.minWidth;
      });
    });

    if (scaleRef.current) {
      const sr = scaleRef.current;
      const prevTransform = sr.style.transform;
      const prevPosition  = sr.style.position;
      const prevTop       = sr.style.top;
      const prevLeft      = sr.style.left;
      sr.style.transform  = '';
      sr.style.position   = 'relative';
      sr.style.top        = '';
      sr.style.left       = '';
      restoreFns.push(() => {
        sr.style.transform = prevTransform;
        sr.style.position  = prevPosition;
        sr.style.top       = prevTop;
        sr.style.left      = prevLeft;
      });
    }

    await new Promise<void>(r => requestAnimationFrame(() => r()));

    // Wait for every <img> inside the document to finish decoding so the banner
    // (and any other inline image) is never captured as a blank box.
    const imgs = Array.from(documentRef.current.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      if (img.complete && img.naturalWidth > 0) return null;
      if (typeof img.decode === 'function') return img.decode().catch(() => {});
      return new Promise<void>(res => {
        img.addEventListener('load',  () => res(), { once: true });
        img.addEventListener('error', () => res(), { once: true });
      });
    }));

    try {
      const html2canvas = (await import('html2canvas')).default;
      return await html2canvas(documentRef.current, {
        scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false,
      });
    } finally {
      restoreFns.forEach(fn => fn());
    }
  };

  /* ── Print ────────────────────────────────────────────────────────── */
  const handlePrint = () => window.print();

  /* ── Native share helper ─────────────────────────────────────────── */
  const nativeShareFile = async (base64Data: string, fileName: string, dialogTitle: string) => {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
    await Share.share({ files: [written.uri], dialogTitle });
  };

  /* ── WhatsApp share ───────────────────────────────────────────────── */
  const handleShareWhatsApp = async () => {
    if (!editData) return;
    setSharing(true);
    try {
      const canvas = await captureCanvas();
      const nameA  = editData.policyA.insurerName || 'Policy A';
      const nameB  = editData.policyB.insurerName || 'Policy B';
      const fname  = sanitizeFilename(`PolicySnap_${viewMode === 'verdict' ? 'Verdict' : 'Compare'}_${nameA}_vs_${nameB}`);

      if (isNativeApp) {
        const b64 = canvas.toDataURL('image/png').split(',')[1];
        await nativeShareFile(b64, `${fname}.png`, 'Share Policy Comparison');
      } else {
        const blob = await new Promise<Blob>((res, rej) =>
          canvas.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
        const file = new File([blob], `${fname}.png`, { type: 'image/png' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Policy Comparison' });
        } else {
          const text = `*Policy Comparison*\nPolicy A: ${nameA} | Premium: ${editData.policyA.annualPremium || 'N/A'}\nPolicy B: ${nameB} | Premium: ${editData.policyB.annualPremium || 'N/A'}\n\n_Generated by PolicySnap by Onyxx Tech_`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
        }
      }
      showToast('Shared successfully');
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Could not share. Please try again.', false);
      }
    } finally {
      setSharing(false);
    }
  };

  /* ── Download PDF ────────────────────────────────────────────────── */
  const handleDownloadPDF = async () => {
    if (!editData) return;
    setDownloading(true);
    try {
      const canvas  = await captureCanvas();
      const nameA   = editData.policyA.insurerName || 'PolicyA';
      const nameB   = editData.policyB.insurerName || 'PolicyB';
      const fname   = sanitizeFilename(`PolicySnap_${viewMode === 'verdict' ? 'Verdict' : 'Compare'}_${nameA}_vs_${nameB}`);
      const imgData = canvas.toDataURL('image/png', 1.0);

      const jsPDF = (await import('jspdf')).default;
      const pdf   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW  = pdf.internal.pageSize.getWidth();
      const pdfH  = pdf.internal.pageSize.getHeight();
      const MARGIN = 5; // mm — safe area so home printers don't clip edges
      const availW = pdfW - MARGIN * 2;
      const availH = pdfH - MARGIN * 2;
      const ratio  = canvas.height / canvas.width;
      const imgH   = availW * ratio;

      if (imgH <= availH) {
        pdf.addImage(imgData, 'PNG', MARGIN, MARGIN, availW, imgH);
      } else {
        const scaledW = availH / ratio;
        pdf.addImage(imgData, 'PNG', (pdfW - scaledW) / 2, MARGIN, scaledW, availH);
      }

      if (isNativeApp) {
        const b64 = pdf.output('datauristring').split(',')[1];
        let savedToDownloads = false;
        try {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          await Filesystem.writeFile({ path: `Download/${fname}.pdf`, data: b64, directory: Directory.ExternalStorage, recursive: true });
          savedToDownloads = true;
          showToast(`Saved to Downloads: ${fname}.pdf`);
        } catch {}
        if (!savedToDownloads) await nativeShareFile(b64, `${fname}.pdf`, 'Save to Files to download');
      } else {
        pdf.save(`${fname}.pdf`);
        showToast('PDF downloaded successfully');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        showToast('Could not generate the PDF. Please try again.', false);
      }
    } finally {
      setDownloading(false);
    }
  };

  /* ── Loading state ────────────────────────────────────────────────── */
  if (!data || !editData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <svg className="w-8 h-8 animate-spin" style={{ color: 'var(--green)' }} fill="none" viewBox="0 0 24 24" aria-label="Loading">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading your comparison...</p>
        </div>
      </div>
    );
  }

  const btnBase = 'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 select-none';

  return (
    <div className="h-screen overflow-hidden flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Toast */}
      {toast && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          maxWidth: 'calc(100vw - 32px)',
          background: toast.ok ? '#1D9E75' : '#dc2626', color: '#ffffff',
          padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
          zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
          wordBreak: 'break-all', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Action bar */}
      <div className="no-print sticky top-0 z-50 border-b" style={{ background: '#111111', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between gap-2 px-3 py-2">

          {/* Left — back + brand */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <button
              onClick={() => router.push('/compare')}
              className="flex items-center gap-1 text-sm transition shrink-0"
              style={{ color: 'var(--muted)' }}
              aria-label="Back to compare input"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline text-xs">Back</span>
            </button>
            <span className="shrink-0" style={{ color: '#333' }}>|</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Image src="/onyxx-symbol.png" alt="Onyxx" width={18} height={18} className="object-contain" />
              <span className="font-bold text-sm" style={{ color: '#ffffff' }}>
                Policy<span style={{ color: 'var(--green)' }}>Snap</span>
              </span>
              <span className="hidden sm:inline text-xs font-medium" style={{ color: 'var(--green)' }}>
                Comparison
              </span>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Edit toggle (hidden in verdict view — values are derived) */}
            {viewMode === 'detail' && <button
              onClick={() => setIsEditing(p => !p)}
              className={btnBase}
              aria-pressed={isEditing}
              style={isEditing
                ? { background: '#1D9E75', color: '#000', border: '1px solid #1D9E75' }
                : { border: '1px solid var(--border)', color: '#e5e5e5', background: 'transparent' }}
            >
              {isEditing ? (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Done</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l-4 4h4v-4zm6.232-7.768a2 2 0 012.828 2.828L9 16.01H5v-4L15.232 5.232z" />
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </>
              )}
            </button>}

            {/* Print */}
            <button
              onClick={handlePrint}
              className={`${btnBase} hidden sm:flex`}
              style={{ border: '1px solid var(--border)', color: '#e5e5e5', background: 'transparent' }}
              aria-label="Print poster"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>

            {/* WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              disabled={sharing}
              className={btnBase}
              style={{ background: '#25D366', color: '#fff' }}
              aria-label={sharing ? 'Sharing…' : 'Share via WhatsApp'}
            >
              {sharing ? (
                <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.18 0 5.767-2.586 5.767-5.767 0-3.178-2.584-5.77-5.763-5.77zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 1.856.001 3.598.723 4.907 2.034 1.31 1.311 2.031 3.054 2.03 4.908-.001 3.825-3.113 6.938-6.937 6.938z" />
                </svg>
              )}
              <span className="hidden sm:inline">{sharing ? 'Sharing…' : 'Share'}</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={btnBase}
              style={{ background: 'var(--green)', color: '#000' }}
              aria-label={downloading ? 'Saving PDF…' : isNativeApp ? 'Save PDF' : 'Download PDF'}
            >
              {downloading ? (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span className="hidden sm:inline">Saving…</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">{isNativeApp ? 'Save' : 'Download PDF'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* View toggle + zoom controls */}
      <div className="no-print flex justify-between items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
        {/* View toggle */}
        <div style={{ display: 'inline-flex', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={() => { setViewMode('detail'); zoomReset(); }}
            aria-pressed={viewMode === 'detail'}
            type="button"
            style={{
              padding: '0 10px', height: 28, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
              background: viewMode === 'detail' ? 'var(--green)' : 'transparent',
              color:      viewMode === 'detail' ? '#000' : '#e5e5e5',
              border:     'none', cursor: 'pointer',
            }}
          >Detail</button>
          <button
            onClick={() => { setViewMode('verdict'); setIsEditing(false); zoomReset(); }}
            aria-pressed={viewMode === 'verdict'}
            type="button"
            style={{
              padding: '0 10px', height: 28, fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
              background: viewMode === 'verdict' ? 'var(--green)' : 'transparent',
              color:      viewMode === 'verdict' ? '#000' : '#e5e5e5',
              border:     'none', borderLeft: '1px solid var(--border)', cursor: 'pointer',
            }}
          >Verdict</button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button onClick={zoomOut} disabled={zoom <= fitZoomRef.current} aria-label="Zoom out" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#e5e5e5', fontSize: 16, lineHeight: 1, cursor: zoom <= fitZoomRef.current ? 'not-allowed' : 'pointer', opacity: zoom <= fitZoomRef.current ? 0.4 : 1 }}>−</button>
          <button onClick={zoomReset} aria-label="Reset zoom" style={{ minWidth: 52, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#e5e5e5', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.02em' }}>{Math.round(zoom * 100)}%</button>
          <button onClick={zoomIn} disabled={zoom >= 5} aria-label="Zoom in" style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#e5e5e5', fontSize: 16, lineHeight: 1, cursor: zoom >= 5 ? 'not-allowed' : 'pointer', opacity: zoom >= 5 ? 0.4 : 1 }}>+</button>
        </div>
      </div>

      {/* Document viewport (native scroll + zoom) */}
      <div
        ref={touchContainerRef}
        className="no-print"
        style={{
          position:    'relative',
          overflow:    'auto',
          flex:        1,
          touchAction: 'pan-x pan-y',
          userSelect:  isEditing ? 'text' : 'none',
          WebkitUserSelect: isEditing ? 'text' : 'none',
        }}
      >
        <div
          style={{
            width:    docSize.w * zoom,
            height:   docSize.h * zoom,
            margin:   '16px auto',
            position: 'relative',
          }}
        >
          <div
            ref={scaleRef}
            style={{
              position:        'absolute',
              top:             0,
              left:            0,
              transformOrigin: 'top left',
              transform:       `scale(${zoom})`,
            }}
          >
            <div ref={documentRef}>
              {viewMode === 'detail' ? (
                <ComparisonDocument
                  data={editData}
                  agentName={agentName}
                  isEditing={isEditing}
                  onEdit={handleEdit}
                />
              ) : (
                <ComparisonVerdict data={editData} agentName={agentName} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print-only render */}
      <div className="hidden print:block">
        {viewMode === 'detail' ? (
          <ComparisonDocument data={editData} agentName={agentName} />
        ) : (
          <ComparisonVerdict data={editData} agentName={agentName} />
        )}
      </div>

    </div>
  );
}
