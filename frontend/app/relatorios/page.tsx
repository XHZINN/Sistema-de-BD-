'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { mockReports, mockClients } from '@/lib/mock-data'
import { Report } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Send,
  Eye,
  Download,
  Calendar,
  Building2,
  CheckCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function RelatoriosPage() {
  const [reports, setReports] = useState<Report[]>(mockReports)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [newReport, setNewReport] = useState({
    clientId: '',
    title: '',
    content: '',
    type: 'visit' as Report['type'],
  })

  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleAddReport = () => {
    const report: Report = {
      id: String(Date.now()),
      clientId: newReport.clientId,
      title: newReport.title,
      content: newReport.content,
      type: newReport.type,
      createdAt: new Date().toISOString().split('T')[0],
    }

    setReports([report, ...reports])
    setNewReport({ clientId: '', title: '', content: '', type: 'visit' })
    setIsDialogOpen(false)
  }

  const handleSendReport = (reportId: string) => {
    setReports(prev => prev.map(r => {
      if (r.id === reportId) {
        return { ...r, sentAt: new Date().toISOString().split('T')[0] }
      }
      return r
    }))
  }

  const getTypeColor = (type: Report['type']) => {
    switch (type) {
      case 'visit':
        return 'bg-primary/10 text-primary'
      case 'analysis':
        return 'bg-chart-2/10 text-chart-2'
      case 'recommendation':
        return 'bg-warning/10 text-warning'
      case 'follow-up':
        return 'bg-success/10 text-success'
    }
  }

  const getTypeText = (type: Report['type']) => {
    switch (type) {
      case 'visit':
        return 'Visita'
      case 'analysis':
        return 'Análise'
      case 'recommendation':
        return 'Recomendação'
      case 'follow-up':
        return 'Acompanhamento'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getClientName = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId)
    return client?.name || 'Cliente desconhecido'
  }

  const sentCount = reports.filter(r => r.sentAt).length
  const pendingCount = reports.filter(r => !r.sentAt).length

  return (
    <div className="min-h-screen">
      <Header title="Relatórios" subtitle="Gerencie seus relatórios" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{reports.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Enviados</p>
            <p className="text-2xl font-semibold text-success">{sentCount}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-semibold text-warning">{pendingCount}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar relatório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="all">Todos os tipos</option>
                <option value="visit">Visita</option>
                <option value="analysis">Análise</option>
                <option value="recommendation">Recomendação</option>
                <option value="follow-up">Acompanhamento</option>
              </select>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
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
                  <Label>Cliente</Label>
                  <select
                    value={newReport.clientId}
                    onChange={(e) => setNewReport({ ...newReport, clientId: e.target.value })}
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um cliente</option>
                    {mockClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name} - {client.company}
                      </option>
                    ))}
                  </select>
                </div>
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
                  disabled={!newReport.title || !newReport.content || !newReport.clientId}
                >
                  Criar Relatório
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Report List */}
        <div className="space-y-4">
          {filteredReports.map(report => (
            <div key={report.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-medium text-foreground">{report.title}</h3>
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getTypeColor(report.type))}>
                      {getTypeText(report.type)}
                    </span>
                    {report.sentAt && (
                      <span className="flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                        <CheckCircle className="h-3 w-3" />
                        Enviado
                      </span>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{report.content}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {getClientName(report.clientId)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      {formatDate(report.createdAt)}
                    </span>
                    {report.sentAt && (
                      <span className="text-success">Enviado em {formatDate(report.sentAt)}</span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedReport(report)}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    Ver
                  </Button>
                  {!report.sentAt && (
                    <Button 
                      size="sm"
                      onClick={() => handleSendReport(report.id)}
                    >
                      <Send className="mr-1 h-4 w-4" />
                      Enviar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">Nenhum relatório encontrado</p>
            </div>
          )}
        </div>

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedReport?.title}</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="py-4">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', getTypeColor(selectedReport.type))}>
                    {getTypeText(selectedReport.type)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {getClientName(selectedReport.clientId)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedReport.createdAt)}
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-4">
                  <p className="whitespace-pre-wrap text-foreground">{selectedReport.content}</p>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                  </Button>
                  {!selectedReport.sentAt && (
                    <Button onClick={() => {
                      handleSendReport(selectedReport.id)
                      setSelectedReport(null)
                    }}>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar para Cliente
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
