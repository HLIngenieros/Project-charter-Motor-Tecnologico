import { loginEntrada } from '@charter/shared'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useEntrar } from '../api/sesion'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { CampoClave } from '../componentes/CampoClave'
import { camposDeZod, separarError, type ErroresCampos } from './errores'
import { MarcoAcceso } from './MarcoAcceso'

export function Entrar() {
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const entrar = useEntrar()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [campos, setCampos] = useState<ErroresCampos>({})
  const [general, setGeneral] = useState<string>()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setGeneral(undefined)
    const datos = loginEntrada.safeParse({ correo, clave })
    if (!datos.success) {
      setCampos(camposDeZod(datos.error))
      return
    }
    setCampos({})
    entrar.mutate(datos.data, {
      onSuccess: () => {
        const desde = (ubicacion.state as { desde?: string } | null)?.desde
        navegar(desde ?? '/', { replace: true })
      },
      onError: (error) => {
        const r = separarError(error)
        setCampos(r.campos)
        setGeneral(r.general)
      },
    })
  }

  return (
    <MarcoAcceso
      titulo="Entra a tus charters"
      pie={
        <>
          ¿Aún no tienes cuenta?{' '}
          <Link to="/registro" className="font-semibold text-institucional hover:underline">
            Créala con tu correo de HL
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        {general && <Aviso tono="alerta">{general}</Aviso>}
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          placeholder="nombre@hlingenieros.com"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={campos.correo}
        />
        <CampoClave
          etiqueta="Clave"
          autoComplete="current-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={campos.clave}
        />
        <Boton type="submit" ancho cargando={entrar.isPending} className="mt-2">
          Entrar
        </Boton>
        <p className="text-center text-sm text-texto-2">
          ¿Olvidaste tu clave? Contacta al administrador del sistema.
        </p>
      </form>
    </MarcoAcceso>
  )
}
