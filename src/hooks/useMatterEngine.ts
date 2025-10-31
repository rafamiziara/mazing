import { Engine, Render, Runner } from 'matter-js'
import { useCallback, useEffect, useState } from 'react'

interface UseMatterEngineProps {
  canvas: HTMLCanvasElement | null
  width: number
  height: number
}

const useMatterEngine = ({ canvas, width, height }: UseMatterEngineProps) => {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [render, setRender] = useState<Render | null>(null)
  const [runner, setRunner] = useState<Runner | null>(null)
  const [isReady, setIsReady] = useState(false)

  const init = useCallback(() => {
    if (!engine) return setEngine(Engine.create())

    if (engine && !isReady) {
      const newRender = Render.create({
        canvas: canvas ?? undefined,
        engine,
        options: { wireframes: false, width, height },
      })
      const newRunner = Runner.create()

      Render.run(newRender)
      Runner.run(newRunner, engine)

      setRender(newRender)
      setRunner(newRunner)
      setIsReady(true)
    }
  }, [engine, isReady, canvas, width, height])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!isReady) init()
  }, [isReady, init])

  // Cleanup Matter.js resources on unmount
  useEffect(() => {
    return () => {
      if (render) {
        Render.stop(render)
        render.canvas.remove()
        render.textures = {}
      }

      if (runner) Runner.stop(runner)
      if (engine) Engine.clear(engine)
    }
  }, [render, runner, engine])

  return { engine, render, runner, world: engine?.world, isReady }
}

export default useMatterEngine
