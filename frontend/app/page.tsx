'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { StatsCard } from '@/components/stats-card'
import { ClientList } from '@/components/client-list'
import { TaskList } from '@/components/task-list'
import { UpcomingVisits } from '@/components/upcoming-visits'
import { MessagePreview } from '@/components/message-preview'
import { Users, Calendar, AlertTriangle, MessageSquare, Plus, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Pagamento {
  id_pagamento: string
  id_contrato: string
  valor: number
  tipo: string
  status: string
  data_vencimento: string
  data_pagamento: string | null
  contratos?: {
    cliente?: { nome: string }
  }
}

// Mapa prioridade PT → EN (para o TaskList)
const prioridadeMap: Record<string, string> = {
  'Urgente': 'urgent',
  'Alta':    'high',
  'Média':   'medium',
  'Baixa':   'low',
}

export default function Dashboard() {
  const [clientes, setClientes]   = useState<any[]>([])
  const [tasks, setTasks]         = useState<any[]>([])
  const [visitas, setVisitas]     = useState<any[]>([])
  const [mensagens, setMensagens] = useState<any[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading]     = useState(true)

  const hoje = new Date().toISOString().split('T')[0]

  const activeClients       = clientes.filter(c => c.status === 'Ativo').length
  const upcomingVisits      = visitas.filter(v => v.status === 'Agendada').length
  const urgentTasks         = tasks.filter(t => t.prioridade === 'Urgente' && t.status !== 'Concluída').length
  const unreadMessages      = mensagens.filter(m => !m.lida).length
  const pagamentosPendentes = pagamentos.filter(p => p.status !== 'Pago')
  const pagamentosAtrasados = pagamentosPendentes.filter(p => p.data_vencimento < hoje).length

  useEffect(() => {
    Promise.all([
      fetchClientes(),
      fetchTarefas(),
      fetchAgendamentos(),
      fetchMensagens(),
      fetchPagamentos(),
    ]).finally(() => setLoading(false))
  }, [])

  async function fetchClientes() {
    try {
      const res = await fetch(`${API}/cliente/listar`)
      const data = await res.json()
      const mapeado = (Array.isArray(data) ? data : []).map((c: any) => ({
        id:      c.id_cliente,
        name:    c.nome,
        company: c.cidade,
        email:   c.email_oficial ?? '',
        phone:   c.telefone_oficial ?? '',
        status:  c.status ?? 'active',
      }))
      setClientes(mapeado)
    } catch {}
  }

  async function fetchTarefas() {
    try {
      const res = await fetch(`${API}/tarefas/listar`)
      const data = await res.json()
      setTasks(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchAgendamentos() {
    try {
      const res = await fetch(`${API}/agendamento/listar`)
      const data = await res.json()
      setVisitas(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchMensagens() {
    try {
      const res = await fetch(`${API}/mensagen/listar`)
      const data = await res.json()
      setMensagens(Array.isArray(data) ? data : [])
    } catch {}
  }

  async function fetchPagamentos() {
    try {
      const res = await fetch(`${API}/pagamento/listar`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPagamentos(Array.isArray(data) ? data : [])
    } catch {
      setPagamentos([])
    }
  }

  // ── Mappers para os componentes ──────────────────────────────────────────

  // TaskList espera: { id, title, description, priority ('urgent'|'high'|'medium'|'low'), status ('completed'|qualquer), dueDate }
  const mappedTasks = tasks
    .filter(t => t.status !== 'Concluída')
    .slice(0, 4)
    .map(t => ({
      id:          t.id_tarefa,
      title:       t.descricao,
      description: t.origem ?? '',
      priority:    prioridadeMap[t.prioridade] ?? 'low',
      status:      t.status === 'Concluída' ? 'completed' : 'pending',
      dueDate:     t.data_vencimento ?? new Date().toISOString(),
    }))

  // UpcomingVisits espera: { id, scheduledDate, title, clientName }
  const mappedVisitas = visitas
    .filter(v => v.status === 'Agendada')
    .slice(0, 3)
    .map(v => ({
      id:            v.id_agendamento,
      scheduledDate: v.data,
      title:         v.tipo_agendamento ?? 'Visita',
      clientName:    v.cliente?.nome ?? v.local ?? '',
    }))

  // MessagePreview espera: { id, channel ('whatsapp'|'email'|'phone'), read, clientName, createdAt, content }
  const mappedMensagens = mensagens
    .filter(m => m.direcao === 'recebida')
    .slice(0, 3)
    .map(m => ({
      id:         m.id_mensagem,
      channel:    (m.canal?.toLowerCase() ?? 'whatsapp') as 'whatsapp' | 'email' | 'phone',
      read:       m.lida,
      clientName: m.remetente ?? '—',
      createdAt:  m.created_at ?? new Date().toISOString(),
      content:    m.conteudo,
    }))

  const handleToggleTask = async (taskId: string) => {
    const tarefa = tasks.find(t => t.id_tarefa === taskId)
    if (!tarefa) return

    const novoStatus = tarefa.status === 'Concluída' ? 'Pendente' : 'Concluída'

    await fetch(`${API}/tarefas/${taskId}/status`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: novoStatus }),
    })

    setTasks(prev => prev.map(t =>
      t.id_tarefa === taskId ? { ...t, status: novoStatus } : t
    ))
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Dashboard"
        subtitle={`Bem-vindo, Adriano! ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Clientes Ativos"
            value={activeClients}
            description={`${clientes.length} clientes no total`}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Próximas Visitas"
            value={upcomingVisits}
            description="Agendadas para este mês"
            icon={Calendar}
            variant="default"
          />
          <StatsCard
            title="Tarefas Urgentes"
            value={urgentTasks}
            description="Precisam de atenção"
            icon={AlertTriangle}
            variant={urgentTasks > 0 ? 'warning' : 'default'}
          />
          <StatsCard
            title="Mensagens"
            value={unreadMessages}
            description="Não lidas"
            icon={MessageSquare}
            variant={unreadMessages > 0 ? 'primary' : 'default'}
          />
          <StatsCard
            title="Pgtos. Pendentes"
            value={pagamentosPendentes.length}
            description={`${pagamentosAtrasados} atrasados`}
            icon={DollarSign}
            variant={pagamentosAtrasados > 0 ? 'warning' : 'default'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Clients Section */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="font-semibold text-foreground">Clientes</h2>
                  <p className="text-sm text-muted-foreground">Seus clientes recentes</p>
                </div>
                <Link href="/clientes">
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Novo Cliente
                  </Button>
                </Link>
              </div>
              <div className="p-4">
                <ClientList clients={clientes.slice(0, 4)} />
                <Link
                  href="/clientes"
                  className="mt-4 block text-center text-sm text-primary hover:underline"
                >
                  Ver todos os clientes
                </Link>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          <div>
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div>
                  <h2 className="font-semibold text-foreground">Tarefas</h2>
                  <p className="text-sm text-muted-foreground">Suas pendências</p>
                </div>
                <Link href="/tarefas">
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="p-4">
                <TaskList
                  tasks={mappedTasks}
                  onToggleStatus={handleToggleTask}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Upcoming Visits */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-semibold text-foreground">Próximas Visitas</h2>
                <p className="text-sm text-muted-foreground">Agenda da semana</p>
              </div>
              <Link href="/agendamentos">
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Agendar
                </Button>
              </Link>
            </div>
            <div className="p-4">
              <UpcomingVisits visits={mappedVisitas} />
              <Link
                href="/agendamentos"
                className="mt-4 block text-center text-sm text-primary hover:underline"
              >
                Ver todas as visitas
              </Link>
            </div>
          </div>

          {/* Messages */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-semibold text-foreground">Mensagens Recentes</h2>
                <p className="text-sm text-muted-foreground">Central de comunicação</p>
              </div>
              <Link href="/mensagens">
                <Button variant="outline" size="sm">
                  Ver todas
                </Button>
              </Link>
            </div>
            <div className="p-4">
              <MessagePreview messages={mappedMensagens} />
            </div>
          </div>

          {/* Pagamentos */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h2 className="font-semibold text-foreground">Pagamentos</h2>
                <p className="text-sm text-muted-foreground">Pendências financeiras</p>
              </div>
              <Link href="/pagamentos">
                <Button variant="outline" size="sm">
                  Ver todos
                </Button>
              </Link>
            </div>
            <div className="p-4 space-y-2">
              {pagamentosPendentes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum pagamento pendente
                </p>
              ) : pagamentosPendentes.slice(0, 3).map(p => {
                const atrasado = p.data_vencimento < hoje
                return (
                  <div
                    key={p.id_pagamento}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {atrasado
                        ? <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                        : <Clock className="h-4 w-4 shrink-0 text-warning" />
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          R$ {p.valor.toFixed(2)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.contratos?.cliente?.nome ?? '—'} · {new Date(p.data_vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      'ml-2 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium',
                      atrasado
                        ? 'bg-destructive/10 text-destructive border-destructive/20'
                        : 'bg-warning/10 text-warning border-warning/20'
                    )}>
                      {atrasado ? 'Atrasado' : 'Pendente'}
                    </span>
                  </div>
                )
              })}
              {pagamentosPendentes.length > 3 && (
                <Link
                  href="/pagamento"
                  className="block pt-1 text-center text-sm text-primary hover:underline"
                >
                  Ver mais {pagamentosPendentes.length - 3} pendentes
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}