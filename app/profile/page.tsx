'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, saveSession } from '@/lib/auth';
import Navbar from '@/components/navbar';

const API = process.env.NEXT_PUBLIC_API || 'https://codezoner.in';

function StrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#10B981'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 99,
            background: i < score ? colors[score - 1] : '#E2E8F0',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: score > 0 ? colors[score - 1] : '#94A3B8', fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : 'Too short'}
      </span>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 20, padding: 28,
      border: '1px solid #E8ECF4',
      boxShadow: '0 2px 16px rgba(15,45,90,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '11px 14px', fontSize: 14,
          border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
          borderRadius: 10, outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
          background: '#FAFAFA',
          ...props.style,
        }}
      />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
          {label}
        </label>
      )}
      <textarea
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: '100%', padding: '11px 14px', fontSize: 14,
          border: `1.5px solid ${focused ? '#1D4ED8' : '#E2E8F0'}`,
          borderRadius: 10, outline: 'none', resize: 'vertical',
          boxSizing: 'border-box', lineHeight: 1.5,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(29,78,216,0.1)' : 'none',
          background: '#FAFAFA',
          ...props.style,
        }}
      />
    </div>
  );
}

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({
    phone: '', linkedin: '', city: '', college: '', bio: '', profileImage: '',
  });
  const [tab, setTab] = useState<'details' | 'password' | 'executive'>('details');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState('');
  const [imgPreview, setImgPreview] = useState('');
  const [pw, setPw] = useState({ old: '', new1: '', new2: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [mouCollege, setMouCollege] = useState('');
  const [mouNote, setMouNote] = useState('');
  const [mouFile, setMouFile] = useState<File | null>(null);
  const [mouSaving, setMouSaving] = useState(false);
  const [mouSent, setMouSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/'); return; }
    setSession(s);
    fetch(`${API}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${s.token}` },
    }).then(r => r.json()).then(d => {
      const src = d.profile || d;
      setForm(f => ({
        ...f,
        phone: src.phone || '',
        linkedin: src.linkedin || '',
        city: src.city || '',
        college: src.college || '',
        bio: src.bio || '',
        profileImage: src.profileImage || '',
      }));
      if (src.profileImage) setImgPreview(src.profileImage);
    }).catch(() => {});
  }, []);

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setImgError('');
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setImgError('Image must be under 1MB. Please compress it first.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImgError('Only JPG, PNG or WebP allowed.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      setImgPreview(result);
      setForm(f => ({ ...f, profileImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const s = getSession();
    if (!s) return;
    setSaving(true);
    await fetch(`${API}/api/partner/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
      body: JSON.stringify(form),
    });
    saveSession(s.token, { ...s.partner, ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const changePw = async () => {
    setPwMsg(null);
    if (!pw.old || !pw.new1 || !pw.new2) {
      setPwMsg({ text: 'Fill all password fields', ok: false }); return;
    }
    if (pw.new1 !== pw.new2) {
      setPwMsg({ text: 'New passwords do not match', ok: false }); return;
    }
    if (pw.new1.length < 8) {
      setPwMsg({ text: 'Password must be at least 8 characters', ok: false }); return;
    }
    const s = getSession();
    if (!s) return;
    setPwSaving(true);
    const res = await fetch(`${API}/api/partner/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
      body: JSON.stringify({ oldPassword: pw.old, newPassword: pw.new1 }),
    });
    const d = await res.json();
    if (d.success) {
      setPwMsg({ text: '✓ Password changed successfully!', ok: true });
      setPw({ old: '', new1: '', new2: '' });
    } else {
      setPwMsg({ text: d.error || 'Failed to change password', ok: false });
    }
    setPwSaving(false);
  };

  const submitMOU = async () => {
    if (!mouCollege.trim()) { alert('Please enter college name'); return; }
    setMouSaving(true);
    const s = getSession();
    if (!s) return;
    let pdfUrl = '';
    if (mouFile) {
      const fd = new FormData();
      fd.append('file', mouFile);
      const r = await fetch(`${API}/api/partner/upload-mou`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${s.token}` },
        body: fd,
      });
      const d = await r.json();
      pdfUrl = d.url || '';
    }
    const r2 = await fetch(`${API}/api/partner/mou-apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
      body: JSON.stringify({ mouCollege, mouNote, pdfUrl }),
    });
    const d2 = await r2.json();
    if (!d2.success) { alert(d2.error || 'Submission failed'); setMouSaving(false); return; }
    setMouSent(true);
    setMouSaving(false);
  };

  const partner = session?.partner || {};
  const isExec = partner.role?.toLowerCase() === 'executive';
  const initial = (partner.name || 'P')[0].toUpperCase();

  type TabId = 'details' | 'password' | 'executive';
  const TABS: { id: TabId; label: string; icon: string }[] = [
    { id: 'details', label: 'Personal Details', icon: '👤' },
    { id: 'password', label: 'Password', icon: '🔑' },
    ...(!isExec ? [{ id: 'executive' as TabId, label: 'Become Executive', icon: '🏛️' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#F4F6FB', fontFamily: 'system-ui,sans-serif' }}>
      <Navbar
        partnerName={partner.name || ''}
        role={partner.role || 'ambassador'}
        portalId={partner.portalId || ''}
        activePage="profile"
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>

        {/* Profile hero card */}
        <Card style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
          {/* Cover gradient */}
          <div style={{
            height: 90,
            background: isExec
              ? 'linear-gradient(135deg,#4C1D95,#7C3AED,#A78BFA)'
              : 'linear-gradient(135deg,#0F2D5A,#1D4ED8,#3B82F6)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 16,
              background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
              padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, color: '#fff',
            }}>
              {isExec ? '🏛️ Business Executive' : '⭐ Campus Ambassador'}
            </div>
          </div>

          <div style={{ padding: '0 28px 28px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', display: 'inline-block', marginTop: -36 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                  border: '4px solid #fff', cursor: 'pointer', position: 'relative',
                  background: isExec ? '#4C1D95' : '#0F2D5A',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                }}
              >
                {imgPreview ? (
                  <img src={imgPreview} alt="profile"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, fontWeight: 800,
                    color: isExec ? '#C4B5FD' : '#93C5FD',
                  }}>
                    {initial}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s', fontSize: 18,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0'; }}
                >
                  📷
                </div>
              </div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 24, height: 24, borderRadius: '50%',
                  background: '#1D4ED8', border: '2px solid #fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                ✏️
              </div>
            </div>

            <input ref={fileRef} type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImg} style={{ display: 'none' }} />

            {imgError && (
              <div style={{
                marginTop: 8, padding: '8px 12px', background: '#FEE2E2',
                border: '1px solid #FECACA', borderRadius: 8,
                fontSize: 12, color: '#DC2626',
              }}>
                {imgError}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                {partner.name}
              </div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                {partner.email}
              </div>
              <div style={{
                fontSize: 11, color: '#94A3B8', marginTop: 4,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>ID: {partner.portalId}</span>
                {form.city && <span>· {form.city}</span>}
                {form.college && <span>· {form.college}</span>}
              </div>
            </div>

            <p style={{ fontSize: 11, color: '#94A3B8', margin: '10px 0 0' }}>
              Click avatar to upload photo · JPG/PNG/WebP · Max 1MB
            </p>
          </div>
        </Card>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          background: '#fff', borderRadius: 14, padding: 6,
          border: '1px solid #E8ECF4',
          boxShadow: '0 2px 8px rgba(15,45,90,0.04)',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 16px', border: 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.id
                  ? (t.id === 'executive' ? '#7C3AED' : '#1D4ED8')
                  : 'transparent',
                color: tab === t.id ? '#fff' : '#64748B',
                boxShadow: tab === t.id ? '0 4px 12px rgba(29,78,216,0.3)' : 'none',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === 'details' && (
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#0F172A' }}>
              Personal Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Input label="Phone Number" type="tel"
                value={form.phone} placeholder="+91 98765 43210"
                onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} />
              <Input label="LinkedIn Profile URL" type="url"
                value={form.linkedin} placeholder="linkedin.com/in/yourname"
                onChange={(e) => setForm(f => ({ ...f, linkedin: e.target.value }))} />
              <Input label="City" type="text"
                value={form.city} placeholder="Mumbai"
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))} />
              <Input label="College / University" type="text"
                value={form.college} placeholder="Mumbai University"
                onChange={(e) => setForm(f => ({ ...f, college: e.target.value }))} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <Textarea label="Short Bio" rows={4}
                value={form.bio}
                placeholder="Tell us about yourself — your college, year, why you joined CodeZoner..."
                onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>
            <button onClick={save} disabled={saving} style={{
              background: saved ? '#15803D' : '#1D4ED8',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '12px 28px', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(29,78,216,0.3)',
              opacity: saving ? 0.8 : 1,
            }}>
              {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Profile'}
            </button>
          </Card>
        )}

        {/* Password tab */}
        {tab === 'password' && (
          <Card>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', color: '#0F172A' }}>
              Change Password
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
              <Input label="Current Password" type="password"
                value={pw.old} placeholder="Your current password"
                onChange={(e) => { setPw(p => ({ ...p, old: e.target.value })); setPwMsg(null); }} />
              <div>
                <Input label="New Password" type="password"
                  value={pw.new1} placeholder="Min. 8 characters"
                  onChange={(e) => { setPw(p => ({ ...p, new1: e.target.value })); setPwMsg(null); }} />
                <StrengthMeter password={pw.new1} />
              </div>
              <Input label="Confirm New Password" type="password"
                value={pw.new2} placeholder="Repeat new password"
                onChange={(e) => { setPw(p => ({ ...p, new2: e.target.value })); setPwMsg(null); }} />
            </div>

            {pwMsg && (
              <div style={{
                marginTop: 14, padding: '10px 16px', borderRadius: 10, fontSize: 13,
                background: pwMsg.ok ? '#F0FDF4' : '#FEF2F2',
                border: `1px solid ${pwMsg.ok ? '#86EFAC' : '#FECACA'}`,
                color: pwMsg.ok ? '#15803D' : '#DC2626', fontWeight: 500,
              }}>
                {pwMsg.text}
              </div>
            )}

            <button onClick={changePw} disabled={pwSaving} style={{
              marginTop: 20, background: '#0F2D5A', color: '#fff', border: 'none',
              borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700,
              cursor: pwSaving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(15,45,90,0.3)',
              opacity: pwSaving ? 0.8 : 1,
            }}>
              {pwSaving ? 'Changing...' : 'Change Password'}
            </button>
          </Card>
        )}

        {/* Executive application tab */}
        {tab === 'executive' && !isExec && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{
                width: 48, height: 48, background: '#EDE9FE', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
              }}>🏛️</div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#6D28D9' }}>
                  Apply to Become a Business Executive
                </h2>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: '2px 0 0' }}>
                  College tie-up required · Reviewed within 24 hours
                </p>
              </div>
            </div>

            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 24px', lineHeight: 1.6 }}>
              Have a college partnership? Upload your signed MOU document and we will
              review and upgrade your account to Business Executive within 24 hours.
              You will then track students from your college automatically.
            </p>

            {mouSent ? (
              <div style={{
                background: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
                border: '1px solid #86EFAC', borderRadius: 16, padding: 32, textAlign: 'center',
              }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#15803D', marginBottom: 6 }}>
                  Application submitted!
                </div>
                <div style={{ fontSize: 13, color: '#16A34A' }}>
                  CodeZoner admin will review and upgrade your account within 24 hours.
                  You will receive a confirmation email.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <Input label="College / University Name *" type="text"
                  value={mouCollege}
                  placeholder="e.g. Swami Vivekanand University, Bhopal"
                  onChange={(e) => setMouCollege(e.target.value)} />

                <div>
                  <label style={{
                    fontSize: 12, fontWeight: 600, color: '#374151',
                    display: 'block', marginBottom: 6,
                  }}>
                    Upload Signed MOU Document
                  </label>
                  <div
                    onClick={() => document.getElementById('mouFile')?.click()}
                    style={{
                      border: '2px dashed #DDD6FE', borderRadius: 12, padding: '24px',
                      textAlign: 'center', cursor: 'pointer', background: '#FAFAFA',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#7C3AED';
                      (e.currentTarget as HTMLElement).style.background = '#F5F3FF';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#DDD6FE';
                      (e.currentTarget as HTMLElement).style.background = '#FAFAFA';
                    }}
                  >
                    {mouFile ? (
                      <div>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>
                          {mouFile.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                          {(mouFile.size / 1024).toFixed(0)} KB · Click to change
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#7C3AED' }}>
                          Click to upload MOU
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                          PDF, JPG, PNG · Max 5MB · Scan or photo is fine
                        </div>
                      </div>
                    )}
                  </div>
                  <input id="mouFile" type="file" accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setMouFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }} />
                </div>

                <Textarea label="Additional Notes (optional)" rows={3}
                  value={mouNote}
                  placeholder="Contact person, expected number of students, any context..."
                  onChange={(e) => setMouNote(e.target.value)} />

                <button onClick={submitMOU} disabled={mouSaving} style={{
                  background: 'linear-gradient(135deg,#6D28D9,#7C3AED)',
                  color: '#fff', border: 'none', borderRadius: 12,
                  padding: '14px', fontSize: 15, fontWeight: 700,
                  cursor: mouSaving ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                  opacity: mouSaving ? 0.8 : 1,
                  width: '100%',
                }}>
                  {mouSaving ? 'Submitting...' : '🏛️ Submit MOU Application'}
                </button>
              </div>
            )}
          </Card>
        )}

        {/* Executive status badge */}
        {isExec && (
          <Card style={{
            background: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
            border: '1px solid #C4B5FD',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>🏛️</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#6D28D9' }}>
                  Business Executive
                </div>
                <div style={{ fontSize: 13, color: '#7C3AED', marginTop: 2 }}>
                  {partner.college || 'College tie-up active'}
                </div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>
                  Students from your college are automatically tracked under your account.
                </div>
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}
