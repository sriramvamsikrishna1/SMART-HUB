import React, {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  type ElementType,
  type ComponentPropsWithRef,
} from 'react'
import { cn } from '../../lib/utils'

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined)

const useMouseEnter = () => {
  const context = useContext(MouseEnterContext)
  if (context === undefined) {
    throw new Error('useMouseEnter must be used within a MouseEnterProvider')
  }
  return context
}

export interface CardContainerProps {
  children?: ReactNode
  className?: string
  containerClassName?: string
  isStatic?: boolean
}

export const CardContainer: React.FC<CardContainerProps> = ({
  children,
  className,
  containerClassName,
  isStatic = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMouseEntered, setIsMouseEntered] = useState<boolean>(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isStatic) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / 20
    const y = (e.clientY - top - height / 2) / 20
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`
  }

  const handleMouseEnter = () => {
    if (isStatic) return
    setIsMouseEntered(true)
  }

  const handleMouseLeave = () => {
    if (!containerRef.current || isStatic) return
    setIsMouseEntered(false)
    containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn('flex items-center justify-center', containerClassName)}
        style={{
          perspective: '1000px',
        }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative transition-all duration-200 ease-linear w-full',
            className
          )}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export interface CardBodyProps {
  children: ReactNode
  className?: string
  id?: string
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className, id }) => {
  return (
    <div
      id={id}
      className={cn(
        'w-full transform-3d *:transform-3d',
        className
      )}
    >
      {children}
    </div>
  )
}

export type CardItemProps<T extends ElementType = 'div'> = {
  as?: T
  children?: ReactNode
  className?: string
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
  rotateX?: number | string
  rotateY?: number | string
  rotateZ?: number | string
} & Omit<ComponentPropsWithRef<T>, 'as' | 'children' | 'className'>

export const CardItem = <T extends ElementType = 'div'>({
  as,
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: CardItemProps<T>) => {
  const Tag = as || 'div'
  const ref = useRef<HTMLElement>(null)
  const [isMouseEntered] = useMouseEnter()

  useEffect(() => {
    if (!ref.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      ref.current.style.transform = 'none'
      return
    }

    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    } else {
      ref.current.style.transform = 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)'
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ])

  return (
    <Tag
      ref={ref as any}
      className={cn('transition duration-200 ease-linear', className)}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export default CardContainer
