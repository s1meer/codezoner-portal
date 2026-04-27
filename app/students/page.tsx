'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, getToken } from '@/lib/auth';
import { apiCollegeStudents, apiCollegeExport } from '@/lib/api';
import Navbar from '@/components/navbar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const S = {
  page: { minHeight: '100vh', background: '#050508', color: '#F0F0FF', fontFamily: 'system-ui,-apple-system,sans-serif' } as React.CSSProperties,
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, backdropFilter: 'blur(20px)' } as React.CSSProperties,
  input: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#F0F0FF', borderRadius: 10, padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  btnGlass: { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#F0F0FF', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
};

function activeBtn(active: boolean): React.CSSProperties {
  return {
    ...S.btnGlass,
    background: active ? 'rgba(79,142,247,0.25)' : 'rgba(255,255,255,0.06)',
    border: `1px solid ${active ? 'rgba(79,142,247,0.4)' : 'rgba(255,255,255,0.12)'}`,
    color: active ? '#4F8EF7' : '#F0F0FF',
  };
}

function badge(color: string, bg: string): React.CSSProperties {
  return { background: bg, color, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const };
}

interface Student {
  id: string;
  name: string;
  email: string;
  program: string;
  duration: string;
  status: string;
  certificateIssued: boolean;
  enrolledAt: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [partner, setPartner] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', duration: '', status: '', page: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) { router.push('/'); return; }
    if (session.partner.role !== 'college') { router.push('/dashboard'); return; }
    setPartner(session.partner);
    load({ q: '', duration: '', status: '', page: 0 });
  }, []);

  const load = useCallback(async (f: typeof filters) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(f.page) };
    if (f.q) params.q = f.q;
    if (f.duration) params.duration = f.duration;
    if (f.status) params.status = f.status;
    const data = await apiCollegeStudents(getToken(), params);
    setStudents(data?.students || []);
    setTotal(data?.total || 0);
    setLoading(false);
  }, []);

  async function handleExcel() {
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

  function handlePDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${partner?.college || 'College'} — Student Report`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Total: ${total} students`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [['#', 'Name', 'Email', 'Program', 'Duration', 'Status', 'Certificate', 'Enrolled']],
      body: students.map((s, i) => [
        i + 1, s.name, s.email, s.program, s.duration, s.status,
        s.certificateIssued ? 'Yes' : 'No',
        s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString('en-IN') : '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [79, 142, 247] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`${partner?.college || 'college'}-students.pdf`);
  }

  if (!partner) return null;

  return (
    <div style={S.page}>
      <style>{`*{box-sizing:border-box} input::placeholder{color:rgba(240,240,255,0.25)} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`}</style>
      <div style={{ position: 'fixed', top: '-20%', left: '-10%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(79,142,247,0.08) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <Navbar partnerName={partner.name} role={partner.role} portalId={partner.portalId} activePage="students" />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(240,240,255,0.4)', marginBottom: 4 }}>
              {partner.college || partner.name}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: '#F0F0FF' }}>
              {loading ? 'Loading...' : `${total} Students`}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleExcel} disabled={exporting} style={S.btnGlass}>
              📊 {exporting ? 'Exporting...' : 'Excel'}
            </button>
            <button onClick={handlePDF} disabled={students.length === 0} style={S.btnGlass}>📄 PDF</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ ...S.card, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Search name or email..."
              style={{ ...S.input, maxWidth: 260 }}
              value={filters.q}
              onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const f = { ...filters, page: 0 };
                  setFilters(f);
                  load(f);
                }
              }}
            />
            {[{ l: 'All', v: '' }, { l: '4W', v: '28' }, { l: '6W', v: '42' }, { l: '8W', v: '56' }, { l: '12W', v: '84' }].map(d => (
              <button key={d.v} onClick={() => { const f = { ...filters, duration: d.v, page: 0 }; setFilters(f); load(f); }} style={activeBtn(filters.duration === d.v)}>
                {d.l}
              </button>
            ))}
            {[{ l: 'All Status', v: '' }, { l: 'Active', v: 'Active' }, { l: 'Completed', v: 'Completed' }, { l: 'Certified', v: 'CertificateIssued' }].map(s => (
              <button key={s.v} onClick={() => { const f = { ...filters, status: s.v, page: 0 }; setFilters(f); load(f); }} style={activeBtn(filters.status === s.v)}>
                {s.l}
              </button>
            ))}
            <button
              onClick={() => { const f = { ...filters, page: 0 }; load(f); }}
              style={{ ...S.btnGlass, background: 'linear-gradient(135deg,#4F8EF7,#8B5CF6)', color: '#fff', border: 'none' }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Name', 'Email', 'Program', 'Duration', 'Status', 'Certificate', 'Enrolled'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'rgba(240,240,255,0.4)', borderBottom: '1px solid rgba(255,255,255,0.06)', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'rgba(240,240,255,0.3)' }}>Loading...</td></tr>
                ) : students.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 48, textAlign: 'center', color: 'rgba(240,240,255,0.3)' }}>No students found</td></tr>
                ) : students.map((s, i) => (
                  <tr
                    key={s.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '12px 16px', color: 'rgba(240,240,255,0.3)', fontSize: 11 }}>{filters.page * 50 + i + 1}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#F0F0FF' }}>{s.name}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(240,240,255,0.5)', fontSize: 12 }}>{s.email}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(240,240,255,0.7)', fontSize: 12, maxWidth: 200 }}>{s.program}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={badge('#4F8EF7', 'rgba(79,142,247,0.15)')}>{s.duration}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={
                        s.status === 'Completed' || s.status === 'CertificateIssued'
                          ? badge('#22C55E', 'rgba(34,197,94,0.15)')
                          : s.status === 'Active'
                          ? badge('#4F8EF7', 'rgba(79,142,247,0.15)')
                          : badge('#F97316', 'rgba(249,115,22,0.15)')
                      }>
                        {s.status === 'CertificateIssued' ? 'Certified' : s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {s.certificateIssued
                        ? <span style={badge('#06B6D4', 'rgba(6,182,212,0.15)')}>✓ Issued</span>
                        : <span style={{ color: 'rgba(240,240,255,0.2)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'rgba(240,240,255,0.4)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {s.enrolledAt ? new Date(s.enrolledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Math.ceil(total / 50) > 1 && (
            <div style={{ padding: '16px', display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                disabled={filters.page === 0}
                onClick={() => { const f = { ...filters, page: filters.page - 1 }; setFilters(f); load(f); }}
                style={S.btnGlass}
              >
                ← Prev
              </button>
              <span style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)' }}>
                Page {filters.page + 1} of {Math.ceil(total / 50)}
              </span>
              <button
                disabled={filters.page >= Math.ceil(total / 50) - 1}
                onClick={() => { const f = { ...filters, page: filters.page + 1 }; setFilters(f); load(f); }}
                style={S.btnGlass}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
