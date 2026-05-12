'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Plus,
  Building2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  MapPin,
  AlertCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Agendamento {
  id_agendamento: string
  id_cliente: string
  tipo_agendamento: string
  data: string
  urgencia: string
  local: string
  formato: string
  status: string
  observacao?: string
  cliente?: { nome: string }
}

interface Cliente {
  id_cliente: string
  nome: string
}

// ─── Scroll Time Picker ────────────────────────────────────────────────────
function ScrollPicker({
  items,
  value,
  onChange,
}: {
  items: string[]
  value: string
  onChange: (v: string) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const itemHeight = 40
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartScroll = useRef(0)

  useEffect(() => {
    const idx = items.indexOf(value)
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTop = idx * itemHeight
    }
  }, [value, items])

  const snapToNearest = () => {
    if (!containerRef.current) return
    const idx = Math.round(containerRef.current.scrollTop / itemHeight)
    const clamped = Math.max(0, Math.min(idx, items.length - 1))
    containerRef.current.scrollTop = clamped * itemHeight
    if (items[clamped] !== value) onChange(items[clamped])
  }

  // Scroll: avança exatamente 1 item por tick, sem imprecisão
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current) return
    const currentIdx = Math.round(containerRef.current.scrollTop / itemHeight)
    const nextIdx = Math.max(0, Math.min(currentIdx + (e.deltaY > 0 ? 1 : -1), items.length - 1))
    containerRef.current.scrollTop = nextIdx * itemHeight
    if (items[nextIdx] !== value) onChange(items[nextIdx])
  }

  // Drag: preventDefault no mousedown evita seleção de texto
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return
    e.preventDefault()
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartScroll.current = containerRef.current.scrollTop

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      containerRef.current.scrollTop = dragStartScroll.current + (dragStartY.current - ev.clientY)
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      snapToNearest()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <div className="relative h-[120px] w-16 overflow-hidden rounded-lg border border-border bg-secondary">
      {/* selection highlight */}
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-10 -translate-y-1/2 rounded-md bg-primary/15 border-y border-primary/30 z-10" />
      {/* fade top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-secondary to-transparent z-10" />
      {/* fade bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-secondary to-transparent z-10" />
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        className="h-full overflow-y-scroll scrollbar-none snap-y snap-mandatory cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', userSelect: 'none' }}
      >
        {/* padding top/bottom so first/last items center */}
        <div style={{ height: 40 }} />
        {items.map(item => (
          <div
            key={item}
            className={cn(
              'flex h-10 snap-center items-center justify-center text-sm font-medium transition-colors',
              item === value ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {item}
          </div>
        ))}
        <div style={{ height: 40 }} />
      </div>
    </div>
  )
}

function TimePicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  const [h, m] = value ? value.split(':') : ['08', '00']

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">Horário</p>
      <div className="flex items-center gap-1">
        <ScrollPicker
          items={hours}
          value={h}
          onChange={newH => onChange(`${newH}:${m}`)}
        />
        <span className="text-lg font-semibold text-foreground">:</span>
        <ScrollPicker
          items={minutes}
          value={m}
          onChange={newM => onChange(`${h}:${newM}`)}
        />
      </div>
      <p className="text-sm font-medium text-foreground">{h}:{m}</p>
    </div>
  )
}

