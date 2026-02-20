'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings, Key, Loader2, Truck, Palette } from 'lucide-react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function AdminConfigPage() {
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [loadingShipping, setLoadingShipping] = useState(true)
  const [savingShipping, setSavingShipping] = useState(false)
  const [shippingMsg, setShippingMsg] = useState<string | null>(null)
  const [shippingCosts, setShippingCosts] = useState({
    pickupPoint: 0,
    localDelivery: 3500,
    nationalCourier: 5950,
  })

  // Theme customization
  const [loadingTheme, setLoadingTheme] = useState(true)
  const [savingTheme, setSavingTheme] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [themeMsg, setThemeMsg] = useState<string | null>(null)
  const [theme, setTheme] = useState({
    appTitle: 'Tiempo Bakery',
    appSubtitle: 'Panadería artesanal con preventa semanal',
    logoUrl: '/img/espiga.png',
    primaryColor: '#d89a44',
    secondaryColor: '#2c2c2c',
    accentColor: '#f5f5f5',
  })

  const fetchShippingCosts = async () => {
    setLoadingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setShippingCosts({
        pickupPoint: Number(data.pickupPoint ?? 0),
        localDelivery: Number(data.localDelivery ?? 3500),
        nationalCourier: Number(data.nationalCourier ?? 5950),
      })
    } catch {
      setShippingMsg('No se pudieron cargar los costos de envío')
    } finally {
      setLoadingShipping(false)
    }
  }

  const fetchThemeConfig = async () => {
    setLoadingTheme(true)
    setThemeMsg(null)
    try {
      const res = await fetch('/api/admin/tema')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setTheme(data)
    } catch {
      setThemeMsg('No se pudo cargar la configuración del tema')
    } finally {
      setLoadingTheme(false)
    }
  }

  useEffect(() => {
    void fetchShippingCosts()
    void fetchThemeConfig()
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.push('/admin/login')
    router.refresh()
  }

  const handleSaveShipping = async () => {
    setSavingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localDelivery: Math.max(0, shippingCosts.localDelivery),
          nationalCourier: Math.max(0, shippingCosts.nationalCourier),
        }),
      })
      if (!res.ok) throw new Error()
      setShippingMsg('Costos de envío actualizados')
    } catch {
      setShippingMsg('No se pudieron guardar los costos de envío')
    } finally {
      setSavingShipping(false)
    }
  }

  const handleResetShipping = async () => {
    setSavingShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/admin/envios', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchShippingCosts()
      setShippingMsg('Costos restablecidos a valores por defecto')
    } catch {
      setShippingMsg('No se pudieron restablecer los costos')
    } finally {
      setSavingShipping(false)
    }
  }

  const handleSaveTheme = async () => {
    setSavingTheme(true)
    setThemeMsg(null)
    try {
      console.log('[Save Theme] Enviando:', theme)
      const res = await fetch('/api/admin/tema', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(theme),
      })
      const data = await res.json()
      console.log('[Save Theme] Respuesta:', { status: res.status, data })
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}`)
      }
      setThemeMsg('Configuración actualizada correctamente')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'No se pudo guardar la configuración'
      console.error('[Save Theme] Error:', errorMsg)
      setThemeMsg(`No se pudo guardar la configuración: ${errorMsg}`)
    } finally {
      setSavingTheme(false)
    }
  }

  const handleResetTheme = async () => {
    setSavingTheme(true)
    setThemeMsg(null)
    try {
      const res = await fetch('/api/admin/tema', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchThemeConfig()
      setThemeMsg('Tema restablecido a valores por defecto')
    } catch {
      setThemeMsg('No se pudo restablecer el tema')
    } finally {
      setSavingTheme(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setThemeMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'logo')

      const res = await fetch('/api/admin/uploads/logo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar el logo')

      setTheme({ ...theme, logoUrl: data.url })
      setThemeMsg('Logo cargado correctamente')
      
      // Limpiar el input - usar getElementById en lugar de e.currentTarget
      const logoInput = document.getElementById('logo-upload') as HTMLInputElement
      if (logoInput) {
        logoInput.value = ''
      }
    } catch (error) {
      setThemeMsg(`Error: ${error instanceof Error ? error.message : 'No se pudo cargar el logo'}`)
    } finally {
      setUploadingLogo(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6 text-amber-600" /> Configuración
      </h1>
      <Tabs.Root defaultValue="puntos" className="w-full">
        <Tabs.List className="flex gap-2 border-b mb-6">
          <Tabs.Trigger value="puntos" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <MapPin className="w-4 h-4" /> Puntos de Entrega
          </Tabs.Trigger>
          <Tabs.Trigger value="footer" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Layout className="w-4 h-4" /> Footer
          </Tabs.Trigger>
          <Tabs.Trigger value="nav" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Palette className="w-4 h-4" /> Navegación
          </Tabs.Trigger>
          <Tabs.Trigger value="sobre" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Info className="w-4 h-4" /> Sobre Nosotros
          </Tabs.Trigger>
          <Tabs.Trigger value="contacto" className="px-4 py-2 font-medium text-gray-700 data-[state=active]:border-b-2 data-[state=active]:border-amber-600 data-[state=active]:text-amber-700 flex items-center gap-1">
            <Mail className="w-4 h-4" /> Contacto
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="puntos">
          <PuntosEntregaAdmin />
        </Tabs.Content>
        // --- CRUD de puntos de entrega ---
        import { Input } from '@/components/ui/input'
        import { Button } from '@/components/ui/button'
        import { Textarea } from '@/components/ui/textarea'
        import { Switch } from '@radix-ui/react-switch'
        import { useRef } from 'react'

        function PuntosEntregaAdmin() {
          const [puntos, setPuntos] = useState<any[]>([])
          const [loading, setLoading] = useState(true)
          const [error, setError] = useState<string | null>(null)
          const [editing, setEditing] = useState<string | null>(null)
          const [form, setForm] = useState<any>({
            name: '', address: '', city: '', postalCode: '', schedule: '', instructions: '', isActive: true, order: 0
          })
          const [saving, setSaving] = useState(false)
          const [deleting, setDeleting] = useState<string | null>(null)
          const formRef = useRef<HTMLFormElement>(null)

          const fetchPuntos = async () => {
            setLoading(true)
            setError(null)
            try {
              const res = await fetch('/api/admin/puntos-recogida')
              const data = await res.json()
              setPuntos(data.puntos || [])
            } catch {
              setError('No se pudieron cargar los puntos de entrega')
            } finally {
              setLoading(false)
            }
          }

          useEffect(() => { fetchPuntos() }, [])

          const resetForm = () => {
            setForm({ name: '', address: '', city: '', postalCode: '', schedule: '', instructions: '', isActive: true, order: 0 })
            setEditing(null)
            if (formRef.current) formRef.current.reset()
          }

          const handleEdit = (p: any) => {
            setForm({ ...p })
            setEditing(p.id)
          }

          const handleDelete = async (id: string) => {
            if (!window.confirm('¿Eliminar este punto de entrega?')) return
            setDeleting(id)
            try {
              await fetch('/api/admin/puntos-recogida', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
              await fetchPuntos()
            } catch {
              setError('No se pudo eliminar el punto')
            } finally {
              setDeleting(null)
            }
          }

          const handleSubmit = async (e: any) => {
            e.preventDefault()
            setSaving(true)
            setError(null)
            try {
              const method = editing ? 'PUT' : 'POST'
              const body = { ...form, id: editing }
              await fetch('/api/admin/puntos-recogida', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
              resetForm()
              await fetchPuntos()
            } catch {
              setError('No se pudo guardar el punto')
            } finally {
              setSaving(false)
            }
          }

          return (
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">Puntos de Entrega</h2>
              <p className="text-sm text-gray-500 mb-4">Agregá, editá, eliminá y cambiá la visibilidad de los puntos de entrega.</p>
              <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4 mb-6">
                <Input placeholder="Nombre" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                <Input placeholder="Dirección" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
                <Input placeholder="Ciudad" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                <Input placeholder="Código Postal" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} required />
                <Input placeholder="Horario (ej: Viernes 17-20)" value={form.schedule} onChange={e => setForm(f => ({ ...f, schedule: e.target.value }))} required />
                <Textarea placeholder="Instrucciones (opcional)" value={form.instructions || ''} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-sm">Visible</label>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                </div>
                <Input placeholder="Orden" type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))} />
                <div className="col-span-2 flex gap-2 mt-2">
                  <Button type="submit" disabled={saving}>{editing ? 'Guardar cambios' : 'Agregar punto'}</Button>
                  {editing && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
                </div>
                {error && <div className="col-span-2 text-red-600 text-sm mt-2">{error}</div>}
              </form>
              {loading ? (
                <div className="text-gray-400">Cargando puntos…</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-2 py-1">Nombre</th>
                        <th className="px-2 py-1">Dirección</th>
                        <th className="px-2 py-1">Ciudad</th>
                        <th className="px-2 py-1">CP</th>
                        <th className="px-2 py-1">Horario</th>
                        <th className="px-2 py-1">Visible</th>
                        <th className="px-2 py-1">Orden</th>
                        <th className="px-2 py-1">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puntos.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="px-2 py-1 font-medium">{p.name}</td>
                          <td className="px-2 py-1">{p.address}</td>
                          <td className="px-2 py-1">{p.city}</td>
                          <td className="px-2 py-1">{p.postalCode}</td>
                          <td className="px-2 py-1">{p.schedule}</td>
                          <td className="px-2 py-1 text-center">{p.isActive ? 'Sí' : 'No'}</td>
                          <td className="px-2 py-1 text-center">{p.order}</td>
                          <td className="px-2 py-1 flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>{deleting === p.id ? 'Eliminando…' : 'Eliminar'}</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        }
        <Tabs.Content value="footer">
          <FooterConfigAdmin />
        </Tabs.Content>
        // --- Edición de datos del footer ---
        function FooterConfigAdmin() {
          const [form, setForm] = useState({
            contactoEmail: '',
            contactoTel: '',
            horarios: '',
            entregas: '',
            textoExtra: '',
          })
          const [loading, setLoading] = useState(true)
          const [saving, setSaving] = useState(false)
          const [msg, setMsg] = useState<string | null>(null)

          useEffect(() => {
            const fetchFooter = async () => {
              setLoading(true)
              setMsg(null)
              try {
                const res = await fetch('/api/admin/tema')
                const data = await res.json()
                setForm({
                  contactoEmail: data.contactoEmail ?? 'contacto@tiempobakery.com',
                  contactoTel: data.contactoTel ?? '',
                  horarios: data.horarios ?? 'Miércoles 18:00 - Domingo 20:00',
                  entregas: data.entregas ?? 'Entregas: Viernes y Sábado',
                  textoExtra: data.textoExtra ?? '',
                })
              } catch {
                setMsg('No se pudieron cargar los datos del footer')
              } finally {
                setLoading(false)
              }
            }
            fetchFooter()
          }, [])

          const handleChange = (e: any) => {
            setForm(f => ({ ...f, [e.target.name]: e.target.value }))
          }

          const handleSubmit = async (e: any) => {
            e.preventDefault()
            setSaving(true)
            setMsg(null)
            try {
              const res = await fetch('/api/admin/tema', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
              })
              if (!res.ok) throw new Error()
              setMsg('Datos guardados correctamente')
            } catch {
              setMsg('No se pudo guardar el footer')
            } finally {
              setSaving(false)
            }
          }

          return (
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">Footer</h2>
              <p className="text-sm text-gray-500 mb-4">Editá los datos de contacto, horarios y textos del pie de página.</p>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4 max-w-2xl">
                <Input name="contactoEmail" value={form.contactoEmail} onChange={handleChange} placeholder="Email de contacto" required />
                <Input name="contactoTel" value={form.contactoTel} onChange={handleChange} placeholder="Teléfono de contacto" />
                <Input name="horarios" value={form.horarios} onChange={handleChange} placeholder="Horarios de pedidos" required />
                <Input name="entregas" value={form.entregas} onChange={handleChange} placeholder="Texto de entregas" />
                <Textarea name="textoExtra" value={form.textoExtra} onChange={handleChange} placeholder="Texto extra (opcional)" className="md:col-span-2" />
                <div className="col-span-2 flex gap-2 mt-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
                </div>
                {msg && <div className="col-span-2 text-sm mt-2 text-amber-700">{msg}</div>}
                {loading && <div className="col-span-2 text-gray-400">Cargando…</div>}
              </form>
            </div>
          )
        }
        <Tabs.Content value="nav">
          <NavConfigAdmin />
        </Tabs.Content>
        // --- Edición de navegación ---
        function NavConfigAdmin() {
          const [form, setForm] = useState({
            linkProductos: '/productos',
            textoProductos: 'Productos',
            linkSobre: '/sobre-nosotros',
            textoSobre: 'Sobre Nosotros',
            linkContacto: '/contacto',
            textoContacto: 'Contacto',
          })
          const [loading, setLoading] = useState(true)
          const [saving, setSaving] = useState(false)
          const [msg, setMsg] = useState<string | null>(null)

          useEffect(() => {
            const fetchNav = async () => {
              setLoading(true)
              setMsg(null)
              try {
                const res = await fetch('/api/admin/tema')
                const data = await res.json()
                setForm({
                  linkProductos: data.linkProductos ?? '/productos',
                  textoProductos: data.textoProductos ?? 'Productos',
                  linkSobre: data.linkSobre ?? '/sobre-nosotros',
                  textoSobre: data.textoSobre ?? 'Sobre Nosotros',
                  linkContacto: data.linkContacto ?? '/contacto',
                  textoContacto: data.textoContacto ?? 'Contacto',
                })
              } catch {
                setMsg('No se pudieron cargar los datos de navegación')
              } finally {
                setLoading(false)
              }
            }
            fetchNav()
          }, [])

          const handleChange = (e: any) => {
            setForm(f => ({ ...f, [e.target.name]: e.target.value }))
          }

          const handleSubmit = async (e: any) => {
            e.preventDefault()
            setSaving(true)
            setMsg(null)
            try {
              const res = await fetch('/api/admin/tema', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
              })
              if (!res.ok) throw new Error()
              setMsg('Datos guardados correctamente')
            } catch {
              setMsg('No se pudo guardar la navegación')
            } finally {
              setSaving(false)
            }
          }

          return (
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">Barra de Navegación</h2>
              <p className="text-sm text-gray-500 mb-4">Editá los links y textos de la barra superior.</p>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4 max-w-2xl">
                <Input name="textoProductos" value={form.textoProductos} onChange={handleChange} placeholder="Texto Productos" required />
                <Input name="linkProductos" value={form.linkProductos} onChange={handleChange} placeholder="URL Productos" required />
                <Input name="textoSobre" value={form.textoSobre} onChange={handleChange} placeholder="Texto Sobre Nosotros" required />
                <Input name="linkSobre" value={form.linkSobre} onChange={handleChange} placeholder="URL Sobre Nosotros" required />
                <Input name="textoContacto" value={form.textoContacto} onChange={handleChange} placeholder="Texto Contacto" required />
                <Input name="linkContacto" value={form.linkContacto} onChange={handleChange} placeholder="URL Contacto" required />
                <div className="col-span-2 flex gap-2 mt-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
                </div>
                {msg && <div className="col-span-2 text-sm mt-2 text-amber-700">{msg}</div>}
                {loading && <div className="col-span-2 text-gray-400">Cargando…</div>}
              </form>
            </div>
          )
        }
        <Tabs.Content value="sobre">
          <SobreNosotrosConfigAdmin />
        </Tabs.Content>
        // --- Edición de Sobre Nosotros ---
        function SobreNosotrosConfigAdmin() {
          const [texto, setTexto] = useState('')
          const [loading, setLoading] = useState(true)
          const [saving, setSaving] = useState(false)
          const [msg, setMsg] = useState<string | null>(null)

          useEffect(() => {
            const fetchSobre = async () => {
              setLoading(true)
              setMsg(null)
              try {
                const res = await fetch('/api/admin/tema')
                const data = await res.json()
                setTexto(data.sobreNosotros ?? '')
              } catch {
                setMsg('No se pudo cargar el texto')
              } finally {
                setLoading(false)
              }
            }
            fetchSobre()
          }, [])

          const handleSubmit = async (e: any) => {
            e.preventDefault()
            setSaving(true)
            setMsg(null)
            try {
              const res = await fetch('/api/admin/tema', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sobreNosotros: texto }),
              })
              if (!res.ok) throw new Error()
              setMsg('Texto guardado correctamente')
            } catch {
              setMsg('No se pudo guardar el texto')
            } finally {
              setSaving(false)
            }
          }

          return (
            <div className="py-4">
              <h2 className="text-lg font-semibold mb-2">Sobre Nosotros</h2>
              <p className="text-sm text-gray-500 mb-4">Editá el texto de la página “Sobre Nosotros”.</p>
              <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-4 max-w-2xl">
                <Textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Texto de la página Sobre Nosotros" rows={8} required />
                <div className="flex gap-2 mt-2">
                  <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
                </div>
                {msg && <div className="text-sm mt-2 text-amber-700">{msg}</div>}
                {loading && <div className="text-gray-400">Cargando…</div>}
              </form>
            </div>
          )
        }
        <Tabs.Content value="contacto">
          <ContactoConfigAdmin />
        </Tabs.Content>
      // --- Edición de Contacto ---
      function ContactoConfigAdmin() {
        const [form, setForm] = useState({
          titulo: 'Contacto',
          texto: 'Podés escribirnos a contacto@tiempobakery.com.',
          email: 'contacto@tiempobakery.com',
          telefono: '',
          direccion: '',
        })
        const [loading, setLoading] = useState(true)
        const [saving, setSaving] = useState(false)
        const [msg, setMsg] = useState<string | null>(null)

        useEffect(() => {
          const fetchContacto = async () => {
            setLoading(true)
            setMsg(null)
            try {
              const res = await fetch('/api/admin/tema')
              const data = await res.json()
              setForm({
                titulo: data.contactoTitulo ?? 'Contacto',
                texto: data.contactoTexto ?? 'Podés escribirnos a contacto@tiempobakery.com.',
                email: data.contactoEmail ?? 'contacto@tiempobakery.com',
                telefono: data.contactoTelefono ?? '',
                direccion: data.contactoDireccion ?? '',
              })
            } catch {
              setMsg('No se pudieron cargar los datos de contacto')
            } finally {
              setLoading(false)
            }
          }
          fetchContacto()
        }, [])

        const handleChange = (e: any) => {
          setForm(f => ({ ...f, [e.target.name]: e.target.value }))
        }

        const handleSubmit = async (e: any) => {
          e.preventDefault()
          setSaving(true)
          setMsg(null)
          try {
            const res = await fetch('/api/admin/tema', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contactoTitulo: form.titulo,
                contactoTexto: form.texto,
                contactoEmail: form.email,
                contactoTelefono: form.telefono,
                contactoDireccion: form.direccion,
              }),
            })
            if (!res.ok) throw new Error()
            setMsg('Datos guardados correctamente')
          } catch {
            setMsg('No se pudo guardar la página de contacto')
          } finally {
            setSaving(false)
          }
        }

        return (
          <div className="py-4">
            <h2 className="text-lg font-semibold mb-2">Contacto</h2>
            <p className="text-sm text-gray-500 mb-4">Editá el texto y datos de la página de contacto.</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border rounded-lg p-4 max-w-2xl">
              <Input name="titulo" value={form.titulo} onChange={handleChange} placeholder="Título" required />
              <Input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
              <Input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" />
              <Input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" />
              <Textarea name="texto" value={form.texto} onChange={handleChange} placeholder="Texto de la página" className="md:col-span-2" />
              <div className="col-span-2 flex gap-2 mt-2">
                <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</Button>
              </div>
              {msg && <div className="col-span-2 text-sm mt-2 text-amber-700">{msg}</div>}
              {loading && <div className="col-span-2 text-gray-400">Cargando…</div>}
            </form>
          </div>
        )
      }
      </Tabs.Root>

      {/* Seguridad */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-10">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Key className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Seguridad</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-700 font-medium mb-1">Contraseña de administrador</p>
            <p className="text-sm text-gray-500">
              Configura la variable de entorno{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">ADMIN_PASSWORD</code>{' '}
              en tu archivo <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">.env.local</code>
            </p>
            <p className="text-xs text-yellow-600 bg-yellow-50 px-3 py-2 rounded-lg mt-2">
              ⚠️ Si no defines <code>ADMIN_PASSWORD</code>, la contraseña por defecto es <strong>admin123</strong>. 
              Cámbiala antes de desplegar en producción.
            </p>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
          >
            {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Info del sistema */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-6">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Settings className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Información del sistema</h3>
        </div>
        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          {[
            { label: 'Versión', value: '1.0.0' },
            { label: 'Stack', value: 'Next.js 14 + Prisma' },
            { label: 'Base de datos', value: 'SQLite (dev) / PostgreSQL (prod)' },
            { label: 'Pagos', value: 'Stripe' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400">{item.label}</p>
              <p className="text-sm text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Envíos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Truck className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Costos de envío</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Envío local (AR$)</label>
              <input
                type="number"
                min={0}
                step="1"
                value={shippingCosts.localDelivery}
                disabled={loadingShipping || savingShipping}
                onChange={(e) =>
                  setShippingCosts((prev) => ({ ...prev, localDelivery: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.localDelivery)}</p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Mensajería nacional (AR$)</label>
              <input
                type="number"
                min={0}
                step="1"
                value={shippingCosts.nationalCourier}
                disabled={loadingShipping || savingShipping}
                onChange={(e) =>
                  setShippingCosts((prev) => ({ ...prev, nationalCourier: Number(e.target.value) }))
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(shippingCosts.nationalCourier)}</p>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Recogida en punto siempre se mantiene en <strong>gratis</strong>.
          </p>

          {shippingMsg && <p className="text-sm text-gray-600">{shippingMsg}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleSaveShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {savingShipping ? 'Guardando...' : 'Guardar costos'}
            </button>
            <button
              onClick={handleResetShipping}
              disabled={loadingShipping || savingShipping}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>

      {/* Personalización de la app */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <Palette className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-900 text-sm">Personalización de la app</h3>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Título de la tienda</label>
            <input
              type="text"
              value={theme.appTitle}
              disabled={loadingTheme || savingTheme}
              onChange={(e) => setTheme({ ...theme, appTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Ej: Tiempo Bakery"
            />
          </div>

          {/* Subtítulo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subtítulo/Lema</label>
            <input
              type="text"
              value={theme.appSubtitle}
              disabled={loadingTheme || savingTheme}
              onChange={(e) => setTheme({ ...theme, appSubtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="Ej: Panadería artesanal con preventa semanal"
            />
          </div>

          {/* Logo */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Logo de la tienda</label>
            <div className="space-y-2">
              {/* Cargar archivo */}
              <div className="flex items-center gap-2">
                <label
                  htmlFor="logo-upload"
                  className={`flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors ${
                    uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {uploadingLogo ? 'Cargando...' : 'Seleccionar imagen'}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  disabled={loadingTheme || savingTheme || uploadingLogo}
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>

              {/* O URL manual */}
              <div>
                <label className="block text-xs text-gray-400 mb-1">O ingresa URL manualmente:</label>
                <input
                  type="url"
                  value={theme.logoUrl}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  placeholder="Ej: /img/logo.png"
                />
              </div>
            </div>

            {/* Preview */}
            {theme.logoUrl && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                <img
                  src={theme.logoUrl}
                  alt="Logo preview"
                  className="h-16 object-contain"
                />
              </div>
            )}
          </div>

          {/* Colores */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.primaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.primaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Color secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.secondaryColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Color de acentos</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={theme.accentColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="h-10 w-20 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={theme.accentColor}
                  disabled={loadingTheme || savingTheme}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {themeMsg && (
            <p className={`text-sm ${themeMsg.includes('correctamente') ? 'text-green-600' : 'text-red-600'}`}>
              {themeMsg}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSaveTheme}
              disabled={loadingTheme || savingTheme}
              className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {savingTheme ? 'Guardando...' : 'Guardar personalización'}
            </button>
            <button
              onClick={handleResetTheme}
              disabled={loadingTheme || savingTheme}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Restablecer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
