import CampaignStatus from './components/CampaignStatus'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-5 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Micro-Donations</h1>
          <span className="inline-flex items-center gap-2 text-xs text-slate-600">
            <span className="size-2 rounded-full bg-emerald-500" /> Sepolia (testnet)
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <CampaignStatus />
      </main>
    </div>
  )
}
