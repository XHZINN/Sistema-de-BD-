'use client'

import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useRef, useState } from 'react'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Undo, Redo, AlignLeft, AlignCenter, AlignRight, Minus,
  Paperclip, X, Loader2,
} from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_BACKEND

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded text-sm transition-colors',
        'hover:bg-background disabled:pointer-events-none disabled:opacity-35',
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <div className="mx-1 h-4 w-px shrink-0 bg-border" />
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function AnexoItem({ anexo, onDelete }: { anexo: Anexo; onDelete: () => void }) {
  const isImagem = anexo.tipo.startsWith('image/')
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
      {isImagem
        ? <img src={anexo.url} className="h-8 w-8 rounded object-cover" alt={anexo.nome} />
        : <Paperclip className="h-4 w-4 text-muted-foreground" />
      }
      <a href={anexo.url} target="_blank" rel="noreferrer"
        className="flex-1 truncate text-sm text-foreground hover:underline">
        {anexo.nome}
      </a>
      <span className="text-xs text-muted-foreground">{formatBytes(anexo.tamanho)}</span>
      <button type="button" onClick={onDelete}
        className="text-muted-foreground hover:text-destructive">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  /** Initial content – JSON takes precedence over HTML */
  contentJson?: JSONContent | null
  contentHtml?: string | null
  onChange?: (json: JSONContent, html: string) => void
  readOnly?: boolean
  placeholder?: string
  minHeight?: string
  idRelatorio?: string           // pra saber qual relatório
  anexos?: Anexo[]               // lista atual vinda do banco
  onAnexosChange?: (anexos: Anexo[]) => void
}

export interface Anexo {
  id: string
  nome: string
  tipo: string
  tamanho: number
  url: string
  path: string
}

export function RichTextEditor({
  contentJson,
  contentHtml,
  onChange,
  readOnly = false,
  placeholder = '...',
  minHeight = '400px',
  idRelatorio,
  anexos,
  onAnexosChange,
}: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploading, setUploading] = useState(false)
  
    const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: contentJson ?? contentHtml ?? '',
    editable: !readOnly,
    onUpdate({ editor }) {
      onChange?.(editor.getJSON(), editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          // Tiptap prose styles
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none',
          'prose-headings:font-semibold prose-headings:text-foreground',
          'prose-p:text-foreground prose-li:text-foreground',
          'prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground',
          'prose-hr:border-border prose-strong:text-foreground prose-code:text-primary',
          'px-6 py-5',
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  })

  if (!editor) return null

  const iconSize = 'h-3.5 w-3.5'

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!idRelatorio || !e.target.files?.length) return
        setUploading(true)

        try {
            const files = Array.from(e.target.files)
            const novosAnexos: Anexo[] = []

            for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BACKEND}/relatorio/${idRelatorio}/anexos`, {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error(`Erro ao enviar ${file.name}`)
            const anexo = await res.json()
            novosAnexos.push(anexo)
            }

            onAnexosChange?.([...(anexos || []), ...novosAnexos])
        } catch (err) {
            console.error('Erro no upload:', err)
        } finally {
            setUploading(false)
            e.target.value = ''
        }
        }

    async function handleDelete(id_anexo: string) {
    if (!idRelatorio) return
    await fetch(`${API}}/relatorio/${idRelatorio}/anexos/${id_anexo}`, { method: 'DELETE' })
    onAnexosChange?.((anexos || []).filter(a => a.id !== id_anexo))
    }

  return (
    <div className={cn(
      'flex flex-col overflow-hidden rounded-xl border border-border bg-card',
      readOnly && 'pointer-events-none opacity-75',
    )}>
      {/* ── Toolbar ── */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/50 px-2 py-1.5">
          {/* Text style */}
          <ToolbarBtn title="Negrito (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>
            <Bold className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Itálico (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}>
            <Italic className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Sublinhado (Ctrl+U)" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}>
            <UnderlineIcon className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}>
            <Strikethrough className={iconSize} />
          </ToolbarBtn>

          <Sep />

          {/* Headings */}
          <ToolbarBtn title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })}>
            <Heading1 className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>
            <Heading2 className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Título 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}>
            <Heading3 className={iconSize} />
          </ToolbarBtn>

          <Sep />

          {/* Lists & blocks */}
          <ToolbarBtn title="Lista com marcadores" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>
            <List className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>
            <ListOrdered className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')}>
            <Quote className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Linha separadora" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className={iconSize} />
          </ToolbarBtn>

          <Sep />

          {/* Alignment */}
          <ToolbarBtn title="Alinhar à esquerda" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}>
            <AlignLeft className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Centralizar" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}>
            <AlignCenter className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Alinhar à direita" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}>
            <AlignRight className={iconSize} />
          </ToolbarBtn>

            <Sep />
            {/* Upload de anexo */}
            <ToolbarBtn title="Adicionar anexo" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className={iconSize} />
            </ToolbarBtn>
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleUpload}
            />

          <Sep />

          {/* History */}
          <ToolbarBtn title="Desfazer (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
            <Undo className={iconSize} />
          </ToolbarBtn>
          <ToolbarBtn title="Refazer (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
            <Redo className={iconSize} />
          </ToolbarBtn>
        </div>
      )}

      {/* ── Content area ── */}
      <EditorContent editor={editor} className="flex-1 cursor-text overflow-y-auto" />

      {/* Seção de anexos */}
      {(anexos && anexos.length > 0 || uploading) && (
        <div className="border-t border-border bg-secondary/20 px-4 py-3 flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">Anexos</span>
            {anexos?.map(a => (
            <AnexoItem key={a.id} anexo={a} onDelete={() => handleDelete(a.id)} />
            ))}
            {uploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Enviando...
            </div>
            )}
        </div>
        )}

    </div>
  )
}