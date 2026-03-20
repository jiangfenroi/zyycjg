"use client"

import * as React from "react"
import { Sun, Moon, Eye, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = React.useState<'normal' | 'dark' | 'eye-care'>('normal')

  React.useEffect(() => {
    const saved = localStorage.getItem('app-theme') as any || 'normal'
    setTheme(saved)
  }, [])

  const toggleTheme = (newTheme: 'normal' | 'dark' | 'eye-care') => {
    setTheme(newTheme)
    localStorage.setItem('app-theme', newTheme)
    document.documentElement.classList.remove('dark', 'eye-care')
    if (newTheme !== 'normal') {
      document.documentElement.classList.add(newTheme)
    }
  }

  return (
    <div className={cn("flex items-center gap-1 bg-muted/50 p-1 rounded-lg", className)}>
      <Button
        variant={theme === 'normal' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-md"
        onClick={() => toggleTheme('normal')}
        title="普通模式"
      >
        <Monitor className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'eye-care' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-md"
        onClick={() => toggleTheme('eye-care')}
        title="护眼模式"
      >
        <Eye className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-8 w-8 rounded-md"
        onClick={() => toggleTheme('dark')}
        title="夜间模式"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  )
}
