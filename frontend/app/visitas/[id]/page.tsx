'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { mockVisits, mockClients } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  Building2,
  Calendar,
  FileText,
  Plus,
  X,
  Check,
} from 'lucide-react'

type PageParams = Promise<{ id: string }>

export default function VisitDetailPage({ params }: { params: PageParams }) {
  const { id } = use(params)
  const router = useRouter()
  const visit = mockVisits.find(v => v.id === id)
  const client = visit?.clientId ? mockClients.find(c => c.id === visit.clientId) : null

  const [status, setStatus] = useState(visit?.status || 'scheduled')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [observations, setObservations] = useState(visit?.observations || '')
  const [participants, setParticipants] = useState<string[]>(visit?.participants || [])
  const [newParticipant, setNewParticipant] = useState('')

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  if (!visit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Visita não encontrada</h2>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
    setStartTime(new Date())
    setStatus('in-progress')
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleResume = () => {
    setIsRunning(true)
  }

  const handleStop = () => {
    setIsRunning(false)
    setStatus('completed')
  }

  const handleAddParticipant = () => {
    if (newParticipant.trim() && !participants.includes(newParticipant.trim())) {
      setParticipants([...participants, newParticipant.trim()])
      setNewParticipant('')
    }
  }

  const handleRemoveParticipant = (participant: string) => {
    setParticipants(participants.filter(p => p !== participant))
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'scheduled':
        return 'bg-primary/10 text-primary'
      case 'in-progress':
        return 'bg-warning/10 text-warning'
      case 'completed':
        return 'bg-success/10 text-success'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusText = (s: string) => {
    switch (s) {
      case 'scheduled':
        return 'Agendada'
      case 'in-progress':
        return 'Em andamento'
      case 'completed':
        return 'Concluída'
      default:
        return s
    }
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen">
      <Header title={visit.title} subtitle={client?.company || 'Visita sem cliente'} />

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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Card */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold text-foreground">Cronômetro da Visita</h3>
                  <p className="text-sm text-muted-foreground">Controle o tempo da sua visita</p>
                </div>
                <span className={cn('rounded-full px-3 py-1 text-sm font-medium', getStatusColor(status))}>
                  {getStatusText(status)}
                </span>
              </div>

              <div className="flex flex-col items-center gap-6">
                {/* Timer Display */}
                <div className="flex items-center justify-center rounded-2xl bg-secondary/50 px-12 py-8">
                  <span className="font-mono text-5xl font-bold text-foreground">
                    {formatTime(elapsedTime)}
                  </span>
                </div>

                {/* Start Time */}
                {startTime && (
                  <p className="text-sm text-muted-foreground">
                    Iniciada às {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {status === 'scheduled' && (
                    <Button onClick={handleStart} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Iniciar Visita
                    </Button>
                  )}

                  {status === 'in-progress' && (
                    <>
                      {isRunning ? (
                        <Button onClick={handlePause} variant="outline" size="lg" className="gap-2">
                          <Pause className="h-5 w-5" />
                          Pausar
                        </Button>
                      ) : (
                        <Button onClick={handleResume} size="lg" className="gap-2">
                          <Play className="h-5 w-5" />
                          Continuar
                        </Button>
                      )}
                      <Button onClick={handleStop} variant="destructive" size="lg" className="gap-2">
                        <Square className="h-5 w-5" />
                        Finalizar
                      </Button>
                    </>
                  )}

                  {status === 'completed' && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-success">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Visita Concluída</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Observations */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Observações</h3>
              </div>
              <Textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Adicione suas anotações sobre a visita..."
                rows={6}
                className="resize-none"
              />
            </div>

            {/* Participants */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold text-foreground">Participantes</h3>
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  value={newParticipant}
                  onChange={(e) => setNewParticipant(e.target.value)}
                  placeholder="Nome do participante"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddParticipant()
                    }
                  }}
                />
                <Button onClick={handleAddParticipant} disabled={!newParticipant.trim()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {participants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {participants.map((participant) => (
                    <div
                      key={participant}
                      className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-sm"
                    >
                      <span className="text-foreground">{participant}</span>
                      <button
                        onClick={() => handleRemoveParticipant(participant)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum participante adicionado</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Visit Info */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">Informações da Visita</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Agendada para</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(visit.scheduledDate)}
                    </p>
                  </div>
                </div>

                {client && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="text-sm font-medium text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.company}</p>
                    </div>
                  </div>
                )}

                {elapsedTime > 0 && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duração Total</p>
                      <p className="text-sm font-medium text-foreground">{formatTime(elapsedTime)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 font-semibold text-foreground">Ações Rápidas</h3>
              <div className="space-y-2">
                {client && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`/clientes/${client.id}`}>
                      <Building2 className="mr-2 h-4 w-4" />
                      Ver Cliente
                    </a>
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="mr-2 h-4 w-4" />
                  Criar Relatório
                </Button>
              </div>
            </div>

            {/* Initial Observations */}
            {visit.observations && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold text-foreground">Notas Iniciais</h3>
                <p className="text-sm text-muted-foreground">{visit.observations}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
