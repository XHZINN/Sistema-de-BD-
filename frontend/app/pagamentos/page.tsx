'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Filter, Loader2, CheckCircle2,
  Clock, AlertCircle, DollarSign, Calendar,
  Building2, ChevronRight,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const API = process.env.NEXT_PUBLIC_API_BACKEND

type TipoPagamento = 'Mensalidade' | 'Cobrança extra'
type StatusPagamento = 'Pendente' | 'Pago' | 'Atrasado'

interface Pagamento {
  id_pagamento: string
  id_contrato: string
  valor: number
  tipo: TipoPagamento
  status: StatusPagamento
  data_vencimento: string
  data_pagamento: string | null
  observacao: string | null
  contrato?: {
    modelo: string
    valor: number
    id_cliente: string
    cliente?: { nome: string }
  }
}

interface Contrato {
  id_contrato: string
  id_cliente: string
  modelo: string
  valor: number | null
}

interface Cliente {
  id_cliente: string
  nome: string
}

const statusColor: Record<StatusPagamento, string> = {
  Pago:     'bg-success/10 text-success border-success/20',
  Pendente: 'bg-warning/10 text-warning border-warning/20',
  Atrasado: 'bg-destructive/10 text-destructive border-destructive/20',
}

const StatusIcon = ({ status }: { status: StatusPagamento }) => {
  if (status === 'Pago')     return <CheckCircle2 className="h-4 w-4 text-success" />
  if (status === 'Atrasado') return <AlertCircle  className="h-4 w-4 text-destructive" />
  return <Clock className="h-4 w-4 text-warning" />
}

