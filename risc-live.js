/* =============================================================================
   SADRIF · Risc en directe  —  mòdul compartit per index.html, producto3d.html
   i sobre-nosotros.html.

   Una sola font de veritat:
     · una sola fórmula de càlcul del risc  -> SadrifRisc.calcular()
     · una sola connexió a ThingSpeak       -> SadrifRisc.subscriure()
     · una sola píndola "Risc: XX%" al menú -> SadrifRisc.initPindola()

   IMPORTANT sobre els colors:
   el color del risc NOMÉS tenyeix la pàgina quan s'hi demana explícitament
   (initPindola({ tenyirPagina: true }), que només fa el panell principal).
   A la resta de pàgines el color viu dins de la píndola i prou, de manera que
   el verd maragda de la marca no canvia mai encara que el risc sigui alt.
   ============================================================================= */
(function (global) {
    'use strict';

    var CANAL_ID = '3411217';
    var CLAU_LECTURA = 'GYE9XC7CJSA3916';
    var INTERVAL_MS = 15000;
    var INTERVAL_EXTREMS_MS = 300000;   // mínimes i màximes: cada 5 minuts n'hi ha de sobres
    var MINUTS_OBSOLET = 30;            // a partir d'aquí, la lectura es marca com a antiga

    /* Escala oficial de nivells. Els colors són els mateixos que fa servir el
       panell principal, de manera que la píndola i el panell mai no es
       contradiuen visualment. */
    var NIVELLS = [
        { nivell: 0, nom: 'Molt Baix', color: '#10b981', bg: 'rgba(16, 185, 129, 0.08)',  border: 'rgba(16, 185, 129, 0.4)' },
        { nivell: 1, nom: 'Baix',      color: '#84cc16', bg: 'rgba(132, 204, 22, 0.08)',  border: 'rgba(132, 204, 22, 0.4)' },
        { nivell: 2, nom: 'Moderat',   color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.08)',  border: 'rgba(245, 158, 11, 0.4)' },
        { nivell: 3, nom: 'Alt',       color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)',  border: 'rgba(249, 115, 22, 0.4)' },
        { nivell: 4, nom: 'Extrem',    color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)',   border: 'rgba(239, 68, 68, 0.4)' }
    ];

    /* ---------------------------------------------------------------------
       CÀLCUL DEL RISC (0-100)
       Idèntic a tot arreu: qualsevol canvi aquí es propaga a les tres pàgines.
       --------------------------------------------------------------------- */
    function calcular(temp, hum, pres, vent) {
        temp = Number(temp) || 0;
        hum  = Number(hum)  || 0;
        pres = Number(pres) || 1013;
        vent = Number(vent) || 0;

        var ptsT = temp > 35 ? 40 : temp > 30 ? 30 : temp > 25 ? 20 : temp > 20 ? 12 : 5;
        var ptsH = hum < 15 ? 38 : hum < 25 ? 29 : hum < 40 ? 19 : hum < 55 ? 11 : 5;
        var ptsV = vent > 60 ? 20 : vent > 40 ? 15 : vent > 20 ? 10 : vent > 10 ? 6 : 3;
        // La pressió baixa aporta un lleuger increment de risc (inestabilitat atmosfèrica)
        var ptsP = pres < 1005 ? 4 : pres < 1013 ? 2 : 0;

        var punts = Math.min(ptsT + ptsH + ptsV + ptsP, 100);

        // Regla del 30-30-30: escenari d'alerta extrema
        var regla30 = (temp >= 30 && hum <= 30 && vent >= 30);

        var idx;
        if (punts <= 25) idx = 0;
        else if (punts <= 42) idx = 1;
        else if (punts <= 62) idx = 2;
        else if (punts <= 80) idx = 3;
        else idx = 4;

        if (regla30) { idx = 4; punts = 100; }

        var n = NIVELLS[idx];
        return {
            punts: punts,
            idx: idx,
            nivellNum: n.nivell,
            nom: regla30 ? 'Extrem (30-30-30)' : n.nom,
            color: n.color,
            bg: n.bg,
            border: n.border,
            regla30: regla30
        };
    }

    /* ---------------------------------------------------------------------
       DADES EN DIRECTE (ThingSpeak) — una sola connexió compartida
       --------------------------------------------------------------------- */
    var subscriptors = [];
    var temporitzador = null;
    var ultimaLectura = null;
    var demanantAra = false;
    /* El panell principal ja demana l'històric sencer a ThingSpeak per als
       gràfics i la taula. Quan ho declara, el mòdul no obre una segona
       connexió: es limita a rebre les dades que li passa la pàgina. */
    var fontExterna = false;

    function configurar(o) {
        if (o && o.fontExterna) fontExterna = true;
    }

    /* Dades que arriben de fora (les que ja ha llegit la pàgina). */
    function publicar(d) {
        if (!d) return null;
        var dades = {
            temp: Number(d.temp) || 0,
            hum:  Number(d.hum)  || 0,
            pres: Number(d.pres) || 1012,
            vent: Number(d.vent) || 0,
            data: d.data instanceof Date ? d.data : (d.data ? new Date(d.data) : new Date())
        };
        ultimaLectura = { dades: dades, risc: calcular(dades.temp, dades.hum, dades.pres, dades.vent) };
        notificar(ultimaLectura, null);
        return ultimaLectura;
    }

    function urlCanal(params) {
        return 'https://api.thingspeak.com/channels/' + CANAL_ID +
               '/feeds.json?api_key=' + CLAU_LECTURA + '&' + params;
    }

    function llegirCanal() {
        if (demanantAra) return Promise.resolve(ultimaLectura);
        demanantAra = true;
        return fetch(urlCanal('results=1'))
            .then(function (r) {
                if (!r.ok) throw new Error('ThingSpeak ha respost ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var feeds = data && data.feeds;
                if (!feeds || !feeds.length) throw new Error('Cap lectura disponible');
                var f = feeds[feeds.length - 1];
                var dades = {
                    temp: parseFloat(f.field1) || 0,
                    hum:  parseFloat(f.field2) || 0,
                    pres: parseFloat(f.field3) || 1012,
                    vent: parseFloat(f.field4) || 0,
                    data: f.created_at ? new Date(f.created_at) : null
                };
                ultimaLectura = { dades: dades, risc: calcular(dades.temp, dades.hum, dades.pres, dades.vent) };
                notificar(ultimaLectura, null);
                return ultimaLectura;
            })
            .catch(function (err) {
                console.warn('[SadrifRisc] No s\'han pogut llegir les dades:', err.message);
                notificar(ultimaLectura, err);
                return ultimaLectura;
            })
            .then(function (res) { demanantAra = false; return res; });
    }

    function notificar(payload, err) {
        for (var i = 0; i < subscriptors.length; i++) {
            try { subscriptors[i](payload, err); } catch (e) { console.error('[SadrifRisc]', e); }
        }
    }

    function arrencarBucle() {
        if (fontExterna || temporitzador !== null) return;
        llegirCanal();
        temporitzador = setInterval(function () {
            // Amb la pestanya amagada no cal gastar dades: es reprèn en tornar.
            if (!document.hidden) llegirCanal();
        }, INTERVAL_MS);
        document.addEventListener('visibilitychange', function () {
            if (!document.hidden) llegirCanal();
        });
    }

    /* Registra una funció que rebrà ({dades, risc}, error) a cada actualització.
       Retorna la funció per donar-se de baixa. */
    function subscriure(cb) {
        if (typeof cb !== 'function') return function () {};
        subscriptors.push(cb);
        if (ultimaLectura) cb(ultimaLectura, null);
        arrencarBucle();
        return function () {
            var i = subscriptors.indexOf(cb);
            if (i > -1) subscriptors.splice(i, 1);
        };
    }

    /* ---------------------------------------------------------------------
       MÍNIMES I MÀXIMES DE LES ÚLTIMES 24 HORES
       Es demanen a part i molt de tant en tant: són moltes més lectures i no
       tenen cap sentit refrescar-les cada 15 segons.
       --------------------------------------------------------------------- */
    var subsExtrems = [];
    var ultimsExtrems = null;
    var temporitzadorExtrems = null;

    function llegirExtrems() {
        return fetch(urlCanal('days=1&results=8000'))
            .then(function (r) {
                if (!r.ok) throw new Error('ThingSpeak ha respost ' + r.status);
                return r.json();
            })
            .then(function (data) {
                var feeds = (data && data.feeds) || [];
                var camps = { temp: 'field1', hum: 'field2', pres: 'field3', vent: 'field4' };
                var res = {};
                Object.keys(camps).forEach(function (clau) { res[clau] = null; });

                feeds.forEach(function (f) {
                    Object.keys(camps).forEach(function (clau) {
                        var v = parseFloat(f[camps[clau]]);
                        if (!isFinite(v)) return;
                        var quan = f.created_at ? new Date(f.created_at) : null;
                        var e = res[clau];
                        if (!e) { res[clau] = { min: v, max: v, minQuan: quan, maxQuan: quan }; return; }
                        if (v < e.min) { e.min = v; e.minQuan = quan; }
                        if (v > e.max) { e.max = v; e.maxQuan = quan; }
                    });
                });

                ultimsExtrems = { valors: res, lectures: feeds.length };
                subsExtrems.forEach(function (cb) {
                    try { cb(ultimsExtrems); } catch (e) { console.error('[SadrifRisc]', e); }
                });
                return ultimsExtrems;
            })
            .catch(function (err) {
                console.warn('[SadrifRisc] Mínimes i màximes no disponibles:', err.message);
                return ultimsExtrems;
            });
    }

    function subscriureExtrems(cb) {
        if (typeof cb !== 'function') return function () {};
        subsExtrems.push(cb);
        if (ultimsExtrems) cb(ultimsExtrems);
        if (temporitzadorExtrems === null) {
            llegirExtrems();
            temporitzadorExtrems = setInterval(function () {
                if (!document.hidden) llegirExtrems();
            }, INTERVAL_EXTREMS_MS);
        }
        return function () {
            var i = subsExtrems.indexOf(cb);
            if (i > -1) subsExtrems.splice(i, 1);
        };
    }

    /* ---------------------------------------------------------------------
       UTILITATS DE FORMAT
       --------------------------------------------------------------------- */
    function fa(data) {
        if (!data) return null;
        var min = Math.floor((Date.now() - data.getTime()) / 60000);
        if (min < 0) min = 0;
        if (min < 1) return 'ara mateix';
        if (min === 1) return 'fa 1 minut';
        if (min < 60) return 'fa ' + min + ' minuts';
        var h = Math.floor(min / 60);
        if (h === 1) return 'fa 1 hora';
        if (h < 24) return 'fa ' + h + ' hores';
        var d = Math.floor(h / 24);
        return d === 1 ? 'fa 1 dia' : 'fa ' + d + ' dies';
    }

    function esObsoleta(data) {
        if (!data) return true;
        return (Date.now() - data.getTime()) / 60000 > MINUTS_OBSOLET;
    }

    function hora(data) {
        if (!data) return '--:--';
        return data.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
    }

    /* ---------------------------------------------------------------------
       PÍNDOLA DEL MENÚ + DESPLEGABLE AMB EL DETALL
       opcions.sentinella  : selector de l'element que, mentre es vegi, manté la
                             píndola amagada (al panell és el percentatge gran).
       opcions.tenyirPagina: si és cert, el color del risc s'escriu a l'arrel del
                             document. Només l'activa el panell principal.
       --------------------------------------------------------------------- */
    var FILES = [
        { clau: 'temp', nom: 'Temperatura', unitat: '°C',   dec: 1 },
        { clau: 'hum',  nom: 'Humitat',     unitat: '%',    dec: 0 },
        { clau: 'vent', nom: 'Vent',        unitat: 'km/h', dec: 1 },
        { clau: 'pres', nom: 'Pressió',     unitat: 'hPa',  dec: 0 }
    ];

    function construirDesplegable(contenidor) {
        var pop = document.createElement('div');
        pop.className = 'risc-pop';
        pop.id = 'risc-pop';
        pop.setAttribute('role', 'region');
        pop.setAttribute('aria-label', 'Detall del risc en directe');
        pop.hidden = true;
        pop.innerHTML =
            '<div class="risc-pop__top">' +
                '<div>' +
                    '<div class="risc-pop__nivell" data-pop="nivell">--</div>' +
                    '<div class="risc-pop__sub" data-pop="subnivell">Carregant dades…</div>' +
                '</div>' +
                '<div class="risc-pop__punts"><span data-pop="punts">--</span><small>/100</small></div>' +
            '</div>' +
            '<div class="risc-pop__barra"><i data-pop="barra"></i></div>' +
            '<dl class="risc-pop__llista" data-pop="llista"></dl>' +
            '<div class="risc-pop__regla is-alerta" data-pop="regla" hidden></div>' +
            '<div class="risc-pop__peu">' +
                '<span data-pop="quan">—</span>' +
                '<span class="risc-pop__lloc">Estació SADRIF · Sabadell</span>' +
            '</div>' +
            '<a class="risc-pop__cta" href="index.html#inicio">Veure el panell complet' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M12 5l7 7-7 7"/></svg>' +
            '</a>';

        var llista = pop.querySelector('[data-pop="llista"]');
        FILES.forEach(function (f) {
            var wrap = document.createElement('div');
            wrap.className = 'risc-pop__fila';
            wrap.innerHTML = '<dt>' + f.nom + '</dt><dd data-val="' + f.clau + '">--</dd>';
            llista.appendChild(wrap);
        });

        contenidor.appendChild(pop);
        return pop;
    }

    function pintar(estat, payload) {
        var el = estat.pindola, pop = estat.pop;
        if (!payload) return;

        var risc = payload.risc, dades = payload.dades;
        var antiga = esObsoleta(dades.data);
        var color = antiga ? '#94a3b8' : risc.color;

        // El color viu dins de la píndola; només surt a l'arrel si s'ha demanat.
        el.style.setProperty('--riesgo-color-dinamico', color);
        if (estat.tenyirPagina) {
            document.documentElement.style.setProperty('--riesgo-color-dinamico', risc.color);
            document.documentElement.style.setProperty('--riesgo-bg-suave', risc.bg);
            document.documentElement.style.setProperty('--riesgo-borde', risc.border);
        }

        var valor = el.querySelector('[data-risc-valor]');
        if (valor) valor.textContent = risc.punts + '%';
        el.classList.remove('is-carregant');
        el.classList.toggle('is-obsolet', antiga);
        el.setAttribute('title', 'Risc d\'incendi actual: ' + risc.nom + ' (' + risc.punts + '%)');

        if (!pop) return;
        var q = function (sel) { return pop.querySelector(sel); };
        q('[data-pop="nivell"]').textContent = 'Risc ' + risc.nom.toLowerCase();
        q('[data-pop="nivell"]').style.color = color;
        q('[data-pop="subnivell"]').textContent = 'Nivell ' + risc.nivellNum + ' de 4';
        q('[data-pop="punts"]').textContent = risc.punts;
        q('[data-pop="punts"]').style.color = color;
        var barra = q('[data-pop="barra"]');
        barra.style.width = risc.punts + '%';
        barra.style.backgroundColor = color;

        FILES.forEach(function (f) {
            var cel = pop.querySelector('[data-val="' + f.clau + '"]');
            if (cel) cel.textContent = dades[f.clau].toFixed(f.dec) + ' ' + f.unitat;
        });

        /* L'avís de la regla del 30-30-30 només apareix quan es compleix: si no,
           no aporta res i només afegeix soroll al desplegable. */
        var regla = q('[data-pop="regla"]');
        regla.textContent = risc.regla30 ? 'Regla 30-30-30: es compleix ara mateix' : '';
        regla.hidden = !risc.regla30;

        q('[data-pop="quan"]').textContent = antiga
            ? 'Sense dades recents · última lectura ' + fa(dades.data)
            : 'Actualitzat ' + fa(dades.data);
    }

    function initPindola(opcions) {
        opcions = opcions || {};
        var el = document.getElementById(opcions.id || 'sticky-risk-badge');
        if (!el) return;

        el.classList.add('is-carregant');

        var estat = { pindola: el, pop: null, tenyirPagina: !!opcions.tenyirPagina };

        /* El desplegable no pot viure dins de `.card-nav`, que té overflow
           amagat per a l'animació d'obertura: quedaria retallat. El pengem del
           contenidor del menú, que no retalla res. */
        var amfitrio = el.closest('.card-nav-container') || el.parentElement;
        if (amfitrio && el.tagName === 'BUTTON') {
            estat.pop = construirDesplegable(amfitrio);
            /* Al panell mateix, l'enllaç "Veure el panell complet" no porta enlloc:
               ja hi som. Es treu en comptes de recarregar la pàgina. */
            if (opcions.tenyirPagina) {
                var cta = estat.pop.querySelector('.risc-pop__cta');
                if (cta) cta.remove();
            }
            connectarDesplegable(el, estat.pop);
        }

        var sentinella = opcions.sentinella ? document.querySelector(opcions.sentinella) : null;
        if (sentinella && 'IntersectionObserver' in global) {
            var obs = new IntersectionObserver(function (entrades) {
                entrades.forEach(function (e) {
                    el.classList.toggle('visible', !e.isIntersecting);
                    if (e.isIntersecting) tancar(el, estat.pop);
                });
            }, { threshold: 0.1 });
            obs.observe(sentinella);
        } else {
            el.classList.add('visible');
        }

        subscriure(function (payload) { pintar(estat, payload); });

        // El "fa X minuts" s'ha de refrescar encara que no arribin dades noves.
        setInterval(function () {
            if (!document.hidden && ultimaLectura) pintar(estat, ultimaLectura);
        }, 30000);
    }

    function obrir(btn, pop) {
        if (!pop || !pop.hidden) return;
        pop.hidden = false;
        // Un fotograma de marge perquè la transició d'entrada es vegi.
        requestAnimationFrame(function () { pop.classList.add('is-obert'); });
        btn.setAttribute('aria-expanded', 'true');
    }

    function tancar(btn, pop) {
        if (!pop || pop.hidden) return;
        pop.classList.remove('is-obert');
        btn.setAttribute('aria-expanded', 'false');
        setTimeout(function () { if (!pop.classList.contains('is-obert')) pop.hidden = true; }, 220);
    }

    function connectarDesplegable(btn, pop) {
        var potPassarRatoli = global.matchMedia && global.matchMedia('(hover: hover)').matches;
        var tancarTard = null;

        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', pop.id);

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            pop.hidden ? obrir(btn, pop) : tancar(btn, pop);
        });

        if (potPassarRatoli) {
            var entra = function () { clearTimeout(tancarTard); obrir(btn, pop); };
            var surt = function () { clearTimeout(tancarTard); tancarTard = setTimeout(function () { tancar(btn, pop); }, 260); };
            btn.addEventListener('mouseenter', entra);
            btn.addEventListener('mouseleave', surt);
            pop.addEventListener('mouseenter', entra);
            pop.addEventListener('mouseleave', surt);
        }

        btn.addEventListener('focus', function () { obrir(btn, pop); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') tancar(btn, pop); });
        document.addEventListener('click', function (e) {
            if (!pop.hidden && !pop.contains(e.target) && !btn.contains(e.target)) tancar(btn, pop);
        });
    }

    global.SadrifRisc = {
        CANAL_ID: CANAL_ID,
        CLAU_LECTURA: CLAU_LECTURA,
        NIVELLS: NIVELLS,
        calcular: calcular,
        configurar: configurar,
        publicar: publicar,
        subscriure: subscriure,
        subscriureExtrems: subscriureExtrems,
        initPindola: initPindola,
        fa: fa,
        hora: hora,
        esObsoleta: esObsoleta,
        ultima: function () { return ultimaLectura; },
        extrems: function () { return ultimsExtrems; },
        /* Una sola lectura, sense bucle ni res que toqui el DOM: és el que
           crida el service worker quan es desperta en segon pla per mirar si
           cal enviar cap avís. */
        llegirAra: llegirCanal
    };

/* Aquest mòdul viu a dos móns: dins de la pàgina, on `self` és `window`, i
   dins del service worker, que no té `window` enlloc. Per això aquí no s'hi
   pot escriure `window`: `sw.js` fa importScripts d'aquest mateix fitxer per
   calcular el risc amb la fórmula de sempre i no haver-la de duplicar mai. */
})(typeof self !== 'undefined' ? self : this);
