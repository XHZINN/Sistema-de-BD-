'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { mockVisits, mockClients } from '@/lib/mock-data'
import { Visit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Calendar,
  Clock,
  Plus,
  Building2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function AgendamentosPage() {
  const [visits, setVisits] = useState<Visit[]>(mockVisits)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newVisit, setNewVisit] = useState({
    title: '',
    clientId: '',
    scheduledDate: '',
    scheduledTime: '',
  })

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()

    const days: (number | null)[] = []
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null)
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const getVisitsForDay = (day: number) => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    return visits.filter(visit => {
      const visitDate = new Date(visit.scheduledDate)
      return (
        visitDate.getFullYear() === year &&
        visitDate.getMonth() === month &&
        visitDate.getDate() === day
      )
    })
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleAddVisit = () => {
    const client = mockClients.find(c => c.id === newVisit.clientId)
    
    const visit: Visit = {
      id: String(Date.now()),
      clientId: newVisit.clientId || undefined,
      clientName: client?.name,
      title: newVisit.title,
      scheduledDate: `${newVisit.scheduledDate}T${newVisit.scheduledTime}:00`,
      status: 'scheduled',
      observations: '',
      participants: [],
      createdAt: new Date().toISOString().split('T')[0],
    }

    setVisits([visit, ...visits])
    setNewVisit({ title: '', clientId: '', scheduledDate: '', scheduledTime: '' })
    setIsDialogOpen(false)
  }

  const days = getDaysInMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  // Get upcoming visits for the sidebar
  const upcomingVisits = visits
    .filter(v => new Date(v.scheduledDate) >= new Date() && v.status === 'scheduled')
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen">
      <Header title="Agendamentos" subtitle="Calendário de visitas" />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card">
              {/* Calendar Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold capitalize text-foreground">{monthYear}</h2>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              {/* Calendar Grid */}
              <div className="p-4">
                {/* Week days header */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                  {weekDays.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    const dayVisits = day ? getVisitsForDay(day) : []
                    
                    return (
                      <div
                        key={index}
                        className={cn(
                          'min-h-24 rounded-lg border border-transparent p-2 transition-colors',
                          day && 'hover:border-border hover:bg-secondary/50',
                          day && isToday(day) && 'border-primary/50 bg-primary/5'
                        )}
                      >
                        {day && (
                          <>
                            <span className={cn(
                              'inline-flex h-7 w-7 items-center justify-center rounded-full text-sm',
                              isToday(day) && 'bg-primary font-semibold text-primary-foreground'
                            )}>
                              {day}
                            </span>
                            <div className="mt-1 space-y-1">
                              {dayVisits.slice(0, 2).map(visit => (
                                <div
                                  key={visit.id}
                                  className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary"
                                >
                                  {visit.title}
                                </div>
                              ))}
                              {dayVisits.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayVisits.length - 2} mais
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* New Visit Button */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Visita
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agendar Nova Visita</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={newVisit.title}
                      onChange={(e) => setNewVisit({ ...newVisit, title: e.target.value })}
                      placeholder="Ex: Reunião de acompanhamento"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <select
                      value={newVisit.clientId}
                      onChange={(e) => setNewVisit({ ...newVisit, clientId: e.target.value })}
                      className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                    >
                      <option value="">Sem cliente específico</option>
                      {mockClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.name} - {client.company}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={newVisit.scheduledDate}
                        onChange={(e) => setNewVisit({ ...newVisit, scheduledDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horário</Label>
                      <Input
                        type="time"
                        value={newVisit.scheduledTime}
                        onChange={(e) => setNewVisit({ ...newVisit, scheduledTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddVisit} 
                    className="w-full"
                    disabled={!newVisit.title || !newVisit.scheduledDate}
                  >
                    Agendar Visita
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Upcoming Visits */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Próximas Visitas</h3>
              </div>
              <div className="p-4 space-y-3">
                {upcomingVisits.length > 0 ? (
                  upcomingVisits.map(visit => {
                    const date = new Date(visit.scheduledDate)
                    return (
                      <div key={visit.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="font-medium text-foreground">{visit.title}</p>
                        {visit.clientName && (
                          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {visit.clientName}
                          </div>
                        )}
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Nenhuma visita agendada
                  </p>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 font-semibold text-foreground">Este Mês</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-foreground">
                    {visits.filter(v => {
                      const d = new Date(v.scheduledDate)
                      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Visitas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-success">
                    {visits.filter(v => {
                      const d = new Date(v.scheduledDate)
                      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() && v.status === 'completed'
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
