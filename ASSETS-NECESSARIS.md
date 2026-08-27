# Assets de la web — Pla DRIF / SADRIF

Estado actualizado. **Ya solo faltan las 4 fotos del equipo.** Todo lo demás está entregado y conectado.

> **Sobre los emojis:** no queda ni uno en toda la web. Están sustituidos por un **sistema de iconos SVG propio** (trazo 1,75 px, rejilla 24×24, `currentColor`) incrustado en el HTML: 0 KB extra, nítido en cualquier pantalla y del color que toque en cada sitio. Es el enfoque de Apple (SF Symbols) o Google (Material Symbols). Por eso esta lista no pide iconos sueltos.

---

## PENDIENTE — Fotos del equipo (4 archivos)

Van en las tarjetas ProfileCard de `sobre-nosotros.html`. Mientras no existan, la tarjeta muestra el monograma de iniciales (AA, KJ, GL, UC), así que la web no se rompe, pero se ve incompleta.

| Nombre base | Persona |
|---|---|
| `equip-abraham` | Abraham Ayala |
| `equip-kevin` | Kevin Juan |
| `equip-guillem` | Guillem Llamas |
| `equip-unai` | Unai Cañas |

**La extensión da igual**: el código prueba `.png`, `.jpeg` y `.jpg` en ese orden y usa la primera que encuentre. Si Gemini te lo da en JPEG, guárdalo tal cual como `equip-abraham.jpeg` y ya funciona. Solo si consigues recortar la silueta con fondo transparente merece la pena el PNG.

**Especificaciones (las 4 iguales, si no, cantará):**
- **800 × 1000 px** (vertical 4:5)
- Encuadre **de pecho para arriba**, cabeza en el tercio superior, mirando a cámara
- La foto se recorta por abajo con un degradado hacia transparente: **deja los hombros/pecho en la parte inferior**, nada importante ahí
- Fondo oscuro y liso (cada tarjeta ya tiene su propio color detrás)

**Prompt para Nano Banana (partiendo de una foto vuestra real):**
```
Toma esta fotografía y edítala manteniendo a la persona exactamente igual (mismos rasgos,
mismo pelo, misma ropa, no cambies la cara). Cambios a aplicar:
1) Recorta en vertical 4:5, encuadre de pecho para arriba, cabeza en el tercio superior.
2) Sustituye el fondo por un fondo liso oscuro con un degradado suave de #0f172a a #0b1220,
   sin objetos ni textura.
3) Iluminación de estudio suave y frontal, luz de relleno para que no queden sombras duras
   en la cara. Tono de piel natural, sin sobresaturar.
4) Contraste ligeramente alto y colores fríos, coherente con una web de tecnología.
Salida: 800x1000 px.
```

> Hazlas las cuatro **en la misma sesión**, misma pared y misma luz. Es el detalle que separa "web de instituto" de "web profesional".

---

## ENTREGADO — ya está todo conectado

### Galería "Arquitectura del Sistema" (`producto3d.html`)
Al pulsar cada panel se despliega y aparece su descripción debajo.

| Archivo | Panel |
|---|---|
| `foto-caja-sadrif.jpeg` | Dispositiu SADRIF — Muntatge complet |
| `foto-component-esp32.jpeg` | ESP32 STEAMakers — Placa principal |
| `foto-component-sensors.jpeg` | DHT11 i BMP280 |
| `foto-component-anemometre.jpeg` | Anemòmetre |
| `foto-component-cam.jpeg` | ESP32-CAM |
| `foto-component-energia.jpeg` | Plaques solars, TP4056 i bateria |

### Carrusel "El procés de construcció" (`sobre-nosotros.html`)
Al pulsar cada foto aparece su descripción debajo.

| Archivo | Momento |
|---|---|
| `proces-1-disseny3d.jpeg` | Diseño 3D de la carcasa |
| `proces-2-programacio.jpeg` | Programando el firmware desde el aula |
| `proces-3-muntatge.jpeg` | Soldando los componentes |
| `proces-4-sensors.jpeg` | Montaje completo dentro de la caja |
| `proces-5-bosc.jpeg` | Estación instalada en el árbol |

### Resto
- **`risc-live.js` + `risc-live.css` — OBLIGATORIOS.** El módulo compartido que calcula el riesgo y alimenta la píldora "Risc: XX%" del menú, con su desplegable. Los cargan **las tres** páginas. Si no los subes, el panel de `index.html` deja de calcular el riesgo.
- **Carpeta `js/` — OBLIGATORIA.** Contiene el JSX ya compilado de `producto3d.html` y `sobre-nosotros.html`. Sin ella esas dos páginas se quedan sin las secciones animadas. Se genera con `npm run build` a partir de `src/` (ver el README).
- **`avisos-nucli.js`, `avisos.js`, `avisos.css` — OBLIGATORIOS** si quieres las notificaciones.
  `avisos-nucli.js` lo cargan la página **y** `sw.js`, así que si falta, el service worker no arranca
  y con él se cae también el botón de instalar.
- **`icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `badge-96.png`
  — OBLIGATORIOS.** Son las icónos de verdad de la app, generados a partir de `logo-sadrif.svg`
  (logo blanco sobre el degradado verde de la marca). iOS ignora los SVG en `apple-touch-icon`,
  así que sin los PNG el icono de la pantalla de inicio del iPhone sale mal. `icon-192.png` es
  además el que usa la animación de instalación y el que sale en todas las notificaciones.
- `manifest.webmanifest` — permite instalar la web como app.
- `og-preview.png` — la imagen que sale en WhatsApp, Twitter y Facebook al compartir el enlace. Se genera a partir de `og-preview.svg`; las redes **no aceptan SVG**, así que el PNG es el que cuenta.
- `logo-sadrif.svg`, `favicon.svg`, `apple-touch-icon.svg`, `og-preview.svg`
- `logo-sabadell.png`, `logo-generalitat.png` — en las chips blancas del footer
- `sadrif_3d.glb`, `sadrif_inside.glb` — modelos del visor 3D
- `icon-youtube.svg`, `icon-twitch.svg`, `icon-instagram.png` — **ya no se usan** (el footer lleva iconos SVG incrustados). Puedes borrarlos.
- `mi_dispositivo_color.glb` — no se usa en ninguna página

---

## Cómo añadir las fotos del equipo

Déjalas en esta misma carpeta con el nombre base de la tabla y cualquiera de las tres extensiones. Aparecen solas. **No hay que tocar código.**
