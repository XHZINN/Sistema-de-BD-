'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { mockClients, mockVisits, mockReports, mockObservations } from '@/lib/mock-data'
import { Visit, Report, Observation } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Eye,
  MessageSquare,
  Plus,
  Send,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

type PageParams = Promise<{ id: string }>

export default function ClientDetailPage({ params }: { params: PageParams }) {
  const { id } = use(params)
  const router = useRouter()
  const client = mockClients.find(c => c.id === id)
  
  const [visits, setVisits] = useState<Visit[]>(
    mockVisits.filter(v => v.clientId === id)
  )
  const [reports, setReports] = useState<Report[]>(
    mockReports.filter(r => r.clientId === id)
  )
  const [observations, setObservations] = useState<Observation[]>(
    mockObservations.filter(o => o.clientId === id)
  )

  const [newVisit, setNewVisit] = useState({
    title: '',
    scheduledDate: '',
    scheduledTime: '',
  })
  const [newReport, setNewReport] = useState({
    title: '',
    content: '',
    type: 'visit' as Report['type'],
  })
  const [newObservation, setNewObservation] = useState('')
  const [isVisitDialogOpen, setIsVisitDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Cliente não encontrado</h2>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const handleAddVisit = () => {
    const visit: Visit = {
      id: String(Date.now()),
      clientId: client.id,
      clientName: client.name,
      title: newVisit.title,
      scheduledDate: `${newVisit.scheduledDate}T${newVisit.scheduledTime}:00`,
      status: 'scheduled',
      observations: '',
      participants: [],
      createdAt: new Date().toISOString().split('T')[0],
    }
    setVisits([visit, ...visits])
    setNewVisit({ title: '', scheduledDate: '', scheduledTime: '' })
    setIsVisitDialogOpen(false)
  }

  const handleAddReport = () => {
    const report: Report = {
      id: String(Date.now()),
      clientId: client.id,
      title: newReport.title,
      content: newReport.content,
      type: newReport.type,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setReports([report, ...reports])
    setNewReport({ title: '', content: '', type: 'visit' })
    setIsReportDialogOpen(false)
  }

  const handleSendReport = (reportId: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, sentAt: new Date().toISOString().split('T')[0] }
      }
      return r
    }))
  }

  const handleAddObservation = () => {
    if (!newObservation.trim()) return
    const observation: Observation = {
      id: String(Date.now()),
      clientId: client.id,
      content: newObservation,
      createdAt: new Date().toISOString().split('T')[0],
    }
    setObservations([observation, ...observations])
    setNewObservation('')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground'
      case 'pending':
        return 'bg-warning text-warning-foreground'
      case 'inactive':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'pending':
        return 'Pendente'
      case 'inactive':
        return 'Inativo'
      default:
        return status
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  return (
    <div className="min-h-screen">
      <Header title={client.name} subtitle={client.company} />

      <div className="p-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {/* Client Info Card */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-foreground">{client.name}</h2>
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getStatusColor(client.status))}>
                    {getStatusText(client.status)}
                  </span>
                </div>
                <p className="text-muted-foreground">{client.company}</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
                    <MapPin className="h-4 w-4" />
                    {client.address}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <div className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Última Visita</p>
                <p className="font-medium text-foreground">{formatDate(client.lastVisit)}</p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/50 px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Próxima Visita</p>
                <p className="font-medium text-foreground">{formatDate(client.nextVisit)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="visits" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="visits" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Visitas</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
            <TabsTrigger value="observations" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Observações</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Agendar</span>
            </TabsTrigger>
          </TabsList>

          {/* Visits Tab */}
          <TabsContent value="visits">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Visitas Realizadas e Agendadas</h3>
                <Dialog open={isVisitDialogOpen} onOpenChange={setIsVisitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
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
              </div>
              <div className="p-4">
                {visits.length > 0 ? (
                  <div className="space-y-3">
                    {visits.map((visit) => (
                      <div key={visit.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                        <div>
                          <p className="font-medium text-foreground">{visit.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(visit.scheduledDate).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className={cn(
                          'rounded-full px-2.5 py-0.5 text-xs font-medium',
                          visit.status === 'completed' && 'bg-success/10 text-success',
                          visit.status === 'scheduled' && 'bg-primary/10 text-primary',
                          visit.status === 'in-progress' && 'bg-warning/10 text-warning',
                        )}>
                          {visit.status === 'completed' ? 'Concluída' : visit.status === 'scheduled' ? 'Agendada' : 'Em andamento'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhuma visita registrada</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Relatórios</h3>
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Novo Relatório
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Relatório</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                          value={newReport.title}
                          onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                          placeholder="Título do relatório"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                          value={newReport.type}
                          onChange={(e) => setNewReport({ ...newReport, type: e.target.value as Report['type'] })}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                        >
                          <option value="visit">Visita</option>
                          <option value="analysis">Análise</option>
                          <option value="recommendation">Recomendação</option>
                          <option value="follow-up">Acompanhamento</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Conteúdo</Label>
                        <Textarea
                          value={newReport.content}
                          onChange={(e) => setNewReport({ ...newReport, content: e.target.value })}
                          placeholder="Conteúdo do relatório..."
                          rows={6}
                        />
                      </div>
                      <Button 
                        onClick={handleAddReport} 
                        className="w-full"
                        disabled={!newReport.title || !newReport.content}
                      >
                        Criar Relatório
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="p-4">
                {reports.length > 0 ? (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{report.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{report.content}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Criado em {formatDate(report.createdAt)}</span>
                              {report.sentAt && (
                                <span className="text-success">Enviado em {formatDate(report.sentAt)}</span>
                              )}
                            </div>
                          </div>
                          {!report.sentAt && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSendReport(report.id)}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Enviar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhum relatório criado</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Observations Tab */}
          <TabsContent value="observations">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Observações</h3>
              </div>
              <div className="p-4">
                <div className="mb-4 flex gap-2">
                  <Textarea
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    placeholder="Adicione uma nova observação..."
                    rows={2}
                    className="flex-1"
                  />
                  <Button onClick={handleAddObservation} disabled={!newObservation.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {observations.length > 0 ? (
                  <div className="space-y-3">
                    {observations.map((obs) => (
                      <div key={obs.id} className="rounded-lg border border-border bg-secondary/30 p-4">
                        <p className="text-foreground">{obs.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(obs.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">Nenhuma observação registrada</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">Agendar Nova Visita</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título da Visita</Label>
                  <Input
                    value={newVisit.title}
                    onChange={(e) => setNewVisit({ ...newVisit, title: e.target.value })}
                    placeholder="Ex: Reunião de acompanhamento"
                  />
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
                  <Calendar className="mr-2 h-4 w-4" />
                  Agendar Visita
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
