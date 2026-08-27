/* =============================================================================
   Pla DRIF · Instal·lar l'app  —  mòdul compartit per index.html,
   producto3d.html i sobre-nosotros.html.

   Què fa, de dalt a baix:
     1. Registra el service worker (sw.js). Sense ell Chrome no ofereix mai la
        instal·lació i l'usuari s'ha d'empassar el menú dels tres punts.
     2. Intercepta 'beforeinstallprompt' i es guarda l'esdeveniment, que és
        l'única manera de poder llançar el diàleg natiu des d'un botó propi.
     3. Injecta tot sol dos accessos, sense tocar el HTML de cada pàgina:
          · un enllaç "Instal·la l'app" dins de la primera targeta del menú
          · una píndola discreta al final del peu de pàgina
     4. Obre una finestra amb l'escena del telèfon: la icona vola cap a la
        pantalla d'inici, hi aterra i es marca com a instal·lada.

   A l'iPhone i a l'iPad no existeix cap API d'instal·lació, així que la
   mateixa finestra mostra els passos reals de Safari en comptes del botó.

   Tot el que es veu és accessible des de window.SadrifInstalar.
   ============================================================================= */
(function (global) {
    'use strict';

    var CLAU_VIST = 'pladrif-instalar-vist';

    var promptDiferit = null;   // l'esdeveniment beforeinstallprompt guardat
    var fons = null;            // la finestra, es construeix el primer cop que s'obre
    var muntatges = [];         // els botons injectats (menú i peu)
    var estat = 'esperant';     // esperant | preparada | ios | manual | feta

    /* ---------------------------------------------------------------------
       DETECCIÓ D'ENTORN
       --------------------------------------------------------------------- */
    var ua = navigator.userAgent || '';

    function esIOS() {
        /* L'iPad modern s'identifica com un Mac; el nombre de punts de contacte
           és el que el delata. */
        return /iphone|ipad|ipod/i.test(ua) ||
               (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    }

    function jaInstalada() {
        try {
            if (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches) return true;
            if (global.matchMedia && global.matchMedia('(display-mode: fullscreen)').matches) return true;
        } catch (e) { }
        if (navigator.standalone === true) return true;                       // iOS
        if (document.referrer.indexOf('android-app://') === 0) return true;   // TWA
        return false;
    }

    function menysMoviment() {
        try { return global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
        catch (e) { return false; }
    }

    /* ---------------------------------------------------------------------
       ICONES (SVG propis, mai emojis)
       --------------------------------------------------------------------- */
    var ICONES = {
        baixar: '<svg class="instalar-fletxa" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4.5 17.5v1.5A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-1.5"/></svg>',
        mobil: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 5.5h3"/></svg>',
        llamp: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2.5 4.5 13.5H11l-.5 8L19.5 10H13z"/></svg>',
        senseXarxa: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4.5 22 20"/><path d="M5 12.5a10 10 0 0 1 3.4-2.2M2.5 8.5A15 15 0 0 1 7 5.8M17 5.8a15 15 0 0 1 4.5 2.7M15.6 10.3a10 10 0 0 1 3.4 2.2"/><path d="M8.8 16a5 5 0 0 1 6.4 0"/><path d="M12 20h.01"/></svg>',
        pantallaCompleta: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 3.5H5A1.5 1.5 0 0 0 3.5 5v3.5M15.5 3.5H19A1.5 1.5 0 0 1 20.5 5v3.5M20.5 15.5V19a1.5 1.5 0 0 1-1.5 1.5h-3.5M3.5 15.5V19A1.5 1.5 0 0 0 5 20.5h3.5"/></svg>',
        tancar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        tic: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5 10 17.5 19 7"/></svg>',
        compartir: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15.5V3.5"/><path d="M8.2 7.3 12 3.5l3.8 3.8"/><path d="M6 11H5a1.5 1.5 0 0 0-1.5 1.5V19A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-6.5A1.5 1.5 0 0 0 19 11h-1"/></svg>',
        mes: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 6v12M6 12h12"/></svg>',
        tresPunts: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>'
    };

    /* ---------------------------------------------------------------------
       SERVICE WORKER
       --------------------------------------------------------------------- */
    function registrarSW() {
        if (!('serviceWorker' in navigator)) return;
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

        global.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function (e) {
                if (global.console) console.warn('[Pla DRIF] no s’ha pogut registrar el service worker:', e);
            });
        });
    }

    /* ---------------------------------------------------------------------
       BOTONS INJECTATS
       El HTML de les tres pàgines no s'ha de tocar: es busquen els punts
       d'ancoratge i, si encara no hi són (el peu de producto3d.html el pinta
       React), s'espera que apareguin.
       --------------------------------------------------------------------- */
    function esperarElement(selector, callback) {
        var trobat = document.querySelector(selector);
        if (trobat) { callback(trobat); return; }

        var observador = new MutationObserver(function () {
            var el = document.querySelector(selector);
            if (el) { observador.disconnect(); callback(el); }
        });
        observador.observe(document.documentElement, { childList: true, subtree: true });

        /* Xarxa de seguretat: si passats 15 s no hi és, es deixa d'observar. */
        setTimeout(function () { observador.disconnect(); }, 15000);
    }

    function marcarComVist() {
        try { localStorage.setItem(CLAU_VIST, '1'); } catch (e) { }
        var distintius = document.querySelectorAll('.instalar-nou');
        for (var i = 0; i < distintius.length; i++) distintius[i].remove();
    }

    function jaVist() {
        try { return localStorage.getItem(CLAU_VIST) === '1'; } catch (e) { return false; }
    }

    function muntarBotons() {
        /* 1. Enllaç dins de la primera targeta del menú CardNav. */
        esperarElement('#card-nav-content .nav-card-links', function (contenidor) {
            if (contenidor.querySelector('.instalar-nav')) return;

            var a = document.createElement('a');
            a.className = 'nav-card-link instalar-nav';
            a.href = '#instalar';
            a.setAttribute('aria-haspopup', 'dialog');
            a.innerHTML = ICONES.baixar + ' Instal·la l’app' +
                (jaVist() ? '' : '<span class="instalar-nou">Nou</span>');
            a.addEventListener('click', function (e) { e.preventDefault(); obrir(); });

            contenidor.appendChild(a);
            registrarMuntatge(a);
        });

        /* 2. Píndola al final del peu de pàgina. */
        esperarElement('.footer-bottom', function (peu) {
            if (peu.querySelector('.instalar-peu')) return;

            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'instalar-peu';
            b.setAttribute('aria-haspopup', 'dialog');
            b.innerHTML = '<span class="instalar-peu-ico">' + ICONES.mobil + '</span>' +
                          '<span>Instal·la l’app</span>' + ICONES.baixar;
            b.addEventListener('click', function () { obrir(); });

            peu.appendChild(b);
            registrarMuntatge(b);
        });
    }

    /* Els botons neixen amagats i només es mostren quan sabem del cert que
       serveixen d'alguna cosa: mai un botó que no faci res. */
    function registrarMuntatge(el) {
        muntatges.push(el);
        el.style.display = 'none';
        refrescarVisibilitat();
    }

    function refrescarVisibilitat() {
        var visible = (estat === 'preparada' || estat === 'ios');
        for (var i = 0; i < muntatges.length; i++) {
            var el = muntatges[i];
            var eraVisible = el.style.display !== 'none';
            el.style.display = visible ? '' : 'none';
            if (visible && !eraVisible) {
                el.classList.remove('instalar-entrada');
                void el.offsetWidth;                 // reinicia l'animació d'entrada
                el.classList.add('instalar-entrada');
            }
        }
    }

    /* ---------------------------------------------------------------------
       LA FINESTRA
       --------------------------------------------------------------------- */
    function construirFinestra() {
        fons = document.createElement('div');
        fons.className = 'instalar-fons';
        fons.style.display = 'none';

        var caselles = '';
        for (var i = 0; i < 12; i++) {
            /* La setena casella és el forat reservat per al Pla DRIF. */
            caselles += (i === 6) ? '<span class="instalar-forat"></span>' : '<span></span>';
        }

        fons.innerHTML =
            '<div class="instalar-caixa" role="dialog" aria-modal="true" aria-labelledby="instalar-titol">' +
                '<button type="button" class="instalar-tancar" aria-label="Tancar">' + ICONES.tancar + '</button>' +

                '<div class="instalar-escena">' +
                    '<div class="instalar-presentacio">' +
                        '<div class="instalar-icona">' +
                            '<div class="instalar-icona-quadre">' +
                                '<img src="favicon.svg" alt="" width="76" height="76">' +
                                '<div class="instalar-halo"></div>' +
                                '<div class="instalar-tic">' + ICONES.tic + '</div>' +
                            '</div>' +
                            '<span class="instalar-icona-nom">Pla DRIF</span>' +
                        '</div>' +
                        '<p class="instalar-lema"><strong>Pla DRIF</strong>El risc del bosc, sempre a la butxaca</p>' +
                    '</div>' +
                    '<div class="instalar-telefon">' +
                        '<div class="instalar-pantalla">' +
                            '<div class="instalar-aurora"></div>' +
                            '<div class="instalar-osca"></div>' +
                            '<div class="instalar-hora">9:41</div>' +
                            '<div class="instalar-senyal"><i></i><i></i><i></i><i></i></div>' +
                            '<div class="instalar-graella">' + caselles + '</div>' +
                            '<div class="instalar-dock"></div>' +
                            '<div class="instalar-llum"></div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +

                '<div class="instalar-text">' +
                    '<p class="instalar-etiqueta">' + ICONES.mobil + ' Aplicació</p>' +
                    '<h3 class="instalar-titol" id="instalar-titol">Porta el Pla DRIF a la pantalla d’inici</h3>' +
                    '<p class="instalar-desc"></p>' +
                    '<ul class="instalar-llista">' +
                        '<li><i>' + ICONES.pantallaCompleta + '</i> S’obre com una app, sense barra del navegador</li>' +
                        '<li><i>' + ICONES.llamp + '</i> Arrenca a l’instant des de la pantalla d’inici</li>' +
                        '<li><i>' + ICONES.senseXarxa + '</i> Segueix obrint-se encara que et quedis sense connexió</li>' +
                    '</ul>' +
                    '<ol class="instalar-passos" hidden></ol>' +
                    '<div class="instalar-accions">' +
                        '<button type="button" class="instalar-cta"></button>' +
                        '<button type="button" class="instalar-secundari">Ara no</button>' +
                    '</div>' +
                    '<p class="instalar-nota"></p>' +
                '</div>' +
            '</div>';

        document.body.appendChild(fons);

        fons.querySelector('.instalar-tancar').addEventListener('click', tancar);
        fons.querySelector('.instalar-secundari').addEventListener('click', tancar);
        fons.querySelector('.instalar-cta').addEventListener('click', accionarCTA);

        /* Clic fora de la caixa: es tanca. */
        fons.addEventListener('click', function (e) { if (e.target === fons) tancar(); });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && fons && fons.classList.contains('obert')) tancar();
        });

        return fons;
    }

    /* Pinta la finestra segons on estem: Android/escriptori, iPhone o la resta. */
    function pintarContingut() {
        var desc = fons.querySelector('.instalar-desc');
        var llista = fons.querySelector('.instalar-llista');
        var passos = fons.querySelector('.instalar-passos');
        var cta = fons.querySelector('.instalar-cta');
        var secundari = fons.querySelector('.instalar-secundari');
        var nota = fons.querySelector('.instalar-nota');

        nota.textContent = '';
        cta.disabled = false;

        if (estat === 'ios' || estat === 'manual') {
            var esApple = (estat === 'ios');
            desc.textContent = esApple
                ? 'A l’iPhone i a l’iPad la instal·lació la porta el mateix sistema, no la pàgina. Són tres tocs:'
                : 'Aquest navegador no deixa obrir l’instal·lador des d’un botó, però el té al seu menú. Són tres passos:';

            llista.hidden = true;
            passos.hidden = false;
            passos.innerHTML = esApple
                ? '<li><span class="instalar-pas-ico">' + ICONES.compartir + '</span> Toca <strong>Compartir</strong>, el quadrat amb la fletxa cap amunt de la barra de baix</li>' +
                  '<li><span class="instalar-pas-ico">' + ICONES.mes + '</span> Baixa per la llista fins a <strong>Afegir a la pantalla d’inici</strong></li>' +
                  '<li><span class="instalar-pas-ico">' + ICONES.tic + '</span> Toca <strong>Afegir</strong>, a dalt a la dreta, i ja la tens entre les apps</li>'
                : '<li><span class="instalar-pas-ico">' + ICONES.tresPunts + '</span> Obre el <strong>menú del navegador</strong>, els tres punts de dalt a la dreta</li>' +
                  '<li><span class="instalar-pas-ico">' + ICONES.mes + '</span> Tria <strong>Instal·lar aplicació</strong> o <strong>Afegir a la pantalla d’inici</strong></li>' +
                  '<li><span class="instalar-pas-ico">' + ICONES.tic + '</span> Confirma amb <strong>Instal·lar</strong> i s’obrirà com una app</li>';

            cta.innerHTML = 'Entesos';
            secundari.hidden = true;
            return;
        }

        if (estat === 'feta') {
            desc.textContent = 'Ja la tens entre les teves aplicacions. Obre-la des de la pantalla d’inici i tindràs el risc en directe d’un sol toc.';
            llista.hidden = true;
            passos.hidden = true;
            cta.innerHTML = 'Fet';
            secundari.hidden = true;
            return;
        }

        desc.textContent = 'Instal·la el panell com una aplicació de veritat: ocupa uns pocs kB i sempre el tindràs a un toc.';
        llista.hidden = false;
        passos.hidden = true;
        cta.innerHTML = ICONES.baixar + ' Instal·la l’app';
        secundari.hidden = false;
    }

    function obrir() {
        marcarComVist();

        if (!fons) construirFinestra();
        if (estat === 'esperant') estat = esIOS() ? 'ios' : 'manual';

        fons.classList.remove('instalant', 'feta');
        pintarContingut();

        fons.style.display = 'grid';
        preparaVol();

        /* Es força el recàlcul d'estils abans d'afegir la classe: així la
           transició d'entrada arrenca segur. Amb requestAnimationFrame no
           n'hi hauria prou, perquè un navegador que té la pestanya amagada
           no dibuixa fotogrames i la finestra es quedaria invisible. */
        void fons.offsetWidth;
        fons.classList.add('obert');

        var cta = fons.querySelector('.instalar-cta');
        if (cta) cta.focus({ preventScroll: true });

        document.documentElement.style.overflow = 'hidden';
    }

    function tancar() {
        if (!fons) return;
        fons.classList.remove('obert');
        document.documentElement.style.overflow = '';
        setTimeout(function () {
            if (fons && !fons.classList.contains('obert')) fons.style.display = 'none';
        }, 450);
    }

    /* Calcula el trajecte exacte de la icona fins al forat de la graella.
       Es mesura en píndoles reals en comptes de posar-hi números fixos, així
       funciona igual al telèfon petit que a l'escriptori. */
    function preparaVol() {
        var icona = fons.querySelector('.instalar-icona');
        var quadre = fons.querySelector('.instalar-icona-quadre');
        var forat = fons.querySelector('.instalar-forat');
        if (!icona || !quadre || !forat) return;

        icona.style.transformOrigin = '50% ' + (quadre.offsetTop + quadre.offsetHeight / 2) + 'px';

        /* La icona està surant (puja, baixa i gira uns graus). Si es mesurés
           enmig del vol, el punt d'arribada sortiria desplaçat, així que
           s'atura l'animació el temps just de prendre les mides. */
        quadre.style.animation = 'none';
        void quadre.offsetWidth;

        var q = quadre.getBoundingClientRect();
        var f = forat.getBoundingClientRect();

        quadre.style.animation = '';

        if (!q.width || !f.width) return;

        /* Mentre la finestra encara s'està obrint, la caixa està escalada i
           les mides de pantalla no coincideixen amb les del sistema de
           coordenades on s'aplicarà el transform. Es divideix pel factor real
           perquè la icona aterri al forat tant si s'obre com si ja és oberta. */
        var factor = q.width / quadre.offsetWidth || 1;

        icona.style.setProperty('--inst-dx', (((f.left + f.width / 2) - (q.left + q.width / 2)) / factor) + 'px');
        icona.style.setProperty('--inst-dy', (((f.top + f.height / 2) - (q.top + q.height / 2)) / factor) + 'px');
        icona.style.setProperty('--inst-escala', (f.width / q.width).toFixed(3));
    }

    /* ---------------------------------------------------------------------
       ACCIÓ DEL BOTÓ PRINCIPAL
       --------------------------------------------------------------------- */
    function accionarCTA() {
        if (estat !== 'preparada' || !promptDiferit) { tancar(); return; }

        var cta = fons.querySelector('.instalar-cta');
        var nota = fons.querySelector('.instalar-nota');

        cta.disabled = true;
        cta.innerHTML = '<span class="instalar-carregant"></span> Esperant la confirmació…';

        var esdeveniment = promptDiferit;
        promptDiferit = null;                 // un beforeinstallprompt només es pot fer servir un cop

        Promise.resolve(esdeveniment.prompt()).then(function () {
            return esdeveniment.userChoice;
        }).then(function (resultat) {
            if (resultat && resultat.outcome === 'accepted') {
                animarInstalacio();
            } else {
                /* L'ha descartat: es recupera l'esdeveniment per si s'ho repensa. */
                promptDiferit = esdeveniment;
                cta.disabled = false;
                cta.innerHTML = ICONES.baixar + ' Instal·la l’app';
                nota.textContent = 'Cap problema. Ho pots fer quan vulguis des d’aquest mateix botó.';
            }
        }).catch(function () {
            promptDiferit = esdeveniment;
            estat = 'manual';
            pintarContingut();
        });
    }

    /* L'escena: la icona vola cap a la graella, hi aterra, la pantalla fa una
       escombrada de llum i apareix la marca de verificació. */
    function animarInstalacio() {
        var cta = fons.querySelector('.instalar-cta');
        var titol = fons.querySelector('.instalar-titol');
        var nota = fons.querySelector('.instalar-nota');

        preparaVol();
        fons.classList.add('instalant');

        cta.innerHTML = '<span class="instalar-carregant"></span> Instal·lant…';
        nota.textContent = '';

        var espera = menysMoviment() ? 250 : 1650;

        setTimeout(function () {
            estat = 'feta';
            fons.classList.add('feta');
            titol.textContent = 'Ja la tens a la pantalla d’inici';
            cta.disabled = false;
            cta.innerHTML = ICONES.tic + ' Fet';
            fons.querySelector('.instalar-desc').textContent =
                'Busca la icona del Pla DRIF entre les teves aplicacions: s’obre a pantalla completa i amb el risc actualitzat.';
            fons.querySelector('.instalar-llista').hidden = true;
            fons.querySelector('.instalar-secundari').hidden = true;
            refrescarVisibilitat();
        }, espera);
    }

    /* ---------------------------------------------------------------------
       AVÍS BREU QUAN EL SISTEMA CONFIRMA LA INSTAL·LACIÓ
       --------------------------------------------------------------------- */
    function avis(text) {
        var el = document.createElement('div');
        el.className = 'instalar-avis';
        el.setAttribute('role', 'status');
        el.innerHTML = ICONES.tic + '<span>' + text + '</span>';
        document.body.appendChild(el);

        void el.offsetWidth;
        el.classList.add('visible');
        setTimeout(function () {
            el.classList.remove('visible');
            setTimeout(function () { el.remove(); }, 600);
        }, 3800);
    }

    /* ---------------------------------------------------------------------
       ESDEVENIMENTS DEL NAVEGADOR
       Es registren de seguida, no pas al DOMContentLoaded: Chrome dispara
       'beforeinstallprompt' molt aviat i, si no hi ha ningú escoltant, es perd.
       --------------------------------------------------------------------- */
    global.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();                   // evita la barra que posa Chrome pel seu compte
        promptDiferit = e;
        if (estat !== 'feta') {
            estat = 'preparada';
            refrescarVisibilitat();
            if (fons && fons.classList.contains('obert')) pintarContingut();
        }
    });

    global.addEventListener('appinstalled', function () {
        estat = 'feta';
        promptDiferit = null;
        refrescarVisibilitat();
        if (!fons || !fons.classList.contains('obert')) avis('Pla DRIF instal·lat');
    });

    /* ---------------------------------------------------------------------
       ARRENCADA
       --------------------------------------------------------------------- */
    function init() {
        registrarSW();

        if (jaInstalada()) {
            /* Dins de l'app instal·lada no té cap sentit oferir instal·lar-la. */
            estat = 'feta';
            return;
        }

        /* A l'iPhone no arribarà mai cap 'beforeinstallprompt', així que el botó
           s'ensenya des del principi amb els passos de Safari. */
        if (esIOS()) estat = 'ios';

        muntarBotons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    global.SadrifInstalar = {
        obrir: obrir,
        tancar: tancar,
        estat: function () { return estat; },
        disponible: function () { return estat === 'preparada' || estat === 'ios'; },
        jaInstalada: jaInstalada
    };
})(window);
