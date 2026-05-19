'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Play, Pause, Square, Clock,
  Building2, Calendar, FileText, Check,
  Camera, Mic, MicOff, Upload, Trash2,
  Loader2, Image as ImageIcon, Volume2, Download,
  Paperclip,
} from 'lucide-react'


const API = process.env.NEXT_PUBLIC_API_BACKEND

// ─── Types ────────────────────────────────────────────────────────────────────

type PageParams = Promise<{ id: string }>
type Fase = 'agendada' | 'em-andamento' | 'concluida'

interface Agendamento {
  id_agendamento: string
  tipo_agendamento: string
  data: string
  urgencia: string
  local: string
  formato: string
  status: string
  observacao: string | null
  cliente: { nome: string } | null
  id_cliente: string | null
}

interface RegistroMidia {
  nome: string
  url: string
  path: string
  tipo: string
  tamanho: number
  criado_em: string
}

interface VisitaRegistro {
  id_visita: string
  id_agendamento: string
  hora_inicio: string
  created_at: string
  observacao: string | null
  registros: RegistroMidia[]
}

// Registro capturado localmente (antes de salvar)
interface RegistroLocal {
  id: string
  nome: string
  tipo: string
  blob: Blob
  localUrl: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
    year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function calcDuracao(inicio: string, fim: string) {
  const diff = Math.floor(
    (new Date(fim).getTime() - new Date(inicio).getTime()) / 1000
  )
  return formatTime(Math.max(0, diff))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MidiaIcon({ tipo }: { tipo: string }) {
  if (tipo.startsWith('image/')) return <ImageIcon className="h-4 w-4 text-primary" />
  if (tipo.startsWith('audio/')) return <Volume2 className="h-4 w-4 text-warning" />
  return <Paperclip className="h-4 w-4 text-muted-foreground" />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VisitDetailPage({ params }: { params: PageParams }) {
  const { id } = use(params)
  const router = useRouter()

  const [agendamento, setAgendamento] = useState<Agendamento | null>(null)
  const [visita, setVisita]           = useState<VisitaRegistro | null>(null)
  const [loading, setLoading]         = useState(true)
  const [finalizando, setFinalizando] = useState(false)

  // Controle da visita
  const [fase, setFase]               = useState<Fase>('agendada')
  const [isRunning, setIsRunning]     = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [horaInicio, setHoraInicio]   = useState<Date | null>(null)
  const [observacao, setObservacao]   = useState('')

  // Mídia capturada localmente (ainda não enviada ao servidor)
  const [registrosLocais, setRegistrosLocais] = useState<RegistroLocal[]>([])
  const [gravandoAudio, setGravandoAudio]     = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef        = useRef<Blob[]>([])
  const cameraInputRef   = useRef<HTMLInputElement>(null)
  const fileInputRef     = useRef<HTMLInputElement>(null)

  // ── Carrega dados ─────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      try {
        // 1. Busca os dados do agendamento
        const resAg = await fetch(`${API}/agendamento/${id}`)
        const ag: Agendamento = await resAg.json()
        setAgendamento(ag)

        // 2. Verifica se já existe uma visita iniciada para este agendamento
        const resV = await fetch(`${API}/visitas/listar?id_agendamento=${id}`)
        const lista: VisitaRegistro[] = await resV.json()

        if (lista.length > 0) {
          const v = lista[0]
          setVisita(v)
          setObservacao(v.observacao ?? '')
          setFase('concluida')
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ── Timer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => setElapsedTime(prev => prev + 1), 1000)
    return () => clearInterval(interval)
  }, [isRunning])

  // ── Controles da visita ───────────────────────────────────────────

  function handleIniciar() {
    setHoraInicio(new Date())
    setIsRunning(true)
    setFase('em-andamento')
  }

  function handlePausar()   { setIsRunning(false) }
  function handleContinuar(){ setIsRunning(true)  }

  async function handleFinalizar() {
    if (!horaInicio) return
    setIsRunning(false)
    setFinalizando(true)
    try {
      // 1. Cria a visita no banco com hora_inicio e observação
      await fetch(`${API}/visitas/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_agendamento: id,
          hora_inicio:    horaInicio.toISOString(),
          observacao:     observacao || null,
        }),
      })
      await fetch(`${API}/agendamento/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Concluída' }),
      })

      // 2. Busca a visita recém-criada para ter o id_visita
      const resV = await fetch(`${API}/visitas/listar?id_agendamento=${id}`)
      const lista: VisitaRegistro[] = await resV.json()
      const novaVisita = lista[0]

      // 3. Faz upload de cada arquivo capturado localmente via API
      const registrosSalvos: RegistroMidia[] = []
      for (const reg of registrosLocais) {
        const formData = new FormData()
        formData.append('file', reg.blob, reg.nome)

        try {
          const res = await fetch(`${API}/visitas/${novaVisita.id_visita}/midia`, {
            method: 'POST',
            body: formData,
          })
          if (res.ok) {
            const registro: RegistroMidia = await res.json()
            registrosSalvos.push(registro)
          }
        } catch {
          console.error(`Erro ao enviar ${reg.nome}`)
        }
      }

      // 4. Atualiza o estado com a visita finalizada

      setVisita({ ...novaVisita, registros: registrosSalvos, created_at: new Date().toISOString() })
      setFase('concluida')
    } finally {
      setFinalizando(false)
    }
  }

