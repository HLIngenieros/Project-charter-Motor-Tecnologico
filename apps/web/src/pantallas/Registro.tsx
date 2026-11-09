import { DOMINIO_POR_DEFECTO, esCorreoPermitido, registroEntrada } from '@charter/shared'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useRegistrar } from '../api/sesion'
import { Aviso } from '../componentes/Aviso'
import { Boton } from '../componentes/Boton'
import { Campo } from '../componentes/Campo'
import { camposDeZod, separarError, type ErroresCampos } from './errores'
import { MarcoAcceso } from './MarcoAcceso'

const AVISO_DOMINIO = `Usa tu correo @${DOMINIO_POR_DEFECTO}`

export function Registro() {
  const navegar = useNavigate()
  const registrar = useRegistrar()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [campos, setCampos] = useState<ErroresCampos>({})
  const [general, setGeneral] = useState<string>()

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setGeneral(undefined)
    const datos = registroEntrada.safeParse({ nombre, correo, clave })
    const errores = datos.success ? {} : camposDeZod(datos.error)
    if (!errores.correo && !esCorreoPermitido(correo, DOMINIO_POR_DEFECTO)) {
      errores.correo = AVISO_DOMINIO
    }
    setCampos(errores)
    if (!datos.success || Object.keys(errores).length > 0) return

    registrar.mutate(datos.data, {
      onSuccess: () => navegar('/', { replace: true }),
      onError: (error) => {
        const r = separarError(error)
        setCampos(r.campos)
        setGeneral(r.general)
      },
    })
  }

  return (
    <MarcoAcceso
      titulo="Crea tu cuenta"
      pie={
        <>
          ¿Ya tienes cuenta?{' '}
          <Link to="/entrar" className="font-semibold text-institucional hover:underline">
            Entra
          </Link>
        </>
      }
    >
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        {general && <Aviso tono="alerta">{general}</Aviso>}
        <Campo
          etiqueta="Nombre"
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={campos.nombre}
        />
        <Campo
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          placeholder={`nombre@${DOMINIO_POR_DEFECTO}`}
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          error={campos.correo}
        />
        <Campo
          etiqueta="Clave"
          type="password"
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres."
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={campos.clave}
        />
        <Boton type="submit" ancho cargando={registrar.isPending} className="mt-2">
          Crear cuenta
        </Boton>
      </form>
    </MarcoAcceso>
  )
}
