import { expect, type APIRequestContext, type Page } from '@playwright/test'

/** Cabecera que la API exige en toda mutación (CSRF). */
export const CSRF = { 'x-requested-with': 'charter' }

type Cuenta = { correo: string; nombre: string; clave: string }

export async function registrarPorPantalla(page: Page, cuenta: Cuenta) {
  await page.goto('/registro')
  await page.getByRole('textbox', { name: 'Nombre' }).fill(cuenta.nombre)
  await page.getByRole('textbox', { name: 'Correo' }).fill(cuenta.correo)
  await page.getByRole('textbox', { name: 'Clave', exact: true }).fill(cuenta.clave)
  await page.getByRole('textbox', { name: 'Confirmar clave' }).fill(cuenta.clave)
  await page.getByRole('button', { name: 'Crear cuenta' }).click()
  await expect(page.getByRole('heading', { name: 'Mis charters', level: 1 })).toBeVisible()
}

export async function entrar(page: Page, cuenta: Pick<Cuenta, 'correo' | 'clave'>) {
  await page.goto('/entrar')
  await page.getByRole('textbox', { name: 'Correo' }).fill(cuenta.correo)
  await page.getByRole('textbox', { name: 'Clave' }).fill(cuenta.clave)
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page.getByRole('button', { name: 'Salir' })).toBeVisible()
}

/** Registra una cuenta por la API; la sesión queda en las cookies de `request`. */
export async function registrarPorApi(request: APIRequestContext, cuenta: Cuenta) {
  const respuesta = await request.post('/api/auth/registro', { headers: CSRF, data: cuenta })
  expect(respuesta.status()).toBe(201)
}

export async function crearCharterPorApi(request: APIRequestContext, nombre: string) {
  const respuesta = await request.post('/api/charters', { headers: CSRF, data: { nombre } })
  expect(respuesta.status()).toBe(201)
  return ((await respuesta.json()) as { id: string }).id
}
