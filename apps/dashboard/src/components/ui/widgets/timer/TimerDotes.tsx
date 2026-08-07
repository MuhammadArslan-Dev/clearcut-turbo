import React, { memo } from 'react'

interface TimerDotsProps {
  color?: string
  width?: number
  height?: number
  radius?: number
  gap?: number
  vertical?: boolean
  className?: string
}

const TimerDots: React.FC<TimerDotsProps> = ({
  color = '#192839',
  width = 4,
  height = 18,
  radius = 2,
  gap = 12,
  vertical = true,
  className = '',
}) => {
  const cx = width / 2
  const firstCy = radius
  const secondCy = vertical ? firstCy + gap : firstCy

  return (
    <svg
      width={vertical ? width : gap + radius * 2}
      height={vertical ? height : width}
      viewBox={`0 0 ${vertical ? width : gap + radius * 2} ${vertical ? height : width
        }`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx={cx} cy={firstCy} r={radius} fill={color} />
      <circle
        cx={vertical ? cx : firstCy + gap}
        cy={vertical ? secondCy : cx}
        r={radius}
        fill={color}
      />
    </svg>
  )
}

export default memo(TimerDots);