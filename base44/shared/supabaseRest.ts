export function createSupabaseRestClient(restUrl: string, serviceKey: string) {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const request = async (path: string, options: RequestInit = {}) => {
    const response = await fetch(`${restUrl}/${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (!response.ok) throw new Error((await response.text()) || 'Database request failed');
    if (response.status === 204) return null;
    return response.json();
  };
  const select = (table: string, query: string) => request(`${table}?${query}`);
  const insert = (table: string, data: unknown, prefer = 'return=representation') => request(table, { method: 'POST', headers: { Prefer: prefer }, body: JSON.stringify(data) });
  const update = (table: string, query: string, data: unknown) => request(`${table}?${query}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(data) });
  return { headers, request, select, insert, update };
}