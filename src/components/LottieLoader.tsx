'use client'

import Lottie from 'lottie-react'
import animationData from '../../public/assets/Flowpeoplemine.json'

interface LottieLoaderProps {
  /** CSS size class applied to the wrapper div, e.g. "w-8 h-8" */
  className?: string
}

export default function LottieLoader({ className = 'w-8 h-8' }: LottieLoaderProps) {
  return (
    <div className={className}>
      <Lottie animationData={animationData} loop autoplay renderer="svg" />
    </div>
  )
}
