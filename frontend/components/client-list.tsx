'use client'

import Link from 'next/link'
import { Client } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronRight, Building2 } from 'lucide-react'

interface ClientListProps {
  clients: Client[]
  compact?: boolean
}

export function ClientList({ clients, compact = false }: ClientListProps) {
  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success'
      case 'pending':
        return 'bg-warning'
      case 'inactive':
        return 'bg-muted-foreground'
    }
  }

  const getStatusText = (status: Client['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'pending':
        return 'Pendente'
      case 'inactive':
        return 'Inativo'
    }
  }

  return (
    <div className="space-y-2">
      {clients.map((client) => (
        <Link
          key={client.id}
          href={`/clientes/${client.id}`}
          className="group flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{client.name}</p>
              {!compact && (
                <p className="text-sm text-muted-foreground">{client.company}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className={cn('h-2 w-2 rounded-full', getStatusColor(client.status))}
              />
              <span className="text-sm text-muted-foreground">
                {getStatusText(client.status)}
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ))}
    </div>
  )
}
