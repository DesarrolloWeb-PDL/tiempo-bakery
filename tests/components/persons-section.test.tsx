// @vitest-environment jsdom
import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  PersonsSection,
  EMPTY_PERSON_DRAFT,
} from '@/components/admin/reparto/persons-section'
import type { DeliveryPerson } from '@/types/delivery'

describe('PersonsSection', () => {
  beforeEach(() => {
    cleanup()
  })

  const persons: DeliveryPerson[] = [
    {
      id: 'p1',
      name: 'Ana García',
      phone: '1199998888',
      email: 'ana@example.com',
      isActive: true,
    },
    {
      id: 'p2',
      name: 'Carlos López',
      phone: '1155556666',
      email: null,
      isActive: false,
    },
  ]

  const baseProps = {
    persons,
    personDraft: EMPTY_PERSON_DRAFT,
    setPersonDraft: vi.fn(),
    editingPersonId: null as string | null,
    loadingPersons: false,
    savingPerson: false,
    personsMsg: null as string | null,
    onRefreshPersons: vi.fn(),
    onEditPerson: vi.fn(),
    onCancelEditPerson: vi.fn(),
    onSavePerson: vi.fn(),
    onDeletePerson: vi.fn(),
  }

  it('renderiza el título y el estado vacío', () => {
    render(<PersonsSection {...baseProps} persons={[]} />)
    expect(screen.getByText('Repartidores')).toBeDefined()
    expect(
      screen.getByText('Todavía no hay repartidores cargados.')
    ).toBeDefined()
  })

  it('renderiza la lista con teléfono, email y badges de estado', () => {
    render(<PersonsSection {...baseProps} />)
    expect(screen.getByText('Ana García')).toBeDefined()
    expect(screen.getByText('Carlos López')).toBeDefined()
    expect(screen.getByText('1199998888')).toBeDefined()
    expect(screen.getByText('1155556666')).toBeDefined()
    expect(screen.getByText('ana@example.com')).toBeDefined()
    expect(screen.getByText('Activo')).toBeDefined()
    expect(screen.getByText('Oculto')).toBeDefined()
  })

  it('dispara editar y eliminar', async () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(
      <PersonsSection
        {...baseProps}
        onEditPerson={onEdit}
        onDeletePerson={onDelete}
      />
    )

    const editButtons = screen.getAllByText('Editar')
    await userEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(persons[0])

    const deleteButtons = screen.getAllByRole('button', { name: '' })
    await userEvent.click(deleteButtons[deleteButtons.length - 1])
    expect(onDelete).toHaveBeenCalledWith(persons[1].id)
  })

  it('actualiza el borrador del formulario', async () => {
    const setPersonDraft = vi.fn()
    render(
      <PersonsSection {...baseProps} setPersonDraft={setPersonDraft} />
    )

    const nameInput = screen.getByLabelText('Nombre')
    await userEvent.type(nameInput, 'Laura')
    expect(setPersonDraft).toHaveBeenCalled()

    const phoneInput = screen.getByLabelText('Teléfono')
    await userEvent.type(phoneInput, '1177778888')
    expect(setPersonDraft).toHaveBeenCalled()
  })

  it('actualiza el email', async () => {
    const setPersonDraft = vi.fn()
    render(
      <PersonsSection {...baseProps} setPersonDraft={setPersonDraft} />
    )

    const emailInput = screen.getByLabelText('Email')
    await userEvent.type(emailInput, 'laura@example.com')
    expect(setPersonDraft).toHaveBeenCalled()
  })

  it('alterna el toggle de activo', async () => {
    const setPersonDraft = vi.fn()
    render(
      <PersonsSection {...baseProps} setPersonDraft={setPersonDraft} />
    )

    const toggle = screen.getByLabelText('Repartidor activo')
    await userEvent.click(toggle)
    expect(setPersonDraft).toHaveBeenCalled()
  })

  it('muestra mensaje de éxito', () => {
    render(
      <PersonsSection {...baseProps} personsMsg="Repartidor guardado" />
    )
    expect(screen.getByText('Repartidor guardado')).toBeDefined()
  })

  it('muestra mensaje de error', () => {
    render(
      <PersonsSection {...baseProps} personsMsg="Error al guardar" />
    )
    expect(screen.getByText('Error al guardar')).toBeDefined()
  })

  it('renderiza modo edición con botón de cancelar', () => {
    render(
      <PersonsSection
        {...baseProps}
        editingPersonId="p1"
        personDraft={{
          ...EMPTY_PERSON_DRAFT,
          name: 'Editando',
          phone: '1111112222',
        }}
      />
    )
    expect(screen.getByText('Actualizar repartidor')).toBeDefined()
    expect(screen.getByText('Cancelar edición')).toBeDefined()
  })
})
