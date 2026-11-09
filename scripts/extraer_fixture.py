"""Extrae el cronograma de la hoja «ID & TI» del Excel como fixture JSON para las pruebas del motor.

Uso: python -I scripts/extraer_fixture.py <libro.xlsx> <salida.json>

Regla de jerarquía (ver docs/planes/fase-2.md, Task 2): una fila es agrupadora si su celda G
es una fórmula que referencia otras celdas G; sus hijas son las filas referenciadas (los rangos
se expanden). Las filas sin padre por fórmula toman como padre la fila anterior más cercana con
un nivel de esquema menor. La fila 19 es la raíz implícita y no se exporta.
"""

import json
import re
import sys
from datetime import date, datetime

import openpyxl

HOJA = 'ID & TI'
FILA_RAIZ = 19
PRIMERA, ULTIMA = 20, 185
CORTE = '2025-03-13'

RANGO = re.compile(r'G(\d+):G(\d+)')
CELDA = re.compile(r'G(\d+)')


def referencias_g(formula: str) -> list[int]:
    filas: list[int] = []
    for a, b in RANGO.findall(formula):
        filas.extend(range(int(a), int(b) + 1))
    sin_rangos = RANGO.sub('', formula)
    filas.extend(int(n) for n in CELDA.findall(sin_rangos))
    return filas


def a_iso(valor) -> str | None:
    if valor is None:
        return None
    if isinstance(valor, datetime):
        return valor.date().isoformat()
    if isinstance(valor, date):
        return valor.isoformat()
    raise ValueError(f'Fecha inesperada: {valor!r}')


def texto(valor) -> str | None:
    if valor is None:
        return None
    t = str(valor).strip()
    return t or None


def numero(valor) -> float | None:
    return None if valor is None else float(valor)


def main(ruta_libro: str, ruta_salida: str) -> None:
    formulas = openpyxl.load_workbook(ruta_libro, data_only=False)[HOJA]
    valores = openpyxl.load_workbook(ruta_libro, data_only=True)[HOJA]

    filas = range(PRIMERA, ULTIMA + 1)
    padre: dict[int, int | None] = {}
    agrupadoras: set[int] = set()

    # 1. Padres por fórmula de peso (incluida la raíz implícita, fila 19).
    for f in [FILA_RAIZ, *filas]:
        g = formulas.cell(f, 7).value
        if isinstance(g, str) and g.startswith('='):
            hijas = referencias_g(g)
            assert hijas, f'Fórmula de peso sin referencias en la fila {f}: {g}'
            if f != FILA_RAIZ:
                agrupadoras.add(f)
            for h in hijas:
                assert PRIMERA <= h <= ULTIMA, f'Referencia fuera de rango en la fila {f}: G{h}'
                assert h not in padre, f'La fila {h} tiene dos padres ({padre[h]} y {f})'
                padre[h] = None if f == FILA_RAIZ else f

    # 2. Filas sin padre por fórmula: la anterior más cercana con nivel de esquema menor.
    for f in filas:
        if f in padre:
            continue
        nivel = formulas.row_dimensions[f].outline_level
        candidato = next(
            (p for p in range(f - 1, PRIMERA - 1, -1)
             if formulas.row_dimensions[p].outline_level < nivel),
            None,
        )
        assert candidato is not None, f'La fila {f} no tiene padre'
        padre[f] = candidato
        agrupadoras.add(candidato)

    salida = []
    for f in filas:
        es_agrupadora = f in agrupadoras
        responsables = texto(valores.cell(f, 10).value)
        salida.append({
            'fila': f,
            'item': str(valores.cell(f, 1).value).strip(),
            'nombre': texto(valores.cell(f, 2).value),
            'entregable': texto(valores.cell(f, 6).value),
            'peso': None if es_agrupadora else numero(valores.cell(f, 7).value),
            'inicio': a_iso(valores.cell(f, 8).value),
            'fin': a_iso(valores.cell(f, 9).value),
            'responsables': [r.strip() for r in responsables.split('-')] if responsables else [],
            'padreFila': padre[f],
            'esperado': {
                'K': numero(valores.cell(f, 11).value),
                'L': numero(valores.cell(f, 12).value),
            },
        })

    hojas = [x for x in salida if x['fila'] not in agrupadoras]
    programadas = [x for x in hojas if x['peso'] and x['inicio'] and x['fin']]
    sin_programar = [x for x in hojas if x not in programadas]
    suma = sum(x['peso'] for x in programadas)

    assert len(salida) == 166, len(salida)
    assert len(agrupadoras) == 22, len(agrupadoras)
    assert len(hojas) == 144, len(hojas)
    assert len(programadas) == 138, len(programadas)
    assert len(sin_programar) == 6, len(sin_programar)
    assert all(padre[x['fila']] == 168 for x in sin_programar), 'Las hojas sin programar no están bajo 2.2'
    assert abs(suma - 1.0) <= 1e-9, suma

    with open(ruta_salida, 'w', encoding='utf-8', newline='\n') as archivo:
        json.dump({'corte': CORTE, 'filas': salida}, archivo, ensure_ascii=False, indent=2)
        archivo.write('\n')

    print(f'{len(salida)} filas, {len(agrupadoras)} agrupadoras, {len(hojas)} hojas, Σpeso={round(suma, 9)}')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    if len(sys.argv) != 3:
        sys.exit('Uso: python -I scripts/extraer_fixture.py <libro.xlsx> <salida.json>')
    main(sys.argv[1], sys.argv[2])
