'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { mockVisits } from '@/lib/mock-data'
import { Visit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  Play,
  ChevronRight,
  Building2,
  Filter,
} from 'lucide-react'

export default function VisitasPage() {
  const [visits] = useState<Visit[]>(mockVisits)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredVisits = visits.filter(visit => {
    if (statusFilter === 'all') return true
    return visit.status === statusFilter
  })

  const getStatusColor = (status: Visit['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-primary/10 text-primary'
      case 'in-progress':
        return 'bg-warning/10 text-warning'
      case 'completed':
        return 'bg-success/10 text-success'
      case 'cancelled':
        return 'bg-destructive/10 text-destructive'
    }
  }

  const getStatusText = (status: Visit['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Agendada'
      case 'in-progress':
        return 'Em andamento'
      case 'completed':
        return 'Concluída'
      case 'cancelled':
        return 'Cancelada'
    }
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

  const scheduledCount = visits.filter(v => v.status === 'scheduled').length
  const inProgressCount = visits.filter(v => v.status === 'in-progress').length
  const completedCount = visits.filter(v => v.status === 'completed').length

  return (
    <div className="min-h-screen">
      <Header title="Visitas" subtitle="Gerencie suas visitas" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Agendadas</p>
            <p className="text-2xl font-semibold text-primary">{scheduledCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Em Andamento</p>
            <p className="text-2xl font-semibold text-warning">{inProgressCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Concluídas</p>
            <p className="text-2xl font-semibold text-success">{completedCount}</p>
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
            <option value="scheduled">Agendadas</option>
            <option value="in-progress">Em andamento</option>
            <option value="completed">Concluídas</option>
          </select>
        </div>

        {/* Visit List */}
        <div className="space-y-3">
          {filteredVisits.map((visit) => {
            const { date, time } = formatDateTime(visit.scheduledDate)

            return (
              <Link
                key={visit.id}
                href={`/visitas/${visit.id}`}
                className="group block rounded-xl border border-border bg-card p-5 transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-foreground">{visit.title}</h3>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusColor(visit.status))}>
                        {getStatusText(visit.status)}
                      </span>
                    </div>

                    {visit.clientName && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {visit.clientName}
                      </div>
                    )}

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

                  <div className="flex items-center gap-3">
                    {visit.status === 'scheduled' && (
                      <Button size="sm" className="gap-1.5">
                        <Play className="h-4 w-4" />
                        Iniciar
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            )
          })}

          {filteredVisits.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma visita encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
