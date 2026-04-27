'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/auth';
import { apiCollegeStats } from '@/lib/api';
import Navbar from '@/components/navbar';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip,
} from 'recharts';

const COLORS = ['#4F8EF7', '#8B5CF6', '#06B6D4', '#22C55E', '#F97316'];

const S = {
  page: { minHeight: '100vh', background: '#050508', color: '#F0F0FF', fontFamily: 'system-ui,-apple-system,sans-serif' } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)' } as React.CSSProperties,
  label: { fontSize: 11, fontWeight: 700 as const, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(240,240,255,0.4)', marginBottom: 14 },
};

interface TooltipProps { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string; }
function DarkTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,10,20,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'rgba(240,240,255,0.6)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</div>)}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    if (session.partner.role !== 'college') { router.push('/dashboard'); return; }
    setPartner(session.partner);
    apiCollegeStats(getToken()).then(d => { setStats(d); setLoading(false); });
  }, []);

  if (!partner) return null;

  return (
    <div style={S.page}>
      <style>{`*{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`}</style>
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar partnerName={partner.name} role={partner.role} portalId={partner.portalId} activePage="analytics" />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <div style={S.label}>Analytics</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: '#F0F0FF' }}>Performance Overview</h1>
          <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.4)', marginTop: 4 }}>{partner.college || partner.name}</div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Students', value: stats?.total ?? '—', color: '#4F8EF7', glow: 'rgba(79,142,247,0.2)', icon: '👥' },
            { label: 'Enrolled', value: stats?.enrolled ?? '—', color: '#8B5CF6', glow: 'rgba(139,92,246,0.2)', icon: '✅' },
            { label: 'Completed', value: stats?.completed ?? '—', color: '#22C55E', glow: 'rgba(34,197,94,0.2)', icon: '🏆' },
            { label: 'Certificates', value: stats?.certificates ?? '—', color: '#06B6D4', glow: 'rgba(6,182,212,0.2)', icon: '📜' },
            { label: 'Completion %', value: stats ? `${stats.completionRate || 0}%` : '—', color: '#F97316', glow: 'rgba(249,115,22,0.2)', icon: '📈' },
          ].map((k, i) => (
            <div key={i} style={{ ...S.card, padding: 20, position: 'relative', overflow: 'hidden', boxShadow: `0 0 30px ${k.glow}` }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle,${k.glow} 0%,transparent 70%)` }} />
              <div style={{ fontSize: 20, marginBottom: 6 }}>{k.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(240,240,255,0.5)', marginTop: 4 }}>{k.label}</div>
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

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginBottom: 16 }}>
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.label}>Monthly Enrollment</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={stats?.byMonth || []}>
                <defs>
                  <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F8EF7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<DarkTooltip />} />
                <Area type="monotone" dataKey="value" stroke="#4F8EF7" strokeWidth={2} fill="url(#ag)" name="Students" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.label}>Domain Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart data={(stats?.byDomain || []).slice(0, 6)}>
                <PolarGrid stroke="rgba(255,255,255,0.08)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 9 }} />
                <Radar name="Students" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.25} />
                <Tooltip content={<DarkTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.label}>Duration Split</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: '4W', value: stats?.by4W || 0 },
                    { name: '6W', value: stats?.by6W || 0 },
                    { name: '8W', value: stats?.by8W || 0 },
                    { name: '12W', value: stats?.by12W || 0 },
                  ]}
                  cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value"
                >
                  {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                </Pie>
                <Tooltip content={<DarkTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.label}>Week-by-Week Completion</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.weekProgress || []}>
                <defs>
                  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4F8EF7" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: 'rgba(240,240,255,0.4)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `W${v}`} />
                <YAxis hide />
                <Tooltip content={<DarkTooltip />} />
                <Bar dataKey="completed" fill="url(#bg)" radius={[6, 6, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ ...S.card, padding: 24 }}>
            <div style={S.label}>Status Breakdown</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
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
      </div>
    </div>
  );
}
