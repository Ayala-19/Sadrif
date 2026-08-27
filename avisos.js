/* =============================================================================
   Pla DRIF · Avisos  —  mòdul compartit per index.html, producto3d.html i
   sobre-nosotros.html.

   Aquí hi ha la part que es veu i es toca. La política de quan s'avisa i quan
   no viu tota a 'avisos-nucli.js', que també carrega el service worker: així
   la pàgina i el segon pla no poden arribar mai a conclusions diferents.

   Què fa, de dalt a baix:
     1. Injecta un accés "Avisos" dins de la targeta del menú, al costat del
        d'instal·lar. No es toca el HTML de cap pàgina.
     2. Obre un panell on l'usuari decideix què vol rebre, amb un interruptor
        general, tres categories i l'horari de silenci.
     3. Demana el permís de notificacions NOMÉS quan l'usuari prem el botó.
        Mai en carregar la pàgina: un permís demanat de cop és un permís
        denegat per sempre.
     4. Amb el permís donat, envia la benvinguda, apunta la revisió periòdica
        en segon pla i, mentre la pàgina és oberta, revisa cada pocs minuts.
     5. Un cop a la vida, i només si l'app està instal·lada o s'hi ha tornat
        unes quantes vegades, ofereix els avisos amb una targeta discreta a
        baix de tot. Si es diu que no, no es torna a preguntar.
   ============================================================================= */
