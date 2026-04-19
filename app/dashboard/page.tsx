'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, clearSession, getToken } from '@/lib/auth';
import { apiStats, apiStudents } from '@/lib/api';

const PAGE_SIZE = 20;

type WeekStatus = 'on_time' | 'late' | 'missed' | 'active' | null;

interface Student {
  id: string;
  name: string;
  enrolledAt: string;
  completed: boolean;
  certificateIssued: boolean;
  week1: WeekStatus;
  week2: WeekStatus;
  week3: WeekStatus;
  week4: WeekStatus;
}

interface Stats {
  totalReferred: number;
  enrolled: number;
  completed: number;
  certificates: number;
}

interface Partner {
  name: string;
  portalId: string;
  role: string;
  referralCode: string;
  college?: string;
}

const WEEK_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  on_time: { bg: '#DCFCE7', color: '#166534', label: 'On time' },
  late:    { bg: '#FEF9C3', color: '#854D0E', label: 'Late' },
  missed:  { bg: '#FEE2E2', color: '#991B1B', label: 'Missed' },
  active:  { bg: '#DBEAFE', color: '#1E40AF', label: 'Active' },
};

function WeekBadge({ status }: { status: WeekStatus }) {
  if (!status) return <span style={{ color: '#CBD5E1', fontSize: 11 }}>—</span>;
  const s = WEEK_COLORS[status];
  return (
    <span style={{
      background: s.bg, color: s.color, fontSize: 10, fontWeight: 700,
      padding: '2px 7px', borderRadius: 5, whiteSpace: 'nowrap'
    }}>{s.label}</span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
      padding: '18px 22px', flex: 1, minWidth: 130
    }}>
      <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} style={{
      background: copied ? '#DCFCE7' : '#EFF6FF', color: copied ? '#166534' : '#1D4ED8',
      border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12,
      fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
    }}>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    setPartner(session.partner);
    loadData(session.partner);
  }, []);

  const loadData = async (p: Partner) => {
    setLoading(true);
    const token = getToken();
    const [s, st] = await Promise.all([
      apiStats(token),
      apiStudents(token, '', 0),
    ]);
    setStats(s);
    setStudents(st.students || []);
    setTotal(st.total || 0);
    setLoading(false);
  };

  const fetchStudents = useCallback(async (query: string, pg: number) => {
    setLoading(true);
    const st = await apiStudents(getToken(), query, pg);
    setStudents(st.students || []);
    setTotal(st.total || 0);
    setLoading(false);
  }, []);

  const search = () => {
    setPage(0);
    setQ(searchInput);
    fetchStudents(searchInput, 0);
  };

  const goPage = (pg: number) => {
    setPage(pg);
    fetchStudents(q, pg);
  };

  const logout = () => {
    clearSession();
    router.push('/');
  };

  if (!partner) return null;

  const BASE = process.env.NEXT_PUBLIC_API || 'https://codezoner.in';
  const referralLink = `${BASE}/register?ref=${partner.referralCode}`;
  const isExec = partner.role?.toLowerCase() === 'executive';
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #E2E8F0',
        padding: '0 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: '#1E3A8A', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800, color: '#fff'
          }}>CZ</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              CodeZoner Partner Portal
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>portal.codezoner.in</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{partner.name}</div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 2 }}>
              <span style={{
                background: isExec ? '#EDE9FE' : '#DBEAFE',
                color: isExec ? '#6D28D9' : '#1D4ED8',
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5
              }}>
                {isExec ? 'Executive' : 'Ambassador'}
              </span>
              <span style={{
                background: '#F1F5F9', color: '#64748B',
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5
              }}>
                {partner.portalId}
              </span>
            </div>
          </div>
          <a href="/profile" style={{
            background: '#EFF6FF', color: '#1D4ED8',
            border: '1px solid #BFDBFE', borderRadius: 8,
            padding: '7px 14px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer', textDecoration: 'none'
          }}>My Profile</a>
          <button onClick={logout} style={{
            background: '#F1F5F9', color: '#475569', border: 'none',
            borderRadius: 8, padding: '7px 14px', fontSize: 12,
            fontWeight: 600, cursor: 'pointer'
          }}>Sign out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 20px' }}>

        {/* MOU badge for executives */}
        {isExec && partner.college && (
          <div style={{
            background: '#EDE9FE', border: '1px solid #C4B5FD', borderRadius: 10,
            padding: '10px 16px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 10
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6D28D9' }}>MOU Partner</span>
            <span style={{ fontSize: 13, color: '#7C3AED' }}>{partner.college}</span>
          </div>
        )}

        {/* Referral link */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Your referral link
            </div>
            <div style={{ fontSize: 13, color: '#1D4ED8', fontFamily: 'monospace' }}>
              {referralLink}
            </div>
          </div>
          <CopyButton text={referralLink} />
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <StatCard label="Total Referred" value={stats.totalReferred} />
            <StatCard label="Enrolled" value={stats.enrolled} sub="paid students" />
            <StatCard label="Completed" value={stats.completed} sub="all 4 weeks" />
            <StatCard label="Certificates" value={stats.certificates} sub="issued" />
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            placeholder="Search by name or email..."
            style={{
              flex: 1, padding: '9px 14px', border: '1px solid #E2E8F0',
              borderRadius: 8, fontSize: 13, outline: 'none'
            }}
          />
          <button onClick={search} style={{
            background: '#1D4ED8', color: '#fff', border: 'none',
            borderRadius: 8, padding: '9px 18px', fontSize: 13,
            fontWeight: 600, cursor: 'pointer'
          }}>Search</button>
          {q && (
            <button onClick={() => { setSearchInput(''); setQ(''); setPage(0); fetchStudents('', 0); }}
              style={{
                background: '#F1F5F9', color: '#475569', border: 'none',
                borderRadius: 8, padding: '9px 14px', fontSize: 13,
                fontWeight: 600, cursor: 'pointer'
              }}>Clear</button>
          )}
        </div>

        {/* Table */}
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden'
        }}>
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid #F1F5F9',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Students {q && <span style={{ color: '#64748B', fontWeight: 400 }}>— "{q}"</span>}
            </span>
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              {total} student{total !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              Loading...
            </div>
          ) : students.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              {q ? 'No students match your search.' : 'No students referred yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    {['Name', 'Enrolled', 'Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Status'].map(h => (
                      <th key={h} style={{
                        padding: '10px 16px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: '#64748B',
                        borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap'
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0F172A' }}>
                        {s.name}
                      </td>
                      <td style={{ padding: '11px 16px', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {s.enrolledAt
                          ? new Date(s.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                          : '—'}
                      </td>
                      <td style={{ padding: '11px 16px' }}><WeekBadge status={s.week1} /></td>
                      <td style={{ padding: '11px 16px' }}><WeekBadge status={s.week2} /></td>
                      <td style={{ padding: '11px 16px' }}><WeekBadge status={s.week3} /></td>
                      <td style={{ padding: '11px 16px' }}><WeekBadge status={s.week4} /></td>
                      <td style={{ padding: '11px 16px' }}>
                        {s.certificateIssued ? (
                          <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>
                            Certificate
                          </span>
                        ) : s.completed ? (
                          <span style={{ background: '#F0FDF4', color: '#15803D', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>
                            Completed
                          </span>
                        ) : (
                          <span style={{ background: '#F1F5F9', color: '#64748B', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5 }}>
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '12px 20px', borderTop: '1px solid #F1F5F9',
              display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center'
            }}>
              <button
                onClick={() => goPage(page - 1)}
                disabled={page === 0}
                style={{
                  background: page === 0 ? '#F1F5F9' : '#1D4ED8',
                  color: page === 0 ? '#94A3B8' : '#fff',
                  border: 'none', borderRadius: 6, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600,
                  cursor: page === 0 ? 'not-allowed' : 'pointer'
                }}
              >← Prev</button>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => goPage(page + 1)}
                disabled={page >= totalPages - 1}
                style={{
                  background: page >= totalPages - 1 ? '#F1F5F9' : '#1D4ED8',
                  color: page >= totalPages - 1 ? '#94A3B8' : '#fff',
                  border: 'none', borderRadius: 6, padding: '6px 14px',
                  fontSize: 12, fontWeight: 600,
                  cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
                }}
              >Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
