'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken, clearSession } from '@/lib/auth';
import { apiCollegeStats, apiCollegeStudents, apiCollegeExport } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = ['#4F8EF7', '#8B5CF6', '#06B6D4', '#22C55E', '#F97316', '#F43F5E'];

const S = {
  page: { minHeight: '100vh', background: '#050508', color: '#F0F0FF', fontFamily: 'system-ui,-apple-system,sans-serif' } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, backdropFilter: 'blur(20px)' } as React.CSSProperties,
  sectionTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(240,240,255,0.4)', marginBottom: 16 },
  btnPrimary: { background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 13 } as React.CSSProperties,
  btnGlass: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F0F0FF', borderRadius: 10, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 12 } as React.CSSProperties,
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
};

function kpiCardStyle(glow: string): React.CSSProperties {
  return {
    ...S.card,
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `0 0 40px ${glow}`,
  };
}

function badge(color: string, bg: string): React.CSSProperties {
  return { background: bg, color, fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 6, whiteSpace: 'nowrap' };
}

interface DarkTooltipProps { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string; }
function DarkTooltip({ active, payload, label }: DarkTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(240,240,255,0.6)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  enrolledAt: string;
  program: string;
  domain: string;
  duration: string;
  status: string;
  certificateIssued: boolean;
  paymentAmount: number;
}

interface Stats {
  total: number;
  enrolled: number;
  completed: number;
  certificates: number;
  active: number;
  dropped: number;
  completionRate: number;
  certRate: number;
  by4W: number;
  by6W: number;
  by8W: number;
  by12W: number;
  byDomain: { name: string; value: number }[];
  byMonth: { name: string; value: number }[];
  weekProgress: { week: number; completed: number }[];
  topProgram: string;
}

function exportPDF(students: Student[], collegeName: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`${collegeName} — Student Report`, 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 14, 28);
  autoTable(doc, {
    startY: 35,
    head: [['#', 'Name', 'Email', 'Program', 'Duration', 'Status', 'Certificate']],
    body: students.map((s, i) => [
      i + 1, s.name, s.email, s.program, s.duration, s.status, s.certificateIssued ? 'Yes' : 'No',
    ]),
    theme: 'grid',
    headStyles: { fillColor: [79, 142, 247] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
  });
  doc.save(`${collegeName}-students.pdf`);
}

