'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { mockMessages, mockClients } from '@/lib/mock-data'
import { Message } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Search,
  Filter,
  Check,
  CheckCheck,
  ArrowRight,
  Building2,
} from 'lucide-react'

export default function MensagensPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [channelFilter, setChannelFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')

  const filteredMessages = messages.filter(message => {
    const matchesChannel = channelFilter === 'all' || message.channel === channelFilter
    const matchesSearch = 
      message.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesChannel && matchesSearch
  })

  const unreadCount = messages.filter(m => !m.read && m.direction === 'incoming').length

  const handleSelectMessage = (message: Message) => {
    setSelectedMessage(message)
    if (!message.read && message.direction === 'incoming') {
      setMessages(prev => prev.map(m => 
        m.id === message.id ? { ...m, read: true } : m
      ))
    }
  }

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return

    const reply: Message = {
      id: String(Date.now()),
      clientId: selectedMessage.clientId,
      clientName: selectedMessage.clientName,
      channel: selectedMessage.channel,
      content: replyText,
      direction: 'outgoing',
      read: true,
      createdAt: new Date().toISOString(),
    }

    setMessages([reply, ...messages])
    setReplyText('')
  }

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

  const getChannelName = (channel: Message['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return 'WhatsApp'
      case 'email':
        return 'E-mail'
      case 'phone':
        return 'Telefone'
      default:
        return 'Outro'
    }
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const formatFullDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Group messages by client for conversation view
  const clientMessages = selectedMessage 
    ? messages.filter(m => m.clientId === selectedMessage.clientId).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    : []

  return (
    <div className="min-h-screen">
      <Header title="Mensagens" subtitle="Central de comunicação" />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Messages List */}
        <div className="w-full border-r border-border lg:w-96">
          <div className="border-b border-border p-4">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="all">Todos os canais</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
              </select>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {/* Message List */}
          <div className="h-[calc(100%-8rem)] overflow-y-auto">
            {filteredMessages.filter(m => m.direction === 'incoming').map((message) => (
              <button
                key={message.id}
                onClick={() => handleSelectMessage(message)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-secondary/50',
                  selectedMessage?.id === message.id && 'bg-secondary/50',
                  !message.read && 'bg-primary/5'
                )}
              >
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', getChannelColor(message.channel))}>
                  {getChannelIcon(message.channel)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn('font-medium text-foreground', !message.read && 'font-semibold')}>
                      {message.clientName}
                    </p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatTime(message.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {message.content}
                  </p>
                  <span className="mt-1 inline-block text-xs text-muted-foreground">
                    {getChannelName(message.channel)}
                  </span>
                </div>

                {!message.read && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            ))}

            {filteredMessages.filter(m => m.direction === 'incoming').length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Detail / Conversation */}
        <div className="hidden flex-1 flex-col lg:flex">
          {selectedMessage ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', getChannelColor(selectedMessage.channel))}>
                    {getChannelIcon(selectedMessage.channel)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedMessage.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {getChannelName(selectedMessage.channel)}
                    </p>
                  </div>
                </div>

                {selectedMessage.clientId && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/clientes/${selectedMessage.clientId}`}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Ver Cliente
                    </a>
                  </Button>
                )}
              </div>

              {/* Conversation */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {clientMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-md rounded-2xl px-4 py-2.5',
                        msg.direction === 'outgoing'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-xs',
                        msg.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {msg.direction === 'outgoing' && (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply()
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendReply} 
                    disabled={!replyText.trim()}
                    className="self-end"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">Selecione uma mensagem para visualizar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
