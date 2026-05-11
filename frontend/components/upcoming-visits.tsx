'use client'

import Link from 'next/link'
import { Visit } from '@/lib/types'
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react'

interface UpcomingVisitsProps {
  visits: Visit[]
}

export function UpcomingVisits({ visits }: UpcomingVisitsProps) {
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

  return (
    <div className="space-y-3">
      {visits.map((visit) => {
        const { date, time } = formatDateTime(visit.scheduledDate)

        return (
          <Link
            key={visit.id}
            href={`/visitas/${visit.id}`}
            className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{visit.title}</p>
                {visit.clientName && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {visit.clientName}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {time}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        )
      })}
    </div>
  )
}
