'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { StatsCard } from '@/components/stats-card'
import { ClientList } from '@/components/client-list'
import { TaskList } from '@/components/task-list'
import { UpcomingVisits } from '@/components/upcoming-visits'
import { MessagePreview } from '@/components/message-preview'
import { mockClients, mockTasks, mockVisits, mockMessages } from '@/lib/mock-data'
import { Users, Calendar, AlertTriangle, MessageSquare, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Dashboard() {
  const [tasks, setTasks] = useState(mockTasks)

  const activeClients = mockClients.filter(c => c.status === 'active').length
  const upcomingVisits = mockVisits.filter(v => v.status === 'scheduled').length
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  const unreadMessages = mockMessages.filter(m => !m.read).length

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          status: task.status === 'completed' ? 'pending' : 'completed'
        }
      }
      return task
    }))
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
            description={`${mockClients.length} clientes no total`}
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
                <ClientList clients={mockClients.slice(0, 4)} />
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
                  tasks={tasks.filter(t => t.status !== 'completed').slice(0, 4)} 
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
              <UpcomingVisits visits={mockVisits.slice(0, 3)} />
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
              <MessagePreview messages={mockMessages.filter(m => m.direction === 'incoming').slice(0, 3)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
