'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ChevronLeft, Pencil, X, Check, Loader2, AlertCircle,
  Send, CheckCircle, Calendar, Tag, AlignLeft, ArrowRight,
  DollarSign, Clock, FileText, Building2, Link, ExternalLink,
  Save, FileEdit,
} from 'lucide-react'
import { RichTextEditor } from '@/components/rich-text-editor'
import type { JSONContent } from '@tiptap/react'
import type { Anexo } from '@/components/rich-text-editor'

const API = process.env.NEXT_PUBLIC_API_BACKEND

// ─── Types ─────────────────────────────────────────────────────────────────

interface Relatorio {
  id_relatorio: string
  id_visita: string
  tipo: string
  data_prevista: string
  status: string
  documento: string | null
  avancos: string | null
  proximo_passo: string | null
  cobranca_extra: boolean
  valor_extra: number | null
  duracao: number | null
  conteudo: JSONContent | null
  conteudo_html: string | null
  anexos: Anexo[]
  visitas?: {
    id_agendamento: string
    agendamentos?: {
      id_cliente: string
      cliente?: { nome: string }
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const TIPOS = ['Visita', 'Análise', 'Recomendação', 'Acompanhamento']

const tipoColor: Record<string, string> = {
  Visita:         'bg-primary/10 text-primary border-primary/20',
  Análise:        'bg-chart-2/10 text-chart-2 border-chart-2/20',
  Recomendação:   'bg-warning/10 text-warning border-warning/20',
  Acompanhamento: 'bg-success/10 text-success border-success/20',
}

function Badge({ label, colorClass }: { label: string; colorClass: string }) {
  return (
    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium', colorClass)}>
      {label}
    </span>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  )
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function RelatorioDetailPage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string

  const [relatorio,     setRelatorio]     = useState<Relatorio | null>(null)
  const [loadingPage,   setLoadingPage]   = useState(true)
  const [notFound,      setNotFound]      = useState(false)
  const [editing,       setEditing]       = useState(false)
  const [loadingSave,   setLoadingSave]   = useState(false)
  const [loadingEnviar, setLoadingEnviar] = useState(false)

  // Editor state
  const [editorJson,        setEditorJson]        = useState<JSONContent | null>(null)
  const [editorHtml,        setEditorHtml]        = useState<string | null>(null)
  const [editorDirty,       setEditorDirty]       = useState(false)
  const [loadingEditorSave, setLoadingEditorSave] = useState(false)
  const [editorSavedAt,     setEditorSavedAt]     = useState<Date | null>(null)

  // Documento externo
  const [documentoEdit,    setDocumentoEdit]    = useState(false)
  const [documentoInput,   setDocumentoInput]   = useState('')
  const [loadingDocumento, setLoadingDocumento] = useState(false)

  const [form, setForm] = useState({
    tipo: '',
    data_prevista: '',
    avancos: '',
    proximo_passo: '',
    cobranca_extra: false,
    valor_extra: '',
    duracao: '',
  })

  // ── Fetch ─────────────────────────────────────────────────────────────

  useEffect(() => { fetchRelatorio() }, [id])

  async function fetchRelatorio() {
    setLoadingPage(true)
    try {
      const res = await fetch(`${API}/relatorio/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      const data: Relatorio = await res.json()
      setRelatorio(data)
      setForm({
        tipo:           data.tipo,
        data_prevista:  data.data_prevista?.split('T')[0] ?? '',
        avancos:        data.avancos ?? '',
        proximo_passo:  data.proximo_passo ?? '',
        cobranca_extra: data.cobranca_extra,
        valor_extra:    data.valor_extra?.toString() ?? '',
        duracao:        data.duracao?.toString() ?? '',
      })
      // Initialize editor content
      setEditorJson(data.conteudo)
      setEditorHtml(data.conteudo_html)
      setDocumentoInput(data.documento ?? '')
    } catch {
      setNotFound(true)
    } finally {
      setLoadingPage(false)
    }
  }

  // ── Salvar informações ────────────────────────────────────────────────

  async function handleSave() {
    if (!form.tipo || !form.data_prevista) return
    setLoadingSave(true)
    try {
      const body: Record<string, unknown> = {
        tipo:           form.tipo,
        data_prevista:  form.data_prevista,
        avancos:        form.avancos       || null,
        proximo_passo:  form.proximo_passo || null,
        cobranca_extra: form.cobranca_extra,
        valor_extra:    form.valor_extra  ? parseFloat(form.valor_extra)  : null,
        duracao:        form.duracao      ? parseFloat(form.duracao)      : null,
      }
      const res = await fetch(`${API}/relatorio/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const updated: Relatorio = await res.json()
      setRelatorio(prev => prev ? { ...prev, ...updated } : updated)
      setEditing(false)
    } finally {
      setLoadingSave(false)
    }
  }

  function cancelEdit() {
    if (!relatorio) return
    setForm({
      tipo:           relatorio.tipo,
      data_prevista:  relatorio.data_prevista?.split('T')[0] ?? '',
      avancos:        relatorio.avancos ?? '',
      proximo_passo:  relatorio.proximo_passo ?? '',
      cobranca_extra: relatorio.cobranca_extra,
      valor_extra:    relatorio.valor_extra?.toString() ?? '',
      duracao:        relatorio.duracao?.toString() ?? '',
    })
    setEditing(false)
  }

  // ── Salvar conteúdo do editor ─────────────────────────────────────────

  const handleEditorChange = useCallback((json: JSONContent, html: string) => {
    setEditorJson(json)
    setEditorHtml(html)
    setEditorDirty(true)
  }, [])

  async function handleSaveEditor() {
    if (!editorJson && !editorHtml) return
    setLoadingEditorSave(true)
    try {
      const res = await fetch(`${API}/relatorio/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo:      editorJson,
          conteudo_html: editorHtml,
        }),
      })
      if (!res.ok) throw new Error()
      setEditorDirty(false)
      setEditorSavedAt(new Date())
      setRelatorio(prev =>
        prev ? { ...prev, conteudo: editorJson, conteudo_html: editorHtml } : prev
      )
    } finally {
      setLoadingEditorSave(false)
    }
  }

  // ── Salvar documento externo ──────────────────────────────────────────

  async function handleSaveDocumento() {
    setLoadingDocumento(true)
    try {
      const res = await fetch(`${API}/relatorio/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documento: documentoInput || null }),
      })
      if (!res.ok) throw new Error()
      setRelatorio(prev => prev ? { ...prev, documento: documentoInput || null } : prev)
      setDocumentoEdit(false)
    } finally {
      setLoadingDocumento(false)
    }
  }

  // ── Enviar ────────────────────────────────────────────────────────────

  async function handleEnviar() {
    setLoadingEnviar(true)
    try {
      const res = await fetch(`${API}/relatorio/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Enviado' }),
      })
      if (!res.ok) throw new Error()
      setRelatorio(prev => prev ? { ...prev, status: 'Enviado' } : prev)
    } finally {
      setLoadingEnviar(false)
    }
  }

  // ── Guards ────────────────────────────────────────────────────────────

  const selectClass = 'w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary'

  if (loadingPage) {
    return (
      <div className="min-h-screen">
        <Header title="Detalhes do Relatório" subtitle="Carregando..." />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (notFound || !relatorio) {
    return (
      <div className="min-h-screen">
        <Header title="Detalhes do Relatório" subtitle="" />
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">Relatório não encontrado</p>
          <Button variant="outline" onClick={() => router.push('/relatorios')}>
            <ChevronLeft className="mr-2 h-4 w-4" />Voltar
          </Button>
        </div>
      </div>
    )
  }

  const clienteNome  = relatorio.visitas?.agendamentos?.cliente?.nome
  const isEnviado    = relatorio.status === 'Enviado'
  const hasContent   = !!(relatorio.conteudo || relatorio.conteudo_html)

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header
        title="Detalhes do Relatório"
        subtitle={clienteNome ?? 'Sem cliente vinculado'}
      />

      <div className="p-6">
        <Button
          variant="ghost" size="sm"
          className="mb-6 -ml-1 text-muted-foreground"
          onClick={() => router.push('/relatorios')}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />Relatórios
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ── Coluna principal ─────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Card de informações */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-semibold text-foreground">
                  {editing ? 'Editar Informações' : 'Informações'}
                </h2>
                <div className="flex items-center gap-2">
                  {editing ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={loadingSave}>
                        <X className="mr-1.5 h-4 w-4" />Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={loadingSave}>
                        {loadingSave
                          ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          : <Check className="mr-1.5 h-4 w-4" />
                        }
                        Salvar
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setEditing(true)}
                      disabled={isEnviado}
                    >
                      <Pencil className="mr-1.5 h-4 w-4" />Editar
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <select
                          value={form.tipo}
                          onChange={e => setForm({ ...form, tipo: e.target.value })}
                          className={selectClass}
                        >
                          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Data Prevista</Label>
                        <Input
                          type="date"
                          value={form.data_prevista}
                          onChange={e => setForm({ ...form, data_prevista: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Avanços</Label>
                      <Input
                        value={form.avancos}
                        onChange={e => setForm({ ...form, avancos: e.target.value })}
                        placeholder="O que foi avançado nesta visita..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Próximo Passo</Label>
                      <Input
                        value={form.proximo_passo}
                        onChange={e => setForm({ ...form, proximo_passo: e.target.value })}
                        placeholder="O que deve ser feito a seguir..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duração (horas)</Label>
                        <Input
                          type="number" min="0" step="0.5"
                          value={form.duracao}
                          onChange={e => setForm({ ...form, duracao: e.target.value })}
                          placeholder="Ex: 1.5"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valor Extra (R$)</Label>
                        <Input
                          type="number" min="0" step="0.01"
                          value={form.valor_extra}
                          onChange={e => setForm({ ...form, valor_extra: e.target.value })}
                          placeholder="Ex: 150.00"
                          disabled={!form.cobranca_extra}
                        />
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.cobranca_extra}
                        onChange={e => setForm({
                          ...form,
                          cobranca_extra: e.target.checked,
                          valor_extra: e.target.checked ? form.valor_extra : '',
                        })}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm text-foreground">Possui cobrança extra</span>
                    </label>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <InfoRow icon={Tag}      label="Tipo"          value={relatorio.tipo} />
                    <InfoRow icon={Calendar} label="Data Prevista" value={formatDate(relatorio.data_prevista)} />
                    {relatorio.avancos && (
                      <InfoRow icon={AlignLeft}  label="Avanços"       value={relatorio.avancos} />
                    )}
                    {relatorio.proximo_passo && (
                      <InfoRow icon={ArrowRight} label="Próximo Passo" value={relatorio.proximo_passo} />
                    )}
                    {relatorio.duracao != null && (
                      <InfoRow icon={Clock}      label="Duração"       value={`${relatorio.duracao}h`} />
                    )}
                    {relatorio.cobranca_extra && relatorio.valor_extra != null && (
                      <InfoRow icon={DollarSign} label="Cobrança Extra" value={`R$ ${relatorio.valor_extra.toFixed(2)}`} />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Card do editor ── */}
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-muted-foreground" />
                  <h2 className="font-semibold text-foreground">Conteúdo do Relatório</h2>
                  {hasContent && !editorDirty && (
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs text-success">
                      Salvo
                    </span>
                  )}
                  {editorDirty && (
                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                      Não salvo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {editorSavedAt && !editorDirty && (
                    <span className="text-xs text-muted-foreground">
                      Salvo às {editorSavedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  {!isEnviado && (
                    <Button
                      size="sm"
                      onClick={handleSaveEditor}
                      disabled={loadingEditorSave || !editorDirty}
                    >
                      {loadingEditorSave
                        ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        : <Save className="mr-1.5 h-4 w-4" />
                      }
                      Salvar conteúdo
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4">
                {isEnviado ? (
                  // Modo leitura — exibe o HTML renderizado se disponível, senão o editor somente-leitura
                  relatorio.conteudo_html ? (
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none px-2 py-1
                        prose-headings:font-semibold prose-headings:text-foreground
                        prose-p:text-foreground prose-li:text-foreground
                        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
                        prose-hr:border-border prose-strong:text-foreground"
                      dangerouslySetInnerHTML={{ __html: relatorio.conteudo_html }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                      <FileText className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Nenhum conteúdo registrado para este relatório.</p>
                    </div>
                  )
                ) : (
                  <RichTextEditor
                    idRelatorio={relatorio.id_relatorio}
                    anexos={relatorio.anexos}
                    onAnexosChange={(novosAnexos) => setRelatorio(r => r ? { ...r, anexos: novosAnexos } : r)}
                    contentJson={editorJson}
                    contentHtml={!editorJson ? editorHtml : undefined}
                    onChange={handleEditorChange}
                    readOnly={false}
                  />
                )}

                {!isEnviado && editorDirty && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Você tem alterações não salvas. Clique em "Salvar conteúdo" para persistir.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Status */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tipo</span>
                  <Badge
                    label={relatorio.tipo}
                    colorClass={tipoColor[relatorio.tipo] ?? 'bg-secondary text-muted-foreground border-border'}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {isEnviado ? (
                    <span className="flex items-center gap-1 rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                      <CheckCircle className="h-3 w-3" />Enviado
                    </span>
                  ) : (
                    <span className="rounded-full border border-warning/20 bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              {!isEnviado && (
                <Button
                  className="mt-4 w-full"
                  onClick={handleEnviar}
                  disabled={loadingEnviar || editing || editorDirty}
                  title={editorDirty ? 'Salve o conteúdo antes de enviar' : undefined}
                >
                  {loadingEnviar
                    ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    : <Send className="mr-2 h-4 w-4" />
                  }
                  Enviar para Cliente
                </Button>
              )}
              {editorDirty && !isEnviado && (
                <p className="mt-2 text-center text-xs text-warning">
                  Salve o conteúdo antes de enviar.
                </p>
              )}
            </div>

            {/* Cliente */}
            {clienteNome && (
              <div className="rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Cliente</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{clienteNome}</span>
                </div>
              </div>
            )}

            {/* Documento externo */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Documento Externo</h3>
                {!isEnviado && (
                  <button
                    onClick={() => setDocumentoEdit(v => !v)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                  >
                    {documentoEdit ? 'Cancelar' : 'Editar'}
                  </button>
                )}
              </div>

              {documentoEdit ? (
                <div className="space-y-2">
                  <Input
                    value={documentoInput}
                    onChange={e => setDocumentoInput(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={handleSaveDocumento}
                    disabled={loadingDocumento}
                  >
                    {loadingDocumento
                      ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      : <Check className="mr-1.5 h-4 w-4" />
                    }
                    Salvar link
                  </Button>
                </div>
              ) : relatorio.documento ? (
                <a
                  href={relatorio.documento}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/80"
                >
                  <Link className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{relatorio.documento}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum documento externo vinculado.
                  {!isEnviado && (
                    <button
                      onClick={() => setDocumentoEdit(true)}
                      className="ml-1 text-primary underline-offset-2 hover:underline"
                    >
                      Adicionar link
                    </button>
                  )}
                </p>
              )}
            </div>

            {/* Referência */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Referência</h3>
              <p className="break-all font-mono text-xs text-muted-foreground">
                {relatorio.id_relatorio}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}