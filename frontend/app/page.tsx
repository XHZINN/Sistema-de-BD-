'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { StatsCard } from '@/components/stats-card'
import { ClientList } from '@/components/client-list'
import { TaskList } from '@/components/task-list'
import { UpcomingVisits } from '@/components/upcoming-visits'
import { MessagePreview } from '@/components/message-preview'
import { Users, Calendar, AlertTriangle, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Cliente {
  id_cliente: string
  nome: string
  status: string
}

interface Tarefa {
  id_tarefa: string
  descricao: string
  prioridade: string
  status: string
}

interface Agendamento {
  id_agendamento: string
  status: string
  data: string
}

interface Mensagem {
  id_mensagem: string
  lida: boolean
  direcao: string
  conteudo: string
  remetente: string
}

export default function Dashboard() {
  const [clientes, setClientes] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [visitas, setVisitas] = useState<any[]>([])
  const [mensagens, setMensagens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const activeClients = clientes.filter(c => c.status === 'Ativo').length

  const upcomingVisits = visitas.filter(v => v.status === 'Agendada').length

  const urgentTasks = tasks.filter(t => t.prioridade === 'Urgente' && t.status !== 'Concluída').length

  const unreadMessages = mensagens.filter(m => !m.lida).length

  useEffect(() => {
    Promise.all([
      fetchClientes(),
      fetchTarefas(),
      fetchAgendamentos(),
      fetchMensagens(),
    ]).finally(() => setLoading(false))
  }, [])

  async function fetchClientes() {
    const res = await fetch(`${API}/cliente/listar`)
    const data = await res.json()
    const mapeado = (Array.isArray(data) ? data : []).map((c: any) => ({
      id: c.id_cliente,
      name: c.nome,
      company: c.cidade,       // ajusta se tiver campo melhor
      email: c.email_oficial ?? '',
      phone: c.telefone_oficial ?? '',
      status: c.status ?? 'active',
      // adiciona os outros campos que o erro pedir
    }))
    setClientes(mapeado as any)
  }

  async function fetchTarefas() {
    const res = await fetch(`${API}/tarefas/listar`)
    const data = await res.json()
    setTasks(Array.isArray(data) ? data : [])
  }

  async function fetchAgendamentos() {
    const res = await fetch(`${API}/agendamento/listar`)
    const data = await res.json()
    setVisitas(Array.isArray(data) ? data : [])
  }

  async function fetchMensagens() {
    const res = await fetch(`${API}/mensagens/listar`)
    const data = await res.json()
    setMensagens(Array.isArray(data) ? data : [])
  }

  const handleToggleTask = async (taskId: string) => {
    const tarefa = tasks.find(t => t.id_tarefa === taskId)
    if (!tarefa) return

    const novoStatus = tarefa.status === 'Concluída' ? 'Pendente' : 'Concluída'

    await fetch(`${API}/tarefas/${taskId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: novoStatus }),
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <Button variant="ghost" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <TaskList 
                  tasks={tasks.filter(t => t.status !== 'Concluída').slice(0, 4)}
                  onToggleStatus={handleToggleTask}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              <UpcomingVisits visits={visitas.slice(0, 3)} />
              <Link 
                href="/visitas" 
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
              <MessagePreview messages={mensagens.filter(m => m.direcao === 'recebida').slice(0, 3)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