function formatDate(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [contratos, setContratos]   = useState<Contrato[]>([])
  const [clientes, setClientes]     = useState<Cliente[]>([])
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [erro, setErro]             = useState<string | null>(null)

  const [search, setSearch]           = useState('')
  const [filtroStatus, setFiltroStatus] = useState('all')
  const [filtroTipo, setFiltroTipo]   = useState('all')
  const [mostrarVencidos, setMostrarVencidos] = useState(false)

  const [dialogOpen, setDialogOpen]   = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<Pagamento | null>(null)
  const [dataConfirmacao, setDataConfirmacao] = useState(new Date().toISOString().split('T')[0])
  const [obsConfirmacao, setObsConfirmacao] = useState('')

  const [novoPagamento, setNovoPagamento] = useState({
    id_contrato:     '',
    valor:           '',
    tipo:            '' as TipoPagamento | '',
    data_vencimento: '',
    observacao:      '',
  })

  useEffect(() => {
    fetchPagamentos()
    fetchClientes()
  }, [])

  async function fetchPagamentos() {
    setLoading(true)
    setErro(null)
    try {
      const url = new URL(`${API}/pagamento/listar`)
      if (mostrarVencidos) url.searchParams.set('vencidos', 'true')
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      setPagamentos(await res.json())
    } catch {
      setErro('Não foi possível carregar os pagamentos.')
    } finally {
      setLoading(false)
    }
  }

  async function fetchContratosPorCliente(id_cliente: string) {
    try {
      const res = await fetch(`${API}/cliente/${id_cliente}/contrato/listar`)
      if (res.ok) setContratos(await res.json())
    } catch {}
  }

  async function fetchClientes() {
    try {
      const res = await fetch(`${API}/cliente/listar`)
      if (res.ok) setClientes(await res.json())
    } catch {}
  }

  async function handleCadastrar() {
    if (!novoPagamento.id_contrato || !novoPagamento.valor || !novoPagamento.tipo || !novoPagamento.data_vencimento) return
    setSalvando(true)
    setErro(null)
    try {
      const res = await fetch(`${API}/pagamento/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_contrato:     novoPagamento.id_contrato,
          valor:           parseFloat(novoPagamento.valor),
          tipo:            novoPagamento.tipo,
          data_vencimento: novoPagamento.data_vencimento,
          observacao:      novoPagamento.observacao || null,
        }),
      })
      if (!res.ok) throw new Error('Erro ao cadastrar')
      await fetchPagamentos()
      setNovoPagamento({ id_contrato: '', valor: '', tipo: '', data_vencimento: '', observacao: '' })
      setDialogOpen(false)
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setSalvando(false)
    }
  }

  async function handleConfirmar() {
    if (!confirmDialog) return
    setSalvando(true)
    try {
      const res = await fetch(`${API}/pagamento/${confirmDialog.id_pagamento}/confirmar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_pagamento: dataConfirmacao,
          observacao:     obsConfirmacao || null,
        }),
      })
      if (!res.ok) throw new Error()
      setPagamentos(prev => prev.map(p =>
        p.id_pagamento === confirmDialog.id_pagamento
          ? { ...p, status: 'Pago', data_pagamento: dataConfirmacao }
          : p
      ))
      setConfirmDialog(null)
      setObsConfirmacao('')
    } finally {
      setSalvando(false)
    }
  }

  const filtrados = pagamentos.filter(p => {
    const nome = p.contrato?.cliente?.nome ?? ''
    const matchSearch = nome.toLowerCase().includes(search.toLowerCase()) ||
      p.tipo.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filtroStatus === 'all' || p.status === filtroStatus
    const matchTipo   = filtroTipo   === 'all' || p.tipo   === filtroTipo
    return matchSearch && matchStatus && matchTipo
  })

  const faturado  = pagamentos.filter(p => p.status === 'Pago').reduce((a, p) => a + p.valor, 0)
  const pendente  = pagamentos.filter(p => p.status === 'Pendente').reduce((a, p) => a + p.valor, 0)
  const atrasado  = pagamentos.filter(p => p.status === 'Atrasado').reduce((a, p) => a + p.valor, 0)

  const hoje = new Date().toISOString().split('T')[0]
  const atrasadosAuto = pagamentos.filter(p => p.status === 'Pendente' && p.data_vencimento < hoje).length

  const selectClass = 'rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground'

  return (
    <div className="min-h-screen">
      <Header title="Pagamentos" subtitle="Controle financeiro" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Faturado',       value: `R$ ${faturado.toFixed(2)}`,  color: 'text-success'     },
            { label: 'Pendente',       value: `R$ ${pendente.toFixed(2)}`,  color: 'text-warning'     },
            { label: 'Atrasado',       value: `R$ ${atrasado.toFixed(2)}`,  color: 'text-destructive' },
            { label: 'Venc. pendentes',value: String(atrasadosAuto),        color: 'text-destructive' },
          ].map(s => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={cn('mt-0.5 text-xl font-semibold', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filtros + botão */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou tipo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className={selectClass}>
                <option value="all">Todos os status</option>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
              </select>
              <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className={selectClass}>
                <option value="all">Todos os tipos</option>
                <option value="Mensalidade">Mensalidade</option>
                <option value="Cobrança extra">Cobrança extra</option>
              </select>
            </div>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Novo Pagamento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Cadastrar Pagamento</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <select
                    className={'w-full ' + selectClass}
                    onChange={e => {
                      setContratos([])
                      setNovoPagamento({ ...novoPagamento, id_contrato: '' })
                      if (e.target.value) fetchContratosPorCliente(e.target.value)
                    }}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map(c => <option key={c.id_cliente} value={c.id_cliente}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Contrato *</Label>
                  <select
                    value={novoPagamento.id_contrato}
                    onChange={e => {
                      const contrato = contratos.find(c => c.id_contrato === e.target.value)
                      setNovoPagamento({
                        ...novoPagamento,
                        id_contrato: e.target.value,
                        valor: contrato?.valor?.toString() ?? '',
                      })
                    }}
                    className={'w-full ' + selectClass}
                    disabled={contratos.length === 0}
                  >
                    <option value="">{contratos.length === 0 ? 'Selecione um cliente primeiro' : 'Selecione o contrato'}</option>
                    {contratos.map(c => <option key={c.id_contrato} value={c.id_contrato}>{c.modelo} — R$ {c.valor?.toFixed(2) ?? '—'}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo *</Label>
                    <select
                      value={novoPagamento.tipo}
                      onChange={e => setNovoPagamento({ ...novoPagamento, tipo: e.target.value as TipoPagamento })}
                      className={'w-full ' + selectClass}
                    >
                      <option value="">Selecione</option>
                      <option value="Mensalidade">Mensalidade</option>
                      <option value="Cobrança extra">Cobrança extra</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valor (R$) *</Label>
                    <Input
                      type="number" min="0" step="0.01"
                      value={novoPagamento.valor}
                      onChange={e => setNovoPagamento({ ...novoPagamento, valor: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={novoPagamento.data_vencimento}
                    onChange={e => setNovoPagamento({ ...novoPagamento, data_vencimento: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Observação</Label>
                  <Input
                    value={novoPagamento.observacao}
                    onChange={e => setNovoPagamento({ ...novoPagamento, observacao: e.target.value })}
                    placeholder="Observação opcional"
                  />
                </div>
                {erro && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}
                <Button
                  onClick={handleCadastrar}
                  className="w-full"
                  disabled={salvando || !novoPagamento.id_contrato || !novoPagamento.valor || !novoPagamento.tipo || !novoPagamento.data_vencimento}
                >
                  {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                  Cadastrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dialog de confirmação de pagamento */}
        <Dialog open={!!confirmDialog} onOpenChange={open => { if (!open) setConfirmDialog(null) }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Marcar pagamento de <strong>R$ {confirmDialog?.valor.toFixed(2)}</strong> como pago.
              </p>
              <div className="space-y-1.5">
                <Label>Data do pagamento</Label>
                <Input type="date" value={dataConfirmacao} onChange={e => setDataConfirmacao(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Observação</Label>
                <Input value={obsConfirmacao} onChange={e => setObsConfirmacao(e.target.value)} placeholder="Ex: Pix, boleto..." />
              </div>
              <Button onClick={handleConfirmar} className="w-full" disabled={salvando || !dataConfirmacao}>
                {salvando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lista */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : erro && pagamentos.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" onClick={fetchPagamentos} className="mt-4">Tentar novamente</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.length === 0 ? (
              <div className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-4 text-muted-foreground">Nenhum pagamento encontrado</p>
              </div>
            ) : filtrados.map(p => {
              const vencido = p.status === 'Pendente' && p.data_vencimento < hoje
              return (
                <div
                  key={p.id_pagamento}
                  className={cn(
                    'rounded-xl border border-border bg-card p-4',
                    vencido && 'border-destructive/30 bg-destructive/5'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <StatusIcon status={vencido ? 'Atrasado' : p.status} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">R$ {p.valor.toFixed(2)}</p>
                          <span className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            statusColor[vencido ? 'Atrasado' : p.status]
                          )}>
                            {vencido ? 'Atrasado' : p.status}
                          </span>
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                            {p.tipo}
                          </span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {p.contrato?.cliente?.nome && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3.5 w-3.5" />{p.contrato.cliente.nome}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Vence: {formatDate(p.data_vencimento)}
                          </span>
                          {p.data_pagamento && (
                            <span className="flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Pago: {formatDate(p.data_pagamento)}
                            </span>
                          )}
                        </div>
                        {p.observacao && (
                          <p className="mt-1 text-xs text-muted-foreground">{p.observacao}</p>
                        )}
                      </div>
                    </div>
                    {p.status !== 'Pago' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setConfirmDialog(p)
                          setDataConfirmacao(new Date().toISOString().split('T')[0])
                        }}
                      >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />Confirmar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}