// ─── Mini Calendar Picker ──────────────────────────────────────────────────
function CalendarPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const selected = value ? new Date(value + 'T12:00:00') : null
  const [viewDate, setViewDate] = useState(selected ?? new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
  const today = new Date()

  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)

  const monthLabel = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const isSelected = (d: number) => {
    if (!selected) return false
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d
  }

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d

  const select = (d: number) => {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onChange(`${year}-${mm}-${dd}`)
  }

  return (
    <div className="w-full rounded-lg border border-border bg-secondary/40 p-3">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="rounded p-1 hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-medium capitalize text-foreground">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="rounded p-1 hover:bg-secondary"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map((w, i) => (
          <div key={i} className="py-1 text-center text-xs font-medium text-muted-foreground">{w}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className="aspect-square">
            {d && (
              <button
                type="button"
                onClick={() => select(d)}
                className={cn(
                  'h-full w-full rounded-full text-xs transition-colors',
                  isSelected(d) && 'bg-primary text-primary-foreground font-semibold',
                  !isSelected(d) && isToday(d) && 'border border-primary text-primary',
                  !isSelected(d) && !isToday(d) && 'text-foreground hover:bg-secondary'
                )}
              >
                {d}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [tiposVisita, setTiposVisita] = useState<string[]>([])
  const [formatosVisita, setFormatosVisita] = useState<string[]>([])
  const [prioridadeNivel, setPrioridadeNivel] = useState<string[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // dia selecionado no calendário → abre painel lateral
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const [novoAgendamento, setNovoAgendamento] = useState({
    id_cliente: '',
    tipo_agendamento: '',
    scheduledDate: '',
    scheduledTime: '08:00',
    urgencia: '',
    local: '',
    formato: '',
    status: 'Agendada',
    observacao: '',
  })

  useEffect(() => {
    fetchAgendamentos()
    fetchClientes()
    fetchEnums()
  }, [])

  async function fetchAgendamentos() {
    const res = await fetch(`${API}/agendamento/listar`)
    const data = await res.json()
    setAgendamentos(data)
  }

  async function fetchClientes() {
    const res = await fetch(`${API}/cliente/listar`)
    const data = await res.json()
    setClientes(Array.isArray(data) ? data : data.clientes ?? data.data ?? [])
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

  // Abre dialog com a data já preenchida
  function openDialogForDay(day: number) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    setNovoAgendamento(prev => ({ ...prev, scheduledDate: `${year}-${month}-${dd}` }))
    setIsDialogOpen(true)
  }

  async function handleCadastrar() {
    if (!novoAgendamento.tipo_agendamento || !novoAgendamento.scheduledDate || !novoAgendamento.local || !novoAgendamento.urgencia) return

    setLoading(true)
    try {
      const body = {
        id_cliente: novoAgendamento.id_cliente || null,
        tipo_agendamento: novoAgendamento.tipo_agendamento,
        data: `${novoAgendamento.scheduledDate}T${novoAgendamento.scheduledTime}:00`,
        urgencia: novoAgendamento.urgencia,
        local: novoAgendamento.local,
        formato: novoAgendamento.formato,
        status: novoAgendamento.status,
        observacao: novoAgendamento.observacao || null,
      }

      const res = await fetch(`${API}/agendamento/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Erro ao cadastrar')

      await fetchAgendamentos()
      setNovoAgendamento({
        id_cliente: '', tipo_agendamento: '', scheduledDate: '',
        scheduledTime: '08:00', urgencia: '', local: '', formato: '',
        status: 'Agendada', observacao: '',
      })
      setIsDialogOpen(false)
    } finally {
      setLoading(false)
    }
  }

  // ─── Calendário ───────────────────────────────────────────────────────────
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days: (number | null)[] = []
    for (let i = 0; i < new Date(year, month, 1).getDay(); i++) days.push(null)
    for (let i = 1; i <= new Date(year, month + 1, 0).getDate(); i++) days.push(i)
    return days
  }

  const getAgendamentosForDay = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return agendamentos.filter(a => {
      const d = new Date(a.data)
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  const today = new Date()
  const isToday = (day: number) =>
    day === today.getDate() &&
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  const days = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const upcomingAgendamentos = agendamentos
    .filter(a => new Date(a.data) >= new Date() && a.status === 'Agendada')
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .slice(0, 5)

  const selectedDayAgendamentos = selectedDay ? getAgendamentosForDay(selectedDay) : []

  const urgencyColor: Record<string, string> = {
    'Baixa': 'bg-success/10 text-success',
    'Média': 'bg-warning/10 text-warning',
    'Alta': 'bg-orange-500/10 text-orange-500',
    'Urgente': 'bg-destructive/10 text-destructive',
  }

  const cardColor: Record<string, string> = {
    'Cancelada': 'opacity-50 grayscale',
    'Urgente': 'border-destructive/50 bg-destructive/5',
  }

  return (
    <div className="min-h-screen">
      <Header title="Agendamentos" subtitle="Calendário de visitas" />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Calendário ── */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <Button variant="ghost" size="icon" onClick={() =>
                  setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
                }>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold capitalize text-foreground">{monthYear}</h2>
                <Button variant="ghost" size="icon" onClick={() =>
                  setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
                }>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-4">
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const dayAgendamentos = day ? getAgendamentosForDay(day) : []
                    const isSelected = selectedDay === day

                    return (
                      <div
                        key={index}
                        onClick={() => day && setSelectedDay(isSelected ? null : day)}
                        className={cn(
                          'min-h-24 rounded-lg border p-2 transition-colors',
                          day && 'cursor-pointer hover:border-border hover:bg-secondary/50',
                          day && !isSelected && 'border-transparent',
                          day && isToday(day) && !isSelected && 'border-primary/30 bg-primary/5',
                          day && isSelected && 'border-primary bg-primary/10',
                        )}
                      >
                        {day && (
                          <>
                            <span className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                              isToday(day) && 'bg-primary font-semibold text-primary-foreground'
                            )}>
                              {day}
                            </span>
                            <div className="mt-1 space-y-1">
                              {dayAgendamentos.slice(0, 2).map(a => (
                                <div
                                  key={a.id_agendamento}
                                  className={cn('truncate rounded px-1.5 py-0.5 text-xs font-medium',a.status === 'Cancelada' && 'bg-secondary text-muted-foreground line-through',a.urgencia === 'Urgente' && a.status !== 'Cancelada' && 'bg-destructive/10 text-destructive',a.status !== 'Cancelada' && a.urgencia !== 'Urgente' && 'bg-primary/10 text-primary')}
                                >
                                  <span className="flex items-center gap-1">
                                  {a.status === 'Concluída' && <Check className="h-3 w-3 shrink-0 text-success" />}
                                  {a.cliente?.nome ?? a.local ?? a.observacao?.slice(0, 30)}
                                  </span>
                                </div>
                              ))}
                              {dayAgendamentos.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayAgendamentos.length - 2} mais
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Painel do dia selecionado ── */}
            {selectedDay && (
              <div className="mt-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h3 className="font-semibold text-foreground">
                    {selectedDay} de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => openDialogForDay(selectedDay)}>
                      <Plus className="mr-1.5 h-4 w-4" />
                      Novo agendamento
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4">
                  {selectedDayAgendamentos.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">Nenhum agendamento neste dia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDayAgendamentos.map(a => {
                        const date = new Date(a.data)
                        return (
                          <Link key={a.id_agendamento} href={`/agendamentos/${a.id_agendamento}`} className={cn('flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60',a.status === 'Cancelada' && cardColor['Cancelada'],a.urgencia === 'Urgente' && a.status !== 'Cancelada' && cardColor['Urgente'])}>
                            <div className="flex flex-col items-center pt-0.5">
                              <span className="text-sm font-semibold text-foreground">
                                {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                {a.status === 'Concluída' && <Check className="h-3 w-3 shrink-0 text-success" />}
                                {a.cliente?.nome ?? a.local ?? a.observacao?.slice(0, 30)}
                                </span>
                                <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', urgencyColor[a.urgencia] ?? 'bg-secondary text-muted-foreground')}>
                                  {a.urgencia}
                                </span>
                                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                                  {a.formato}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {a.local}
                              </div>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            <Button className="w-full" onClick={() => {
              setNovoAgendamento(prev => ({ ...prev, scheduledDate: '' }))
              setIsDialogOpen(true)
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Agendamento
            </Button>

            {/* Próximos */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Próximos Agendamentos</h3>
              </div>
              <div className="space-y-3 p-4">
                {upcomingAgendamentos.length > 0 ? (
                  upcomingAgendamentos.map(a => {
                    const date = new Date(a.data)
                    return (
                      <Link key={a.id_agendamento} href={`/agendamentos/${a.id_agendamento}`} className={cn('block rounded-lg border border-border bg-secondary/30 p-3 transition-colors hover:bg-secondary/60',a.status === 'Cancelada' && cardColor['Cancelada'],a.urgencia === 'Urgente' && a.status !== 'Cancelada' && cardColor['Urgente'])}>
                        <p className="font-medium text-foreground">
                          <span className="flex items-center gap-1">
                          {a.status === 'Concluída' && <Check className="h-3 w-3 shrink-0 text-success" />}
                          {a.cliente?.nome ?? a.local ?? a.observacao?.slice(0, 30)}
                          </span>
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </Link>
                    )
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">Nenhum agendamento futuro</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-foreground">Este Mês</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {agendamentos.filter(a => {
                      const d = new Date(a.data)
                      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Agendamentos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-success">
                    {agendamentos.filter(a => {
                      const d = new Date(a.data)
                      return d.getMonth() === currentDate.getMonth() &&
                        d.getFullYear() === currentDate.getFullYear() &&
                        a.status === 'Concluída'
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog de cadastro ── */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>Preencha os dados do agendamento</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  value={novoAgendamento.tipo_agendamento}
                  onChange={e => setNovoAgendamento({ ...novoAgendamento, tipo_agendamento: e.target.value })}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {tiposVisita.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <select
                  value={novoAgendamento.formato}
                  onChange={e => {
                    const fmt = e.target.value
                    setNovoAgendamento({
                      ...novoAgendamento,
                      formato: fmt,
                    })
                  }}
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                >
                  <option value="">Selecione</option>
                  {formatosVisita.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Urgência</Label>
              <select
                value={novoAgendamento.urgencia}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, urgencia: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="">Selecione</option>
                {prioridadeNivel.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Cliente (opcional)</Label>
              <select
                value={novoAgendamento.id_cliente}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, id_cliente: e.target.value })}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
              >
                <option value="">Sem cliente específico</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={novoAgendamento.local}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, local: e.target.value })}
                placeholder={novoAgendamento.formato === 'Online' ? 'Ex: Google Meet' : 'Ex: Sede do cliente'}
              />
            </div>

            {/* Data (calendário visual) */}
            <div className="space-y-2">
              <Label>Data</Label>
              <CalendarPicker
                value={novoAgendamento.scheduledDate}
                onChange={v => setNovoAgendamento({ ...novoAgendamento, scheduledDate: v })}
              />
              {novoAgendamento.scheduledDate && (
                <p className="text-xs text-muted-foreground">
                  Selecionado: {new Date(novoAgendamento.scheduledDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>

            {/* Horário (scroll picker) */}
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="flex justify-center rounded-lg border border-border bg-secondary/40 py-4">
                <TimePicker
                  value={novoAgendamento.scheduledTime}
                  onChange={v => setNovoAgendamento({ ...novoAgendamento, scheduledTime: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Input
                value={novoAgendamento.observacao}
                onChange={e => setNovoAgendamento({ ...novoAgendamento, observacao: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>

            <Button
              onClick={handleCadastrar}
              className="w-full"
              disabled={
                loading ||
                !novoAgendamento.tipo_agendamento ||
                !novoAgendamento.scheduledDate ||
                !novoAgendamento.urgencia ||
                !novoAgendamento.local ||
                !novoAgendamento.formato
              }
            >
              {loading ? 'Salvando...' : 'Agendar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}