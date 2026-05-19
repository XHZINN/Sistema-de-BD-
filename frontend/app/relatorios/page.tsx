'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  Eye,
  Calendar,
  Building2,
  CheckCircle,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const API = process.env.NEXT_PUBLIC_API_BACKEND

// ─── Types ─────────────────────────────────────────────────────────────────

interface Relatorio {
  id_relatorio: string
  id_visita: string
  tipo: string
  data_prevista: string
  status: string
  avancos: string | null
  proximo_passo: string | null
  cobranca_extra: boolean
  valor_extra: number | null
  duracao: number | null
  visitas?: {
    id_agendamento: string
    agendamentos?: {
      id_cliente: string
      cliente?: { nome: string }
    }
  }
}

interface Visita {
  id_visita: string
  id_agendamento: string
  hora_inicio: string
  nome_cliente: string | null
  local: string | null
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TIPOS = ['Visita', 'Análise', 'Recomendação', 'Acompanhamento']

const tipoColor: Record<string, string> = {
  'Visita':          'bg-primary/10 text-primary',
  'Análise':         'bg-chart-2/10 text-chart-2',
  'Recomendação':    'bg-warning/10 text-warning',
  'Acompanhamento':  'bg-success/10 text-success',
}

function clienteNome(r: Relatorio) {
  return r.visitas?.agendamentos?.cliente?.nome ?? '—'
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RelatoriosPage() {
  const router = useRouter()

  const [relatorios, setRelatorios] = useState<Relatorio[]>([])
  const [visitas, setVisitas]       = useState<Visita[]>([])
  const [visitaSearch, setVisitaSearch]       = useState('')
  const [visitaDateFrom, setVisitaDateFrom]   = useState('')
  const [visitaDateTo, setVisitaDateTo]       = useState('')
  const [loadingPage, setLoadingPage] = useState(true)
  const [loadingSave, setLoadingSave] = useState(false)

  const [searchTerm,   setSearchTerm]   = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tipoFilter,   setTipoFilter]   = useState('all')

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newRelatorio, setNewRelatorio] = useState({
    id_visita: '',
    tipo: 'Visita',
    data_prevista: new Date().toISOString().split('T')[0],
    status: 'Pendente',
    avancos: '',
    proximo_passo: '',
  })

