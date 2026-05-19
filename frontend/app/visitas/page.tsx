'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  ChevronRight,
  Building2,
  Filter,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Agendamento {
  id_agendamento: string
  data: string
  cliente: { nome: string } | null
  local: string
  tipo_agendamento: string
  urgencia: string
  formato: string
  status: string
}

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
  fetch(`${API}/agendamento/listar?tipo_agendamento=Visita`)
    .then(r => r.json())
    .then(data => setVisitas(data.filter((v: Agendamento) => v.cliente !== null)))
    .finally(() => setLoading(false))
}, [])

  const filteredvisitas = visitas.filter(v => {
    if (statusFilter === 'all') return true
    return v.status === statusFilter
  })

  const statusColor: Record<string, string> = {
  'Agendada':    'bg-primary/10 text-primary',
  'Em Andamento': 'bg-warning/10 text-warning',
  'Concluída':   'bg-success/10 text-success',
  'Cancelada':   'bg-destructive/10 text-destructive',
}

  const formatDateTime = (date: string) => {
    const d = new Date(date)
    return {
      date: d.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      }),
      time: d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  }

  const totalCount     = visitas.length
  const concluidaCount = visitas.filter(v => v.status === 'Concluída').length
  const agendadaCount  = visitas.filter(v => v.status === 'Agendada').length

  return (
    <div className="min-h-screen">
      <Header title="Visitas" subtitle="Gerencie suas visitas" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Agendadas</p>
            <p className="text-2xl font-semibold text-primary">{agendadaCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Concluídas</p>
            <p className="text-2xl font-semibold text-success">{concluidaCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="all">Todas</option>
            <option value="Agendada">Agendadas</option>
            <option value="Concluída">Concluídas</option>
            <option value="Cancelada">Canceladas</option>
          </select>
        </div>

        {/* Visit List */}
        <div className="space-y-3">
          {filteredvisitas.map((v) => {
            const { date, time } = formatDateTime(v.data)

            return (
              <Link
                key={v.id_agendamento}
                href={`/visitas/${v.id_agendamento}`}
                className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground">{v.cliente?.nome ?? v.local ?? '—'}</h3>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusColor[v.status] ?? 'bg-secondary text-muted-foreground')}>
                        {v.status}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      {v.local ?? '—'}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {time}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            )
          })}

          {filteredvisitas.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma visita encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
