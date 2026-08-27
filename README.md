# Pla DRIF · Web de l'estació SADRIF

Web del Treball de Recerca **Pla DRIF**: el panell en temps real del risc d'incendi forestal
que calcula l'estació SADRIF instal·lada a Sabadell.

🌐 **https://pladrif.online**

---

## Les tres pàgines

| Fitxer | Què és |
|---|---|
| `index.html` | Panell en directe: risc, sensors, mapa, gràfics, històric i càmera |
| `producto3d.html` | El dispositiu en 3D, la fitxa tècnica i les preguntes freqüents |
| `sobre-nosotros.html` | La història del projecte, el procés, la línia de temps i l'equip |

---

## ⚠️ Abans de pujar res: hi ha un pas de compilació

Dues pàgines fan servir React amb JSX. **El JSX no s'escriu dins de l'HTML**: viu a `src/` i
es compila a `js/`. Si edites el JSX, has de recompilar o els canvis no es veuran.

```bash
npm install     # només la primera vegada
npm run build   # compila src/*.jsx  ->  js/*.js
```

Mentre hi treballes, `npm run watch` recompila sol a cada canvi.

| Font (edita això) | Compilat (es puja, no s'edita) | Pàgina |
|---|---|---|
| `src/producto3d.jsx` | `js/producto3d.js` | `producto3d.html` |
| `src/sobre-nosotros.jsx` | `js/sobre-nosotros.js` | `sobre-nosotros.html` |

> **La carpeta `js/` es puja al repositori a propòsit.** Així GitHub Pages pot servir la web
> directament des de la branca, sense cap acció de compilació al núvol. Si algun dia
> l'esborres, la web es queda sense les seccions animades.

Abans es feia servir Babel dins del navegador. Es va treure perquè eren ~1,4 MB que s'havien
de baixar i processar **a cada visita**, sobretot notoris al mòbil.

---

## Fitxers compartits per les tres pàgines

| Fitxer | Per a què serveix |
|---|---|
| `risc-live.js` | **Obligatori.** Fórmula del risc, connexió a ThingSpeak i píndola "Risc: XX%" del menú |
| `risc-live.css` | Estils del desplegable de la píndola |
| `manifest.webmanifest` | Fitxa de l'aplicació: nom, icones, color i pantalla d'inici |
| `instalar-app.js` | Botó propi "Instal·la l'app" + escena animada + registre del service worker |
| `instalar-app.css` | Estils del botó, de la finestra d'instal·lació i del tel d'arrencada |
| `avisos-nucli.js` | **Obligatori per als avisos.** La política: què s'avisa, quan i, sobretot, quan no |
| `avisos.js` | Panell d'avisos, permís de notificacions i revisió mentre la pàgina és oberta |
| `avisos.css` | Estils del panell i de la targeta que ofereix els avisos |
| `sw.js` | **Obligatori.** Service worker: memòria cau, sense connexió i avisos en segon pla |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `badge-96.png` | Les icones de veritat de l'app, generades a partir de `logo-sadrif.svg` |

### Una sola font de veritat per al risc

Tot el càlcul del risc viu a `risc-live.js`. Si canvies un llindar o un color,
**canvia'l només allà** i es propaga a les tres pàgines alhora.

`index.html` conserva el seu array `NIVELLS_RISC` amb els textos llargs (consells i mesures),
però la puntuació i el nivell els demana a `window.SadrifRisc.calcular()`.

### El color del risc no tenyeix tota la web

Només el panell principal canvia de paleta segons el risc
(`initPindola({ tenyirPagina: true })`). A `producto3d.html` i `sobre-nosotros.html` el color
del risc viu **només dins de la píndola**: la resta sempre és el verd maragda de la marca.

---

## Instal·lar la web com a app

Les tres pàgines tenen un botó propi que llança el diàleg d'instal·lació del sistema, sense
haver de buscar-lo al menú dels tres punts del navegador. Apareix en dos llocs:

- dins del menú, com a últim enllaç de la targeta **Navegació**
- al final del peu de pàgina, com una píndola discreta

Tot ho munta `instalar-app.js` tot sol: **no cal tocar el HTML de cap pàgina** per afegir-hi
o treure'n el botó, només cal que la pàgina carregui `instalar-app.css` i `instalar-app.js`.

### Tres detalls que és important no trencar

1. **`sw.js` no és opcional.** Chrome només dispara `beforeinstallprompt` —l'única manera de
   poder obrir el diàleg des d'un botó propi— si hi ha un service worker registrat amb un
   gestor de `fetch`. Si s'esborra `sw.js`, el botó desapareix i es torna al menú dels tres punts.
2. **El botó no es mostra mai si no serveix de res.** Neix amagat i només apareix quan el
   navegador confirma que la web es pot instal·lar, o quan som en un iPhone o iPad (allà no hi
   ha cap API i la mateixa finestra ensenya els passos de Safari). Dins de l'app ja instal·lada
   no es veu.
3. **La icona que vola cap al telèfon es mesura en viu.** `preparaVol()` calcula el trajecte
   amb `getBoundingClientRect()`, així que es pot canviar la mida del telèfon o de la graella
   sense tocar cap número de l'animació.

### Les icones: PNG, i generades del logo

`favicon.svg` i `apple-touch-icon.svg` són icones **redibuixades**; les que compten ara són
les PNG (`icon-192`, `icon-512`, `icon-maskable-512`, `apple-touch-icon`, `badge-96`), fetes
rasteritzant `logo-sadrif.svg` en blanc damunt del degradat verd de la marca.

No és cap caprici estètic: **iOS ignora completament els SVG a `apple-touch-icon`**, així que
amb només l'SVG el Pla DRIF anava a parar a la pantalla d'inici de l'iPhone amb una icona
qualsevol, sovint el logo negre damunt del fons blanc de `background_color`. Amb el PNG, la
icona és el logo verd tant a Android com a l'iPhone.

`icon-192.png` és, a més, la que fa servir l'escena d'instal·lació i la que apareix a totes
les notificacions, de manera que **la icona de l'animació i la de l'app són literalment el
mateix fitxer**. Si es refà el logo, s'han de tornar a generar les cinc.

### L'escena d'instal·lació

Quatre temps, encadenats des de `animarInstalacio()` amb classes (`instalant`, `aterrada`,
`obrint`, `feta`) en comptes de retards escrits a mà dins del CSS:

1. la icona vola de la fitxa fins al forat de la graella,
2. hi aterra i les veïnes fan lloc,
3. l'app s'obre des d'aquell punt (`clip-path` en cercle) i el logo verd omple la pantalla,
4. la finestra passa a "ja la tens" i ofereix els avisos.

El vol va partit en dues capes (`.instalar-icona` mou l'eix X, `.instalar-icona-vol` l'eix Y
i l'escala) perquè cada eix pugui tenir la seva pròpia corba: amb una sola capa el moviment
només pot ser una recta en diagonal. Es fa amb `Element.animate()`, i el CSS conserva una
versió amb una transició per capa com a xarxa de seguretat.

### El tel d'arrencada

Quan l'app s'obre des de la pantalla d'inici, el sistema ensenya primer la seva pantalla de
càrrega (el `background_color` del manifest, ara verd fosc) i tot seguit hi entra la pàgina,
que és clara. El `<div class="app-entrada">` que hi ha a dalt del `<body>` de les tres
pàgines tapa aquell salt amb el mateix verd i el mateix logo, i marxa sol al cap de mig segon.

És **només CSS**: fora del mode `standalone` el tel està a `display: none` i ni tan sols es
dibuixa. Si es toca, comprovar sempre que a la web normal segueix invisible.

### La memòria cau

`sw.js` guarda les pàgines per poder-les obrir sense cobertura, però amb dues regles:

- **HTML, CSS i JS**: xarxa primer. Amb connexió sempre es veu l'última versió publicada,
  mai una de vella encallada a la memòria.
- **Imatges, models 3D i fonts**: memòria primer, perquè quasi mai canvien i pesen molt.
- **ThingSpeak i qualsevol domini extern**: mai es desen. Les dades del risc són sempre en directe.

Si algun dia cal invalidar tota la memòria cau de cop, canvia la constant `VERSIO` de `sw.js`.

---

## Avisos

Amb l'app instal·lada, el telèfon pot avisar quan el risc puja. Tot passa dins del navegador:
**no hi ha servidor, ni compte, ni cap dada que surti del dispositiu.**

### On viu cada cosa

| Fitxer | Responsabilitat |
|---|---|
| `avisos-nucli.js` | La política sencera. El carreguen la pàgina i el service worker, tots dos |
| `avisos.js` | El panell, el permís i la revisió mentre la pàgina és oberta |
| `sw.js` | Es desperta en segon pla, demana una lectura i deixa decidir el nucli |

El nucli és el mateix fitxer als dos móns, i l'estat es guarda a **IndexedDB** (no a
`localStorage`, que dins d'un service worker no existeix). Així la pàgina i el segon pla no
poden arribar mai a conclusions diferents ni enviar el mateix avís dues vegades.

Per poder-lo carregar des del worker, `risc-live.js` ja no s'ancora a `window` sinó a
`self`, i exporta `llegirAra()`, una lectura solta que no toca el DOM. **No hi pot haver cap
referència a `document` fora de les funcions que només crida la pàgina.**

### Què s'avisa

| Categoria | Quan |
|---|---|
| Risc | El risc **puja** a alt (3 de 4) o a extrem. I una vegada quan torna a la normalitat |
| Recomanacions | Un consell al dia, triat pel factor que més pesa (vent, sequedat, calor o la regla 30-30-30) |
| Estació | Quan deixa d'enviar dades i quan torna a estar en línia |

### Què evita que sigui molest

Tots els números són a `POLITICA`, a dalt de `avisos-nucli.js`:

- només a partir del nivell **alt**; el moderat no desperta ningú,
- només quan el risc **canvia de nivell**, mai a cada lectura,
- sis hores entre avisos de risc; l'extrem porta comptador propi de tres hores perquè passar
  d'alt a extrem no quedi tapat per l'espera de l'avís d'alt,
- **màxim tres avisos al dia**, i l'extrem no hi compta,
- de 22 a 8 h no sona res que no sigui extrem. El que queda pendent **no es reprodueix tal
  qual** al matí: es torna a mirar la lectura i s'explica què va passar,
- un avís de risc que topa amb el silenci o amb el sostre diari s'ajorna, no es llença: si no,
  un dia amb tres avisos de matí podria amagar que a la tarda el risc ha pujat,
- els informatius van amb `silent: true` (ni so ni vibració) i una etiqueta per categoria, de
  manera que un avís nou substitueix el vell en comptes d'apilar-s'hi.

### Segon pla: fins on arriba

Sense servidor propi no hi ha *push* de veritat. L'únic mecanisme és **Periodic Background
Sync**, que només tenen els navegadors Chromium, amb l'app instal·lada i si s'hi entra sovint;
a més, la freqüència real la decideix el navegador. Quan no dispara, la revisió es fa en obrir
la pàgina, que ja cobreix el cas de "el risc ha pujat mentre l'app era tancada".

`sw.js` ja té el gestor de `push` escrit per si algun dia hi ha servidor amb claus VAPID.

### A l'iPhone

Els avisos web només existeixen a iOS 16.4 endavant i **només amb l'app instal·lada** a la
pantalla d'inici. Des de Safari, `window.Notification` ni tan sols existeix; el panell ho
detecta i, en comptes d'un botó que no faria res, ofereix instal·lar l'app primer.

### El permís

No es demana mai en carregar la pàgina. Només surt quan l'usuari prem el botó del panell, o
quan accepta la targeta que s'ofereix **una sola vegada** (a la primera obertura com a app
instal·lada, o a partir de la tercera visita). Si es diu que no, no es torna a preguntar.

---

## Assets

Les fotografies i models 3D que fan servir les pàgines estan documentats a
[`ASSETS-NECESSARIS.md`](ASSETS-NECESSARIS.md), amb el que encara falta per entregar.

---

## Publicació a GitHub Pages

La web és HTML estàtic: només cal que la branca publicada contingui els `.html`, les carpetes
`js/`, els assets i els fitxers compartits.

- `.nojekyll` evita que GitHub processi la carpeta amb Jekyll.
- El domini propi es configura a *Settings → Pages → Custom domain*, amb
  **Enforce HTTPS** activat (les etiquetes `canonical` i `og:url` ja apunten a `https://`).
- `robots.txt` i `sitemap.xml` ja apunten a `https://pladrif.online`. Si el domini canvia,
  s'han d'actualitzar tots dos, més els `canonical`, `og:url` i `og:image` de les tres pàgines.
