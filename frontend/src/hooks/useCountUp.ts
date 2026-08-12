import { useEffect, useState } from 'react'
import { animate, useMotionValue, useTransform } from 'framer-motion'

export function useCountUp(target: number, duration = 1.1, start = 0, delay = 0): number {
  const [display, setDisplay] = useState(start)
  const motion = useMotionValue(start)

  const rounded = useTransform(motion, (v) => Math.round(v))

  useEffect(() => {
    const unsubscribe = rounded.on('change', (latest) => setDisplay(latest))
    const controls = animate(motion, target, {
      duration,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => setDisplay(target),
    })
    return () => {
      unsubscribe()
      controls.stop()
    }
  }, [target, duration, delay, motion, rounded])

  return display
}
