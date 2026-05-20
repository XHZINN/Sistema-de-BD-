'use client'

<<<<<<< HEAD
import { useState } from 'react'
import { Header } from '@/components/header'
import { mockMessages, mockClients } from '@/lib/mock-data'
import { Message } from '@/lib/types'
=======
import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
>>>>>>> 3de387f (Atualização pré deploy)
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
<<<<<<< HEAD
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

=======
import { MessageSquare, Mail, Send, Search, Filter, CheckCheck, Building2 } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Message {
  id_mensagem: string
  id_cliente?: string
  canal: string
  direcao: 'recebida' | 'enviada'
  conteudo: string
  lida: boolean
  remetente: string
  status_vinculo: string
  created_at: string
  cliente?: { nome: string }
}

export default function MensagensPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [channelFilter, setChannelFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [replyText, setReplyText] = useState('')

  useEffect(() => { fetchMensagens() }, [])

  async function fetchMensagens() {
    const res = await fetch(`${API}/mensagem/listar`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
  }

  // última mensagem por remetente
  const conversas = Object.values(
    messages.reduce((acc, msg) => {
      const key = msg.remetente
      if (!acc[key] || new Date(msg.created_at) > new Date(acc[key].created_at)) acc[key] = msg
      return acc
    }, {} as Record<string, Message>)
  ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // não lidas por remetente
  const unreadPorRemetente = messages.reduce((acc, msg) => {
    if (!msg.lida && msg.direcao === 'recebida') acc[msg.remetente] = (acc[msg.remetente] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  const unreadCount = Object.values(unreadPorRemetente).reduce((a, b) => a + b, 0)

  const clientMessages = selectedMessage
    ? messages.filter(m => m.remetente === selectedMessage.remetente)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : []

  async function handleSelectMessage(msg: Message) {
    setSelectedMessage(msg)
    setMessages(prev => prev.map(m => m.remetente === msg.remetente ? { ...m, lida: true } : m))
    const naoLidas = messages.filter(m => m.remetente === msg.remetente && !m.lida)
    await Promise.all(naoLidas.map(m =>
      fetch(`${API}/mensagem/${m.id_mensagem}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lida: true }),
      })
    ))
  }

  async function handleSendReply() {
    if (!replyText.trim() || !selectedMessage) return
    await fetch(`${API}/mensagem/${selectedMessage.id_mensagem}/responder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conteudo: replyText }),
    })
    setMessages(prev => [...prev, {
      id_mensagem: String(Date.now()),
      canal: selectedMessage.canal,
      direcao: 'enviada',
      conteudo: replyText,
      lida: true,
      remetente: selectedMessage.remetente,
      status_vinculo: 'vinculado',
      created_at: new Date().toISOString(),
    }])
    setReplyText('')
  }

  const getChannelIcon = (canal: string) => canal === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />
  const getChannelColor = (canal: string) => canal === 'email' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'
  const getChannelName = (canal: string) => canal === 'email' ? 'E-mail' : 'WhatsApp'

  const formatTime = (date: string) => {
    const d = new Date(date)
    const diff = Date.now() - d.getTime()
    const hours = Math.floor(diff / 3600000)
>>>>>>> 3de387f (Atualização pré deploy)
    if (hours < 1) return 'Agora'
    if (hours < 24) return `${hours}h`
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

<<<<<<< HEAD
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

=======
  const conversasFiltradas = conversas.filter(m => {
    const matchCanal = channelFilter === 'all' || m.canal === channelFilter
    const nome = m.cliente?.nome ?? m.remetente
    const matchSearch = nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.conteudo.toLowerCase().includes(searchTerm.toLowerCase())
  return matchCanal && matchSearch
})
>>>>>>> 3de387f (Atualização pré deploy)
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
<<<<<<< HEAD
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
=======
            {conversasFiltradas.map(msg => {
              const unread = unreadPorRemetente[msg.remetente] ?? 0
              return (
                <button
                  key={msg.remetente}
                  onClick={() => handleSelectMessage(msg)}
                  className={cn(
                    'relative flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors hover:bg-secondary/50',
                    selectedMessage?.remetente === msg.remetente && 'bg-secondary/50',
                    unread > 0 && 'bg-primary/5'
                  )}
                >
                  {unread > 0 && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {unread}
                    </span>
                  )}
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', getChannelColor(msg.canal))}>
                    {getChannelIcon(msg.canal)}
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn('truncate font-medium text-foreground', unread > 0 && 'font-semibold')}>
                        {msg.cliente?.nome ?? msg.remetente}
                      </p>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{msg.conteudo}</p>
                    <span className="mt-1 inline-block text-xs text-muted-foreground">{getChannelName(msg.canal)}</span>
                  </div>
                </button>
              )
            })}
            {conversasFiltradas.length === 0 && (
>>>>>>> 3de387f (Atualização pré deploy)
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
<<<<<<< HEAD
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', getChannelColor(selectedMessage.channel))}>
                    {getChannelIcon(selectedMessage.channel)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedMessage.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {getChannelName(selectedMessage.channel)}
=======
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', getChannelColor(selectedMessage.canal))}>
                    {getChannelIcon(selectedMessage.canal)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedMessage.cliente?.nome ?? selectedMessage.remetente}</p>
                    <p className="text-sm text-muted-foreground">
                      {getChannelName(selectedMessage.canal)}
>>>>>>> 3de387f (Atualização pré deploy)
                    </p>
                  </div>
                </div>

<<<<<<< HEAD
                {selectedMessage.clientId && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/clientes/${selectedMessage.clientId}`}>
=======
                {selectedMessage.id_cliente && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/clientes/${selectedMessage.id_cliente}`}>
>>>>>>> 3de387f (Atualização pré deploy)
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
<<<<<<< HEAD
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'
=======
                    key={msg.id_mensagem}
                    className={cn(
                      'flex',
                      msg.direcao === 'enviada' ? 'justify-end' : 'justify-start'
>>>>>>> 3de387f (Atualização pré deploy)
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-md rounded-2xl px-4 py-2.5',
<<<<<<< HEAD
                        msg.direction === 'outgoing'
=======
                        msg.direcao === 'enviada'
>>>>>>> 3de387f (Atualização pré deploy)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      )}
                    >
<<<<<<< HEAD
                      <p className="text-sm">{msg.content}</p>
                      <div className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-xs',
                        msg.direction === 'outgoing' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        <span>{formatTime(msg.createdAt)}</span>
                        {msg.direction === 'outgoing' && (
=======
                      <p className="text-sm">{msg.conteudo}</p>
                      <div className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-xs',
                        msg.direcao === 'enviada' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        <span>{formatTime(msg.created_at)}</span>
                        {msg.direcao === 'enviada' && (
>>>>>>> 3de387f (Atualização pré deploy)
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
