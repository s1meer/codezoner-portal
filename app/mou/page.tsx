'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/auth';
import { apiGetMOUs, apiSendMOU } from '@/lib/api';
import Navbar from '@/components/navbar';

const API = process.env.NEXT_PUBLIC_API || 'https://codezoner.in';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:  { bg: '#F1F5F9', color: '#475569' },
  sent:   { bg: '#DBEAFE', color: '#1E40AF' },
  signed: { bg: '#D1FAE5', color: '#065F46' },
  active: { bg: '#D1FAE5', color: '#065F46' },
};

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });

interface MOU {
  id: string;
  collegeName: string;
  mouNumber: string | null;
  coordinatorEmail: string | null;
  sentAt: string;
  studentTarget: string | null;
  status: string;
  pdfUrl: string | null;
}

interface FormState {
  collegeName: string;
  coordinatorName: string;
  coordinatorEmail: string;
  coordinatorPhone: string;
  city: string;
  state: string;
  studentTarget: string;
  validityMonths: string;
  notes: string;
}

interface Partner {
  name: string;
  portalId: string;
  role: string;
  referralCode: string;
  email?: string;
}

export default function MOUPage() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [mous, setMous] = useState<MOU[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ mouRef: string; sentTo: string; provider: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    collegeName: '', coordinatorName: '', coordinatorEmail: '',
    coordinatorPhone: '', city: '', state: '',
    studentTarget: '', validityMonths: '12', notes: '',
  });
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/'); return; }
    if (s.partner?.role !== 'executive') { router.push('/dashboard'); return; }
    setPartner(s.partner);
    apiGetMOUs(getToken()).then(d => {
      setMous(d.mous || []);
      setLoading(false);
    });
  }, []);

  const send = async () => {
    if (!form.collegeName.trim()) { alert('College name is required'); return; }
    if (!form.coordinatorEmail.trim()) { alert('Coordinator email is required'); return; }
    setSending(true);
    const result = await apiSendMOU(getToken(), form);
    setSending(false);
    if (result.success) {
      setSent({ mouRef: result.mouRef, sentTo: result.sentTo, provider: result.provider });
      setForm({ collegeName: '', coordinatorName: '', coordinatorEmail: '', coordinatorPhone: '', city: '', state: '', studentTarget: '', validityMonths: '12', notes: '' });
      setShowForm(false);
      apiGetMOUs(getToken()).then(d => setMous(d.mous || []));
    } else {
      alert('Failed: ' + (result.error || 'Unknown error'));
    }
  };

  const previewMOU = async () => {
    if (!form.collegeName.trim()) { alert('Enter college name first'); return; }
    const res = await fetch(`${API}/api/admin/mou/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        collegeName:      form.collegeName,
        coordinatorName:  form.coordinatorName,
        coordinatorEmail: form.coordinatorEmail,
        city:             form.city,
        state:            form.state,
        validityMonths:   form.validityMonths,
        studentTarget:    form.studentTarget,
        executiveName:    partner?.name || '',
        executiveEmail:   partner?.email || '',
      }),
    });
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
  };

  const field = (key: keyof FormState, label: string, type = 'text', opts?: { full?: boolean }) => (
    <div style={{ gridColumn: opts?.full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0',
          borderRadius: 9, fontSize: 13, outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );

  if (!partner) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FB', fontFamily: 'system-ui,sans-serif' }}>
      <Navbar partnerName={partner.name} role={partner.role} portalId={partner.portalId} activePage="mou" />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#0F172A' }}>College MOUs</h1>
            <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
              Send and track Memorandum of Understanding with colleges
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setSent(null); }}
            style={{
              background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10,
              padding: '11px 22px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            }}>
            {showForm ? 'Cancel' : '+ Send New MOU'}
          </button>
        </div>

        {/* Success banner */}
        {sent && (
          <div style={{
            background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12,
            padding: '16px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 28 }}>✅</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#15803D' }}>MOU sent successfully!</div>
              <div style={{ fontSize: 13, color: '#16A34A', marginTop: 4 }}>
                Sent to <strong>{sent.sentTo}</strong> via {sent.provider} ·{' '}
                Ref: <code style={{ background: '#D1FAE5', padding: '1px 6px', borderRadius: 4 }}>{sent.mouRef}</code>
              </div>
            </div>
            <button onClick={() => setSent(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#94A3B8' }}>✕</button>
          </div>
        )}

        {/* Send form */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            border: '1px solid #E2E8F0', marginBottom: 24,
            boxShadow: '0 2px 16px rgba(15,45,90,0.06)',
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: '#6D28D9' }}>
              🏛️ Send MOU to College
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              {field('collegeName', 'College / University Name *')}
              {field('coordinatorEmail', 'Coordinator Email *', 'email')}
              {field('coordinatorName', 'Coordinator Name')}
              {field('coordinatorPhone', 'Coordinator Phone', 'tel')}
              {field('city', 'City')}
              {field('state', 'State')}
              {field('studentTarget', 'Expected Students', 'number')}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Validity Period
                </label>
                <select
                  value={form.validityMonths}
                  onChange={e => setForm(f => ({ ...f, validityMonths: e.target.value }))}
                  style={{ width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0', borderRadius: 9, fontSize: 13, outline: 'none' }}>
                  <option value="6">6 Months</option>
                  <option value="12">1 Year</option>
                  <option value="24">2 Years</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  Notes (internal only)
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any notes about this college or coordinator..."
                  style={{
                    width: '100%', padding: '11px 13px', border: '1.5px solid #E2E8F0',
                    borderRadius: 9, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={previewMOU}
                style={{
                  padding: '11px 22px', border: '1.5px solid #7C3AED', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer', background: '#F5F3FF', color: '#7C3AED',
                }}>
                👁 Preview MOU
              </button>
              <button
                onClick={send}
                disabled={sending}
                style={{
                  background: '#7C3AED', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '11px 28px', fontSize: 13, fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                  opacity: sending ? 0.8 : 1,
                }}>
                {sending ? 'Sending...' : '📧 Send MOU to College'}
              </button>
            </div>

            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 10 }}>
              The MOU will be sent as an email to the coordinator with the full document.
              A copy is saved to your MOU history.
            </p>
          </div>
        )}

        {/* Preview modal */}
        {previewUrl && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 1000, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
          }}>
            <div style={{
              background: '#fff', borderRadius: 16, overflow: 'hidden',
              width: '100%', maxWidth: 860, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                padding: '14px 20px', borderBottom: '1px solid #E2E8F0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                  MOU Preview — {form.collegeName}
                </span>
                <button
                  onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                  style={{
                    background: '#FEE2E2', color: '#991B1B', border: 'none',
                    borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                  }}>
                  Close ✕
                </button>
              </div>
              <iframe src={previewUrl} style={{ flex: 1, border: 'none', minHeight: 600 }} title="MOU Preview" />
            </div>
          </div>
        )}

        {/* MOU history */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: '#0F172A' }}>
            MOU History ({mous.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>Loading...</div>
          ) : mous.length === 0 ? (
            <div style={{
              background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
              padding: 48, textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🏛️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 6 }}>No MOUs sent yet</div>
              <div style={{ fontSize: 13, color: '#94A3B8' }}>
                Click &quot;+ Send New MOU&quot; to send your first MOU to a college
              </div>
            </div>
          ) : mous.map(mou => {
            const st = STATUS_COLORS[mou.status] || STATUS_COLORS.draft;
            return (
              <div key={mou.id} style={{
                background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
                padding: '16px 20px', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
                    {mou.collegeName}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {mou.mouNumber && <span style={{ fontFamily: 'monospace' }}>{mou.mouNumber}</span>}
                    {mou.coordinatorEmail && <span>✉ {mou.coordinatorEmail}</span>}
                    {mou.sentAt && <span>Sent {fmt(mou.sentAt)}</span>}
                    {mou.studentTarget && <span>Target: {mou.studentTarget} students</span>}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 99,
                  fontWeight: 700, background: st.bg, color: st.color, flexShrink: 0,
                }}>
                  {mou.status || 'sent'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
