// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}))

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className} data-testid="banner-card">{children}</div>
  ),
  CardContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }: { children: React.ReactNode; variant?: string; className?: string }) => (
    <span className={className} data-variant={variant}>{children}</span>
  ),
}))

vi.mock('lucide-react', () => ({
  Clock: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-clock" {...props} />,
  AlertCircle: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="icon-alert" {...props} />,
}))

import { render, screen, cleanup } from '@testing-library/react'
import { TimeGatingBanner } from '@/components/time-gating-banner'

const baseOpenProps = {
  isOpen: true,
  openingDayLabel: 'Miércoles',
  openingHour: 18,
  openingMinute: 0,
  closingDayLabel: 'Domingo',
  closingHour: 20,
  closingMinute: 0,
}

const baseClosedProps = {
  isOpen: false,
  timeRemaining: { days: 1, hours: 5, minutes: 30, seconds: 0 },
  openingDayLabel: 'Miércoles',
  openingHour: 18,
  openingMinute: 0,
  closingDayLabel: 'Domingo',
  closingHour: 20,
  closingMinute: 0,
}

describe('TimeGatingBanner', () => {
  beforeEach(() => {
    cleanup()
  })

  describe('cuando el sitio está abierto', () => {
    it('muestra "Estamos abiertos!"', () => {
      render(<TimeGatingBanner {...baseOpenProps} />)
      expect(screen.getByText('¡Estamos abiertos!')).toBeDefined()
    })

    it('muestra badge "Abierto"', () => {
      render(<TimeGatingBanner {...baseOpenProps} />)
      expect(screen.getByText('Abierto')).toBeDefined()
    })

    it('muestra horario de pedidos', () => {
      render(<TimeGatingBanner {...baseOpenProps} />)
      expect(screen.getByText(/18:00/)).toBeDefined()
      expect(screen.getByText(/20:00/)).toBeDefined()
    })

    it('muestra icono de reloj', () => {
      render(<TimeGatingBanner {...baseOpenProps} />)
      expect(screen.getByTestId('icon-clock')).toBeDefined()
    })

    it('NO muestra "Temporalmente cerrado"', () => {
      render(<TimeGatingBanner {...baseOpenProps} />)
      expect(screen.queryByText('Temporalmente cerrado')).toBeNull()
    })
  })

  describe('cuando el sitio está cerrado', () => {
    it('muestra "Temporalmente cerrado"', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.getByText('Temporalmente cerrado')).toBeDefined()
    })

    it('muestra badge "Cerrado"', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.getByText('Cerrado')).toBeDefined()
    })

    it('muestra tiempo restante', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.getByText(/1d 5h 30m/)).toBeDefined()
    })

    it('muestra horario de pedidos', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.getByText(/18:00/)).toBeDefined()
      expect(screen.getByText(/20:00/)).toBeDefined()
    })

    it('muestra icono de alerta', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.getByTestId('icon-alert')).toBeDefined()
    })

    it('NO muestra "Estamos abiertos!"', () => {
      render(<TimeGatingBanner {...baseClosedProps} />)
      expect(screen.queryByText('¡Estamos abiertos!')).toBeNull()
    })

    it('no muestra tiempo restante si no se provee', () => {
      render(
        <TimeGatingBanner
          isOpen={false}
          openingDayLabel="Miércoles"
          openingHour={18}
          openingMinute={0}
          closingDayLabel="Domingo"
          closingHour={20}
          closingMinute={0}
        />
      )
      expect(screen.queryByText(/Abrimos en:/)).toBeNull()
    })
  })
})
