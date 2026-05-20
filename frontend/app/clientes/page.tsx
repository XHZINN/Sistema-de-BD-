'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { ClientList } from '@/components/client-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Search, Filter, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const API = process.env.NEXT_PUBLIC_API_BACKEND

interface Cliente {
  id_cliente: string
  nome: string
  cidade: string
  tipo_cliente: string
  email_oficial: string | null
  telefone_oficial: string | null
}

interface NovoCliente {
  nome: string
  cidade: string
  tipo_cliente: string
  email_oficial: string
  telefone_oficial: string
  // contrato mínimo obrigatório pelo back
  modelo: string
  valor: string
  permite_cobranca_extra: boolean
  // contato mínimo obrigatório pelo back
  contato_nome: string
  contato_telefone: string
  contato_email: string
  contato_vinculo: string
}

const TIPO_CLIENTE_OPTIONS = ['Empresa', 'Pessoa Física', 'ONG', 'Governo']
const MODELO_OPTIONS = ['Mensal', 'Avulso', 'Anual']

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tipoFilter, setTipoFilter] = useState('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [novoCliente, setNovoCliente] = useState<NovoCliente>({
    nome: '',
    cidade: '',
    tipo_cliente: '',
    email_oficial: '',
    telefone_oficial: '',
    modelo: '',
    valor: '',
    permite_cobranca_extra: false,
    contato_nome: '',
    contato_telefone: '',
    contato_email: '',
    contato_vinculo: '',
  })

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`${API}/cliente/listar`)
      if (!res.ok) throw new Error(`Erro ${res.status}`)
      const data = await res.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch (e) {
      setErro('Não foi possível carregar os clientes. Verifique sua conexão.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCadastrar() {
    if (!novoCliente.nome || !novoCliente.cidade || !novoCliente.tipo_cliente || !novoCliente.modelo) return
    if (!novoCliente.contato_nome || !novoCliente.contato_vinculo) return
    if (!novoCliente.contato_telefone && !novoCliente.contato_email) return

    setSalvando(true)
    setErro(null)
    try {
      const body = {
        nome: novoCliente.nome,
        cidade: novoCliente.cidade,
        tipo_cliente: novoCliente.tipo_cliente,
        email_oficial: novoCliente.email_oficial || null,
        telefone_oficial: novoCliente.telefone_oficial || null,
        modelo: novoCliente.modelo,
        valor: novoCliente.valor ? parseFloat(novoCliente.valor) : null,
        permite_cobranca_extra: novoCliente.permite_cobranca_extra,
        contatos: [
          {
            nome: novoCliente.contato_nome,
            telefone: novoCliente.contato_telefone || null,
            email: novoCliente.contato_email || null,
            vinculo: novoCliente.contato_vinculo,
          },
        ],
      }

      const res = await fetch(`${API}/cliente/cadastrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? 'Erro ao cadastrar')
      }

      await fetchClientes()
      setIsDialogOpen(false)
      setNovoCliente({
        nome: '', cidade: '', tipo_cliente: '', email_oficial: '',
        telefone_oficial: '', modelo: '', valor: '', permite_cobranca_extra: false,
        contato_nome: '', contato_telefone: '', contato_email: '', contato_vinculo: '',
      })
    } catch (e: any) {
      setErro(e.message ?? 'Erro desconhecido')
    } finally {
      setSalvando(false)
    }
  }

  // Adapta o objeto da API para o formato que ClientList espera
  const clientesAdaptados = clientes.map(c => ({
    id: c.id_cliente,
    name: c.nome,
    company: c.cidade,
    email: c.email_oficial ?? '',
    phone: c.telefone_oficial ?? '',
    status: 'active' as const,
    lastVisit: null,
    nextVisit: null,
    createdAt: '',
  }))

  const filtrados = clientesAdaptados.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase())
    const matchTipo = tipoFilter === 'all' || clientes.find(cl => cl.id_cliente === c.id)?.tipo_cliente === tipoFilter
    return matchSearch && matchTipo
  })

  const tiposUnicos = [...new Set(clientes.map(c => c.tipo_cliente))]

  return (
    <div className="min-h-screen">
      <Header title="Clientes" subtitle="Gerencie seus clientes" />

      <div className="p-6">
        {/* Filtros */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
              >
                <option value="all">Todos</option>
                {tiposUnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-4">

                {/* Dados do cliente */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dados do Cliente</p>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label>Nome *</Label>
                      <Input
                        value={novoCliente.nome}
                        onChange={e => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                        placeholder="Nome ou razão social"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Cidade *</Label>
                        <Input
                          value={novoCliente.cidade}
                          onChange={e => setNovoCliente({ ...novoCliente, cidade: e.target.value })}
                          placeholder="Ex: Fortaleza"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Tipo *</Label>
                        <select
                          value={novoCliente.tipo_cliente}
                          onChange={e => setNovoCliente({ ...novoCliente, tipo_cliente: e.target.value })}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">Selecione</option>
                          {TIPO_CLIENTE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>E-mail oficial</Label>
                        <Input
                          type="email"
                          value={novoCliente.email_oficial}
                          onChange={e => setNovoCliente({ ...novoCliente, email_oficial: e.target.value })}
                          placeholder="email@empresa.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Telefone oficial</Label>
                        <Input
                          value={novoCliente.telefone_oficial}
                          onChange={e => setNovoCliente({ ...novoCliente, telefone_oficial: e.target.value })}
                          placeholder="(85) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contrato */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contrato</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Modelo *</Label>
                        <select
                          value={novoCliente.modelo}
                          onChange={e => setNovoCliente({ ...novoCliente, modelo: e.target.value })}
                          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">Selecione</option>
                          {MODELO_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Valor (R$)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={novoCliente.valor}
                          onChange={e => setNovoCliente({ ...novoCliente, valor: e.target.value })}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={novoCliente.permite_cobranca_extra}
                        onChange={e => setNovoCliente({ ...novoCliente, permite_cobranca_extra: e.target.checked })}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      <span className="text-sm text-foreground">Permite cobrança extra</span>
                    </label>
                  </div>
                </div>

                {/* Contato principal */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contato Principal</p>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Nome *</Label>
                        <Input
                          value={novoCliente.contato_nome}
                          onChange={e => setNovoCliente({ ...novoCliente, contato_nome: e.target.value })}
                          placeholder="Nome do contato"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Vínculo *</Label>
                        <Input
                          value={novoCliente.contato_vinculo}
                          onChange={e => setNovoCliente({ ...novoCliente, contato_vinculo: e.target.value })}
                          placeholder="Ex: Diretor, Sócio"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label>Telefone</Label>
                        <Input
                          value={novoCliente.contato_telefone}
                          onChange={e => setNovoCliente({ ...novoCliente, contato_telefone: e.target.value })}
                          placeholder="(85) 99999-9999"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>E-mail</Label>
                        <Input
                          type="email"
                          value={novoCliente.contato_email}
                          onChange={e => setNovoCliente({ ...novoCliente, contato_email: e.target.value })}
                          placeholder="contato@email.com"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">* Informe ao menos telefone ou e-mail do contato.</p>
                  </div>
                </div>

                {erro && (
                  <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>
                )}

                <Button
                  onClick={handleCadastrar}
                  className="w-full"
                  disabled={
                    salvando ||
                    !novoCliente.nome ||
                    !novoCliente.cidade ||
                    !novoCliente.tipo_cliente ||
                    !novoCliente.modelo ||
                    !novoCliente.contato_nome ||
                    !novoCliente.contato_vinculo ||
                    (!novoCliente.contato_telefone && !novoCliente.contato_email)
                  }
                >
                  {salvando
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                    : 'Cadastrar Cliente'
                  }
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold text-foreground">{clientes.length}</p>
          </div>
          {tiposUnicos.slice(0, 3).map(tipo => (
            <div key={tipo} className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{tipo}</p>
              <p className="text-2xl font-semibold text-foreground">
                {clientes.filter(c => c.tipo_cliente === tipo).length}
              </p>
            </div>
          ))}
        </div>

        {/* Lista */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-foreground">
              {filtrados.length} cliente{filtrados.length !== 1 ? 's' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : erro ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">{erro}</p>
                <Button variant="outline" size="sm" onClick={fetchClientes} className="mt-4">
                  Tentar novamente
                </Button>
              </div>
            ) : filtrados.length > 0 ? (
              <ClientList clients={filtrados} />
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">Nenhum cliente encontrado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}