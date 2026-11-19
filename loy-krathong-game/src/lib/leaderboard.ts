// Leaderboard storage.
//  • Default: browser localStorage + a few demo players (fully offline).
//  • If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set (see README),
//    scores are stored in / read from Supabase through its REST API and the
//    list auto-refreshes (polling) so it updates live for everyone.

export interface Entry {
  id: string
  name: string
  score: number
  at: number
}

const KEY = 'loy-krathong-leaderboard-v1'
const SB_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '')
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const API = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const supabase = Boolean(SB_URL && SB_KEY)
// 'server' = our Node server (npm start) — detected once, falls back to local
let serverOk: boolean | null = supabase || location.protocol === 'file:' ? false : null
async function detectServer(): Promise<boolean> {
  if (serverOk !== null) return serverOk
  try {
    const r = await fetch(`${API}/api/health`)
    serverOk = r.ok && (r.headers.get('content-type') ?? '').includes('json')
  } catch { serverOk = false }
  return serverOk
}
export let usingBackend = supabase
export const backendKind = () => (supabase ? 'supabase' : serverOk ? 'server' : 'local')

const DEMO: Omit<Entry, 'id' | 'at'>[] = [
  { name: 'น้องใบบัว', score: 52 },
  { name: 'พี่ต้นกล้า', score: 47 },
  { name: 'แม่น้ำใส', score: 41 },
  { name: 'ลุงปลาทอง', score: 36 },
  { name: 'หนูนา', score: 31 },
  { name: 'ครูดาว', score: 27 },
  { name: 'เจ้าชายเรือ', score: 22 },
  { name: 'ปูนิ่ม', score: 16 },
]

const sortEntries = (e: Entry[]) => [...e].sort((a, b) => b.score - a.score || a.at - b.at)
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

function readLocal(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Entry[]
  } catch { /* ignore */ }
  const seeded = DEMO.map((d, i) => ({ ...d, id: 'demo-' + i, at: Date.now() - (i + 1) * 3_600_000 }))
  try { localStorage.setItem(KEY, JSON.stringify(seeded)) } catch { /* ignore */ }
  return seeded
}

export async function getLeaderboard(): Promise<Entry[]> {
  if (await detectServer()) {
    try {
      const res = await fetch(`${API}/api/scores`)
      if (res.ok) {
        const rows = (await res.json()) as { id: string; name: string; score: number; created_at: number }[]
        usingBackend = true
        return rows.map((r) => ({ id: r.id, name: r.name, score: r.score, at: r.created_at }))
      }
    } catch { /* fall through */ }
  }
  if (usingBackend) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/scores?select=id,name,score,created_at&order=score.desc,created_at.asc&limit=50`, {
        headers: { apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}` },
      })
      if (res.ok) {
        const rows = (await res.json()) as { id: string; name: string; score: number; created_at: string }[]
        return rows.map((r) => ({ id: r.id, name: r.name, score: r.score, at: Date.parse(r.created_at) }))
      }
    } catch { /* fall through to local */ }
  }
  return sortEntries(readLocal())
}

export async function submitScore(name: string, score: number): Promise<Entry> {
  const clean = name.trim().slice(0, 16) || 'ผู้เล่นนิรนาม'
  if (await detectServer()) {
    try {
      const res = await fetch(`${API}/api/scores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: clean, score }) })
      if (res.ok) {
        const r = (await res.json()) as { id: string; name: string; score: number; created_at: number }
        return { id: r.id, name: r.name, score: r.score, at: r.created_at }
      }
    } catch { /* fall through */ }
  }
  if (usingBackend) {
    try {
      const res = await fetch(`${SB_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: {
          apikey: SB_KEY!, Authorization: `Bearer ${SB_KEY}`,
          'Content-Type': 'application/json', Prefer: 'return=representation',
        },
        body: JSON.stringify({ name: clean, score }),
      })
      if (res.ok) {
        const [row] = (await res.json()) as { id: string; name: string; score: number; created_at: string }[]
        return { id: row.id, name: row.name, score: row.score, at: Date.parse(row.created_at) }
      }
    } catch { /* fall through to local */ }
  }
  const entry: Entry = { id: uid(), name: clean, score, at: Date.now() }
  const all = sortEntries([...readLocal(), entry]).slice(0, 100)
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* ignore */ }
  return entry
}

export function rankOf(entries: Entry[], id: string): number {
  return sortEntries(entries).findIndex((e) => e.id === id) + 1
}
export { sortEntries }
