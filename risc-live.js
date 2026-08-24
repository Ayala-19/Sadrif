/* =============================================================================
   SADRIF · Risc en directe  —  mòdul compartit per index.html, producto3d.html
   i sobre-nosotros.html.

   Una sola font de veritat:
     · una sola fórmula de càlcul del risc  -> SadrifRisc.calcular()
     · una sola connexió a ThingSpeak       -> SadrifRisc.subscriure()
     · una sola píndola "Risc: XX%" al menú -> SadrifRisc.initPindola()

   Així totes les pàgines mostren exactament el mateix percentatge, el mateix
   color i el mateix nivell, i s'actualitzen alhora.
   ============================================================================= */
(function (global) {
    'use strict';

    var CANAL_ID = '3411217';
    var CLAU_LECTURA = 'GYE9XC7CJSA3916';
    var INTERVAL_MS = 15000;

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

    function llegirCanal() {
        if (demanantAra) return Promise.resolve(ultimaLectura);
        demanantAra = true;
        var url = 'https://api.thingspeak.com/channels/' + CANAL_ID +
                  '/feeds.json?api_key=' + CLAU_LECTURA + '&results=1';
        return fetch(url)
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
        if (temporitzador !== null) return;
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
       PÍNDOLA "Risc: XX%" DEL MENÚ
       opcions.sentinella : selector de l'element que, mentre es vegi, manté la
                            píndola amagada (al panell és el percentatge gran).
                            Si no s'indica, la píndola es veu sempre.
       --------------------------------------------------------------------- */
    function pintarPindola(el, payload) {
        if (!el || !payload) return;
        var valor = el.querySelector('[data-risc-valor]') || document.getElementById('sticky-risk-val');
        if (valor) valor.textContent = payload.risc.punts + '%';
        document.documentElement.style.setProperty('--riesgo-color-dinamico', payload.risc.color);
        document.documentElement.style.setProperty('--riesgo-bg-suave', payload.risc.bg);
        document.documentElement.style.setProperty('--riesgo-borde', payload.risc.border);
        el.setAttribute('title', 'Risc d\'incendi actual: ' + payload.risc.nom +
            ' (' + payload.risc.punts + '%) · Estació SADRIF, Sabadell');
        el.classList.remove('is-carregant');
    }

    function initPindola(opcions) {
        opcions = opcions || {};
        var el = document.getElementById(opcions.id || 'sticky-risk-badge');
        if (!el) return;

        el.classList.add('is-carregant');

        var sentinella = opcions.sentinella ? document.querySelector(opcions.sentinella) : null;
        if (sentinella && 'IntersectionObserver' in global) {
            var obs = new IntersectionObserver(function (entrades) {
                entrades.forEach(function (e) {
                    el.classList.toggle('visible', !e.isIntersecting);
                });
            }, { threshold: 0.1 });
            obs.observe(sentinella);
        } else {
            el.classList.add('visible');
        }

        subscriure(function (payload) { pintarPindola(el, payload); });
    }

    global.SadrifRisc = {
        CANAL_ID: CANAL_ID,
        CLAU_LECTURA: CLAU_LECTURA,
        NIVELLS: NIVELLS,
        calcular: calcular,
        subscriure: subscriure,
        initPindola: initPindola,
        ultima: function () { return ultimaLectura; }
    };
})(window);
