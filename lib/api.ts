const BASE = process.env.NEXT_PUBLIC_API || 'https://codezoner.in';

function gone() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cz_session');
    window.location.href = '/';
  }
}

export async function apiLogin(portalId: string, password: string) {
  const r = await fetch(`${BASE}/api/partner/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ portalId, password }),
  });
  return r.json();
}

export async function apiStats(token: string) {
  const r = await fetch(`${BASE}/api/partner/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401) { gone(); return {}; }
  return r.json();
}

export async function apiStudents(token: string, q = '', page = 0) {
  const r = await fetch(
    `${BASE}/api/partner/students?q=${encodeURIComponent(q)}&page=${page}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (r.status === 401) { gone(); return { students: [], total: 0 }; }
  return r.json();
}

export async function apiGetMOUs(token: string) {
  const r = await fetch(`${BASE}/api/partner/mou`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (r.status === 401 || r.status === 403) return { mous: [] };
  return r.json().catch(() => ({ mous: [] }));
}

export async function apiSendMOU(token: string, data: object) {
  const r = await fetch(`${BASE}/api/partner/mou`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return r.json();
}

export async function apiAnnouncements(token: string) {
  const r = await fetch(`${BASE}/api/partner/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (r.status === 401) return { announcements: [] };
  return r.json().catch(() => ({ announcements: [] }));
}
