import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function getPlanColor(plan: string): string {
  const colors: Record<string, string> = {
    free:    'bg-gray-500/10 text-gray-400 border-gray-500/20',
    solo:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
    team:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
    company: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  }
  return colors[plan] || colors.free
}