import { useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { MODULE_INFO } from './Modules'

type Module = { module_id: string; name: string; status: string; data: Record<string, unknown>; timestamp: string }

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const { data: mod } = useApi<Module>(`/api/modules/${moduleId}`, 15000)
  const info = MODULE_INFO[moduleId ?? '']

  if (!mod) return <div className="page-head"><h1>Loading…</h1></div>
  if (mod.status === undefined && !info) return <div className="page-head"><h1>Unknown module</h1></div>

  return (
    <div>
      <div className="page-head">
        <div className="eyebrow">Module</div>
        <h1><span className={mod.status === 'live' ? 'dot g' : 'dot r'} style={{ marginRight: 10 }} />{mod.name}</h1>
        <p className="sub">{info?.oneLine}</p>
      </div>

      <section>
        <div className="pills">
          <div className="pill"><div className={mod.status === 'live' ? 'v g' : 'v r'}>{mod.status}</div><div className="k">Status</div><div className="s">as of last scan</div></div>
          <div className="pill"><div className="v">{Object.keys(mod.data ?? {}).length}</div><div className="k">Reported fields</div><div className="s">from the live scanner</div></div>
        </div>
      </section>

      <section>
        <h2 className="sec">What it is</h2>
        <p style={{ maxWidth: 720 }}>{info?.long ?? 'No description registered for this module yet.'}</p>
        {info?.lesson && <p className="muted" style={{ marginTop: 10 }}>Related reading: <a href={`/lessons${info.lesson}`}>the course</a></p>}
      </section>

      <section>
        <h2 className="sec">Live data</h2>
        <p className="sec-sub">Exactly what the scanner last observed, as raw JSON.</p>
        <pre className="kbd" style={{ display: 'block', padding: '12px 14px', whiteSpace: 'pre-wrap', maxWidth: 620 }}>
{JSON.stringify({ status: mod.status, ...(mod.data ?? {}) }, null, 2)}
        </pre>
      </section>
    </div>
  )
}
