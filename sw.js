/* =============================================================================
   Pla DRIF · Service Worker

   Existeix per dos motius:
     1. Sense un service worker amb gestor de 'fetch', Chrome NO dispara mai
        l'esdeveniment 'beforeinstallprompt' i, per tant, no es pot oferir un
        botó propi d'instal·lació (l'usuari hauria d'anar als tres punts).
     2. Un cop instal·lada, l'app segueix obrint-se encara que no hi hagi
        cobertura al bosc: es mostra l'última versió desada de la pàgina.

   Estratègia, pensada perquè una web que es toca sovint no quedi mai encallada:
     · HTML, CSS i JS  -> xarxa primer, memòria com a xarxa de seguretat.
       Si hi ha connexió sempre es veu l'últim codi publicat.
     · imatges, models 3D i fonts -> memòria primer (no canvien gairebé mai).
     · ThingSpeak i qualsevol domini extern -> mai es guarden a la memòria cau:
       les dades del risc han de ser sempre en directe.
   ============================================================================= */

var VERSIO = 'pladrif-v1';
var CAU_NUCLI = VERSIO + '-nucli';
var CAU_ACTIUS = VERSIO + '-actius';

/* El mínim indispensable perquè l'app arrenqui sense connexió. */
var NUCLI = [
    './',
    './index.html',
    './producto3d.html',
    './sobre-nosotros.html',
    './risc-live.css',
    './risc-live.js',
    './instalar-app.css',
    './instalar-app.js',
    './manifest.webmanifest',
    './favicon.svg',
    './apple-touch-icon.svg',
    './logo-sadrif.svg'
];

/* Extensions que considerem "actius pesants": rarament canvien i pesen molt. */
var ACTIUS = /\.(png|jpe?g|gif|webp|avif|svg|glb|gltf|woff2?|ttf|otf|mp4|webm)$/i;

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CAU_NUCLI).then(function (cau) {
            /* Es demanen d'un en un: si un fitxer falla (404) no ha de tombar
               tota la instal·lació del service worker. */
            return Promise.all(NUCLI.map(function (url) {
                return cau.add(new Request(url, { cache: 'reload' })).catch(function () { });
            }));
        }).then(function () { return self.skipWaiting(); })
    );
});

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (claus) {
            return Promise.all(claus.map(function (clau) {
                if (clau !== CAU_NUCLI && clau !== CAU_ACTIUS) return caches.delete(clau);
            }));
        }).then(function () { return self.clients.claim(); })
    );
});

/* Permet que la pàgina forci l'activació d'una versió nova sense esperar. */
self.addEventListener('message', function (e) {
    if (e.data === 'salta-espera') self.skipWaiting();
});

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (err) { return; }

    /* Fora del nostre domini (ThingSpeak, Google Fonts, CDN...): que passi de llarg. */
    if (url.origin !== self.location.origin) return;

    /* Actius pesants: memòria primer i, si no hi són, xarxa i es desen. */
    if (ACTIUS.test(url.pathname)) {
        e.respondWith(
            caches.match(req).then(function (desat) {
                if (desat) return desat;
                return fetch(req).then(function (resp) {
                    if (resp && resp.ok && resp.type === 'basic') {
                        var copia = resp.clone();
                        caches.open(CAU_ACTIUS).then(function (cau) { cau.put(req, copia); });
                    }
                    return resp;
                });
            })
        );
        return;
    }

    /* Codi i pàgines: xarxa primer perquè mai es vegi una versió antiga. */
    e.respondWith(
        fetch(req).then(function (resp) {
            if (resp && resp.ok && resp.type === 'basic') {
                var copia = resp.clone();
                caches.open(CAU_NUCLI).then(function (cau) { cau.put(req, copia); });
            }
            return resp;
        }).catch(function () {
            return caches.match(req).then(function (desat) {
                if (desat) return desat;
                /* Navegació sense connexió i sense còpia d'aquesta pàgina:
                   es torna el panell principal, que sempre és al nucli. */
                if (req.mode === 'navigate') return caches.match('./index.html');
                return Response.error();
            });
        })
    );
});
