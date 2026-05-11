'use client'

import { Task } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TaskListProps {
  tasks: Task[]
  onToggleStatus?: (taskId: string) => void
}

export function TaskList({ tasks, onToggleStatus }: TaskListProps) {
  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'medium':
        return <Clock className="h-4 w-4 text-primary" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getPriorityText = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'Urgente'
      case 'high':
        return 'Alta'
      case 'medium':
        return 'Média'
      default:
        return 'Baixa'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors',
            task.status === 'completed' && 'opacity-60'
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="mt-0.5 h-5 w-5 shrink-0 p-0"
            onClick={() => onToggleStatus?.(task.id)}
          >
            {task.status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'font-medium text-foreground',
                task.status === 'completed' && 'line-through'
              )}
            >
              {task.title}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {task.description}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1">
                {getPriorityIcon(task.priority)}
                <span className="text-xs text-muted-foreground">
                  {getPriorityText(task.priority)}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Vence: {formatDate(task.dueDate)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