(function (global) {
    'use strict';

    var TASCA = 'pladrif-revisar-risc';
    var CLAU_VISITES = 'pladrif-visites';
    var CLAU_CONVIT = 'pladrif-avisos-convidat';
    var CLAU_ESTRENA = 'pladrif-app-estrenada';

    var ESPERA_REVISIO = 5 * 60000;   // en primer pla no cal mirar-ho més sovint

    var nucli = null;                 // SadrifAvisosNucli, quan hi sigui
    var fons = null;                  // el panell, es construeix el primer cop
    var prefs = null;                 // còpia en memòria de les preferències
    var registre = null;              // el ServiceWorkerRegistration
    var ultimaRevisio = 0;
    var muntatges = [];

    /* ---------------------------------------------------------------------
       ENTORN
       --------------------------------------------------------------------- */
    var ua = navigator.userAgent || '';

    function esIOS() {
        return /iphone|ipad|ipod/i.test(ua) ||
               (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    }

    function comAApp() {
        try {
            if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) return true;
            if (global.matchMedia && global.matchMedia('(display-mode: fullscreen)').matches) return true;
        } catch (e) { }
        return navigator.standalone === true;
    }

    /* Hi ha navegador per a notificacions? A l'iPhone només existeixen si
       l'app està instal·lada a la pantalla d'inici (iOS 16.4 endavant), i
       això canvia tot el que li hem d'explicar a l'usuari. */
    function suportat() {
        return ('Notification' in global) && ('serviceWorker' in navigator);
    }

    function permis() {
        return ('Notification' in global) ? Notification.permission : 'unsupported';
    }

    function llegirLocal(clau, defecte) {
        try { var v = localStorage.getItem(clau); return v === null ? defecte : v; }
        catch (e) { return defecte; }
    }

    function desarLocal(clau, valor) {
        try { localStorage.setItem(clau, valor); } catch (e) { }
    }

    /* ---------------------------------------------------------------------
       ICONES (SVG propis, mai emojis)
       --------------------------------------------------------------------- */
    var I = {
        campana: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M13.7 19.5a2 2 0 0 1-3.4 0"/></svg>',
        campanaGran: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5"/><path d="M13.7 19.5a2 2 0 0 1-3.4 0"/></svg>',
        flama: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5s4.5 4 4.5 8a4.5 4.5 0 0 1-9 0c0-1.4.5-2.6 1.2-3.6"/><path d="M12 21.5a6 6 0 0 0 6-6c0-1.7-.8-3.3-1.8-4.6"/><path d="M12 21.5a6 6 0 0 1-6-6c0-1.3.5-2.6 1.2-3.7"/></svg>',
        consell: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 18.5h5"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-3.8 11.8c.5.4.8 1 .8 1.6v.6h6v-.6c0-.6.3-1.2.8-1.6A6.5 6.5 0 0 0 12 2.5z"/></svg>',
        antena: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"/><path d="M8.6 8.6a4.5 4.5 0 0 0 0 6.8M15.4 8.6a4.5 4.5 0 0 1 0 6.8"/><circle cx="12" cy="12" r="1.6"/></svg>',
        lluna: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/></svg>',
        escut: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 4.8 5.6v5.6c0 4.4 3 8.3 7.2 9.9 4.2-1.6 7.2-5.5 7.2-9.9V5.6z"/><path d="M9.2 12.1 11.3 14.2 15 10.4"/></svg>',
        tancar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        tic: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>',
        prohibit: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M6.2 6.2 17.8 17.8"/></svg>',
        mobil: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 5.5h3"/></svg>'
    };

    /* ---------------------------------------------------------------------
       ACCÉS AL MENÚ
       Mateix ancoratge que el botó d'instal·lar: si algun dia es toca el menú,
       només cal mantenir aquest selector.
       --------------------------------------------------------------------- */
    function esperarElement(selector, callback) {
        var trobat = document.querySelector(selector);
        if (trobat) { callback(trobat); return; }

        var observador = new MutationObserver(function () {
            var el = document.querySelector(selector);
            if (el) { observador.disconnect(); callback(el); }
        });
        observador.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(function () { observador.disconnect(); }, 15000);
    }

    function muntarAccessos() {
        esperarElement('#card-nav-content .nav-card-links', function (contenidor) {
            if (contenidor.querySelector('.avisos-nav')) return;

            var a = document.createElement('a');
            a.className = 'nav-card-link avisos-nav';
            a.href = '#avisos';
            a.setAttribute('aria-haspopup', 'dialog');
            a.innerHTML = I.campana + ' Avisos<span class="avisos-punt" hidden></span>';
            a.addEventListener('click', function (e) { e.preventDefault(); obrir(); });

            contenidor.appendChild(a);
            muntatges.push(a);
            refrescarAccessos();
        });
    }

    /* El puntet verd només hi és quan els avisos ja estan engegats: és l'única
       manera de saber-ho d'un cop d'ull sense obrir res. */
    function refrescarAccessos() {
        var actiu = !!(prefs && prefs.actiu && permis() === 'granted');
        for (var i = 0; i < muntatges.length; i++) {
            var p = muntatges[i].querySelector('.avisos-punt');
            if (p) p.hidden = !actiu;
        }
    }

    /* ---------------------------------------------------------------------
       EL PANELL
       --------------------------------------------------------------------- */
    function interruptor(clau, icona, titol, text) {
        return '<li class="avisos-opcio">' +
                   '<span class="avisos-opcio-ico">' + icona + '</span>' +
                   '<span class="avisos-opcio-txt">' +
                       '<strong>' + titol + '</strong>' +
                       '<small>' + text + '</small>' +
                   '</span>' +
                   '<button type="button" class="avisos-switch" role="switch" aria-checked="false" ' +
                           'data-pref="' + clau + '" aria-label="' + titol + '"><i></i></button>' +
               '</li>';
    }

    function construir() {
        fons = document.createElement('div');
        fons.className = 'avisos-fons';
        fons.style.display = 'none';

        fons.innerHTML =
            '<div class="avisos-caixa" role="dialog" aria-modal="true" aria-labelledby="avisos-titol">' +
                '<button type="button" class="avisos-tancar" aria-label="Tancar">' + I.tancar + '</button>' +

                '<div class="avisos-cap">' +
                    '<span class="avisos-emblema">' + I.campanaGran + '<i></i></span>' +
                    '<div>' +
                        '<h3 id="avisos-titol">Avisos del Pla DRIF</h3>' +
                        '<p>Que el telèfon et digui quan el bosc està en risc, sense convertir-se en una màquina de molestar.</p>' +
                    '</div>' +
                '</div>' +

                '<div class="avisos-estat" data-estat="apagat">' +
                    '<div class="avisos-estat-txt">' +
                        '<strong data-camp="estat-titol">Avisos desactivats</strong>' +
                        '<small data-camp="estat-text">Ara mateix no rebràs res.</small>' +
                    '</div>' +
                    '<button type="button" class="avisos-principal" data-accio="principal">Activa els avisos</button>' +
                '</div>' +

                '<div class="avisos-cos">' +
                    '<p class="avisos-seccio">Què vull que m’arribi</p>' +
                    '<ul class="avisos-llista">' +
                        interruptor('risc', I.flama, 'Risc alt o extrem',
                            'Quan el risc puja a alt (3 de 4) o a extrem. També quan torna a la normalitat.') +
                        interruptor('recomanacions', I.consell, 'Recomanació del dia',
                            'Un sol consell al dia, i només els dies en què el risc el justifica.') +
                        interruptor('estacio', I.antena, 'Estat de l’estació',
                            'Quan l’estació deixa d’enviar dades i quan torna a estar en línia.') +
                    '</ul>' +

                    '<p class="avisos-seccio">Quan no vull que soni</p>' +
                    '<ul class="avisos-llista">' +
                        '<li class="avisos-opcio">' +
                            '<span class="avisos-opcio-ico">' + I.lluna + '</span>' +
                            '<span class="avisos-opcio-txt">' +
                                '<strong>Silenci nocturn</strong>' +
                                '<small>De les <select class="avisos-hora" data-pref="silenciDe"></select> a les ' +
                                '<select class="avisos-hora" data-pref="silenciA"></select> h no sona res. ' +
                                'El que quedi pendent arriba al matí, refet amb les dades del moment. Només el risc extrem es salta l’horari.</small>' +
                            '</span>' +
                            '<button type="button" class="avisos-switch" role="switch" aria-checked="false" ' +
                                    'data-pref="silenci" aria-label="Silenci nocturn"><i></i></button>' +
                        '</li>' +
                    '</ul>' +

                    '<div class="avisos-promesa">' +
                        '<p>' + I.escut + ' El compromís</p>' +
                        '<ul>' +
                            '<li>' + I.tic + ' Com a màxim <strong>tres avisos al dia</strong>. El risc extrem és l’única excepció.</li>' +
                            '<li>' + I.tic + ' Només quan el risc <strong>canvia</strong>, mai a cada lectura.</li>' +
                            '<li>' + I.tic + ' Sis hores de marge entre avisos de risc.</li>' +
                            '<li>' + I.prohibit + ' Res de publicitat, novetats ni recordatoris per fer-te tornar.</li>' +
                            '<li>' + I.prohibit + ' Res surt del teu telèfon: no hi ha servidor ni compte enlloc.</li>' +
                        '</ul>' +
                    '</div>' +
                '</div>' +

                '<div class="avisos-peu">' +
                    '<button type="button" class="avisos-prova" data-accio="prova">Envia’m un avís de prova</button>' +
                    '<p class="avisos-nota" data-camp="nota"></p>' +
                '</div>' +
            '</div>';

        document.body.appendChild(fons);

        /* Els desplegables d'hora es fan aquí per no escriure 48 <option>. */
        var hores = fons.querySelectorAll('.avisos-hora');
        for (var i = 0; i < hores.length; i++) {
            var opcions = '';
            for (var h = 0; h < 24; h++) opcions += '<option value="' + h + '">' + (h < 10 ? '0' + h : h) + '</option>';
            hores[i].innerHTML = opcions;
            hores[i].addEventListener('change', function (e) {
                prefs[e.target.getAttribute('data-pref')] = parseInt(e.target.value, 10);
                guardar();
            });
        }

        fons.querySelector('.avisos-tancar').addEventListener('click', tancar);
        fons.addEventListener('click', function (e) { if (e.target === fons) tancar(); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && fons && fons.classList.contains('obert')) tancar();
        });

        fons.querySelector('[data-accio="principal"]').addEventListener('click', accionarPrincipal);
        fons.querySelector('[data-accio="prova"]').addEventListener('click', enviarProva);

        var switches = fons.querySelectorAll('.avisos-switch');
        for (var j = 0; j < switches.length; j++) {
            switches[j].addEventListener('click', function (e) {
                var b = e.currentTarget;
                var clau = b.getAttribute('data-pref');
                prefs[clau] = !prefs[clau];
                b.setAttribute('aria-checked', prefs[clau] ? 'true' : 'false');
                guardar();
            });
        }

        return fons;
    }

    /* Escriu a la finestra l'estat real: permís, preferències i on som. */
    function pintar() {
        if (!fons || !prefs) return;

        var caixa = fons.querySelector('.avisos-estat');
        var titol = fons.querySelector('[data-camp="estat-titol"]');
        var text = fons.querySelector('[data-camp="estat-text"]');
        var boto = fons.querySelector('[data-accio="principal"]');
        var prova = fons.querySelector('.avisos-prova');
        var nota = fons.querySelector('[data-camp="nota"]');
        var cos = fons.querySelector('.avisos-cos');

        var p = permis();
        var actiu = (p === 'granted' && prefs.actiu);

        cos.classList.toggle('is-apagat', !actiu);
        prova.hidden = !actiu;
        nota.textContent = '';
        boto.disabled = false;

        /* Els interruptors es pinten sempre, també quan els avisos no es poden
           activar: apagats i sense poder-los tocar, però ensenyant els valors
           de debò. Si es deixessin en blanc, l'horari de silenci es llegiria
           "de les 00 a les 00 h", que no és el que passarà. */
        var switches = fons.querySelectorAll('.avisos-switch');
        for (var i = 0; i < switches.length; i++) {
            var clau = switches[i].getAttribute('data-pref');
            switches[i].setAttribute('aria-checked', prefs[clau] ? 'true' : 'false');
            switches[i].disabled = !actiu;
        }

        var hores = fons.querySelectorAll('.avisos-hora');
        for (var j = 0; j < hores.length; j++) {
            hores[j].value = String(prefs[hores[j].getAttribute('data-pref')]);
            hores[j].disabled = !actiu || !prefs.silenci;
        }

        refrescarAccessos();

        if (!suportat()) {
            caixa.setAttribute('data-estat', 'impossible');
            titol.textContent = esIOS() ? 'Cal instal·lar l’app abans' : 'Aquest navegador no pot enviar avisos';
            text.textContent = esIOS()
                ? 'A l’iPhone i a l’iPad els avisos només existeixen si el Pla DRIF és a la pantalla d’inici. Instal·la’l primer i torna a entrar des de la icona.'
                : 'Prova-ho amb Chrome, Edge o Firefox, o des del telèfon amb l’app instal·lada.';
            boto.textContent = esIOS() ? 'Com s’instal·la' : 'Entesos';
            return;
        }

        if (p === 'denied') {
            caixa.setAttribute('data-estat', 'blocat');
            titol.textContent = 'Avisos bloquejats pel navegador';
            text.textContent = 'En algun moment s’ha dit que no. S’ha de tornar a permetre des del cadenat de la barra d’adreces, a “Notificacions”.';
            boto.textContent = 'Entesos';
            return;
        }

        if (actiu) {
            caixa.setAttribute('data-estat', 'ences');
            titol.textContent = 'Avisos actius';
            text.textContent = 'Rebràs el que hagis marcat aquí sota, i res més.';
            boto.textContent = 'Desactiva’ls';
        } else {
            caixa.setAttribute('data-estat', 'apagat');
            titol.textContent = 'Avisos desactivats';
            text.textContent = 'Ara mateix no rebràs res. Ho pots engegar i apagar quan vulguis.';
            boto.textContent = 'Activa els avisos';
        }
    }

    function guardar() {
        if (!nucli || !prefs) return Promise.resolve();
        return nucli.desarPrefs(prefs).then(function () { pintar(); });
    }

    function obrir() {
        if (!fons) construir();
        carregarPrefs().then(function () {
            pintar();
            fons.style.display = 'grid';
            void fons.offsetWidth;
            fons.classList.add('obert');
            document.documentElement.style.overflow = 'hidden';
            var b = fons.querySelector('[data-accio="principal"]');
            if (b) b.focus({ preventScroll: true });
        });
    }

    function tancar() {
        if (!fons) return;
        fons.classList.remove('obert');
        document.documentElement.style.overflow = '';
        setTimeout(function () {
            if (fons && !fons.classList.contains('obert')) fons.style.display = 'none';
        }, 420);
    }

    /* ---------------------------------------------------------------------
       ENGEGAR I APAGAR
       --------------------------------------------------------------------- */
    function accionarPrincipal() {
        var boto = fons.querySelector('[data-accio="principal"]');
        var nota = fons.querySelector('[data-camp="nota"]');

        if (!suportat()) {
            tancar();
            if (esIOS() && global.SadrifInstalar) global.SadrifInstalar.obrir();
            return;
        }
        if (permis() === 'denied') { tancar(); return; }

        if (prefs.actiu && permis() === 'granted') {
            prefs.actiu = false;
            aturarTascaPeriodica();
            guardar();
            return;
        }

        boto.disabled = true;
        boto.textContent = 'Esperant el permís…';

        demanarPermis().then(function (resultat) {
            if (resultat !== 'granted') {
                boto.disabled = false;
                nota.textContent = (resultat === 'denied')
                    ? 'El navegador ho ha bloquejat. Es pot tornar a permetre des del cadenat de la barra d’adreces.'
                    : 'Cap problema: ho pots activar quan vulguis des d’aquí mateix.';
                pintar();
                return;
            }

            prefs.actiu = true;
            return guardar()
                .then(sembrarEstat)
                .then(activarTascaPeriodica)
                .then(benvinguda)
                .then(function () {
                    nota.textContent = 'Fet. T’acabem d’enviar un avís perquè vegis com es veuen.';
                    pintar();
                });
        });
    }

    /* Notification.requestPermission té dues formes segons el navegador: la
       moderna torna una promesa i la vella només crida una funció quan
       l'usuari respon. S'accepten totes dues i es resol amb la primera que
       contesti, que és l'única manera que Safari antic no es quedi penjat
       dient que l'usuari no ha respost quan sí que ho ha fet. */
    function demanarPermis() {
        return new Promise(function (res) {
            var resolt = false;
            function acaba(p) {
                if (resolt) return;
                resolt = true;
                res(p || Notification.permission);
            }
            try {
                var r = Notification.requestPermission(acaba);
                if (r && r.then) r.then(acaba, function () { acaba(null); });
            } catch (e) { acaba(null); }
        });
    }

    /* El registre del service worker pot no haver arribat encara quan l'usuari
       prem el botó. Sense ell no es pot ensenyar cap notificació, així que
       s'espera en comptes de perdre-la. */
    function ambRegistre() {
        if (registre) return Promise.resolve(registre);
        if (!('serviceWorker' in navigator)) return Promise.resolve(null);
        return navigator.serviceWorker.ready.then(function (reg) {
            registre = reg;
            return reg;
        }).catch(function () { return null; });
    }

    /* En engegar-ho s'apunta el nivell d'ara com a "ja conegut": si el risc
       ja era alt, la benvinguda ja ho diu i seria absurd enviar tot seguit una
       alerta del mateix. A partir d'aquí només s'avisa del que canviï. */
    function sembrarEstat() {
        if (!nucli) return Promise.resolve();
        var lectura = global.SadrifRisc && global.SadrifRisc.ultima();
        return nucli.llegirEstat().then(function (e) {
            if (lectura && lectura.risc) {
                e.nivellPrevi = lectura.risc.idx;
                e.nivellAvisat = (lectura.risc.idx >= nucli.POLITICA.nivellMinim) ? lectura.risc.idx : null;
            }
            e.cua = null;
            return nucli.desarEstat(e);
        });
    }

    function benvinguda() {
        if (!nucli) return Promise.resolve();
        return ambRegistre().then(function (reg) {
            if (!reg) return null;
            return nucli.llegirEstat().then(function (e) {
                var lectura = global.SadrifRisc && global.SadrifRisc.ultima();
                var avis = nucli.avisDeBenvinguda(lectura && lectura.risc);
                e.benvingudaFeta = true;
                return nucli.desarEstat(e).then(function () { return nucli.mostrar(reg, avis); });
            });
        });
    }

    function enviarProva() {
        if (!nucli) return;
        var nota = fons.querySelector('[data-camp="nota"]');
        ambRegistre().then(function (reg) {
            if (!reg) return;
            var lectura = global.SadrifRisc && global.SadrifRisc.ultima();
            return nucli.mostrar(reg, nucli.avisDeProva(lectura && lectura.risc));
        }).then(function () {
            if (nota) nota.textContent = 'Enviat. Si no el veus, mira els avisos del sistema per al Pla DRIF.';
        });
    }

    /* ---------------------------------------------------------------------
       REVISIÓ EN SEGON PLA
       Chrome desperta el service worker de tant en tant si l'app està
       instal·lada i s'hi entra sovint. És l'únic mecanisme que hi ha sense
       servidor propi; quan no existeix, la revisió es fa en obrir la pàgina.
       --------------------------------------------------------------------- */
    function activarTascaPeriodica() {
        return ambRegistre().then(function (reg) {
            if (!reg || !reg.periodicSync || !navigator.permissions) return null;
            return navigator.permissions.query({ name: 'periodic-background-sync' })
                .then(function (estat) {
                    if (estat.state !== 'granted') return null;
                    return reg.periodicSync.register(TASCA, { minInterval: 3 * 60 * 60 * 1000 });
                });
        }).catch(function () { return null; });
    }

    function aturarTascaPeriodica() {
        if (!registre || !registre.periodicSync) return Promise.resolve();
        return registre.periodicSync.unregister(TASCA).catch(function () { });
    }

    /* Revisió mentre la pàgina és oberta. Va lligada a les dades que ja
       baixa risc-live.js, així que no obre cap connexió nova. */
    function revisarSiToca(lectura) {
        if (!nucli || !registre || !lectura || !prefs || !prefs.actiu) return;
        if (permis() !== 'granted') return;
        var ara = Date.now();
        if (ara - ultimaRevisio < ESPERA_REVISIO) return;
        ultimaRevisio = ara;
        nucli.processar(registre, lectura);
    }

    /* ---------------------------------------------------------------------
       LA INVITACIÓ
       Una sola vegada a la vida, i mai de cop en obrir la pàgina.
       --------------------------------------------------------------------- */
    function tocaConvidar() {
        if (!suportat() || permis() !== 'default') return false;
        if (llegirLocal(CLAU_CONVIT, '') !== '') return false;

        /* Amb l'app instal·lada s'ofereix de seguida: és el moment en què
           l'usuari ha dit més clarament que això li interessa. */
        if (comAApp()) return true;

        var visites = parseInt(llegirLocal(CLAU_VISITES, '0'), 10) || 0;
        return visites >= 3;
    }

    function convidar() {
        var t = document.createElement('div');
        t.className = 'avisos-convit';
        t.setAttribute('role', 'dialog');
        t.setAttribute('aria-label', 'Activar els avisos');
        t.innerHTML =
            '<span class="avisos-convit-ico">' + I.campana + '</span>' +
            '<div class="avisos-convit-txt">' +
                '<strong>Vols que t’avisi si el risc puja?</strong>' +
                '<small>Només quan passa a alt o extrem. Com a molt tres avisos al dia i cap de matinada.</small>' +
            '</div>' +
            '<div class="avisos-convit-botons">' +
                '<button type="button" data-si>Activa</button>' +
                '<button type="button" data-no>Ara no</button>' +
            '</div>';

        document.body.appendChild(t);
        void t.offsetWidth;
        t.classList.add('visible');

        function fora() {
            t.classList.remove('visible');
            setTimeout(function () { t.remove(); }, 500);
        }

        t.querySelector('[data-no]').addEventListener('click', function () {
            desarLocal(CLAU_CONVIT, 'no');
            fora();
        });
        t.querySelector('[data-si]').addEventListener('click', function () {
            desarLocal(CLAU_CONVIT, 'si');
            fora();
            obrir();
            setTimeout(accionarPrincipal, 380);
        });

        /* Si no es toca, marxa sola i no torna. */
        setTimeout(function () {
            if (document.body.contains(t)) { desarLocal(CLAU_CONVIT, 'ignorat'); fora(); }
        }, 16000);
    }

    /* ---------------------------------------------------------------------
       ARRENCADA
       --------------------------------------------------------------------- */
    function carregarPrefs() {
        if (!nucli) { prefs = {}; return Promise.resolve(prefs); }
        return nucli.llegirPrefs().then(function (p) { prefs = p; return p; });
    }

    function init() {
        nucli = global.SadrifAvisosNucli || null;
        if (!nucli) return;

        /* Comptador de visites, per no oferir res a qui només passa de llarg. */
        var v = (parseInt(llegirLocal(CLAU_VISITES, '0'), 10) || 0) + 1;
        desarLocal(CLAU_VISITES, String(v));

        muntarAccessos();

        carregarPrefs().then(function () {
            refrescarAccessos();

            if (!('serviceWorker' in navigator)) return;
            return navigator.serviceWorker.ready.then(function (reg) {
                registre = reg;

                if (prefs.actiu && permis() === 'granted') {
                    activarTascaPeriodica();

                    /* Una revisió en obrir: si el risc ha pujat amb l'app
                       tancada i el segon pla no s'ha arribat a despertar,
                       aquest és el moment d'assabentar-se'n. */
                    setTimeout(function () {
                        var l = global.SadrifRisc && global.SadrifRisc.ultima();
                        if (l) { ultimaRevisio = 0; revisarSiToca(l); }
                    }, 6000);
                }
            });
        });

        if (global.SadrifRisc) {
            global.SadrifRisc.subscriure(function (lectura) { revisarSiToca(lectura); });
        }

        /* La invitació espera que la pàgina estigui quieta: aparèixer damunt
           d'una pantalla que encara s'està pintant és exactament el que fa
           que la gent tanqui aquestes coses sense llegir-les. */
        if (tocaConvidar()) setTimeout(convidar, comAApp() ? 3200 : 9000);

        /* Primera obertura com a app instal·lada: si els avisos ja hi són,
           es dona la benvinguda; si no, la invitació ja s'encarrega. */
        if (comAApp() && llegirLocal(CLAU_ESTRENA, '') === '') {
            desarLocal(CLAU_ESTRENA, String(Date.now()));
            setTimeout(function () {
                if (prefs && prefs.actiu && permis() === 'granted') {
                    nucli.llegirEstat().then(function (e) {
                        if (!e.benvingudaFeta) benvinguda();
                    });
                }
            }, 4000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.SadrifAvisos = {
        obrir: obrir,
        tancar: tancar,
        actius: function () { return !!(prefs && prefs.actiu && permis() === 'granted'); },
        suportat: suportat,
        permis: permis
    };
})(window);
