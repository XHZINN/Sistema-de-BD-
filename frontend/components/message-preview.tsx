'use client'

import Link from 'next/link'
import { Message } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MessageSquare, Mail, Phone, ChevronRight } from 'lucide-react'

interface MessagePreviewProps {
  messages: Message[]
}

export function MessagePreview({ messages }: MessagePreviewProps) {
  const getChannelIcon = (channel: Message['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'phone':
        return <Phone className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getChannelColor = (channel: Message['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return 'bg-success/10 text-success'
      case 'email':
        return 'bg-primary/10 text-primary'
      case 'phone':
        return 'bg-warning/10 text-warning'
      default:
        return 'bg-secondary text-muted-foreground'
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h atrás`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  return (
    <div className="space-y-2">
      {messages.map((message) => (
        <Link
          key={message.id}
          href="/mensagens"
          className={cn(
            'group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/50',
            !message.read && 'border-primary/50'
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              getChannelColor(message.channel)
            )}
          >
            {getChannelIcon(message.channel)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-foreground">{message.clientName}</p>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatTime(message.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {message.content}
            </p>
          </div>

          {!message.read && (
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </Link>
      ))}
    </div>
  )
}