  // ── Captura de foto via câmera ────────────────────────────────────

  function handleCameraChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    adicionarRegistroLocal(file.name, file.type, file)
    e.target.value = ''
  }

  // ── Importar arquivo ──────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    adicionarRegistroLocal(file.name, file.type, file)
    e.target.value = ''
  }

  // ── Gravação de áudio ─────────────────────────────────────────────

  async function handleIniciarGravacao() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = e => chunksRef.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const nome = `audio_${new Date().toISOString().replace(/[:.]/g, '-')}.webm`
        adicionarRegistroLocal(nome, 'audio/webm', blob)
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setGravandoAudio(true)
    } catch {
      alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
    }
  }

  function handlePararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravandoAudio(false)
  }

  // ── Helpers de mídia ──────────────────────────────────────────────

  function adicionarRegistroLocal(nome: string, tipo: string, blob: Blob) {
    setRegistrosLocais(prev => [...prev, {
      id:       crypto.randomUUID(),
      nome,
      tipo,
      blob,
      localUrl: URL.createObjectURL(blob),
    }])
  }

  function removerRegistroLocal(regId: string) {
    setRegistrosLocais(prev => {
      const reg = prev.find(r => r.id === regId)
      if (reg) URL.revokeObjectURL(reg.localUrl)
      return prev.filter(r => r.id !== regId)
    })
  }

  // ── Guards ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen">
      <Header title="Visita" subtitle="Carregando..." />
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  if (!agendamento) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Agendamento não encontrado.</p>
        <Button variant="outline" onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    </div>
  )

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header
        title="Detalhes da Visita"
        subtitle={agendamento.cliente?.nome ?? agendamento.local}
      />

      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-1">
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Coluna principal ─────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Card do cronômetro */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Cronômetro da Visita</h3>
                  <p className="text-sm text-muted-foreground">Controle o tempo da visita</p>
                </div>
                <span className={cn(
                  'rounded-full px-3 py-1 text-sm font-medium',
                  fase === 'agendada'    && 'bg-primary/10 text-primary',
                  fase === 'em-andamento'&& 'bg-warning/10 text-warning',
                  fase === 'concluida'   && 'bg-success/10 text-success',
                )}>
                  {fase === 'agendada'     && 'Agendada'}
                  {fase === 'em-andamento' && 'Em andamento'}
                  {fase === 'concluida'    && 'Concluída'}
                </span>
              </div>

              <div className="flex flex-col items-center gap-6">
                {/* Display */}
                <div className="flex items-center justify-center rounded-2xl bg-secondary/50 px-12 py-8">
                  <span className="font-mono text-5xl font-bold text-foreground">
                    {fase === 'concluida' && visita
                      ? calcDuracao(visita.hora_inicio, visita.created_at)
                      : formatTime(elapsedTime)
                    }
                  </span>
                </div>

                {horaInicio && fase === 'em-andamento' && (
                  <p className="text-sm text-muted-foreground">
                    Iniciada às {horaInicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}

                {/* Botões de controle */}
                <div className="flex items-center gap-3">
                  {fase === 'agendada' && (
                    <Button onClick={handleIniciar} size="lg" className="gap-2">
                      <Play className="h-5 w-5" />
                      Iniciar Visita
                    </Button>
                  )}

                  {fase === 'em-andamento' && (
                    <>
                      {isRunning ? (
                        <Button onClick={handlePausar} variant="outline" size="lg" className="gap-2">
                          <Pause className="h-5 w-5" />Pausar
                        </Button>
                      ) : (
                        <Button onClick={handleContinuar} size="lg" className="gap-2">
                          <Play className="h-5 w-5" />Continuar
                        </Button>
                      )}
                      <Button
                        onClick={handleFinalizar}
                        variant="destructive"
                        size="lg"
                        className="gap-2"
                        disabled={finalizando}
                      >
                        {finalizando
                          ? <Loader2 className="h-5 w-5 animate-spin" />
                          : <Square className="h-5 w-5" />
                        }
                        {finalizando ? 'Salvando...' : 'Finalizar Visita'}
                      </Button>
                    </>
                  )}

                  {fase === 'concluida' && (
                    <div className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-success">
                      <Check className="h-5 w-5" />
                      <span className="font-medium">Visita Concluída</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card de observações — visível após iniciar ou se concluída */}
            {(fase === 'em-andamento' || fase === 'concluida') && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-foreground">Observações</h3>
                </div>
                <Textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Anote o que foi discutido, observado ou acordado durante a visita..."
                  rows={5}
                  className="resize-none"
                  readOnly={fase === 'concluida'}
                />
              </div>
            )}

            {/* Card de registros de mídia */}
            {(fase === 'em-andamento' || fase === 'concluida') && (
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold text-foreground">Registros de Mídia</h3>
                    {registrosLocais.length > 0 && fase === 'em-andamento' && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                        {registrosLocais.length} pendente{registrosLocais.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de captura — só durante a visita */}
                {fase === 'em-andamento' && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {/* Câmera */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cameraInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" />Tirar foto
                    </Button>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleCameraChange}
                    />

                    {/* Gravar áudio */}
                    {!gravandoAudio ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleIniciarGravacao}
                        className="gap-2"
                      >
                        <Mic className="h-4 w-4" />Gravar áudio
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handlePararGravacao}
                        className="animate-pulse gap-2"
                      >
                        <MicOff className="h-4 w-4" />Parar gravação
                      </Button>
                    )}

                    {/* Importar arquivo */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />Importar arquivo
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* Lista de registros locais (durante a visita) */}
                {fase === 'em-andamento' && registrosLocais.length > 0 && (
                  <div className="space-y-2">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Esses arquivos serão enviados ao finalizar a visita.
                    </p>
                    {registrosLocais.map(reg => (
                      <div key={reg.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
                        <MidiaIcon tipo={reg.tipo} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{reg.nome}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(reg.blob.size)}</p>
                        </div>
                        {/* Preview inline de imagem */}
                        {reg.tipo.startsWith('image/') && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={reg.localUrl} alt={reg.nome} className="h-10 w-10 rounded object-cover" />
                        )}
                        {/* Player inline de áudio */}
                        {reg.tipo.startsWith('audio/') && (
                          <audio controls src={reg.localUrl} className="h-8 max-w-[160px]" />
                        )}
                        <button
                          onClick={() => removerRegistroLocal(reg.id)}
                          className="ml-1 flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lista de registros salvos (visita concluída) */}
                {fase === 'concluida' && (
                  <>
                    {(visita?.registros ?? []).length > 0 ? (
                      <div className="space-y-3">
                        {visita!.registros.map((reg, i) => (
                          <div key={i} className="rounded-lg border border-border bg-secondary/30 p-3">
                            <div className="mb-2 flex items-center gap-2">
                              <MidiaIcon tipo={reg.tipo} />
                              <span className="truncate text-sm font-medium text-foreground">{reg.nome}</span>
                              <span className="ml-auto text-xs text-muted-foreground">{formatBytes(reg.tamanho)}</span>
                              <a
                                href={reg.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                            </div>
                            {/* Preview de imagem */}
                            {reg.tipo.startsWith('image/') && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={reg.url}
                                alt={reg.nome}
                                className="mt-1 w-full rounded-lg object-cover"
                                style={{ maxHeight: 280 }}
                              />
                            )}
                            {/* Player de áudio */}
                            {reg.tipo.startsWith('audio/') && (
                              <audio controls src={reg.url} className="mt-1 w-full" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground">
                        Nenhum registro de mídia nesta visita.
                      </p>
                    )}
                  </>
                )}

                {/* Estado vazio durante a visita */}
                {fase === 'em-andamento' && registrosLocais.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Use os botões acima para capturar fotos, gravar áudios ou importar arquivos.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Informações do agendamento */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold text-foreground">Informações</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Agendada para</p>
                    <p className="font-medium text-foreground">{formatDateTime(agendamento.data)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Local</p>
                    <p className="font-medium text-foreground">{agendamento.local}</p>
                  </div>
                </div>
                {agendamento.cliente?.nome && (
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Cliente</p>
                      <p className="font-medium text-foreground">{agendamento.cliente?.nome}</p>
                    </div>
                  </div>
                )}
                {fase === 'concluida' && visita && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duração total</p>
                      <p className="font-medium text-foreground">
                        {calcDuracao(visita.hora_inicio, visita.created_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-4 font-semibold text-foreground">Ações Rápidas</h3>
              <div className="space-y-2">
                {agendamento.id_cliente && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`/clientes/${agendamento.id_cliente}`}>
                      <Building2 className="mr-2 h-4 w-4" />Ver Cliente
                    </a>
                  </Button>
                )}
                {/* Criar relatório só disponível após finalizar */}
                {fase === 'concluida' && visita && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`/relatorios?id_visita=${visita.id_visita}`}>
                      <FileText className="mr-2 h-4 w-4" />Criar Relatório
                    </a>
                  </Button>
                )}
              </div>
            </div>

            {/* ID de referência */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Referência</h3>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {agendamento.id_agendamento}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}