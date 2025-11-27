import { useEffect, ReactNode } from 'react'

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Appliquer le thème dark au document
    const root = document.documentElement
    root.classList.add('dark')
  }, [])

  return <>{children}</>
}

