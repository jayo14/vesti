export async function query<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`DB query failed: ${res.status}`);
  return res.json();
}
