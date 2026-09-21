'use client'

import React from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Plus, RefreshCw, Save, Trash2, User } from 'lucide-react'
import type { DeliveryPerson } from '@/types/delivery'

export type PersonDraft = {
  name: string
  phone: string
  email: string
  isActive: boolean
}

export const EMPTY_PERSON_DRAFT: PersonDraft = {
  name: '',
  phone: '',
  email: '',
  isActive: true,
}

type PersonsSectionProps = {
  persons: DeliveryPerson[]
  personDraft: PersonDraft
  setPersonDraft: Dispatch<SetStateAction<PersonDraft>>
  editingPersonId: string | null
  loadingPersons: boolean
  savingPerson: boolean
  personsMsg: string | null
  onRefreshPersons: () => void
  onEditPerson: (person: DeliveryPerson) => void
  onCancelEditPerson: () => void
  onSavePerson: () => void
  onDeletePerson: (id: string) => void
}

export function PersonsSection({
  persons,
  personDraft,
  setPersonDraft,
  editingPersonId,
  loadingPersons,
  savingPerson,
  personsMsg,
  onRefreshPersons,
  onEditPerson,
  onCancelEditPerson,
  onSavePerson,
  onDeletePerson,
}: PersonsSectionProps) {
  const updateDraft = <K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) => {
    setPersonDraft((prev) => ({ ...prev, [key]: value }))
  }

  const isSuccessMsg =
    personsMsg &&
    (personsMsg.includes('guardado') ||
      personsMsg.includes('agregado') ||
      personsMsg.includes('eliminado'))

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-700">
        <div>
          <h3 className="font-semibold text-white text-sm">Repartidores</h3>
          <p className="text-xs text-gray-400 mt-1">
            Administrá los repartidores que podrán ser asignados a pedidos.
          </p>
        </div>
        <button
          onClick={onRefreshPersons}
          disabled={loadingPersons || savingPerson}
          className="px-3 py-2 bg-white text-gray-300 text-sm rounded-lg border border-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loadingPersons ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-5 py-4 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="person-name" className="block text-xs text-gray-400 mb-1">
              Nombre
            </label>
            <input
              id="person-name"
              type="text"
              value={personDraft.name}
              disabled={savingPerson}
              onChange={(e) => updateDraft('name', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
              placeholder="Ej: Ana García"
            />
          </div>

          <div>
            <label htmlFor="person-phone" className="block text-xs text-gray-400 mb-1">
              Teléfono
            </label>
            <input
              id="person-phone"
              type="text"
              value={personDraft.phone}
              disabled={savingPerson}
              onChange={(e) => updateDraft('phone', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
              placeholder="Ej: 1199998888"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="person-email" className="block text-xs text-gray-400 mb-1">
              Email
            </label>
            <input
              id="person-email"
              type="email"
              value={personDraft.email}
              disabled={savingPerson}
              onChange={(e) => updateDraft('email', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-700 text-sm"
              placeholder="Ej: ana@example.com"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={personDraft.isActive}
            disabled={savingPerson}
            onChange={(e) => updateDraft('isActive', e.target.checked)}
          />
          Repartidor activo
        </label>

        {personsMsg && (
          <p className={`text-sm ${isSuccessMsg ? 'text-green-600' : 'text-red-600'}`}>
            {personsMsg}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onSavePerson}
            disabled={savingPerson}
            className="flex items-center gap-2 px-4 py-2 bg-brand-gold text-white text-sm rounded-lg hover:bg-brand-gold-dark disabled:opacity-50"
          >
            {editingPersonId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{' '}
            {savingPerson
              ? 'Guardando...'
              : editingPersonId
                ? 'Actualizar repartidor'
                : 'Agregar repartidor'}
          </button>
          {editingPersonId && (
            <button
              onClick={onCancelEditPerson}
              disabled={savingPerson}
              className="px-4 py-2 bg-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-600 disabled:opacity-50"
            >
              Cancelar edición
            </button>
          )}
        </div>

        <div className="space-y-3">
          {persons.map((person) => (
            <div key={person.id} className="rounded-lg border border-gray-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-gold" /> {person.name}
                  </p>
                  <p className="text-sm text-gray-300">{person.phone}</p>
                  {person.email && (
                    <p className="text-xs text-gray-400">{person.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      person.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {person.isActive ? 'Activo' : 'Oculto'}
                  </span>
                  <button
                    onClick={() => onEditPerson(person)}
                    disabled={savingPerson}
                    className="px-3 py-2 bg-gray-700 text-gray-300 text-xs rounded-lg hover:bg-gray-600 disabled:opacity-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDeletePerson(person.id)}
                    disabled={savingPerson}
                    className="px-3 py-2 bg-red-900/30 text-red-400 text-xs rounded-lg hover:bg-red-900/50 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!persons.length && !loadingPersons && (
            <div className="rounded-lg border border-dashed border-gray-600 p-4 text-sm text-gray-400">
              Todavía no hay repartidores cargados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