  // ── Fetch ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchRelatorios()
    fetchVisitas()
  }, [])

  async function fetchRelatorios() {
    setLoadingPage(true)
    try {
      const res = await fetch(`${API}/relatorio/listar`)
      setRelatorios(await res.json())
    } finally {
      setLoadingPage(false)
    }
  }

  async function fetchVisitas() {
    const res = await fetch(`${API}/visitas/listar`)
    if (res.ok) setVisitas(await res.json())
  }

  // ── Criar ─────────────────────────────────────────────────────────────

  async function handleCreate() {
    if (!newRelatorio.id_visita || !newRelatorio.tipo || !newRelatorio.data_prevista) return
    setLoadingSave(true)
    try {
      const body = {
        id_visita: newRelatorio.id_visita,
        tipo: newRelatorio.tipo,
        data_prevista: newRelatorio.data_prevista,
        status: 'Pendente',
        avancos: newRelatorio.avancos || null,
        proximo_passo: newRelatorio.proximo_passo || null,
        cobranca_extra: false,
      }
      const res = await fetch(`${API}/relatorio/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const created: Relatorio = await res.json()
      setRelatorios(prev => [created, ...prev])
      setNewRelatorio({
        id_visita: '', tipo: 'Visita',
        data_prevista: new Date().toISOString().split('T')[0],
        status: 'Pendente', avancos: '', proximo_passo: '',
      })
      setIsDialogOpen(false)
      setVisitaSearch('')
      setVisitaDateFrom('')
      setVisitaDateTo('')
    } finally {
      setLoadingSave(false)
    }
  }

  // ── Enviar ────────────────────────────────────────────────────────────

  async function handleEnviar(id: string) {
    const res = await fetch(`${API}/relatorio/${id}/atualizar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Enviado' }),
    })
    if (!res.ok) return
    setRelatorios(prev => prev.map(r =>
      r.id_relatorio === id ? { ...r, status: 'Enviado' } : r
    ))
  }

  // ── Filtros ───────────────────────────────────────────────────────────

  const filtered = relatorios.filter(r => {
    const nome = clienteNome(r).toLowerCase()
    const matchSearch  = nome.includes(searchTerm.toLowerCase()) || r.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus  = statusFilter === 'all' || r.status === statusFilter
    const matchTipo    = tipoFilter   === 'all' || r.tipo   === tipoFilter
    return matchSearch && matchStatus && matchTipo
  })

  const totalCount    = relatorios.length
  const enviadoCount  = relatorios.filter(r => r.status === 'Enviado').length
  const pendenteCount = relatorios.filter(r => r.status === 'Pendente').length

  const selectClass = 'rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground'
  const selectFullClass = cn(selectClass, 'w-full')
  const visitasFiltradas = visitas
    .filter(v => {
      const matchNome = !visitaSearch ||
        (v.nome_cliente ?? '').toLowerCase().includes(visitaSearch.toLowerCase())
      const matchFrom = !visitaDateFrom ||
        v.hora_inicio >= visitaDateFrom
      const matchTo = !visitaDateTo ||
        v.hora_inicio <= visitaDateTo
      return matchNome && matchFrom && matchTo
    })

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header title="Relatórios" subtitle="Gerencie seus relatórios" />

      <div className="p-6">

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: 'Total',     value: totalCount,    color: 'text-foreground' },
            { label: 'Enviados',  value: enviadoCount,  color: 'text-success'    },
            { label: 'Pendentes', value: pendenteCount, color: 'text-warning'    },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-semibold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters + Novo */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou tipo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={tipoFilter}   onChange={e => setTipoFilter(e.target.value)}   className={selectClass}>
                <option value="all">Todos os tipos</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
                <option value="all">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Enviado">Enviado</option>
              </select>
            </div>
          </div>

          {/* Dialog – Novo Relatório */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Relatório</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>Criar Novo Relatório</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">

                <div className="space-y-2">
                  <Label>Visita</Label>

                  {/* Filtros de busca */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar cliente..."
                      value={visitaSearch}
                      onChange={e => setVisitaSearch(e.target.value)}
                      className="flex-1"
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">De</span>
                      <Input 
                        type="date"
                        value={visitaDateFrom}
                        onChange={e => setVisitaDateFrom(e.target.value)}
                        className="w-36 [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">Até</span>
                      <Input
                        type="date"
                        value={visitaDateTo}
                        onChange={e => setVisitaDateTo(e.target.value)}
                        className="w-36 [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  {/* Lista de visitas filtradas */}
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                    {visitasFiltradas.length === 0 ? (
                      <p className="p-3 text-sm text-muted-foreground text-center">
                        Nenhuma visita encontrada
                      </p>
                    ) : (
                      visitasFiltradas.map(v => (
                        <button
                          key={v.id_visita}
                          type="button"
                          onClick={() => setNewRelatorio({ ...newRelatorio, id_visita: v.id_visita })}
                          className={cn(
                            'w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary',
                            'flex items-center justify-between gap-2',
                            newRelatorio.id_visita === v.id_visita && 'bg-primary/10 text-primary font-medium'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                            {v.nome_cliente ?? '—'}
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatDate(v.hora_inicio)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Visita selecionada */}
                  {newRelatorio.id_visita && (() => {
                    const v = visitas.find(v => v.id_visita === newRelatorio.id_visita)
                    return v ? (
                      <p className="text-xs text-muted-foreground">
                        ✓ Selecionado: <strong>{v.nome_cliente}</strong> — {formatDate(v.hora_inicio)}
                      </p>
                    ) : null
                  })()}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <select
                      value={newRelatorio.tipo}
                      onChange={e => setNewRelatorio({ ...newRelatorio, tipo: e.target.value })}
                      className={selectFullClass}
                    >
                      {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Prevista</Label>
                    <Input
                      type="date"
                      value={newRelatorio.data_prevista}
                      onChange={e => setNewRelatorio({ ...newRelatorio, data_prevista: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Avanços (opcional)</Label>
                  <Input
                    value={newRelatorio.avancos}
                    onChange={e => setNewRelatorio({ ...newRelatorio, avancos: e.target.value })}
                    placeholder="O que foi avançado nesta visita..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Próximo Passo (opcional)</Label>
                  <Input
                    value={newRelatorio.proximo_passo}
                    onChange={e => setNewRelatorio({ ...newRelatorio, proximo_passo: e.target.value })}
                    placeholder="O que deve ser feito a seguir..."
                  />
                </div>

                <Button
                  onClick={handleCreate}
                  className="w-full"
                  disabled={loadingSave || !newRelatorio.id_visita || !newRelatorio.data_prevista}
                >
                  {loadingSave
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Plus className="mr-2 h-4 w-4" />
                  }
                  Criar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        {loadingPage ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => (
              <div key={r.id_relatorio} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <h3 className="font-medium text-foreground">{r.tipo}</h3>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', tipoColor[r.tipo] ?? 'bg-secondary text-muted-foreground')}>
                        {r.tipo}
                      </span>
                      {r.status === 'Enviado' && (
                        <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                          <CheckCircle className="h-3 w-3" />Enviado
                        </span>
                      )}
                    </div>

                    {r.avancos && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.avancos}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" />{clienteNome(r)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />{formatDate(r.data_prevista)}
                      </span>
                      {r.cobranca_extra && r.valor_extra != null && (
                        <span className="text-warning">
                          Cobrança extra: R$ {r.valor_extra.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/relatorios/${r.id_relatorio}`)}
                    >
                      <Eye className="mr-1 h-4 w-4" />Ver
                    </Button>
                    {r.status !== 'Enviado' && (
                      <Button size="sm" onClick={() => handleEnviar(r.id_relatorio)}>
                        <Send className="mr-1 h-4 w-4" />Enviar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Nenhum relatório encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}