import { Body, Composite, Engine, Events } from 'matter-js'
import { useEffect } from 'react'

interface UseCollisionDetectionProps {
  engine: Engine | null
  stageComposite: Composite
  onGoalReached: () => void
}

const useCollisionDetection = ({ engine, stageComposite, onGoalReached }: UseCollisionDetectionProps) => {
  useEffect(() => {
    if (!engine) return

    const handleCollision = (event: Matter.IEventCollision<Engine>) => {
      event.pairs.forEach(({ bodyA, bodyB }) => {
        const labels = ['ball', 'goal']

        if (labels.includes(bodyA.label) && labels.includes(bodyB.label)) {
          engine.gravity.y = 1

          stageComposite.bodies.forEach((body) => {
            if (['wall', 'goal'].includes(body.label)) Body.setStatic(body, false)
          })

          onGoalReached()
        }
      })
    }

    Events.on(engine, 'collisionStart', handleCollision)

    return () => Events.off(engine, 'collisionStart', handleCollision)
  }, [engine, stageComposite, onGoalReached])
}

export default useCollisionDetection
