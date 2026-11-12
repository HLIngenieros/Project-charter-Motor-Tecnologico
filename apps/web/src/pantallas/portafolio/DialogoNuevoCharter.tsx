import { charterCrear, type CategoriaPublica } from '@charter/shared'
import { useId, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useCrearCharter } from '../../api/charters'
import { Aviso } from '../../componentes/Aviso'
import { Boton } from '../../componentes/Boton'
import { Campo } from '../../componentes/Campo'
import { Dialogo } from '../../componentes/Dialogo'
import { Selector } from '../../componentes/Selector'
import { camposDeZod, separarError, type ErroresCampos } from '../errores'

export function DialogoNuevoCharter({
  abierto,
  alCerrar,
  categorias,
}: {
  abierto: boolean
  alCerrar: () => void
  categorias: CategoriaPublica[]
}) {
  const crear = useCrearCharter()
  const navegar = useNavigate()
  const idRazon = useId()
  const [nombre, setNombre] = useState('')
  // null = sin tocar: se usa «Default» (la categoría protegida) apenas lleguen las categorías.
  const [elegida, setElegida] = useState<string | null>(null)
  const categoriaId = elegida ?? categorias.find((c) => c.protegida)?.id ?? ''
  const [razonDeSer, setRazonDeSer] = useState('')
  const [errores, setErrores] = useState<ErroresCampos>({})
  const [general, setGeneral] = useState<string>()
  // El estado de la mutación llega un render tarde: el ref corta el doble clic.
  const enviando = useRef(false)

  const cerrar = () => {
    if (enviando.current) return
    setNombre('')
    setElegida(null)
    setRazonDeSer('')
    setErrores({})
    setGeneral(undefined)
    alCerrar()
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (enviando.current) return
    const datos = {
      nombre,
      ...(categoriaId ? { categoriaId } : {}),
      ...(razonDeSer.trim() ? { razonDeSer } : {}),
    }
    const validado = charterCrear.safeParse(datos)
    if (!validado.success) {
      setErrores(camposDeZod(validado.error))
      return
    }
    setErrores({})
    setGeneral(undefined)
    enviando.current = true
    crear.mutate(validado.data, {
      onSuccess: ({ id }) => navegar(`/charters/${id}`),
      onError: (error) => {
        enviando.current = false
        const { campos, general } = separarError(error)
        setErrores(campos)
        setGeneral(general)
      },
    })
  }

  return (
    <Dialogo abierto={abierto} alCerrar={cerrar} titulo="Nuevo charter">
      <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
        {general && <Aviso tono="alerta">{general}</Aviso>}
        <Campo
          etiqueta="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          error={errores.nombre}
          maxLength={200}
          autoComplete="off"
        />
        {categorias.length > 0 && (
          <Selector
            etiqueta="Categoría"
            value={categoriaId}
            onChange={(e) => setElegida(e.target.value)}
            error={errores.categoriaId}
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </Selector>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor={idRazon} className="text-sm font-semibold text-tinta">
            Razón de ser <span className="font-normal text-texto-2">(opcional)</span>
          </label>
          <textarea
            id={idRazon}
            value={razonDeSer}
            onChange={(e) => setRazonDeSer(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Qué problema resuelve y por qué ahora"
            className={[
              'w-full resize-y rounded-control border border-linea bg-superficie px-3 py-2.5',
              'text-[0.9375rem] leading-normal text-tinta placeholder:text-texto-3',
              'transition-[border-color,box-shadow] duration-150 hover:border-texto-3',
              'focus:border-acento focus:shadow-foco focus:outline-none',
            ].join(' ')}
          />
          {errores.razonDeSer && (
            <p className="text-sm font-medium text-alerta-texto">{errores.razonDeSer}</p>
          )}
        </div>
        <p className="text-sm text-texto-2">El resto lo completas en la ficha.</p>
        <div className="mt-1 flex justify-end gap-2">
          <Boton variante="fantasma" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={crear.isPending}>
            Crear charter
          </Boton>
        </div>
      </form>
    </Dialogo>
  )
}
