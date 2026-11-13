import { expect, test } from '@playwright/test'
import { crearCharterPorApi, CSRF, entrar, registrarPorApi } from './ayudas'
import { ADMIN, cuentaNueva } from './datos'

test('el Admin ve los charters de todos, en solo lectura', async ({
  page,
  playwright,
  baseURL,
}) => {
  // Otro usuario crea su charter.
  const dueno = cuentaNueva('dueno')
  const comoDueno = await playwright.request.newContext({ baseURL })
  await registrarPorApi(comoDueno, dueno)
  const nombre = `Charter ajeno ${Date.now().toString(36)}`
  const id = await crearCharterPorApi(comoDueno, nombre)

  // Un tercero sin perfil Admin ni siquiera sabe que existe.
  const tercero = await playwright.request.newContext({ baseURL })
  await registrarPorApi(tercero, cuentaNueva('tercero'))
  expect((await tercero.get(`/api/charters/${id}`)).status()).toBe(404)

  // El Admin lo encuentra en «Todos» y lo abre.
  await entrar(page, ADMIN)
  await expect(page.getByRole('link', { name: nombre })).toHaveCount(0)
  await page.getByRole('radiogroup', { name: 'Ver' }).getByText('Todos').click()
  await expect(page).toHaveURL(/ver=todos/)
  await page.getByRole('searchbox', { name: 'Buscar' }).fill(nombre)
  await page.getByRole('link', { name: new RegExp(nombre) }).click()

  // Ficha en solo lectura: sin campos, sin agregar actividades, sin registrar corte.
  await expect(page.getByRole('heading', { name: nombre, level: 1 })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'solo lectura' })).toContainText(
    dueno.nombre,
  )
  await expect(page.getByRole('textbox', { name: 'Nombre del charter' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Agregar actividad' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Registrar corte' })).toHaveCount(0)

  // Y la API lo respalda: el Admin no puede editarlo.
  const edicion = await page.request.patch(`/api/charters/${id}`, {
    headers: CSRF,
    data: { nombre: 'Cambio del Admin' },
  })
  expect(edicion.status()).toBe(403)

  await comoDueno.dispose()
  await tercero.dispose()
})
