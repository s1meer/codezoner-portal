const KEY = 'cz_session';

export const saveSession = (token: string, partner: unknown) =>
  localStorage.setItem(KEY, JSON.stringify({ token, partner }));

export const getSession = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
};

export const clearSession = () => localStorage.removeItem(KEY);

export const getToken = () => getSession()?.token || '';
