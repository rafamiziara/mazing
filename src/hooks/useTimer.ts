import { useCallback, useEffect, useRef, useState } from 'react'

const useTimer = ({ autoStart = true, interval = 1000, initialTime = 0 }) => {
  const [time, setTime] = useState(initialTime)
  const [isRunning, setIsRunning] = useState(autoStart)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const play = useCallback(() => {
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTime(initialTime)
  }, [initialTime])

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + interval)
      }, interval)
    } else {
      clearInterval(timerRef.current!)
    }

    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearInterval(timerRef.current!)
    }
  }, [interval, isRunning])

  return { time, play, pause, reset } as const
}

export default useTimer
