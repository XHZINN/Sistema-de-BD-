'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  ChevronLeft,
  Pencil,
  X,
  Check,
  Loader2,
  AlertCircle,
  Tag,
  AlignLeft,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Agendamento {
  id_agendamento: string
  id_cliente: string | null
  tipo_agendamento: string
  data: string
  urgencia: string
  local: string
  formato: string
  status: string
  observacao?: string
  cliente?: { nome: string }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const urgencyColor: Record<string, string> = {
  Baixa: 'bg-success/10 text-success border-success/20',
  Média: 'bg-warning/10 text-warning border-warning/20',
  Alta: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  Urgente: 'bg-destructive/10 text-destructive border-destructive/20',
}

const statusColor: Record<string, string> = {
  Agendada: 'bg-primary/10 text-primary border-primary/20',
  Concluída: 'bg-success/10 text-success border-success/20',
  Cancelada: 'bg-destructive/10 text-destructive border-destructive/20',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', colorClass)}>
      {label}
    </span>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AgendamentoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [agendamento, setAgendamento] = useState<Agendamento | null>(null)
  const [loadingPage, setLoadingPage] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Enums para os selects
  const [tiposVisita, setTiposVisita] = useState<string[]>([])
  const [formatosVisita, setFormatosVisita] = useState<string[]>([])
  const [prioridadeNivel, setPrioridadeNivel] = useState<string[]>([])
  const statusOptions = ['Agendada', 'Cancelada']

  // Modo edição
  const [editing, setEditing] = useState(false)
  const [loadingSave, setLoadingSave] = useState(false)
  const [form, setForm] = useState({
    tipo_agendamento: '',
    data: '',        // 'YYYY-MM-DD'
    time: '',        // 'HH:MM'
    urgencia: '',
    local: '',
    formato: '',
    status: '',
    observacao: '',
  })

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAgendamento()
    fetchEnums()
  }, [id])

  async function fetchAgendamento() {
    setLoadingPage(true)
    try {
      const res = await fetch(`${API}/agendamento/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      const data: Agendamento = await res.json()
      setAgendamento(data)
      const dt = new Date(data.data)
      setForm({
        tipo_agendamento: data.tipo_agendamento,
        data: dt.toISOString().split('T')[0],
        time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        urgencia: data.urgencia,
        local: data.local,
        formato: data.formato,
        status: data.status,
        observacao: data.observacao ?? '',
      })
    } catch {
      setNotFound(true)
    } finally {
      setLoadingPage(false)
    }
  }

  async function fetchEnums() {
    const [tipos, formatos, prioridades] = await Promise.all([
      fetch(`${API}/enum/tipo_visita`).then(r => r.json()),
      fetch(`${API}/enum/formato_visita`).then(r => r.json()),
      fetch(`${API}/enum/prioridade_nivel`).then(r => r.json()),
    ])
    setTiposVisita(tipos)
    setFormatosVisita(formatos)
    setPrioridadeNivel(prioridades)
  }

  // ── Salvar ─────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.tipo_agendamento || !form.data || !form.urgencia || !form.local || !form.formato || !form.status) return

    setLoadingSave(true)
    try {
      const body: Record<string, string | null> = {
        tipo_agendamento: form.tipo_agendamento,
        data: `${form.data}T${form.time}:00`,
        urgencia: form.urgencia,
        local: form.local,
        formato: form.formato,
        status: form.status,
        observacao: form.observacao || null,
      }

      const res = await fetch(`${API}/agendamento/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao atualizar')

      const updated: Agendamento = await res.json()
      setAgendamento(updated)
      setEditing(false)
    } finally {
      setLoadingSave(false)
    }
  }

  function cancelEdit() {
    if (!agendamento) return
    const dt = new Date(agendamento.data)
    setForm({
      tipo_agendamento: agendamento.tipo_agendamento,
      data: dt.toISOString().split('T')[0],
      time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      urgencia: agendamento.urgencia,
      local: agendamento.local,
      formato: agendamento.formato,
      status: agendamento.status,
      observacao: agendamento.observacao ?? '',
    })
    setEditing(false)
  }

  // ── Render helpers ─────────────────────────────────────────────────────

  const selectClass = 'w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  if (loadingPage) {
    return (
      <div className="min-h-screen">
        <Header title="Agendamento" subtitle="Carregando..." />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (notFound || !agendamento) {
    return (
      <div className="min-h-screen">
        <Header title="Agendamento" subtitle="Não encontrado" />
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Agendamento não encontrado</p>
          <Button variant="outline" onClick={() => router.push('/agendamentos')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const dt = new Date(agendamento.data)
  const dateLabel = dt.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timeLabel = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen">
      <Header
        title="Detalhes do Agendamento"
        subtitle={agendamento.cliente?.nome ?? 'Sem cliente vinculado'}
      />

      <div className="p-6">
        {/* Breadcrumb / Voltar */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-1 text-muted-foreground"
          onClick={() => router.push('/agendamentos')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Agendamentos
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Coluna principal ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Card de informações / formulário */}
            <div className="rounded-xl border border-border bg-card">

              {/* Header do card */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-semibold text-foreground">
                  {editing ? 'Editar Agendamento' : 'Informações'}
                </h2>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={loadingSave}>
                        <X className="mr-1.5 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={loadingSave}>
                        {loadingSave
                          ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          : <Check className="mr-1.5 h-4 w-4" />
                        }
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Pencil className="mr-1.5 h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {editing ? (
                  /* ── Formulário de edição ── */
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                          value={form.tipo_agendamento}
                          onChange={e => setForm({ ...form, tipo_agendamento: e.target.value })}
                          className={selectClass}
                        >
                          <option value="">Selecione</option>
                          {tiposVisita.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Formato</Label>
                        <select
                          value={form.formato}
                          onChange={e => setForm({ ...form, formato: e.target.value })}
                          className={selectClass}
                        >
                          <option value="">Selecione</option>
                          {formatosVisita.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Urgência</Label>
                        <select
                          value={form.urgencia}
                          onChange={e => setForm({ ...form, urgencia: e.target.value })}
                          className={selectClass}
                        >
                          <option value="">Selecione</option>
                          {prioridadeNivel.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          className={selectClass}
                        >
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Local</Label>
                      <Input
                        value={form.local}
                        onChange={e => setForm({ ...form, local: e.target.value })}
                        placeholder={form.formato === 'Online' ? 'Ex: meet' : 'Ex: Sede do cliente'}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={form.data}
                          onChange={e => setForm({ ...form, data: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={form.time}
                          onChange={e => setForm({ ...form, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Observação (opcional)</Label>
                      <Input
                        value={form.observacao}
                        onChange={e => setForm({ ...form, observacao: e.target.value })}
                        placeholder="Observações adicionais"
                      />
                    </div>
                  </div>
                ) : (
                  /* ── Visualização ── */
                  <div className="divide-y divide-border">
                    <InfoRow
                      icon={Tag}
                      label="Tipo"
                      value={agendamento.tipo_agendamento}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Data"
                      value={<span className="capitalize">{dateLabel}</span>}
                    />
                    <InfoRow
                      icon={Clock}
                      label="Horário"
                      value={timeLabel}
                    />
                    <InfoRow
                      icon={MapPin}
                      label="Local"
                      value={agendamento.local}
                    />
                    {agendamento.observacao && (
                      <InfoRow
                        icon={AlignLeft}
                        label="Observação"
                        value={agendamento.observacao}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar de status / meta ── */}
          <div className="space-y-4">

            {/* Status & badges */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    label={agendamento.status}
                    colorClass={statusColor[agendamento.status] ?? 'bg-secondary text-muted-foreground border-border'}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Urgência</span>
                  <Badge
                    label={agendamento.urgencia}
                    colorClass={urgencyColor[agendamento.urgencia] ?? 'bg-secondary text-muted-foreground border-border'}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Formato</span>
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {agendamento.formato}
                  </span>
                </div>
              </div>
            </div>

            {/* Cliente */}
            {agendamento.cliente && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Cliente</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {agendamento.cliente.nome}
                  </span>
                </div>
              </div>
            )}

            {/* ID (útil para debug/referência) */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Referência</h3>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {agendamento.id_agendamento}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}