// src/api/client.js
// Uses native fetch() instead of axios — fully compatible with RN 0.81 / React 19
import { ENV } from '../config/env';

const BASE = ENV.API_BASE;

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body, isBlob = false) {
  const url = `${BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body && !(body instanceof FormData)) {
    opts.body = JSON.stringify(body);
  }
  if (body instanceof FormData) {
    delete opts.headers['Content-Type']; // let fetch set multipart boundary
    opts.body = body;
  }

  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(text || `HTTP ${res.status}`, res.status);
    }
    if (isBlob) return { data: await res.arrayBuffer() };
    const text = await res.text();
    return { data: text ? JSON.parse(text) : null };
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      e.message?.includes('Network') || e.message?.includes('fetch')
        ? 'Cannot connect to server. Check your IP in src/config/env.js'
        : e.message,
      0
    );
  }
}

const get  = (path)        => request('GET',    path);
const post = (path, body)  => request('POST',   path, body);
const put  = (path, body)  => request('PUT',    path, body);
const del  = (path)        => request('DELETE', path);
const blob = (path)        => request('GET',    path, null, true);

// ─── Work Entries ─────────────────────────────────────────────────────────────
export const entriesApi = {
  getAll: (year, month) => {
    const q = year && month ? `?year=${year}&month=${month}` : '';
    return get(`/entries${q}`);
  },
  getOne: (id)       => get(`/entries/${id}`),
  create: (data)     => post('/entries', data),
  update: (id, data) => put(`/entries/${id}`, data),
  delete: (id)       => del(`/entries/${id}`),
};

// ─── Summary ──────────────────────────────────────────────────────────────────
export const summaryApi = {
  get: (year, month) => get(`/summary/${year}/${month}`),
};

export const yearlyApi = {
  get: (year) => get(`/summary/${year}`),
};

// ─── Settings ─────────────────────────────────────────────────────────────────
export const settingsApi = {
  get:    ()     => get('/settings'),
  update: (data) => put('/settings', data),
};

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadApi = {
  parse: (file) => {
    const fd = new FormData();
    fd.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'text/csv' });
    return request('POST', '/upload', fd);
  },
  save: (entries) => post('/upload/save', entries),
};

// ─── Export / Payslip ─────────────────────────────────────────────────────────
export const exportApi = {
  excel:     (year, month) => blob(`/export/${year}/${month}/excel`),
  pdf:       (year, month) => blob(`/payslip/${year}/${month}/pdf`),
  annualPdf: (year)        => blob(`/export/${year}/annual-pdf`),
};

// ─── Email ────────────────────────────────────────────────────────────────────
export const emailApi = {
  send:     (data) => post('/email/send', data),
  autoSend: ()     => post('/email/auto-send'),
};

// ─── Vacation ─────────────────────────────────────────────────────────────────
export const vacationApi = {
  getEntries:  (year, month) => get(`/vacation?year=${year}&month=${month}`),
  addEntry:    (data)        => post('/vacation', data),
  deleteEntry: (id)          => del(`/vacation/${id}`),
  getBalances: ()            => get('/vacation/balance'),
  setBalance:  (year, days)  => put(`/vacation/balance/${year}?total_entitlement=${days}`),
};

// ─── Sick Days ────────────────────────────────────────────────────────────────
export const sickDaysApi = {
  getAll:  (year, month) => get(`/sick-days?year=${year}&month=${month}`),
  add:     (data)        => post('/sick-days', data),
  delete:  (id)          => del(`/sick-days/${id}`),
  summary: (year)        => get(`/sick-days/summary?year=${year}`),
};

// ─── Public Holidays ──────────────────────────────────────────────────────────
export const publicHolidaysApi = {
  get: (year, country = 'NL') => get(`/public-holidays/${year}?country=${country}`),
};
