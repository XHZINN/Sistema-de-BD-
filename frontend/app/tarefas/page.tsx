'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Filter, Loader2, CheckCircle2,
  Circle, AlertTriangle, Clock, Tag,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const API = process.env.NEXT_PUBLIC_API_BACKEND

type Origem  = 'Atendimento' | 'WhatsApp' | 'Lembrete pessoal' | 'Ligação rápida'
type Prioridade = 'Baixa' | 'Média' | 'Alta' | 'Urgente'
type Status = 'Pendente' | 'Em andamento' | 'Concluída'

interface Tarefa {
  id_tarefa: string
  id_cliente: string | null
  descricao: string
  origem: Origem
  prioridade: Prioridade
  status: Status
  id_agendamento: string | null
}

interface Cliente {
  id_cliente: string
  nome: string
}

const ORIGENS: Origem[]     = ['Atendimento', 'WhatsApp', 'Lembrete pessoal', 'Ligação rápida']
const PRIORIDADES: Prioridade[] = ['Baixa', 'Média', 'Alta', 'Urgente']
const STATUS_OPTS: Status[] = ['Pendente', 'Em andamento', 'Concluída']

const prioridadeColor: Record<Prioridade, string> = {
  Baixa:   'bg-success/10 text-success border-success/20',
  Média:   'bg-warning/10 text-warning border-warning/20',
  Alta:    'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Urgente: 'bg-destructive/10 text-destructive border-destructive/20',
}

const origemColor: Record<Origem, string> = {
  'Atendimento':     'bg-primary/10 text-primary',
  'WhatsApp':        'bg-success/10 text-success',
  'Lembrete pessoal':'bg-secondary text-muted-foreground',
  'Ligação rápida':  'bg-warning/10 text-warning',
}

export default function TarefasPage() {
  const [tarefas, setTarefas]   = useState<Tarefa[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading]   = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState<string | null>(null)

  const [search, setSearch]           = useState('')
  const [filtroStatus, setFiltroStatus]       = useState<string>('all')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [novaTarefa, setNovaTarefa] = useState({
    descricao: '',
    origem: '' as Origem | '',
    prioridade: '' as Prioridade | '',
    status: 'Pendente' as Status,
    id_cliente: '',
  })

  useEffect(() => {
    fetchTarefas()
    fetchClientes()
  }, [])

  async function fetchTarefas() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`${API}/tarefas/listar`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setTarefas(await res.json())
    } catch {
      setErro('Não foi possível carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchClientes() {
    try {
      const res = await fetch(`${API}/cliente/listar`)
      if (res.ok) setClientes(await res.json())
    } catch {}
  }

  async function handleCadastrar() {
    if (!novaTarefa.descricao || !novaTarefa.origem || !novaTarefa.prioridade) return
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch(`${API}/tarefas/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          descricao:  novaTarefa.descricao,
          origem:     novaTarefa.origem,
          prioridade: novaTarefa.prioridade,
          status:     novaTarefa.status,
          id_cliente: novaTarefa.id_cliente || null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao cadastrar')
      await fetchTarefas()
      setNovaTarefa({ descricao: '', origem: '', prioridade: '', status: 'Pendente', id_cliente: '' })
      setDialogOpen(false)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleToggleStatus(tarefa: Tarefa) {
    const proximo: Record<Status, Status> = {
      'Pendente':     'Em andamento',
      'Em andamento': 'Concluída',
      'Concluída':    'Pendente',
    }
    const novoStatus = proximo[tarefa.status]
    // Otimista
    setTarefas(prev => prev.map(t => t.id_tarefa === tarefa.id_tarefa ? { ...t, status: novoStatus } : t))
    try {
      await fetch(`${API}/tarefas/${tarefa.id_tarefa}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      })
    } catch {
      // Reverte se falhar
      setTarefas(prev => prev.map(t => t.id_tarefa === tarefa.id_tarefa ? { ...t, status: tarefa.status } : t))
    }
  }

  const filtradas = tarefas.filter(t => {
    const matchSearch      = t.descricao.toLowerCase().includes(search.toLowerCase())
    const matchStatus      = filtroStatus      === 'all' || t.status      === filtroStatus
    const matchPrioridade  = filtroPrioridade  === 'all' || t.prioridade  === filtroPrioridade
    return matchSearch && matchStatus && matchPrioridade
  })

  const pendentes    = tarefas.filter(t => t.status === 'Pendente').length
  const andamento    = tarefas.filter(t => t.status === 'Em andamento').length
  const concluidas   = tarefas.filter(t => t.status === 'Concluída').length
  const urgentes     = tarefas.filter(t => t.prioridade === 'Urgente' && t.status !== 'Concluída').length

  const selectClass = 'rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground'

  return (
    <div className="min-h-screen">
      <Header title="Tarefas" subtitle="Gerencie suas pendências" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Pendentes',    value: pendentes,  color: 'text-warning'     },
            { label: 'Em andamento', value: andamento,  color: 'text-primary'     },
            { label: 'Concluídas',   value: concluidas, color: 'text-success'     },
            { label: 'Urgentes',     value: urgentes,   color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-semibold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros + botão */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar tarefa..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={filtroStatus}     onChange={e => setFiltroStatus(e.target.value)}     className={selectClass}>
                <option value="all">Todos status</option>
                {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filtroPrioridade} onChange={e => setFiltroPrioridade(e.target.value)} className={selectClass}>
                <option value="all">Todas prioridades</option>
                {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Tarefa</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Tarefa</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label>Descrição *</Label>
                  <Input
                    value={novaTarefa.descricao}
                    onChange={e => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                    placeholder="O que precisa ser feito..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Origem *</Label>
                    <select
                      value={novaTarefa.origem}
                      onChange={e => setNovaTarefa({ ...novaTarefa, origem: e.target.value as Origem })}
                      className={'w-full ' + selectClass}
                    >
                      <option value="">Selecione</option>
                      {ORIGENS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridade *</Label>
                    <select
                      value={novaTarefa.prioridade}
                      onChange={e => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value as Prioridade })}
                      className={'w-full ' + selectClass}
                    >
                      <option value="">Selecione</option>
                      {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Cliente (opcional)</Label>
                  <select
                    value={novaTarefa.id_cliente}
                    onChange={e => setNovaTarefa({ ...novaTarefa, id_cliente: e.target.value })}
                    className={'w-full ' + selectClass}
                  >
                    <option value="">Sem cliente específico</option>
                    {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>)}
                  </select>
                </div>
                {erro && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}
                <Button
                  onClick={handleCadastrar}
                  className="w-full"
                  disabled={salvando || !novaTarefa.descricao || !novaTarefa.origem || !novaTarefa.prioridade}
                >
                  {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : erro && tarefas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" onClick={fetchTarefas} className="mt-4">Tentar novamente</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtradas.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhuma tarefa encontrada</p>
              </div>
            ) : filtradas.map(t => (
              <div
                key={t.id_tarefa}
                className={cn(
                  'flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors',
                  t.status === 'Concluída' && 'opacity-60'
                )}
              >
                {/* Toggle status */}
                <button
                  onClick={() => handleToggleStatus(t)}
                  className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                >
                  {t.status === 'Concluída' ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : t.status === 'Em andamento' ? (
                    <Clock className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={cn('font-medium text-foreground', t.status === 'Concluída' && 'line-through')}>
                    {t.descricao}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', prioridadeColor[t.prioridade])}>
                      {t.prioridade === 'Urgente' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                      {t.prioridade}
                    </span>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs', origemColor[t.origem])}>
                      <Tag className="mr-1 inline h-3 w-3" />{t.origem}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                      {t.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}