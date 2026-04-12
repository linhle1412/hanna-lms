'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ProgressBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start progress bar when pathname changes
    setLoading(true)
    setProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 50)

    // Complete progress bar after navigation
    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [pathname])

  if (!loading) return null

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar" 
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

