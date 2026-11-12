import { cambiarClaveEntrada } from '@charter/shared'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCambiarClave, useSesion } from '../api/sesion'
import { Layout } from '../app/Layout'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'
import { CampoClave } from '../componentes/CampoClave'
import { camposDeZod, separarError, type ErroresCampos } from './errores'

/** `/cuenta/clave`: cambiar la clave propia; obligatoria tras un restablecimiento del Admin. */
export function CambiarClave() {
  const { data: usuario } = useSesion()
  const cambiar = useCambiarClave()
  const navegar = useNavigate()
  const [claveActual, setClaveActual] = useState('')
  const [claveNueva, setClaveNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [campos, setCampos] = useState<ErroresCampos>({})
  const [general, setGeneral] = useState<string>()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setGeneral(undefined)
    const datos = cambiarClaveEntrada.safeParse({ claveActual, claveNueva })
    const errores = datos.success ? {} : camposDeZod(datos.error)
    if (!errores.claveNueva && confirmacion !== claveNueva) {
      errores.confirmacion = 'Las claves no coinciden'
    }
    setCampos(errores)
    if (!datos.success || Object.keys(errores).length > 0) return

    cambiar.mutate(datos.data, {
      onSuccess: () => navegar('/', { replace: true, state: { aviso: 'Clave cambiada' } }),
      onError: (error) => {
        const r = separarError(error)
        setCampos(r.campos)
        setGeneral(r.general)
      },
    })
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <h1 className="text-[1.625rem] font-semibold">Cambiar clave</h1>
        {usuario?.debeCambiarClave && (
          <Aviso tono="info" className="mt-4">
            Tu clave fue restablecida. Elige una nueva para seguir.
          </Aviso>
        )}
        <form
          noValidate
          onSubmit={enviar}
          className="mt-6 flex flex-col gap-4 rounded-tarjeta border border-linea bg-superficie p-6"
        >
          {general && <Aviso tono="alerta">{general}</Aviso>}
          <CampoClave
            etiqueta="Clave actual"
            autoComplete="current-password"
            value={claveActual}
            onChange={(e) => setClaveActual(e.target.value)}
            error={campos.claveActual}
          />
          <CampoClave
            etiqueta="Clave nueva"
            autoComplete="new-password"
            ayuda="Mínimo 8 caracteres."
            value={claveNueva}
            onChange={(e) => setClaveNueva(e.target.value)}
            error={campos.claveNueva}
          />
          <CampoClave
            etiqueta="Confirmar clave"
            autoComplete="new-password"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            error={campos.confirmacion}
          />
          <Boton type="submit" cargando={cambiar.isPending} className="mt-2 self-start">
            Cambiar clave
          </Boton>
        </form>
      </div>
    </Layout>
  )
}
