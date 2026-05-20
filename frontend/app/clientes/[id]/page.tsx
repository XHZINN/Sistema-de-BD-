'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ArrowLeft, Building2, Mail, Phone, MapPin,
  Calendar, FileText, Plus, Loader2, Pencil,
  Check, X, AlertCircle, User, Tag,
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

const API = process.env.NEXT_PUBLIC_API_BACKEND

// ─── Types ────────────────────────────────────────────────────────────────

interface Cliente {
  id_cliente: string
  nome: string
  cidade: string
  tipo_cliente: string
  email_oficial: string | null
  telefone_oficial: string | null
  contatos: Contato[]
}

interface Contato {
  id_contato: string
  id_cliente: string
  nome: string
  vinculo: string
  area: string | null
  telefone: string | null
  email: string | null
  observacoes: string | null
}

interface Contrato {
  id_contrato: string
  id_cliente: string
  modelo: string
  valor: number | null
  permite_cobranca_extra: boolean
  descricao_regras: string | null
  data_fechamento: string | null
  prazo_contrato: string | null
}

interface Agendamento {
  id_agendamento: string
  tipo_agendamento: string
  data: string
  status: string
  formato: string
  local: string
}

type PageParams = Promise<{ id: string }>

// ─── Helpers ──────────────────────────────────────────────────────────────

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const statusColor: Record<string, string> = {
  Agendada:   'bg-primary/10 text-primary',
  Concluída:  'bg-success/10 text-success',
  Cancelada:  'bg-destructive/10 text-destructive',
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: PageParams }) {
  const { id } = use(params)
  const router = useRouter()

  const [cliente, setCliente]         = useState<Cliente | null>(null)
  const [contratos, setContratos]     = useState<Contrato[]>([])
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [erro, setErro]               = useState<string | null>(null)

  // Edição de dados básicos do cliente
  const [editandoCliente, setEditandoCliente] = useState(false)
  const [salvandoCliente, setSalvandoCliente] = useState(false)
  const [formCliente, setFormCliente] = useState({
    nome: '', cidade: '', tipo_cliente: '', email_oficial: '', telefone_oficial: '',
  })

  // Novo contato
  const [dialogContato, setDialogContato] = useState(false)
  const [salvandoContato, setSalvandoContato] = useState(false)
  const [novoContato, setNovoContato] = useState({
    nome: '', vinculo: '', area: '', telefone: '', email: '', observacoes: '',
  })

  // ── Fetch ────────────────────────────────────────────────────────

  useEffect(() => { fetchTudo() }, [id])

  async function fetchTudo() {
    setLoading(true)
    setErro(null)
    try {
      const [resCliente, resContratos, resAgendamentos] = await Promise.all([
        fetch(`${API}/cliente/${id}`),
        fetch(`${API}/cliente/${id}/contrato/listar`),
        fetch(`${API}/agendamento/listar?id_cliente=${id}`),
      ])

      if (resCliente.status === 404) { setNotFound(true); return }
      if (!resCliente.ok) throw new Error(`Erro ${resCliente.status}`)

      const clienteData: Cliente = await resCliente.json()
      setCliente(clienteData)
      setFormCliente({
        nome:             clienteData.nome,
        cidade:           clienteData.cidade,
        tipo_cliente:     clienteData.tipo_cliente,
        email_oficial:    clienteData.email_oficial ?? '',
        telefone_oficial: clienteData.telefone_oficial ?? '',
      })

      if (resContratos.ok) setContratos(await resContratos.json())
      if (resAgendamentos.ok) setAgendamentos(await resAgendamentos.json())
    } catch {
      setErro('Não foi possível carregar os dados do cliente.')
    } finally {
      setLoading(false)
    }
  }

  // ── Atualizar cliente ────────────────────────────────────────────

  async function handleSalvarCliente() {
    setSalvandoCliente(true)
    setErro(null)
    try {
      const body: Record<string, string | null> = {
        nome:             formCliente.nome,
        cidade:           formCliente.cidade,
        tipo_cliente:     formCliente.tipo_cliente,
        email_oficial:    formCliente.email_oficial    || null,
        telefone_oficial: formCliente.telefone_oficial || null,
      }
      const res = await fetch(`${API}/cliente/${id}/atualizar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erro ao atualizar')
      }
      const { cliente: updated } = await res.json()
      setCliente(prev => prev ? { ...prev, ...updated } : prev)
      setEditandoCliente(false)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvandoCliente(false)
    }
  }

  // ── Cadastrar contato ────────────────────────────────────────────

  async function handleCadastrarContato() {
    if (!novoContato.nome || !novoContato.vinculo) return
    if (!novoContato.telefone && !novoContato.email) return

    setSalvandoContato(true)
    setErro(null)
    try {
      const res = await fetch(`${API}/cliente/${id}/contato/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome:        novoContato.nome,
          vinculo:     novoContato.vinculo,
          area:        novoContato.area        || null,
          telefone:    novoContato.telefone    || null,
          email:       novoContato.email       || null,
          observacoes: novoContato.observacoes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erro ao cadastrar contato')
      }
      const { contato } = await res.json()
      setCliente(prev =>
        prev ? { ...prev, contatos: [...prev.contatos, contato] } : prev
      )
      setNovoContato({ nome: '', vinculo: '', area: '', telefone: '', email: '', observacoes: '' })
      setDialogContato(false)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvandoContato(false)
    }
  }

  // ── Guards ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen">
      <Header title="Cliente" subtitle="Carregando..." />
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  )

  if (notFound || !cliente) return (
    <div className="min-h-screen">
      <Header title="Cliente" subtitle="Não encontrado" />
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button variant="outline" onClick={() => router.push('/clientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
      </div>
    </div>
  )

  const contrato = contratos[0] ?? null
  const agendamentosFuturos = agendamentos
    .filter(a => new Date(a.data) >= new Date())
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen">
      <Header title={cliente.nome} subtitle={`${cliente.tipo_cliente} • ${cliente.cidade}`} />

      <div className="p-6">
        <Button variant="ghost" onClick={() => router.push('/clientes')} className="mb-6 -ml-1">
          <ArrowLeft className="mr-2 h-4 w-4" />Clientes
        </Button>

        {erro && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {erro}
          </div>
        )}

        {/* Card principal */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Building2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                {editandoCliente ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nome</Label>
                        <Input value={formCliente.nome} onChange={e => setFormCliente({ ...formCliente, nome: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Cidade</Label>
                        <Input value={formCliente.cidade} onChange={e => setFormCliente({ ...formCliente, cidade: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tipo</Label>
                        <Input value={formCliente.tipo_cliente} onChange={e => setFormCliente({ ...formCliente, tipo_cliente: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>E-mail oficial</Label>
                        <Input type="email" value={formCliente.email_oficial} onChange={e => setFormCliente({ ...formCliente, email_oficial: e.target.value })} />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label>Telefone oficial</Label>
                        <Input value={formCliente.telefone_oficial} onChange={e => setFormCliente({ ...formCliente, telefone_oficial: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSalvarCliente} disabled={salvandoCliente}>
                        {salvandoCliente ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Check className="mr-1.5 h-4 w-4" />}
                        Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditandoCliente(false)} disabled={salvandoCliente}>
                        <X className="mr-1.5 h-4 w-4" />Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-foreground">{cliente.nome}</h2>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {cliente.tipo_cliente}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{cliente.cidade}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {cliente.email_oficial && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{cliente.email_oficial}
                        </span>
                      )}
                      {cliente.telefone_oficial && (
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{cliente.telefone_oficial}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />{cliente.cidade}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            {!editandoCliente && (
              <Button variant="outline" size="sm" onClick={() => setEditandoCliente(true)}>
                <Pencil className="mr-1.5 h-4 w-4" />Editar
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="contatos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="contatos" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Contatos</span>
            </TabsTrigger>
            <TabsTrigger value="contrato" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Contrato</span>
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agendamentos</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Contatos ── */}
          <TabsContent value="contatos">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Contatos ({cliente.contatos.length})</h3>
                <Dialog open={dialogContato} onOpenChange={setDialogContato}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="mr-2 h-4 w-4" />Novo Contato</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Cadastrar Contato</DialogTitle></DialogHeader>
                    <div className="space-y-3 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Nome *</Label>
                          <Input value={novoContato.nome} onChange={e => setNovoContato({ ...novoContato, nome: e.target.value })} placeholder="Nome completo" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Vínculo *</Label>
                          <Input value={novoContato.vinculo} onChange={e => setNovoContato({ ...novoContato, vinculo: e.target.value })} placeholder="Ex: Diretor" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Área</Label>
                          <Input value={novoContato.area} onChange={e => setNovoContato({ ...novoContato, area: e.target.value })} placeholder="Ex: Financeiro" />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Telefone</Label>
                          <Input value={novoContato.telefone} onChange={e => setNovoContato({ ...novoContato, telefone: e.target.value })} placeholder="(85) 99999-9999" />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>E-mail</Label>
                          <Input type="email" value={novoContato.email} onChange={e => setNovoContato({ ...novoContato, email: e.target.value })} placeholder="contato@email.com" />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                          <Label>Observações</Label>
                          <Input value={novoContato.observacoes} onChange={e => setNovoContato({ ...novoContato, observacoes: e.target.value })} placeholder="Observações adicionais" />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">* Informe ao menos telefone ou e-mail.</p>
                      <Button
                        onClick={handleCadastrarContato}
                        className="w-full"
                        disabled={
                          salvandoContato ||
                          !novoContato.nome ||
                          !novoContato.vinculo ||
                          (!novoContato.telefone && !novoContato.email)
                        }
                      >
                        {salvandoContato ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Cadastrar Contato
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="divide-y divide-border">
                {cliente.contatos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum contato cadastrado</p>
                ) : cliente.contatos.map(c => (
                  <div key={c.id_contato} className="flex items-start gap-4 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{c.nome}</p>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{c.vinculo}</span>
                        {c.area && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">{c.area}</span>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                        {c.telefone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />{c.telefone}
                          </span>
                        )}
                        {c.email && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />{c.email}
                          </span>
                        )}
                      </div>
                      {c.observacoes && <p className="mt-1 text-xs text-muted-foreground">{c.observacoes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ── Contrato ── */}
          <TabsContent value="contrato">
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Contrato</h3>
              </div>
              <div className="p-4">
                {!contrato ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum contrato encontrado</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {[
                        { label: 'Modelo',  value: contrato.modelo,                         icon: Tag },
                        { label: 'Valor',   value: contrato.valor ? `R$ ${contrato.valor.toFixed(2)}` : '—', icon: FileText },
                        { label: 'Cobrança extra', value: contrato.permite_cobranca_extra ? 'Permitida' : 'Não permitida', icon: FileText },
                        { label: 'Fechamento',     value: formatDate(contrato.data_fechamento),  icon: Calendar },
                        { label: 'Prazo',          value: formatDate(contrato.prazo_contrato),   icon: Calendar },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-border bg-secondary/30 p-3">
                          <p className="text-xs text-muted-foreground">{item.label}</p>
                          <p className="mt-0.5 font-medium text-foreground">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    {contrato.descricao_regras && (
                      <div className="rounded-lg border border-border bg-secondary/30 p-3">
                        <p className="text-xs text-muted-foreground">Regras / Observações</p>
                        <p className="mt-0.5 text-sm text-foreground">{contrato.descricao_regras}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Agendamentos ── */}
          <TabsContent value="agendamentos">
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h3 className="font-semibold text-foreground">Agendamentos ({agendamentos.length})</h3>
                <Button size="sm" variant="outline" onClick={() => router.push('/agendamentos')}>
                  <Plus className="mr-2 h-4 w-4" />Novo
                </Button>
              </div>
              <div className="divide-y divide-border">
                {agendamentos.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Nenhum agendamento encontrado</p>
                ) : agendamentos
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map(a => (
                  <div
                    key={a.id_agendamento}
                    className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-secondary/40"
                    onClick={() => router.push(`/agendamentos/${a.id_agendamento}`)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{a.tipo_agendamento}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColor[a.status] ?? 'bg-secondary text-muted-foreground')}>
                          {a.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {new Date(a.data).toLocaleDateString('pt-BR', {
                          weekday: 'short', day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })} • {a.local}
                      </p>
                    </div>
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{a.formato}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}