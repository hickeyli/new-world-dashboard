const BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

export async function searchItems(query, signal, limit = null) {
  const path = '/items/search';
  let qs = `?q=${encodeURIComponent(query)}`;
  if (limit) {
    qs += `&limit=${limit}`;
  }
  const url = BASE ? `${BASE}${path}${qs}` : `${path}${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return res.json();
}

export async function getItemStats(itemName, signal) {
  const path = '/items/stats';
  const qs = `?item_name=${encodeURIComponent(itemName)}`;
  const url = BASE ? `${BASE}${path}${qs}` : `${path}${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return res.json();
}

export async function getRecentScanStats(itemName, signal) {
  const path = '/items/recent-stats';
  const qs = `?item_name=${encodeURIComponent(itemName)}`;
  const url = BASE ? `${BASE}${path}${qs}` : `${path}${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return res.json();
}

export async function getRecentListings(itemName, signal) {
  const path = '/items/recent-listings';
  const qs = `?item_name=${encodeURIComponent(itemName)}`;
  const url = BASE ? `${BASE}${path}${qs}` : `${path}${qs}`;

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` - ${text}` : ''}`);
  }
  return res.json();
}