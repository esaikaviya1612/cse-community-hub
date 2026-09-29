const B =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

export async function api(p, o = {}) {
  const t = localStorage.getItem('token');

  const headers = {
    ...(o.headers || {})
  };

  if (t) {
    headers.Authorization = `Bearer ${t}`;
  }

  const isFormData = o.body instanceof FormData;

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const r = await fetch(B + p, {
    ...o,
    headers
  });

  if (!r.ok) {
    let x = {};

    try {
      x = await r.json();
    } catch {}

    throw Error(
      x.message || 'Request failed'
    );
  }

  return (
    r.headers.get('content-type') || ''
  ).includes('json')
    ? r.json()
    : r.blob();
}

export const get = (p) =>
  api(p);

export const send = (p, b, m = 'POST') =>
  api(p, {
    method: m,
    body:
      b instanceof FormData
        ? b
        : JSON.stringify(b)
  });

export async function excel(id) {
  const b = await api(
    `/events/${id}/excel`
  );

  const a = document.createElement('a');

  a.href = URL.createObjectURL(b);

  a.download = 'Participants.xlsx';

  a.click();
}