export default function CollegeDashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<{ name: string; college: string; referralCode: string; portalId: string; role: string } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', duration: '', status: '', page: 0 });
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    if (session.partner.role !== 'college') { router.push('/dashboard'); return; }
    setPartner(session.partner);
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const token = getToken();
    const [s, st] = await Promise.all([
      apiCollegeStats(token),
      apiCollegeStudents(token, { page: '0' }),
    ]);
    setStats(s);
    setStudents(st?.students || []);
    setTotal(st?.total || 0);
    setLoading(false);
  }

  const applyFilters = useCallback(async (f: typeof filters) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(f.page) };
    if (f.q) params.q = f.q;
    if (f.duration) params.duration = f.duration;
    if (f.status) params.status = f.status;
    const st = await apiCollegeStudents(getToken(), params);
    setStudents(st?.students || []);
    setTotal(st?.total || 0);
    setLoading(false);
  }, []);

  async function handleExcelExport() {
    setExporting(true);
    try {
      const res = await apiCollegeExport(getToken());
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${partner?.college || 'college'}-students.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function copyReferralLink() {
    if (!partner) return;
    navigator.clipboard.writeText(`https://codezoner.in/register?ref=${partner.referralCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!partner || loading) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(79,142,247,0.3)', borderTopColor: '#4F8EF7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ color: 'rgba(240,240,255,0.5)', fontSize: 13 }}>Loading dashboard...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Students', value: stats?.total || 0, glow: 'rgba(79,142,247,0.2)', color: '#4F8EF7', icon: '👥' },
    { label: 'Enrolled', value: stats?.enrolled || 0, glow: 'rgba(139,92,246,0.2)', color: '#8B5CF6', icon: '✅' },
    { label: 'Completed', value: stats?.completed || 0, glow: 'rgba(34,197,94,0.2)', color: '#22C55E', icon: '🏆' },
    { label: 'Certificates', value: stats?.certificates || 0, glow: 'rgba(6,182,212,0.2)', color: '#06B6D4', icon: '📜' },
    { label: 'Active Now', value: stats?.active || 0, glow: 'rgba(249,115,22,0.2)', color: '#F97316', icon: '⚡' },
    { label: 'Completion %', value: `${stats?.completionRate || 0}%`, glow: 'rgba(244,63,94,0.2)', color: '#F43F5E', icon: '📈' },
  ];

  return (
    <div style={S.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
        input::placeholder { color: rgba(240,240,255,0.25); }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(20px)', background: 'rgba(5,5,8,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #4F8EF7, #8B5CF6)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#fff' }}>CZ</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#F0F0FF' }}>{partner.college || partner.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>College Analytics Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(240,240,255,0.4)' }}>{partner.portalId}</span>
          <button onClick={() => { clearSession(); router.push('/'); }} style={{ ...S.btnGlass, fontSize: 11, padding: '6px 12px' }}>Sign out</button>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 32, animation: 'fadeIn 0.4s ease' }}>
          <div style={S.sectionTitle}>College Analytics Dashboard</div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #F0F0FF, rgba(240,240,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {partner.college || partner.name}
          </h1>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
          {kpis.map((k, i) => (
            <div key={i} style={{ ...kpiCardStyle(k.glow), animation: `fadeIn 0.4s ease ${i * 0.05}s both` }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle, ${k.glow} 0%, transparent 70%)` }} />
              <div style={{ fontSize: 20, marginBottom: 8 }}>{k.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.5)', marginTop: 6 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Duration badges */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: '4 Weeks', value: stats?.by4W || 0, color: '#4F8EF7' },
            { label: '6 Weeks', value: stats?.by6W || 0, color: '#8B5CF6' },
            { label: '8 Weeks', value: stats?.by8W || 0, color: '#06B6D4' },
            { label: '12 Weeks', value: stats?.by12W || 0, color: '#22C55E' },
          ].map((d, i) => (
            <div key={i} style={{ ...S.card, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
              <span style={{ color: 'rgba(240,240,255,0.6)', fontSize: 12 }}>{d.label}</span>
              <span style={{ color: d.color, fontWeight: 800, fontSize: 18 }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* Charts row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* Monthly enrollment */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.sectionTitle}>Monthly Enrollment</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats?.byMonth || []}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#4F8EF7" strokeWidth={2} fill="url(#areaGrad)" name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Domain radar */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.sectionTitle}>Domain Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={(stats?.byDomain || []).slice(0, 6)}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 9 }} />
                <Radar name="Students" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Duration pie */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.sectionTitle}>Program Duration Split</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: '4W', value: stats?.by4W || 0 },
                    { name: '6W', value: stats?.by6W || 0 },
                    { name: '8W', value: stats?.by8W || 0 },
                    { name: '12W', value: stats?.by12W || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  paddingAngle={4} dataKey="value"
                >
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 28 }}>
          {/* Week progress */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.sectionTitle}>Week-by-Week Completion</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats?.weekProgress || []}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F8EF7" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `W${v}`} />
                <YAxis hide />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="completed" fill="url(#barGrad)" radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown */}
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.sectionTitle}>Status Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[
                { label: 'Active', value: stats?.active || 0, color: '#4F8EF7' },
                { label: 'Completed', value: stats?.completed || 0, color: '#22C55E' },
                { label: 'Certificates', value: stats?.certificates || 0, color: '#06B6D4' },
                { label: 'Dropped', value: stats?.dropped || 0, color: '#F43F5E' },
              ].map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.6)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.round((s.value / Math.max(stats?.total || 1, 1)) * 100)}%`, background: s.color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters + Table */}
        <div style={{ ...S.card, padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search name or email..."
              style={{ ...S.input, maxWidth: 240 }}
              value={filters.q}
              onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') { const f = { ...filters, page: 0 }; setFilters(f); applyFilters(f); } }}
            />
            {/* Duration filter */}
            {[
              { label: 'All', value: '' },
              { label: '4W', value: '28' },
              { label: '6W', value: '42' },
              { label: '8W', value: '56' },
              { label: '12W', value: '84' },
            ].map(d => (
              <button
                key={d.value}
                onClick={() => { const f = { ...filters, duration: d.value, page: 0 }; setFilters(f); applyFilters(f); }}
                style={{
                  ...S.btnGlass,
                  background: filters.duration === d.value ? 'rgba(79,142,247,0.2)' : undefined,
                  color: filters.duration === d.value ? '#4F8EF7' : undefined,
                  borderColor: filters.duration === d.value ? 'rgba(79,142,247,0.4)' : undefined,
                }}
              >
                {d.label}
              </button>
            ))}
            {/* Status filter */}
            {[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'Active' },
              { label: 'Completed', value: 'Completed' },
            ].map(s => (
              <button
                key={s.value}
                onClick={() => { const f = { ...filters, status: s.value, page: 0 }; setFilters(f); applyFilters(f); }}
                style={{
                  ...S.btnGlass,
                  background: filters.status === s.value ? 'rgba(139,92,246,0.2)' : undefined,
                  color: filters.status === s.value ? '#8B5CF6' : undefined,
                }}
              >
                {s.label}
              </button>
            ))}
            <button onClick={() => applyFilters({ ...filters, page: 0 })} style={S.btnPrimary}>Search</button>
          </div>

          {/* Export buttons */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={handleExcelExport} disabled={exporting} style={{ ...S.btnGlass, display: 'flex', alignItems: 'center', gap: 6 }}>
              📊 {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
            <button onClick={() => exportPDF(students, partner.college || partner.name)} style={{ ...S.btnGlass, display: 'flex', alignItems: 'center', gap: 6 }}>
              📄 Export PDF
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>{total} students total</span>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Program', 'Duration', 'Status', 'Certificate', 'Enrolled'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(240,240,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#F0F0FF' }}>{s.name}</td>
                    <td style={{ padding: '12px 14px', color: 'rgba(240,240,255,0.5)', fontSize: 12 }}>{s.email}</td>
                    <td style={{ padding: '12px 14px', color: 'rgba(240,240,255,0.7)', fontSize: 12 }}>{s.program}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: 'rgba(79,142,247,0.15)', color: '#4F8EF7', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 6 }}>{s.duration}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={
                        s.status === 'Completed' || s.status === 'CertificateIssued'
                          ? badge('#22C55E', 'rgba(34,197,94,0.15)')
                          : s.status === 'Active'
                          ? badge('#4F8EF7', 'rgba(79,142,247,0.15)')
                          : badge('#F97316', 'rgba(249,115,22,0.15)')
                      }>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      {s.certificateIssued
                        ? <span style={badge('#06B6D4', 'rgba(6,182,212,0.15)')}>✓ Issued</span>
                        : <span style={{ color: 'rgba(240,240,255,0.25)', fontSize: 11 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'rgba(240,240,255,0.4)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(240,240,255,0.25)' }}>
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {Math.ceil(total / 50) > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
              <button
                disabled={filters.page === 0}
                onClick={() => { const f = { ...filters, page: filters.page - 1 }; setFilters(f); applyFilters(f); }}
                style={S.btnGlass}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>
                Page {filters.page + 1} of {Math.ceil(total / 50)}
              </span>
              <button
                disabled={filters.page >= Math.ceil(total / 50) - 1}
                onClick={() => { const f = { ...filters, page: filters.page + 1 }; setFilters(f); applyFilters(f); }}
                style={S.btnGlass}
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Referral card */}
        <div style={{ ...S.card, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={S.sectionTitle}>College Referral Link</div>
            <div style={{ fontSize: 13, color: '#4F8EF7', fontFamily: 'monospace' }}>
              {`https://codezoner.in/register?ref=${partner.referralCode}`}
            </div>
          </div>
          <button onClick={copyReferralLink} style={S.btnPrimary}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </button>
        </div>

      </div>
    </div>
  );
}
