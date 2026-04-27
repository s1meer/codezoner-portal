'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/auth';
import { apiCollegeStats } from '@/lib/api';
import Navbar from '@/components/navbar';

const S = {
  page: { minHeight: '100vh', background: '#050508', color: '#F0F0FF', fontFamily: 'system-ui,-apple-system,sans-serif' } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)', transition: 'border-color 0.2s' } as React.CSSProperties,
};

export default function CollegeDashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    if (session.partner.role !== 'college') { router.push('/dashboard'); return; }
    setPartner(session.partner);
    apiCollegeStats(getToken()).then(setStats);
  }, []);

  function copyReferralLink() {
    if (!partner) return;
    navigator.clipboard.writeText(`https://codezoner.in/register?ref=${partner.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!partner) return null;

  const cards = [
    { icon: '👥', title: 'Students', value: stats?.total ?? '—', sub: 'Total enrolled', href: '/students', color: '#4F8EF7', glow: 'rgba(79,142,247,0.2)' },
    { icon: '📈', title: 'Analytics', value: stats ? `${stats.completionRate || 0}%` : '—', sub: 'Completion rate', href: '/analytics', color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)' },
    { icon: '📜', title: 'Certificates', value: stats?.certificates ?? '—', sub: 'Issued so far', href: '/students?status=CertificateIssued', color: '#06B6D4', glow: 'rgba(6,182,212,0.2)' },
    { icon: '⚡', title: 'Active Now', value: stats?.active ?? '—', sub: 'In progress', href: '/students?status=Active', color: '#F97316', glow: 'rgba(249,115,22,0.2)' },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar partnerName={partner.name} role={partner.role} portalId={partner.portalId} activePage="dashboard" />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: 36, animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,255,0.4)', marginBottom: 6 }}>
            College Analytics Portal
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #F0F0FF, rgba(240,240,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {partner.college || partner.name}
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginTop: 4 }}>
            Portal ID: {partner.portalId}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginBottom: 32 }}>
          {cards.map((card, i) => (
            <a key={i} href={card.href} style={{ textDecoration: 'none' }}>
              <div
                style={{ ...S.card, padding: 28, cursor: 'pointer', boxShadow: `0 0 40px rgba(0,0,0,0)`, animation: `fadeIn 0.4s ease ${i * 0.07}s both`, position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 40px ${card.glow}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 40px rgba(0,0,0,0)';
                }}
              >
                <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle,${card.glow} 0%,transparent 70%)` }} />
                <div style={{ fontSize: 28, marginBottom: 10 }}>{card.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0FF', marginTop: 8 }}>{card.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.5)', marginTop: 2 }}>{card.sub}</div>
                <div style={{ marginTop: 14, fontSize: 12, color: card.color, fontWeight: 600 }}>View details →</div>
              </div>
            </a>
          ))}
        </div>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <a href="/students" style={{ textDecoration: 'none' }}>
            <div style={{ ...S.card, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              <div style={{ fontSize: 24 }}>📋</div>
              <div>
                <div style={{ fontWeight: 700, color: '#F0F0FF', fontSize: 14 }}>Student List</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.5)', marginTop: 2 }}>Search, filter, export Excel/PDF</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(240,240,255,0.3)', fontSize: 18 }}>→</div>
            </div>
          </a>

          <a href="/analytics" style={{ textDecoration: 'none' }}>
            <div style={{ ...S.card, padding: '18px 24px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; }}>
              <div style={{ fontSize: 24 }}>📊</div>
              <div>
                <div style={{ fontWeight: 700, color: '#F0F0FF', fontSize: 14 }}>Analytics</div>
                <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.5)', marginTop: 2 }}>Charts, trends, domain split</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'rgba(240,240,255,0.3)', fontSize: 18 }}>→</div>
            </div>
          </a>
        </div>

        {/* Referral card */}
        <div style={{ ...S.card, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,255,0.4)', marginBottom: 6 }}>
              College Referral Link
            </div>
            <div style={{ fontSize: 13, color: '#4F8EF7', fontFamily: 'monospace' }}>
              {`https://codezoner.in/register?ref=${partner.referralCode}`}
            </div>
          </div>
          <button
            onClick={copyReferralLink}
            style={{ background: copied ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px', fontWeight: 700, cursor: 'pointer', fontSize: 13, transition: 'all 0.2s' }}
          >
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
