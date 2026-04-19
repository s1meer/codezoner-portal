'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth';

const API = process.env.NEXT_PUBLIC_API || 'https://codezoner.in';

interface ProfileForm {
  phone: string;
  linkedin: string;
  city: string;
  college: string;
  bio: string;
  profileImage: string;
}

export default function ProfilePage() {
  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState<ProfileForm>({
    phone: '', linkedin: '', city: '', college: '',
    bio: '', profileImage: '',
  });
  const [mouFile, setMouFile] = useState<File | null>(null);
  const [mouNote, setMouNote] = useState('');
  const [mouCollege, setMouCollege] = useState('');
  const [saving, setSaving] = useState(false);
  const [mouSaving, setMouSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mouSent, setMouSent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/'); return; }
    setSession(s);
    fetch(`${API}/api/partner/profile`, {
      headers: { Authorization: `Bearer ${s.token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.name) setForm(f => ({ ...f, phone: d.phone || '', linkedin: d.linkedin || '', city: d.city || '', college: d.college || '', bio: d.bio || '', profileImage: d.profileImage || '' })); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    const s = getSession();
    await fetch(`${API}/api/partner/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.token}` },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const submitMOU = async () => {
    if (!mouCollege.trim()) { alert('Enter college name'); return; }
    setMouSaving(true);
    const s = getSession();
    let pdfUrl = '';

    if (mouFile) {
      const fd = new FormData();
      fd.append('file', mouFile);
      const r = await fetch(`${API}/api/partner/upload-mou`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${s?.token}` },
        body: fd,
      });
      const d = await r.json();
      pdfUrl = d.url || '';
    }

    const r2 = await fetch(`${API}/api/partner/mou-apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s?.token}` },
      body: JSON.stringify({ mouCollege, mouNote, pdfUrl }),
    });
    const d2 = await r2.json();
    if (!d2.success) { alert(d2.error || 'Submission failed'); setMouSaving(false); return; }

    setMouSent(true);
    setMouSaving(false);
  };

  const partner = session?.partner || {};
  const isExec = partner.role?.toLowerCase() === 'executive';

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4FF', fontFamily: 'system-ui,sans-serif' }}>
      {/* Navbar */}
      <div style={{
        background: '#0F2D5A', padding: '0 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 60
      }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{
            width: 36, height: 36, background: '#1D4ED8', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#fff', fontSize: 14
          }}>CZ</div>
          <a href="/dashboard" style={{ color: '#93C5FD', fontSize: 13, textDecoration: 'none' }}>
            ← Dashboard
          </a>
        </div>
        <button
          onClick={() => { clearSession(); router.push('/'); }}
          style={{
            background: 'rgba(255,255,255,0.1)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
            padding: '7px 16px', fontSize: 12, cursor: 'pointer'
          }}
        >
          Sign out
        </button>
      </div>

      <div style={{ maxWidth: 700, margin: '32px auto', padding: '0 20px' }}>

        {/* Profile card */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: 28,
          border: '1px solid #E2E8F0', marginBottom: 20
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20
          }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0F172A' }}>
              My Profile
            </h1>
            <span style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 700,
              background: isExec ? '#EDE9FE' : '#EFF6FF',
              color: isExec ? '#7C3AED' : '#1D4ED8'
            }}>
              {isExec ? 'Business Executive' : 'Campus Ambassador'}
            </span>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 99, overflow: 'hidden',
              background: '#EFF6FF', border: '2px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              {form.profileImage
                ? <img src={form.profileImage} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 28, color: '#1D4ED8', fontWeight: 700 }}>
                    {(partner.name || 'P')[0].toUpperCase()}
                  </span>
              }
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{partner.name}</div>
              <div style={{ fontSize: 12, color: '#64748B' }}>{partner.email}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                ID: {partner.portalId}
              </div>
            </div>
          </div>

          {/* Profile image URL */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Profile Photo URL
            </label>
            <input
              value={form.profileImage}
              onChange={e => setForm(f => ({ ...f, profileImage: e.target.value }))}
              placeholder="https://... (paste image URL or LinkedIn photo URL)"
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0',
                borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            {([
              ['phone', 'Phone Number', '+91 98765 43210'],
              ['linkedin', 'LinkedIn Profile URL', 'linkedin.com/in/yourname'],
              ['city', 'City', 'Mumbai'],
              ['college', 'College / University', 'Mumbai University'],
            ] as [keyof ProfileForm, string, string][]).map(([field, label, ph]) => (
              <div key={field}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                  {label}
                </label>
                <input
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={ph}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0',
                    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
              Short Bio
            </label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell us about yourself — your college, year, why you joined CodeZoner..."
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0',
                borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            style={{
              background: saved ? '#15803D' : '#1D4ED8', color: '#fff',
              border: 'none', borderRadius: 8, padding: '11px 28px', fontSize: 13,
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', transition: 'background 0.2s'
            }}
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

        {/* Apply for Business Executive */}
        {!isExec && (
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            border: '1px solid #DDD6FE'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>🏛️</span>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#6D28D9' }}>
                Apply to Become a Business Executive
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px' }}>
              Have a college tie-up? Upload the signed MOU and we will review and upgrade
              your account to Business Executive within 24 hours.
            </p>

            {mouSent ? (
              <div style={{
                background: '#D1FAE5', border: '1px solid #6EE7B7',
                borderRadius: 10, padding: 16, textAlign: 'center'
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                <div style={{ fontWeight: 700, color: '#065F46' }}>Application submitted!</div>
                <div style={{ fontSize: 12, color: '#065F46', marginTop: 4 }}>
                  CodeZoner admin will review and upgrade your account within 24 hours.
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    College / University Name *
                  </label>
                  <input
                    value={mouCollege}
                    onChange={e => setMouCollege(e.target.value)}
                    placeholder="e.g. Swami Vivekanand University, Bhopal"
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #DDD6FE',
                      borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Upload Signed MOU (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setMouFile(e.target.files?.[0] || null)}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #DDD6FE',
                      borderRadius: 8, fontSize: 13, background: '#F5F3FF',
                      boxSizing: 'border-box'
                    }}
                  />
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '4px 0 0' }}>
                    PDF, JPG or PNG. Max 5MB. Scan or photo of signed document is fine.
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    value={mouNote}
                    onChange={e => setMouNote(e.target.value)}
                    placeholder="Any details about the tie-up — contact person, number of students, etc."
                    rows={2}
                    style={{
                      width: '100%', padding: '10px 12px', border: '1.5px solid #DDD6FE',
                      borderRadius: 8, fontSize: 13, outline: 'none', resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  onClick={submitMOU}
                  disabled={mouSaving}
                  style={{
                    background: '#7C3AED', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '11px 28px', fontSize: 13,
                    fontWeight: 700, cursor: mouSaving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {mouSaving ? 'Submitting...' : 'Submit MOU Application'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Executive badge */}
        {isExec && (
          <div style={{
            background: '#EDE9FE', borderRadius: 16, padding: 24,
            border: '1px solid #C4B5FD', textAlign: 'center'
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6D28D9' }}>Business Executive</div>
            <div style={{ fontSize: 13, color: '#7C3AED', marginTop: 4 }}>
              {partner.college || 'College tie-up active'}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 8 }}>
              Students from your college are automatically tracked under your account.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
