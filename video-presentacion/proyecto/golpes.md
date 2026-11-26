# Golpes de la música

**Tema:** «Technology Corporate» de PaulYudin (Pixabay Content License), `musica/technology-corporate` de la skill `video-proyecto`.

**Tempo:** 112 BPM. Un golpe cada **0,5357 s** (60/112); un compás de 4 golpes cada **2,1429 s**. Primer golpe del archivo en 0,107 s.

**Tramo del video:** desde **12,964 s** del archivo (compás 6) hasta **53,678 s**: **40,714 s** (19 compases), con fundido de salida de 1,5 s. Es la primera parte fuerte del tema; Horas Hombre usa el final (98,678 a 140,678 s).

`assets/musica/pista.mp3` ya está recortada a ese tramo y con el fundido:

```
ffmpeg -ss 12.964 -t 40.7143 -i <skill>/musica/technology-corporate/pista.mp3 \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=39.2143:d=1.5" -c:a libmp3lame -q:a 2 assets/musica/pista.mp3
```

**Acentos** (cada 4 compases desde la entrada fuerte), en segundos del video: **4,286** (entrada fuerte), **12,857**, **21,429**, **30,000** y **38,571**.

## Fronteras de escena (segundos del video)

Cada escena empieza en un compás. Dentro de cada escena los tiempos van en golpes desde su inicio: `const B = 60 / 112`, y el golpe local `k` cae en `k * B`.

| # | Escena | Desde | Hasta | Compases | Música |
|---|---|---|---|---|---|
| 1 | Apertura «Project Charter» | 0,000 | 4,286 | 2 | intro suave |
| 2 | Adiós al Excel | 4,286 | 8,571 | 2 | **entrada fuerte** en 4,286 |
| 3 | Cronograma que se arrastra | 8,571 | 17,143 | 4 | acento en 12,857 (el arrastre) |
| 4 | Cada corte, una foto | 17,143 | 21,429 | 2 | |
| 5 | La curva S, viva | 21,429 | 27,857 | 3 | acento en 21,429 |
| 6 | Riesgos y presupuesto | 27,857 | 32,143 | 2 | acento en 30,000 (el total) |
| 7 | Todo el portafolio | 32,143 | 36,429 | 2 | |
| 8 | Cierre «Project Charter» | 36,429 | 40,714 | 2 | acento en 38,571 (logo de Grupo HL) y fundido |
