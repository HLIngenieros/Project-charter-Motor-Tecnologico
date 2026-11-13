import { expect, test } from '@playwright/test'
import { registrarPorPantalla } from './ayudas'
import { cuentaNueva } from './datos'

// Fechas ya pasadas: el planeado es 100 % sea cual sea el día en que corra la prueba.
const ACTIVIDADES = [
  { nombre: 'Diseño', peso: '40', inicio: '2026-01-05', fin: '2026-02-27', real: '100' },
  { nombre: 'Construcción', peso: '60', inicio: '2026-03-02', fin: '2026-06-30', real: '50' },
]

test('registro → charter → cronograma → corte → curva S', async ({ page }) => {
  await registrarPorPantalla(page, cuentaNueva('flujo'))
  await expect(page.getByRole('heading', { name: 'Aún no tienes charters' })).toBeVisible()

  // Charter nuevo desde el portafolio.
  await page.getByRole('button', { name: 'Nuevo charter' }).click()
  const dialogo = page.getByRole('dialog', { name: 'Nuevo charter' })
  await dialogo.getByRole('textbox', { name: 'Nombre' }).fill('Radicación E2E')
  await dialogo.getByRole('button', { name: 'Crear charter' }).click()
  await expect(page).toHaveURL(/\/charters\/[\w-]+$/)
  await expect(page.getByRole('heading', { name: 'Radicación E2E', level: 1 })).toBeVisible()

  // Cronograma: dos hojas con peso y fechas; se guarda solo.
  const cronograma = page.getByRole('region', { name: 'Cronograma' })
  await cronograma.getByRole('button', { name: 'Agregar actividad' }).click()
  for (const [i, a] of ACTIVIDADES.entries()) {
    const detalle = cronograma.getByRole('group', { name: `Detalle de ${i + 1}` })
    await detalle.getByRole('textbox', { name: 'Actividad' }).fill(a.nombre)
    await detalle.getByRole('textbox', { name: 'Peso (%)' }).fill(a.peso)
    await detalle.getByRole('textbox', { name: 'Inicio' }).fill(a.inicio)
    await detalle.getByRole('textbox', { name: 'Fin' }).fill(a.fin)
    if (i < ACTIVIDADES.length - 1) {
      await detalle.getByRole('button', { name: 'Agregar debajo' }).click()
    }
  }
  const situacion = page.getByRole('group', { name: 'Situación del charter' })
  await expect(situacion).toContainText(/Planeado\s*100,0 %/)
  await expect(situacion).toContainText(/Real\s*0,0 %/)
  const indice = page.getByRole('navigation', { name: 'Secciones del charter' })
  await expect(indice.getByText('Guardado hace un momento')).toBeVisible()

  // Lo guardado sobrevive a una recarga.
  await page.reload()
  await expect(page.getByRole('link', { name: 'Cronograma 2' })).toBeVisible()
  await expect(cronograma.getByRole('button', { name: 'Construcción' })).toBeVisible()

  // Registrar corte: ambas vencieron sin llegar al 100 %.
  await page.getByRole('link', { name: 'Registrar corte' }).click()
  await expect(page.getByRole('heading', { name: 'Registrar corte', level: 1 })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Vencidas · 2' })).toBeVisible()
  for (const a of ACTIVIDADES) {
    await page.getByRole('textbox', { name: `Real de ${a.nombre}, en porcentaje` }).fill(a.real)
  }
  await page.getByRole('textbox', { name: 'Nota del corte' }).fill('Primer corte de prueba')
  const resumen = page.getByRole('complementary')
  await expect(resumen).toContainText(/Real\s*70,0 %/)
  await expect(resumen).toContainText(/Brecha\s*30,0 pts/)
  await page.getByRole('button', { name: 'Guardar corte' }).click()

  // De vuelta en la ficha: banda, curva S e historial con el corte.
  await expect(page).toHaveURL(/\/charters\/[\w-]+$/)
  await expect(page.getByRole('status').filter({ hasText: 'Corte guardado' })).toBeVisible()
  await expect(situacion).toContainText(/Real\s*70,0 %/)
  await expect(situacion).toContainText(/Brecha\s*30,0 pts/)
  const curva = page.getByRole('region', { name: 'Curva S' })
  await expect(curva.getByRole('img', { name: /planeado 100,0 % y real 70,0 %/ })).toBeVisible()
  await expect(curva.getByRole('button', { name: /^Corte del .*1 vencida$/ })).toBeVisible()
  const fila = page.getByRole('table', { name: 'Historial de cortes' }).getByRole('row', {
    name: /último/,
  })
  await expect(fila).toContainText('70,0 %')
  await expect(fila).toContainText('Primer corte de prueba')

  // El portafolio refleja el corte.
  await page
    .getByRole('navigation', { name: 'Ruta' })
    .getByRole('link', { name: 'Mis charters' })
    .click()
  await expect(page.getByRole('link', { name: /Radicación E2E/ })).toContainText(
    '70,0 % de 100,0 %',
  )
})
