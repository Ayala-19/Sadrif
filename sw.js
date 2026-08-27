/* =============================================================================
   Pla DRIF · Service Worker

   Existeix per tres motius:
     1. Sense un service worker amb gestor de 'fetch', Chrome NO dispara mai
        l'esdeveniment 'beforeinstallprompt' i, per tant, no es pot oferir un
        botó propi d'instal·lació (l'usuari hauria d'anar als tres punts).
     2. Un cop instal·lada, l'app segueix obrint-se encara que no hi hagi
        cobertura al bosc: es mostra l'última versió desada de la pàgina.
     3. És l'únic lloc del navegador que segueix viu amb l'app tancada, i per
        tant l'únic que pot enviar un avís quan el risc puja de matinada.

   Estratègia de memòria cau, pensada perquè una web que es toca sovint no
   quedi mai encallada:
     · HTML, CSS i JS  -> xarxa primer, memòria com a xarxa de seguretat.
       Si hi ha connexió sempre es veu l'últim codi publicat.
     · imatges, models 3D i fonts -> memòria primer (no canvien gairebé mai).
     · ThingSpeak i qualsevol domini extern -> mai es guarden a la memòria cau:
       les dades del risc han de ser sempre en directe.

   Els avisos NO es decideixen aquí: la política viu sencera a
   'avisos-nucli.js', que la pàgina carrega igual. Aquí només es desperta,
   es demana una lectura i es deixa que el nucli decideixi.
   ============================================================================= */

/* La fórmula del risc i la política d'avisos, tal com les fa servir la
   pàgina. Res duplicat: són literalment els mateixos fitxers. */
importScripts('risc-live.js', 'avisos-nucli.js');

var VERSIO = 'pladrif-v3';
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
    './avisos.css',
    './avisos.js',
    './avisos-nucli.js',
    './manifest.webmanifest',
    './favicon.svg',
    './logo-sadrif.svg',
    /* Les dues icones que fan falta per ensenyar una notificació sense
       connexió. Les de 512 no hi són a posta: pesen un quart de mega cadascuna
       i només les fa servir el sistema en instal·lar l'app, així que ja es
       desaran soles la primera vegada que es demanin. */
    './icon-192.png',
    './badge-96.png'
];

/* Extensions que considerem "actius pesants": rarament canvien i pesen molt. */
var ACTIUS = /\.(png|jpe?g|gif|webp|avif|svg|glb|gltf|woff2?|ttf|otf|mp4|webm)$/i;

/* Etiqueta de la revisió periòdica en segon pla. */
var TASCA = 'pladrif-revisar-risc';

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

/* =============================================================================
   AVISOS
   ============================================================================= */

/* Demana una lectura a ThingSpeak i deixa que el nucli decideixi si allò
   mereix una notificació o no. Gairebé sempre la resposta és que no. */
function revisar() {
    if (!self.SadrifRisc || !self.SadrifAvisosNucli) return Promise.resolve();
    return self.SadrifRisc.llegirAra()
        .then(function (lectura) {
            if (!lectura) return null;
            return self.SadrifAvisosNucli.processar(self.registration, lectura);
        })
        .catch(function (e) {
            console.warn('[Pla DRIF] revisió en segon pla fallida:', e && e.message);
        });
}

/* Chrome desperta el worker de tant en tant amb l'app instal·lada. És l'única
   manera que hi ha, sense servidor propi, d'assabentar-se que el risc ha pujat
   amb l'app tancada. El navegador decideix la freqüència real; nosaltres només
   diem quin és el mínim que ens serveix. */
self.addEventListener('periodicsync', function (e) {
    if (e.tag === TASCA) e.waitUntil(revisar());
});

/* Sincronització d'un sol cop: la demana la pàgina quan es tanca havent
   detectat que feia estona que no es revisava res. */
self.addEventListener('sync', function (e) {
    if (e.tag === TASCA) e.waitUntil(revisar());
});

/* Preparat per si algun dia hi ha servidor d'enviaments. Sense clau VAPID no
   arriba mai res per aquí, però si arribés no s'ha de perdre. */
self.addEventListener('push', function (e) {
    var dades = null;
    try { dades = e.data ? e.data.json() : null; } catch (err) { dades = null; }

    if (dades && dades.titol) {
        e.waitUntil(self.SadrifAvisosNucli.mostrar(self.registration, {
            clau: dades.clau || 'push',
            categoria: dades.categoria || 'risc',
            to: dades.to || 'normal',
            titol: dades.titol,
            cos: dades.cos || ''
        }));
        return;
    }
    e.waitUntil(revisar());
});

/* Un toc a la notificació ha de portar al panell, i si l'app ja és oberta
   s'hi ha de saltar en comptes d'obrir una segona finestra. */
self.addEventListener('notificationclick', function (e) {
    e.notification.close();

    var desti = (e.notification.data && e.notification.data.url) || './index.html#inicio';
    var absolut = new URL(desti, self.location.href).href;

    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (llista) {
            for (var i = 0; i < llista.length; i++) {
                var c = llista[i];
                if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
                    if ('navigate' in c) { try { c.navigate(absolut); } catch (err) { } }
                    return c.focus();
                }
            }
            if (self.clients.openWindow) return self.clients.openWindow(absolut);
        })
    );
});

/* Missatges de la pàgina. */
self.addEventListener('message', function (e) {
    var m = e.data;
    if (m === 'salta-espera') { self.skipWaiting(); return; }
    if (!m || !m.tipus) return;

    if (m.tipus === 'revisar') {
        e.waitUntil ? e.waitUntil(revisar()) : revisar();
    }
});
