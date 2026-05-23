import { useMemo, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Globe2,
  Lock,
  Mail,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react'
import './App.css'

type AuditForm = {
  url: string
  brand: string
  targetCustomer: string
  services: string
  competitors: string
  markets: string
  depth: 'standard' | 'agency'
}

type Metric = {
  label: string
  value: number
  unit: string
  status: string
  tone: 'good' | 'warn' | 'bad'
}

type Fix = {
  title: string
  detail: string
  priority: 'High' | 'Medium' | 'Low'
  tone: 'bad' | 'warn' | 'good'
}

const defaultForm: AuditForm = {
  url: 'https://bluepeakplumbing.com',
  brand: 'BluePeak Plumbing',
  targetCustomer:
    'Homeowners who need reliable plumbing repairs, installs, leak detection, and emergency service.',
  services:
    'Drain cleaning, Water heater installation, Leak repair, Pipe repair, Toilet repair',
  competitors:
    'https://www.rotorooter.com\nhttps://www.mrrooter.com\nhttps://www.benjaminfranklinplumbing.com\nhttps://www.rotorooter.com/denver',
  markets: 'Denver, CO, Aurora, CO, Lakewood, CO, Englewood, CO',
  depth: 'standard',
}

const marketSignals = [
  {
    source: 'Gartner',
    value: '25%',
    text: 'projected search volume decline by 2026 as users shift to AI answer agents.',
    href: 'https://www.gartner.com/en/newsroom/press-releases/2024-02-19-gartner-predicts-search-engine-volume-will-drop-25-percent-by-2026-due-to-ai-chatbots-and-other-virtual-agents',
  },
  {
    source: 'Pew Research',
    value: 'Lower CTR',
    text: 'reported users are less likely to click result links when an AI summary appears.',
    href: 'https://www.pewresearch.org/short-reads/2025/07/22/google-users-are-less-likely-to-click-on-links-when-an-ai-summary-appears-in-the-results/',
  },
  {
    source: 'Princeton GEO paper',
    value: 'New SEO surface',
    text: 'formalized generative engine optimization as a measurable visibility problem.',
    href: 'https://arxiv.org/abs/2311.09735',
  },
]

const paymentLink = import.meta.env.VITE_PAYMENT_LINK as string | undefined
const orderUrl =
  (import.meta.env.VITE_ORDER_URL as string | undefined) ||
  'https://t.me/AeoSnapshotBot?start=audit'
const sampleReportUrl = `${import.meta.env.BASE_URL}sample-audit.html`

function splitLines(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function domainFromUrl(value: string) {
  try {
    return new URL(value.includes('://') ? value : `https://${value}`).hostname.replace(
      /^www\./,
      '',
    )
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function hashScore(value: string, min: number, max: number) {
  const hash = Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0)
  return min + (hash % (max - min + 1))
}

function toneForScore(value: number): Metric['tone'] {
  if (value >= 75) return 'good'
  if (value >= 50) return 'warn'
  return 'bad'
}

function statusForScore(value: number) {
  if (value >= 80) return 'Strong'
  if (value >= 65) return 'Competitive'
  if (value >= 50) return 'Needs improvement'
  return 'At risk'
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }
}

function scoreAudit(form: AuditForm) {
  const services = splitLines(form.services)
  const competitors = splitLines(form.competitors)
  const markets = splitLines(form.markets)
  const domain = domainFromUrl(form.url)
  const hasHttps = form.url.startsWith('https://')
  const contentDepth = Math.min(22, services.length * 3 + markets.length * 2)
  const entityDepth =
    Math.min(24, form.brand.length / 2) + Math.min(20, form.targetCustomer.length / 9)
  const competitorDepth = Math.min(14, competitors.length * 3)

  const entityClarity = clamp(35 + entityDepth + services.length * 4 + (hasHttps ? 6 : 0))
  const schemaReadiness = clamp(30 + services.length * 5 + markets.length * 4 + (hasHttps ? 8 : 0))
  const llmsReadiness = clamp(18 + (form.targetCustomer.length > 80 ? 14 : 6) + services.length * 4)
  const visibility = clamp(
    28 + contentDepth + entityClarity * 0.18 + schemaReadiness * 0.14 + competitorDepth,
  )
  const citationGap = clamp(86 - visibility + competitors.length * 2 + (markets.length < 3 ? 10 : 0))

  const metrics: Metric[] = [
    {
      label: 'Visibility score',
      value: visibility,
      unit: '/100',
      status: statusForScore(visibility),
      tone: toneForScore(visibility),
    },
    {
      label: 'Citation gap',
      value: citationGap,
      unit: '%',
      status: citationGap > 45 ? 'High' : citationGap > 25 ? 'Manageable' : 'Low',
      tone: citationGap > 45 ? 'bad' : citationGap > 25 ? 'warn' : 'good',
    },
    {
      label: 'Entity clarity',
      value: entityClarity,
      unit: '/100',
      status: statusForScore(entityClarity),
      tone: toneForScore(entityClarity),
    },
    {
      label: 'Schema readiness',
      value: schemaReadiness,
      unit: '/100',
      status: statusForScore(schemaReadiness),
      tone: toneForScore(schemaReadiness),
    },
    {
      label: 'llms.txt readiness',
      value: llmsReadiness,
      unit: '/100',
      status: statusForScore(llmsReadiness),
      tone: toneForScore(llmsReadiness),
    },
  ]

  const checklist = [
    { label: 'Crawlable', detail: hasHttps ? 'Likely yes' : 'Check URL protocol', ok: hasHttps },
    { label: 'Indexable', detail: 'Needs robots/meta check', ok: visibility > 45 },
    { label: 'HTTPS', detail: hasHttps ? 'Yes' : 'Missing', ok: hasHttps },
    { label: 'Brand mentions', detail: entityClarity > 70 ? 'Good' : 'Thin', ok: entityClarity > 70 },
    { label: 'NAP consistency', detail: markets.length >= 3 ? 'Good' : 'Weak', ok: markets.length >= 3 },
    { label: 'Review signals', detail: citationGap < 42 ? 'Good' : 'Fair', ok: citationGap < 42 },
    { label: 'llms.txt found', detail: llmsReadiness > 65 ? 'Likely' : 'No', ok: llmsReadiness > 65 },
  ]

  const competitorRows = [
    {
      domain,
      visibility,
      gap: citationGap,
      entity: entityClarity,
      schema: schemaReadiness,
      llms: llmsReadiness,
      own: true,
    },
    ...competitors.slice(0, 5).map((item) => {
      const competitorDomain = domainFromUrl(item)
      const competitorVisibility = hashScore(competitorDomain, 58, 88)
      return {
        domain: competitorDomain,
        visibility: competitorVisibility,
        gap: clamp(92 - competitorVisibility),
        entity: hashScore(`${competitorDomain}:entity`, 55, 88),
        schema: hashScore(`${competitorDomain}:schema`, 42, 84),
        llms: hashScore(`${competitorDomain}:llms`, 20, 78),
        own: false,
      }
    }),
  ]

  const fixes: Fix[] = [
    llmsReadiness < 70 && {
      title: 'Add an llms.txt file',
      detail: 'Give AI crawlers a concise map of service pages, pricing, locations, and citations.',
      priority: 'High',
      tone: 'bad',
    },
    schemaReadiness < 72 && {
      title: 'Publish LocalBusiness and Service schema',
      detail: 'Mark up address, service area, hours, reviews, FAQs, and core offers.',
      priority: 'High',
      tone: 'warn',
    },
    entityClarity < 72 && {
      title: 'Tighten entity copy on the homepage',
      detail: 'State who you serve, what you sell, where you operate, and why you are credible.',
      priority: 'Medium',
      tone: 'warn',
    },
    markets.length < 5 && {
      title: 'Create city and service-area pages',
      detail: 'AI answers need location-specific evidence, not one generic services page.',
      priority: 'Medium',
      tone: 'warn',
    },
    citationGap > 35 && {
      title: 'Build third-party citation proof',
      detail: 'Improve listings, review snippets, comparison mentions, and trusted directory coverage.',
      priority: citationGap > 50 ? 'High' : 'Medium',
      tone: citationGap > 50 ? 'bad' : 'warn',
    },
    {
      title: 'Ship answer-ready FAQ sections',
      detail: 'Turn buyer questions into short, sourced answers AI systems can quote.',
      priority: 'Low',
      tone: 'good',
    },
  ].filter(Boolean) as Fix[]

  return {
    domain,
    services,
    competitors,
    markets,
    metrics,
    checklist,
    competitorRows,
    fixes,
    scannedAt: new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date()),
  }
}

function App() {
  const [form, setForm] = useState(defaultForm)
  const [isExporting, setIsExporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const audit = useMemo(() => scoreAudit(form), [form])

  const updateField = (field: keyof AuditForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const exportPdf = async () => {
    if (!reportRef.current) return
    setIsExporting(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const imgWidth = pageWidth - 20
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`${audit.domain || 'aeo'}-snapshot.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  const salesEmail = `Subject: ${audit.domain} AI search visibility gap\n\nI ran a quick AEO Snapshot for ${audit.domain}. The model estimates a ${audit.metrics[0].value}/100 AI visibility score and a ${audit.metrics[1].value}% citation gap.\n\nThe first fixes I would ship are:\n${audit.fixes
    .slice(0, 3)
    .map((fix) => `- ${fix.title}: ${fix.detail}`)
    .join('\n')}\n\nI can deliver a full AI Search Visibility Audit for $149: competitor table, schema recommendations, llms.txt draft, and the first 10 priority fixes.\n\nWant me to send the full report?`

  const copySalesEmail = async () => {
    const didCopy = await copyText(salesEmail)
    if (didCopy) {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  const openOrder = () => {
    window.open(paymentLink || orderUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AEO Snapshot home">
          <span className="brand-mark">
            <SearchCheck size={23} strokeWidth={2.2} />
          </span>
          <span>
            <strong>AEO Snapshot</strong>
            <small>AI Search Visibility Audit</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#audit">
            New audit
          </a>
          <a href={sampleReportUrl}>Sample report</a>
          <a href="#market">Market proof</a>
          <a href="#playbook">Sales playbook</a>
        </nav>
        <button className="price-button" type="button" onClick={openOrder}>
          <Lock size={16} />
          $149 audit
        </button>
      </header>

      <main id="top">
        <section className="workspace" id="audit" aria-label="AI search visibility audit tool">
          <aside className="audit-form">
            <div className="section-title">
              <span className="step">1</span>
              <div>
                <h1>Generate a paid AI visibility audit</h1>
                <p>
                  Turn one prospect URL into a score, competitor gap, prioritized fixes, and a
                  sales-ready report.
                </p>
              </div>
            </div>

            <label>
              Website URL
              <span className="input-shell">
                <Globe2 size={16} />
                <input
                  value={form.url}
                  onChange={(event) => updateField('url', event.target.value)}
                  placeholder="https://example.com"
                />
              </span>
            </label>

            <label>
              Business or brand name
              <input
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                placeholder="BluePeak Plumbing"
              />
            </label>

            <label>
              Target customer
              <textarea
                value={form.targetCustomer}
                onChange={(event) => updateField('targetCustomer', event.target.value)}
                rows={4}
              />
            </label>

            <label>
              Top services
              <textarea
                value={form.services}
                onChange={(event) => updateField('services', event.target.value)}
                rows={3}
              />
              <small>Comma-separated services improve entity and schema scoring.</small>
            </label>

            <label>
              Competitors
              <textarea
                value={form.competitors}
                onChange={(event) => updateField('competitors', event.target.value)}
                rows={5}
              />
              <small>One competitor URL per line, up to five shown in the preview.</small>
            </label>

            <label>
              Markets and service areas
              <textarea
                value={form.markets}
                onChange={(event) => updateField('markets', event.target.value)}
                rows={3}
              />
            </label>

            <div className="segmented" aria-label="Audit depth">
              <button
                className={form.depth === 'standard' ? 'selected' : ''}
                type="button"
                onClick={() => setForm((current) => ({ ...current, depth: 'standard' }))}
              >
                Standard
              </button>
              <button
                className={form.depth === 'agency' ? 'selected' : ''}
                type="button"
                onClick={() => setForm((current) => ({ ...current, depth: 'agency' }))}
              >
                Agency
              </button>
            </div>

            <button className="primary-action" type="button" onClick={exportPdf}>
              {isExporting ? <RefreshCw className="spin" size={17} /> : <Download size={17} />}
              {isExporting ? 'Exporting report' : 'Download PDF report'}
            </button>
            <button className="secondary-action" type="button" onClick={copySalesEmail}>
              <Clipboard size={17} />
              {copied ? 'Copied sales email' : 'Copy sales email'}
            </button>
          </aside>

          <section className="report-panel" ref={reportRef}>
            <div className="report-header">
              <div>
                <p className="eyeline">Preview report</p>
                <h2>
                  {audit.domain || 'prospect-site.com'} - AI Search Visibility Audit
                </h2>
                <p>Scanned: {audit.scannedAt}</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => setForm({ ...form })}>
                <RefreshCw size={16} />
                Refresh preview
              </button>
            </div>

            <div className="metrics-grid">
              {audit.metrics.map((metric) => (
                <article className="metric" key={metric.label}>
                  <p>{metric.label}</p>
                  <strong className={`tone-${metric.tone}`}>
                    {metric.value}
                    <span>{metric.unit}</span>
                  </strong>
                  <small>{metric.status}</small>
                  <span className="meter" aria-hidden="true">
                    <span
                      className={`tone-${metric.tone}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </span>
                </article>
              ))}
            </div>

            <div className="checklist">
              <h3>AI answer readiness checklist</h3>
              <div>
                {audit.checklist.map((item) => (
                  <article key={item.label}>
                    {item.ok ? (
                      <CheckCircle2 className="tone-good" size={20} />
                    ) : (
                      <AlertTriangle className="tone-warn" size={20} />
                    )}
                    <span>{item.label}</span>
                    <small>{item.detail}</small>
                  </article>
                ))}
              </div>
            </div>

            <div className="report-split">
              <section className="competitors">
                <div className="panel-heading">
                  <h3>Competitors</h3>
                  <span>{audit.competitorRows.length} domains</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Domain</th>
                        <th>Visibility</th>
                        <th>Gap</th>
                        <th>Entity</th>
                        <th>Schema</th>
                        <th>llms.txt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {audit.competitorRows.map((row, index) => (
                        <tr key={`${row.domain}-${index}`} className={row.own ? 'own-row' : ''}>
                          <td>{row.domain}</td>
                          <td>{row.visibility}</td>
                          <td>{row.gap}%</td>
                          <td>{row.entity}</td>
                          <td>{row.schema}</td>
                          <td>{row.llms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="fixes">
                <div className="panel-heading">
                  <h3>Priority fixes</h3>
                  <span>First 30 days</span>
                </div>
                {audit.fixes.slice(0, 5).map((fix) => (
                  <article key={fix.title}>
                    {fix.tone === 'bad' ? (
                      <XCircle className="tone-bad" size={22} />
                    ) : fix.tone === 'warn' ? (
                      <AlertTriangle className="tone-warn" size={22} />
                    ) : (
                      <CheckCircle2 className="tone-good" size={22} />
                    )}
                    <div>
                      <strong>{fix.title}</strong>
                      <p>{fix.detail}</p>
                    </div>
                    <span className={`priority tone-${fix.tone}`}>{fix.priority}</span>
                  </article>
                ))}
              </section>
            </div>

            <div className="offer-strip">
              <div className="document-icon">
                <FileText size={34} />
              </div>
              <div>
                <h3>Get the full AI Search Visibility Audit</h3>
                <ul>
                  <li>40+ AEO checks across entity, citations, schema, and AI answer readiness</li>
                  <li>Competitor comparison and first 10 prioritized fixes</li>
                  <li>PDF report, llms.txt draft, and implementation checklist</li>
                  <li>Agency-friendly: resell as a $249+ white-label diagnostic</li>
                </ul>
              </div>
              <div className="checkout">
                <strong>$149</strong>
                <span>one-time audit</span>
                <a className="sample-link" href={sampleReportUrl}>
                  View sample report
                </a>
                <button type="button" onClick={openOrder}>
                  {paymentLink ? 'Pay and request audit' : 'Open audit bot'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </section>

        <section className="market-band" id="market">
          <div className="band-copy">
            <span className="section-number">2</span>
            <h2>Why this is sellable now</h2>
            <p>
              The wedge is a paid diagnostic for companies worried about disappearing search
              traffic. It is small enough to buy without procurement and urgent enough to pitch
              today.
            </p>
          </div>
          <div className="signals">
            {marketSignals.map((signal) => (
              <a href={signal.href} key={signal.source} target="_blank" rel="noreferrer">
                <strong>{signal.value}</strong>
                <span>{signal.source}</span>
                <p>{signal.text}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="playbook" id="playbook">
          <div>
            <span className="section-number">3</span>
            <h2>First $100 sales path</h2>
          </div>
          <div className="playbook-grid">
            <article>
              <BarChart3 size={22} />
              <h3>Prospect</h3>
              <p>
                Target local service businesses, SaaS tools, and SEO consultants already buying
                audits or content retainers.
              </p>
            </article>
            <article>
              <Sparkles size={22} />
              <h3>Personalize</h3>
              <p>
                Run their URL, export the preview PDF, and lead with one concrete visibility gap.
              </p>
            </article>
            <article>
              <Mail size={22} />
              <h3>Close</h3>
              <p>
                Offer the $149 full audit. One sale clears the $100 target before subscription
                infrastructure is needed.
              </p>
            </article>
            <article>
              <ShieldCheck size={22} />
              <h3>Deliver</h3>
              <p>
                Send the PDF, an llms.txt draft, schema snippets, and the first 10 fixes within 24
                hours.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
