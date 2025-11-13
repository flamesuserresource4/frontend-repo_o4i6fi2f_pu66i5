import { useEffect, useMemo, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function number(v) { return typeof v === 'number' ? v : (v ? Number(v) : 0) }

function Badge({ children, color = 'blue' }) {
  const map = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    green: 'bg-green-50 text-green-700 ring-green-200',
    gray: 'bg-gray-50 text-gray-700 ring-gray-200',
    amber: 'bg-amber-50 text-amber-700 ring-amber-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  }
  return (
    <span className={`px-2 py-1 rounded-md text-xs font-medium ring-1 ${map[color]}`}>{children}</span>
  )
}

function Header({ season, setSeason, loading, updated }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">F1 Driver Performance Dashboard</h1>
        <p className="text-gray-600">Live ranking and detailed stats for the current season</p>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <label className="block text-xs text-gray-500">Season</label>
          <input type="number" value={season}
            onChange={(e)=>setSeason(Number(e.target.value))}
            className="w-28 px-3 py-2 rounded-md border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex flex-col items-end">
          <Badge color="gray">{updated ? `Updated ${updated}` : '—'}</Badge>
          {loading && <span className="text-xs text-gray-500 mt-1">Fetching data…</span>}
        </div>
      </div>
    </div>
  )
}

function DriverRow({ d, onSelect }) {
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={()=>onSelect(d)}>
      <td className="py-2 px-3 text-center text-gray-800 font-semibold">{d.rank}</td>
      <td className="py-2 px-3 font-medium">{d.givenName} {d.familyName}
        <div className="text-xs text-gray-500">{d.constructor}</div>
      </td>
      <td className="py-2 px-3 text-center">{d.points}</td>
      <td className="py-2 px-3 text-center">{d.wins}</td>
      <td className="py-2 px-3 text-center">{d.avg_quali ?? '—'}</td>
      <td className="py-2 px-3 text-center">{d.avg_grid ?? '—'}</td>
      <td className="py-2 px-3 text-center">{d.avg_finish ?? '—'}</td>
      <td className="py-2 px-3">
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="h-2 rounded-full bg-blue-500" style={{width: `${d.performance_index}%`}} />
        </div>
        <div className="text-xs text-gray-600 mt-1">{d.performance_index}</div>
      </td>
      <td className="py-2 px-3 text-center">{d.dnfs}</td>
    </tr>
  )
}

function DriverModal({ driver, onClose }) {
  if (!driver) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-2xl p-6" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold">{driver.givenName} {driver.familyName}</h3>
            <div className="text-gray-500">{driver.constructor} • {driver.nationality}</div>
          </div>
          <button className="text-gray-500 hover:text-gray-800" onClick={onClose}>Close</button>
        </div>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Performance Index</div>
            <div className="text-3xl font-bold">{driver.performance_index}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Points • Wins • DNFs</div>
            <div className="text-3xl font-bold">{driver.points} • {driver.wins} • {driver.dnfs}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50">
            <div className="text-xs text-gray-500">Avg Quali • Grid • Finish</div>
            <div className="text-3xl font-bold">{driver.avg_quali ?? '—'} • {driver.avg_grid ?? '—'} • {driver.avg_finish ?? '—'}</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-semibold mb-2">Round-by-round</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 px-2">Rnd</th>
                  <th className="py-2 px-2">Quali</th>
                  <th className="py-2 px-2">Grid</th>
                  <th className="py-2 px-2">Finish</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {driver.results?.map((r)=> (
                  <tr key={r.round} className="border-t">
                    <td className="py-2 px-2">{r.round}</td>
                    <td className="py-2 px-2">{r.quali ?? '—'}</td>
                    <td className="py-2 px-2">{r.grid ?? '—'}</td>
                    <td className="py-2 px-2">{r.position ?? '—'}</td>
                    <td className="py-2 px-2">{r.status ?? '—'}</td>
                    <td className="py-2 px-2">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [season, setSeason] = useState(new Date().getUTCFullYear())
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const filtered = useMemo(()=> {
    const q = query.trim().toLowerCase()
    if (!q) return data
    return data.filter(d => `${d.givenName} ${d.familyName}`.toLowerCase().includes(q) || (d.constructor||'').toLowerCase().includes(q))
  }, [data, query])

  useEffect(()=>{
    async function load(){
      setLoading(true); setError('')
      try {
        const res = await fetch(`${BACKEND}/api/season/summary?season=${season}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const json = await res.json()
        setData(json.drivers || [])
      } catch (e) {
        setError('Could not load data. Ensure backend URL is configured.')
      } finally { setLoading(false) }
    }
    load()
  }, [season])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Header season={season} setSeason={setSeason} loading={loading} updated={new Date().toLocaleTimeString()} />

        <div className="mt-6 flex items-center gap-3">
          <input placeholder="Search driver or team" value={query} onChange={e=>setQuery(e.target.value)} className="flex-1 px-4 py-2 rounded-md border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <Badge color="purple">{filtered.length} Drivers</Badge>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="py-2 px-3 text-left">#</th>
                <th className="py-2 px-3 text-left">Driver</th>
                <th className="py-2 px-3 text-left">Pts</th>
                <th className="py-2 px-3 text-left">Wins</th>
                <th className="py-2 px-3 text-left">Avg Quali</th>
                <th className="py-2 px-3 text-left">Avg Grid</th>
                <th className="py-2 px-3 text-left">Avg Finish</th>
                <th className="py-2 px-3 text-left">Perf Index</th>
                <th className="py-2 px-3 text-left">DNFs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-10 text-center text-gray-500">Loading…</td></tr>
              ) : (
                filtered.map(d => (
                  <DriverRow key={d.driverId} d={d} onSelect={setSelected} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <DriverModal driver={selected} onClose={()=>setSelected(null)} />
    </div>
  )
}

export default App
