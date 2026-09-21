'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { Truck } from 'lucide-react'
import {
  PersonsSection,
  EMPTY_PERSON_DRAFT,
  type PersonDraft,
} from '@/components/admin/reparto/persons-section'
import { AssignmentSection } from '@/components/admin/reparto/assignment-section'
import { ReportsSection } from '@/components/admin/reparto/reports-section'
import type { DeliveryPerson, AssignableOrder, DeliveryAssignment } from '@/types/delivery'

export default function AdminRepartoPage() {
  const [persons, setPersons] = useState<DeliveryPerson[]>([])
  const [personDraft, setPersonDraft] = useState<PersonDraft>(EMPTY_PERSON_DRAFT)
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [loadingPersons, setLoadingPersons] = useState(true)
  const [savingPerson, setSavingPerson] = useState(false)
  const [personsMsg, setPersonsMsg] = useState<string | null>(null)

  const [assignments, setAssignments] = useState<DeliveryAssignment[]>([])
  const [assignableOrders, setAssignableOrders] = useState<AssignableOrder[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(true)
  const [assignmentsMsg, setAssignmentsMsg] = useState<string | null>(null)

  const fetchPersons = async () => {
    setLoadingPersons(true)
    setPersonsMsg(null)
    try {
      const res = await fetch('/api/admin/delivery-persons')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPersons(data.persons ?? [])
    } catch {
      setPersonsMsg('No se pudieron cargar los repartidores')
    } finally {
      setLoadingPersons(false)
    }
  }

  const fetchAssignments = async () => {
    setLoadingAssignments(true)
    setAssignmentsMsg(null)
    try {
      const res = await fetch('/api/admin/delivery-assignments')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAssignments(data.assignments ?? [])
      setAssignableOrders(data.assignableOrders ?? [])
    } catch {
      setAssignmentsMsg('No se pudieron cargar las asignaciones')
    } finally {
      setLoadingAssignments(false)
    }
  }

  useEffect(() => {
    void fetchPersons()
    void fetchAssignments()
  }, [])

  const handleEditPerson = (person: DeliveryPerson) => {
    setEditingPersonId(person.id)
    setPersonDraft({
      name: person.name,
      phone: person.phone,
      email: person.email ?? '',
      isActive: person.isActive,
    })
    setPersonsMsg(null)
  }

  const handleCancelEditPerson = () => {
    setEditingPersonId(null)
    setPersonDraft(EMPTY_PERSON_DRAFT)
    setPersonsMsg(null)
  }

  const handleSavePerson = async () => {
    if (!personDraft.name.trim() || !personDraft.phone.trim()) {
      setPersonsMsg('Completá al menos el nombre y el teléfono')
      return
    }

    setSavingPerson(true)
    setPersonsMsg(null)
    try {
      const payload = editingPersonId
        ? { id: editingPersonId, ...personDraft }
        : personDraft
      const res = await fetch('/api/admin/delivery-persons', {
        method: editingPersonId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar el repartidor')
      await fetchPersons()
      setEditingPersonId(null)
      setPersonDraft(EMPTY_PERSON_DRAFT)
      setPersonsMsg(editingPersonId ? 'Repartidor guardado' : 'Repartidor agregado')
    } catch (error) {
      setPersonsMsg(error instanceof Error ? error.message : 'No se pudo guardar el repartidor')
    } finally {
      setSavingPerson(false)
    }
  }

  const handleDeletePerson = async (id: string) => {
    setSavingPerson(true)
    setPersonsMsg(null)
    try {
      const res = await fetch('/api/admin/delivery-persons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo eliminar el repartidor')
      await fetchPersons()
      if (editingPersonId === id) {
        setEditingPersonId(null)
        setPersonDraft(EMPTY_PERSON_DRAFT)
      }
      setPersonsMsg('Repartidor eliminado')
    } catch (error) {
      setPersonsMsg(error instanceof Error ? error.message : 'No se pudo eliminar el repartidor')
    } finally {
      setSavingPerson(false)
    }
  }

  const handleAssign = async (orderId: string, deliveryPersonId: string) => {
    setLoadingAssignments(true)
    setAssignmentsMsg(null)
    try {
      const res = await fetch('/api/admin/delivery-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, deliveryPersonId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo asignar el repartidor')
      await fetchAssignments()
    } catch (error) {
      setAssignmentsMsg(error instanceof Error ? error.message : 'No se pudo asignar el repartidor')
    } finally {
      setLoadingAssignments(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Truck className="w-6 h-6 text-brand-gold" /> Reparto
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Gestiona repartidores, asignaciones y seguimiento de entregas.
        </p>
      </div>

      <PersonsSection
        persons={persons}
        personDraft={personDraft}
        setPersonDraft={setPersonDraft}
        editingPersonId={editingPersonId}
        loadingPersons={loadingPersons}
        savingPerson={savingPerson}
        personsMsg={personsMsg}
        onRefreshPersons={fetchPersons}
        onEditPerson={handleEditPerson}
        onCancelEditPerson={handleCancelEditPerson}
        onSavePerson={handleSavePerson}
        onDeletePerson={handleDeletePerson}
      />

      {assignmentsMsg && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-lg text-sm">
          {assignmentsMsg}
        </div>
      )}

      <AssignmentSection
        orders={assignableOrders}
        assignments={assignments}
        persons={persons}
        loading={loadingAssignments}
        onRefresh={fetchAssignments}
        onAssign={handleAssign}
      />

      <ReportsSection />
    </div>
  )
}
