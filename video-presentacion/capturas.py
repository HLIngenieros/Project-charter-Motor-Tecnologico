"""Capturas de referencia del video de presentación (datos ficticios, nunca producción).

Adaptado de la plantilla de la skill video-proyecto. Levanta una API aislada
(`servidor-demo.ts`: PGlite en memoria con un portafolio inventado, puerto 3400) y la web
en el 5400 apuntando a esa API. No toca `data/pglite`, ni Neon, ni el `npm run dev` del usuario.

Uso (desde la carpeta video-presentacion/):
  PYTHONIOENCODING=utf-8 C:/Users/jurbina/.pw-venv/Scripts/python -I capturas.py
"""
import os
import pathlib
import subprocess
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

AQUI = pathlib.Path(__file__).resolve().parent
SALIDA = AQUI / 'capturas'
RAIZ = AQUI.parent

API = 'http://localhost:3400'
URL = 'http://localhost:5400'
SERVIDORES = [
    (API + '/api/auth/yo', 'npx tsx video-presentacion/servidor-demo.ts', {}),
    (URL, 'npm run dev -w apps/web -- --port 5400 --strictPort', {'API_URL': API}),
]
CORREO = 'demo@hlingenieros.com'
CLAVE = 'demo-video-1234'  # cuenta de demostración de servidor-demo.ts (nunca una real)
WEB = {'width': 1440, 'height': 900}
PRINCIPAL = 'Portal de Proveedores'


def arriba(url: str) -> bool:
    try:
        urllib.request.urlopen(url, timeout=2)
        return True
    except urllib.error.HTTPError:
        return True  # responde (401 sin sesión): está arriba
    except OSError:
        return False


def levantar():
    procesos = []
    for url, comando, entorno in SERVIDORES:
        if arriba(url):
            continue
        procesos.append(subprocess.Popen(comando, cwd=RAIZ, env=dict(os.environ, **entorno), shell=True,
                                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL))
        for _ in range(120):
            if arriba(url):
                break
            time.sleep(1)
        else:
            raise RuntimeError(f'No levantó en 120 s: {comando}')
    return procesos


def foto(pagina, nombre: str):
    pagina.wait_for_load_state('networkidle')
    pagina.wait_for_timeout(1500)
    pagina.screenshot(path=str(SALIDA / nombre))
    print('  ', nombre, pagina.url)


def seccion(pagina, nombre: str, margen: int = 90):
    """Lleva la sección de la ficha al tope de la ventana (bajo la banda fija)."""
    region = pagina.get_by_role('region', name=nombre, exact=True).first
    region.evaluate('(e, m) => window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - m)', margen)
    pagina.wait_for_timeout(600)


def main():
    SALIDA.mkdir(exist_ok=True)
    procesos = levantar()
    try:
        with sync_playwright() as p:
            navegador = p.chromium.launch()
            contexto = navegador.new_context(viewport=WEB, device_scale_factor=2, locale='es-CO',
                                             timezone_id='America/Bogota')
            pagina = contexto.new_page()

            pagina.goto(URL + '/entrar')
            foto(pagina, '1-entrar.png')
            pagina.get_by_role('textbox', name='Correo').fill(CORREO)
            pagina.get_by_role('textbox', name='Clave').fill(CLAVE)
            pagina.get_by_role('button', name='Entrar').click()
            pagina.get_by_role('button', name='Salir').wait_for()
            foto(pagina, '2-portafolio.png')
            pagina.screenshot(path=str(SALIDA / '2-portafolio-completo.png'), full_page=True)

            pagina.get_by_role('link', name=PRINCIPAL).first.click()
            pagina.get_by_role('heading', name=PRINCIPAL, level=1).wait_for()
            foto(pagina, '3-ficha.png')
            pagina.screenshot(path=str(SALIDA / '3-ficha-completa.png'), full_page=True)
            for archivo, nombre in [('4-curva-s.png', 'Curva S'), ('5-cronograma.png', 'Cronograma'),
                                    ('6-riesgos.png', 'Riesgos'), ('7-presupuesto.png', 'Presupuesto'),
                                    ('8-historial.png', 'Historial de cortes')]:
                try:
                    seccion(pagina, nombre)
                    foto(pagina, archivo)
                except Exception as error:  # una sección con otro nombre no detiene las demás
                    print('   (sin captura)', archivo, type(error).__name__)

            pagina.evaluate('window.scrollTo(0, 0)')
            pagina.get_by_role('link', name='Registrar corte').first.click()
            pagina.get_by_role('heading', name='Registrar corte', level=1).wait_for()
            foto(pagina, '9-registrar-corte.png')

            navegador.close()
    finally:
        for proceso in procesos:
            subprocess.run(f'taskkill /PID {proceso.pid} /T /F', shell=True,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


if __name__ == '__main__':
    main()
