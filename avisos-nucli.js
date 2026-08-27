/* =============================================================================
   Pla DRIF · Nucli dels avisos  —  fitxer compartit per la pàgina i el
   service worker. És l'única font de veritat de QUÈ s'avisa i, sobretot, de
   QUAN NO s'avisa.

   Es carrega dos cops i des de dos móns diferents:
     · des del navegador   ->  <script src="avisos-nucli.js">   (l'usa avisos.js)
     · des del service worker -> importScripts('avisos-nucli.js') (l'usa sw.js)

   Per això aquí dins no hi pot haver ni una sola referència a `document`:
   només dades, regles i IndexedDB, que sí que existeix als dos costats.

   LA IDEA DE FONS
   Una app de risc d'incendi que avisa massa deixa de servir per a res: a la
   tercera notificació seguida l'usuari les silencia i ja no se n'assabenta el
   dia que de debò importa. Així que el criteri no és "avisa sempre que puguis"
   sinó "avisa poc i que cada avís valgui la pena":

     · només a partir del nivell Alt (3 de 4). Moderat no desperta ningú.
     · només quan el risc PUJA de nivell, mai a cada lectura.
     · sis hores de marge entre avisos de risc; tres si és Extrem.
     · un màxim de tres avisos al dia (l'Extrem no hi compta: és l'excepció
       que justifica que la resta sigui tan restrictiva).
     · de nit no sona res que no sigui Extrem; el que quedi pendent s'entrega
       al matí, i refet amb les dades del moment, no amb les de la nit.
     · una sola recomanació al dia, i només en hores raonables.
     · de l'estació només se'n parla quan canvia d'estat: quan calla i quan
       torna. Mai "segueix desconnectada".
   ============================================================================= */
(function (global) {
    'use strict';

    var MINUT = 60000;
    var HORA = 60 * MINUT;

    /* ---------------------------------------------------------------------
       PREFERÈNCIES
       El que l'usuari pot decidir. Neixen totes a fals: cap avís s'envia fins
       que algú obre el panell i ho demana explícitament.
       --------------------------------------------------------------------- */
    var PREFS_DEFECTE = {
        actiu: false,           // interruptor general
        risc: true,             // el risc puja a Alt o Extrem
        recomanacions: true,    // un consell al dia quan el risc ho justifica
        estacio: true,          // l'estació calla o torna a parlar
        silenci: true,          // respectar l'horari de silenci
        silenciDe: 22,          // hora en què comença la nit
        silenciA: 8             // hora en què s'acaba
    };

    /* ---------------------------------------------------------------------
       POLÍTICA ANTI-SOROLL
       Tots els números que fan que això no sigui una màquina de molestar.
       --------------------------------------------------------------------- */
    var POLITICA = {
        nivellMinim: 3,                 // 3 = Alt. Per sota no s'avisa mai.
        esperaRisc: 6 * HORA,
        esperaExtrem: 3 * HORA,         // l'Extrem té dret a saltar-se l'espera normal
        esperaCalma: 12 * HORA,
        esperaRecomanacio: 20 * HORA,
        esperaEstacio: 6 * HORA,
        maximDiari: 3,                  // l'Extrem no compta en aquest límit
        minutsSenseSenyal: 180,         // 3 h sense lectura nova = estació desconnectada
        caducitatCua: 10 * HORA,        // el que espera més que això, es descarta
        finestraConsell: [9, 20]        // hores en què una recomanació té sentit
    };

    var ESTAT_DEFECTE = {
        dia: '',
        comptadorDia: 0,
        nivellPrevi: null,
        nivellAvisat: null,     // l'últim nivell pel qual s'ha avisat de debò
        desconnectada: false,
        desconnectadaDes: 0,
        darrers: {},            // marques de temps per categoria
        cua: null,              // l'avís que espera que s'acabi la nit
        benvingudaFeta: false
    };

    /* ---------------------------------------------------------------------
       UTILITATS
       --------------------------------------------------------------------- */
    function clonar(o) {
        return JSON.parse(JSON.stringify(o || {}));
    }

    function completar(base, rebut) {
        var r = clonar(base);
        if (rebut) for (var k in rebut) if (rebut.hasOwnProperty(k)) r[k] = rebut[k];
        return r;
    }

    function diaDe(ts) {
        var d = new Date(ts);
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    }

    /* L'horari de silenci travessa la mitjanit, així que la comparació no pot
       ser un simple "entre A i B". */
    function esHoraDeSilenci(prefs, ara) {
        if (!prefs.silenci) return false;
        var h = new Date(ara).getHours();
        var de = prefs.silenciDe, a = prefs.silenciA;
        if (de === a) return false;
        return (de < a) ? (h >= de && h < a) : (h >= de || h < a);
    }

    function horaCurta(ts) {
        var d = new Date(ts);
        return (d.getHours() < 10 ? '0' : '') + d.getHours() + ':' +
               (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    }

    function duradaLlarga(ms) {
        var h = Math.round(ms / HORA);
        if (h < 1) return 'menys d’una hora';
        if (h === 1) return 'una hora';
        if (h < 24) return h + ' hores';
        var d = Math.round(h / 24);
        return d === 1 ? 'un dia' : d + ' dies';
    }

    /* ---------------------------------------------------------------------
       MAGATZEM (IndexedDB)
       localStorage no existeix dins d'un service worker i la pàgina i el
       worker han de compartir exactament el mateix estat: si no, tots dos
       avisarien pel seu compte i l'usuari rebria l'avís dues vegades.
       --------------------------------------------------------------------- */
    var NOM_BD = 'pladrif-avisos';
    var MAGATZEM = 'estat';
    var bdOberta = null;

    function obrirBD() {
        if (bdOberta) return bdOberta;
        bdOberta = new Promise(function (res, rej) {
            if (!global.indexedDB) { rej(new Error('sense IndexedDB')); return; }
            var p = global.indexedDB.open(NOM_BD, 1);
            p.onupgradeneeded = function () {
                var db = p.result;
                if (!db.objectStoreNames.contains(MAGATZEM)) db.createObjectStore(MAGATZEM);
            };
            p.onsuccess = function () { res(p.result); };
            p.onerror = function () { rej(p.error); };
        }).catch(function (e) { bdOberta = null; throw e; });
        return bdOberta;
    }

    function llegirClau(clau) {
        return obrirBD().then(function (db) {
            return new Promise(function (res, rej) {
                var t = db.transaction(MAGATZEM, 'readonly').objectStore(MAGATZEM).get(clau);
                t.onsuccess = function () { res(t.result || null); };
                t.onerror = function () { rej(t.error); };
            });
        }).catch(function () { return null; });
    }

    function desarClau(clau, valor) {
        return obrirBD().then(function (db) {
            return new Promise(function (res, rej) {
                var tx = db.transaction(MAGATZEM, 'readwrite');
                tx.objectStore(MAGATZEM).put(valor, clau);
                tx.oncomplete = function () { res(valor); };
                tx.onerror = function () { rej(tx.error); };
            });
        }).catch(function () { return valor; });
    }

    function llegirPrefs() {
        return llegirClau('prefs').then(function (p) { return completar(PREFS_DEFECTE, p); });
    }

    function desarPrefs(p) {
        return desarClau('prefs', completar(PREFS_DEFECTE, p));
    }

    function llegirEstat() {
        return llegirClau('estat').then(function (e) {
            var r = completar(ESTAT_DEFECTE, e);
            if (!r.darrers) r.darrers = {};
            return r;
        });
    }

    function desarEstat(e) {
        return desarClau('estat', e);
    }

    /* ---------------------------------------------------------------------
       TEXTOS
       Cap emoji: la marca no en fa servir enlloc.
       --------------------------------------------------------------------- */
    function frase(risc, dades) {
        return risc.punts + ' de 100 · ' + Math.round(dades.temp) + ' °C, ' +
               Math.round(dades.hum) + ' % d’humitat i ' + Math.round(dades.vent) + ' km/h de vent.';
    }

    function avisDeRisc(risc, dades) {
        var extrem = (risc.idx >= 4);
        return {
            clau: extrem ? 'risc-extrem' : 'risc-alt',
            categoria: 'risc',
            to: extrem ? 'destacat' : 'normal',
            urgent: extrem,
            titol: extrem
                ? (risc.regla30 ? 'Risc extrem · regla 30-30-30' : 'Risc d’incendi extrem')
                : 'El risc d’incendi ha pujat a alt',
            cos: frase(risc, dades) +
                 (risc.regla30
                    ? ' Més de 30 °C, menys del 30 % d’humitat i vent per damunt de 30 km/h alhora: és l’escenari on un foc corre més de pressa.'
                    : ' Extrema la precaució a la zona forestal.')
        };
    }

    function avisDeCalma(risc, dades) {
        return {
            clau: 'risc-calma',
            categoria: 'risc',
            to: 'silenciós',
            urgent: false,
            titol: 'El risc ha tornat a ' + risc.nom.toLowerCase(),
            cos: frase(risc, dades) + ' Situació normalitzada a l’estació de Sabadell.'
        };
    }

    /* La recomanació es tria pel factor que més pesa a la lectura d'ara: un
       consell genèric no el llegeix ningú dues vegades. */
    function avisDeConsell(risc, dades) {
        var titol = 'Recomanació del dia', cos;

        if (risc.regla30) {
            cos = 'Es compleix la regla 30-30-30. Avui res de barbacoes, motors ni eines que facin espurna prop del bosc.';
        } else if (dades.vent > 40) {
            cos = 'Vent de ' + Math.round(dades.vent) + ' km/h. Amb aquesta ratxa una guspira viatja lluny: evita qualsevol foc a l’aire lliure i vigila les branques seques.';
        } else if (dades.hum < 25) {
            cos = 'Humitat del ' + Math.round(dades.hum) + ' %. La vegetació està molt seca i s’encén amb molt poc; no llencis res que cremi ni deixis vidres al sol.';
        } else if (dades.temp > 32) {
            cos = Math.round(dades.temp) + ' °C a l’estació. Evita les hores centrals del dia al bosc i no aparquis damunt d’herba seca: el tub d’escapament la pot encendre.';
        } else {
            cos = 'Risc ' + risc.nom.toLowerCase() + ' (' + risc.punts + '/100). Bon moment per revisar la franja de protecció i retirar el material sec de vora casa.';
        }

        return {
            clau: 'recomanacio', categoria: 'recomanacions',
            to: 'silenciós', urgent: false, titol: titol, cos: cos
        };
    }

    function avisEstacioFora(desDe, ara) {
        return {
            clau: 'estacio-fora', categoria: 'estacio',
            to: 'silenciós', urgent: false,
            titol: 'L’estació ha deixat d’enviar dades',
            cos: 'Fa ' + duradaLlarga(ara - desDe) + ' que no arriba cap lectura nova. Pot ser cobertura o bateria; el panell segueix mostrant l’última dada bona.'
        };
    }

    function avisEstacioTorna(desDe, ara, risc) {
        return {
            clau: 'estacio-torna', categoria: 'estacio',
            to: 'silenciós', urgent: false,
            titol: 'L’estació torna a estar en línia',
            cos: 'Ha estat ' + duradaLlarga(ara - desDe) + ' sense senyal. Les dades ja tornen a arribar: risc ' +
                 risc.nom.toLowerCase() + ' (' + risc.punts + '/100).'
        };
    }

    function avisDeBenvinguda(risc) {
        /* La benvinguda ja diu com està el bosc ara mateix. Així, si el risc
           ja era alt quan s'han activat els avisos, l'usuari ho sap des del
           primer segon i no cal enviar-li tot seguit una alerta del mateix. */
        var ara = risc
            ? ' Ara mateix a Sabadell el risc és ' + risc.nom.toLowerCase() + ' (' + risc.punts + '/100).'
            : '';

        return {
            clau: 'benvinguda', categoria: 'sistema',
            to: 'normal', urgent: false, sempre: true,
            titol: 'Avisos del Pla DRIF activats',
            cos: 'T’avisarem quan el risc d’incendi pugi a alt o extrem, quan torni a la normalitat i si l’estació es queda sense senyal. Res més: com a molt tres avisos al dia i cap entre les ' +
                 PREFS_DEFECTE.silenciDe + ' i les ' + PREFS_DEFECTE.silenciA + ' h.' + ara
        };
    }

    function avisDeProva(risc) {
        return {
            clau: 'prova', categoria: 'sistema',
            to: 'normal', urgent: false, sempre: true,
            titol: 'Així es veurà un avís',
            cos: risc
                ? 'Aquest és el format. Ara mateix el risc a Sabadell és ' + risc.nom.toLowerCase() + ' (' + risc.punts + '/100).'
                : 'Aquest és el format dels avisos del Pla DRIF. Els de debò només arriben quan hi ha alguna cosa a dir.'
        };
    }

    /* ---------------------------------------------------------------------
       DECISIÓ · PAS 1 — quins avisos tocarien, sense mirar cap límit
       --------------------------------------------------------------------- */
    function avaluar(prefs, e, lectura, ara) {
        var candidats = [];
        var tornaEnLinia = false;
        var dades = lectura.dades, risc = lectura.risc;
        var quan = dades.data ? new Date(dades.data).getTime() : 0;
        var fresca = quan ? ((ara - quan) / MINUT <= POLITICA.minutsSenseSenyal) : false;

        /* --- Estat de l'estació ---------------------------------------- */
        if (!fresca && !e.desconnectada) {
            e.desconnectada = true;
            e.desconnectadaDes = quan || ara;
            if (prefs.estacio) candidats.push(avisEstacioFora(e.desconnectadaDes, ara));
        } else if (fresca && e.desconnectada) {
            if (prefs.estacio) candidats.push(avisEstacioTorna(e.desconnectadaDes, ara, risc));
            e.desconnectada = false;
            e.desconnectadaDes = 0;
            tornaEnLinia = true;
        }

        /* Amb una lectura vella no es pot dir res del risc: la dada no és
           d'ara i avisar-ne seria mentir. */
        if (!fresca) return candidats;

        var previ = e.nivellPrevi;
        e.nivellPrevi = risc.idx;

        if (!prefs.risc) return candidats;

        /* --- El risc puja ----------------------------------------------
           Dues condicions alhora: que hagi pujat de nivell respecte de
           l'última mirada, i que no s'hagi avisat ja d'aquest nivell o d'un
           de pitjor. La segona és la que evita que una lectura que balla
           entre 80 i 81 punts generi un avís cada quart d'hora. */
        var haviaAvisat = e.nivellAvisat;
        var puja = (previ === null) ? false : (risc.idx > previ);
        var jaAvisat = (haviaAvisat !== null && risc.idx <= haviaAvisat);

        if (risc.idx >= POLITICA.nivellMinim && (puja || previ === null) && !jaAvisat) {
            candidats.push(avisDeRisc(risc, dades));
        }

        /* --- El risc baixa i es normalitza ------------------------------
           Si l'estació acaba de tornar en línia, aquell avís ja diu el nivell
           d'ara: dir-ho dues vegades seguides, amb dues notificacions, és
           exactament la mena de soroll que es vol evitar. */
        if (tornaEnLinia) {
            e.nivellAvisat = null;
        } else if (haviaAvisat !== null && haviaAvisat >= POLITICA.nivellMinim && risc.idx <= 1) {
            candidats.push(avisDeCalma(risc, dades));
        }

        /* Quan el risc torna per sota del llindar s'oblida el nivell avisat:
           si demà torna a pujar, torna a ser notícia. El va-i-ve el frenen les
           sis hores d'espera, no la memòria, que si no un episodi de dos dies
           s'avisaria una sola vegada el primer matí. */
        if (risc.idx < POLITICA.nivellMinim) e.nivellAvisat = null;

        /* --- Recomanació del dia ---------------------------------------- */
        if (prefs.recomanacions && risc.idx >= 2) {
            var h = new Date(ara).getHours();
            if (h >= POLITICA.finestraConsell[0] && h < POLITICA.finestraConsell[1]) {
                candidats.push(avisDeConsell(risc, dades));
            }
        }

        return candidats;
    }

    /* ---------------------------------------------------------------------
       DECISIÓ · PAS 2 — els límits
       Aquí és on la majoria de candidats moren, que és exactament la gràcia.
       --------------------------------------------------------------------- */
    function ajornar(e, ara) {
        /* Si ja n'hi havia un d'esperant, es queda el nivell més alt dels dos
           i l'hora del primer: el que s'ha d'explicar al matí és fins on va
           arribar la cosa i quan va començar. */
        if (e.cua) {
            e.cua = {
                nivell: Math.max(e.cua.nivell, e.nivellPrevi),
                des: Math.min(e.cua.des, ara)
            };
        } else {
            e.cua = { nivell: e.nivellPrevi, des: ara };
        }
    }

    function filtrar(prefs, e, candidats, ara) {
        var lliurats = [];
        var nit = esHoraDeSilenci(prefs, ara);

        for (var i = 0; i < candidats.length; i++) {
            var a = candidats[i];

            /* Els avisos de sistema (benvinguda, prova) els ha demanat
               l'usuari fa un segon: no passen per cap filtre. */
            if (a.sempre) { lliurats.push(a); continue; }

            /* Espera mínima per categoria. L'Extrem porta comptador propi a
               posta: si no en tingués, passar d'alt a extrem en la mateixa
               tarda quedaria tapat per l'espera de l'avís d'alt, que és
               precisament l'avís que menys importa dels dos. */
            var espera = POLITICA.esperaRisc;
            var clauEspera = a.categoria;

            if (a.clau === 'risc-extrem') { espera = POLITICA.esperaExtrem; clauEspera = 'extrem'; }
            else if (a.clau === 'risc-calma') { espera = POLITICA.esperaCalma; clauEspera = 'calma'; }
            else if (a.clau === 'recomanacio') { espera = POLITICA.esperaRecomanacio; clauEspera = 'recomanacio'; }
            /* Els dos avisos de l'estació porten comptador separat: "ha
               callat" i "ha tornat" són esdeveniments oposats i el segon no
               pot quedar tapat per l'espera del primer, que és justament el
               que el fa esperable. */
            else if (a.categoria === 'estacio') { espera = POLITICA.esperaEstacio; clauEspera = a.clau; }

            var darrer = e.darrers[clauEspera] || 0;
            if (ara - darrer < espera) continue;

            /* Hora de silenci: només passa l'Extrem. */
            if (nit && !a.urgent) {
                if (a.categoria === 'risc') ajornar(e, ara);
                continue;
            }

            /* Sostre diari. L'Extrem se'l salta: si el bosc està a punt de
               cremar, el comptador d'avisos és el menor dels problemes. */
            if (!a.urgent && e.comptadorDia >= POLITICA.maximDiari) {
                /* Un avís de risc que topa amb el sostre no es llença: es
                   guarda igual que el de la nit. Si no, un dia amb tres avisos
                   de matí podria acabar amagant que a la tarda el risc ha
                   pujat, que és exactament el que no pot passar mai. */
                if (a.categoria === 'risc') ajornar(e, ara);
                continue;
            }

            e.darrers[clauEspera] = ara;
            /* Un extrem també apaga l'avís d'alt: seria absurd rebre'l tot
               seguit per una cosa de la qual ja s'ha avisat pitjor. */
            if (a.clau === 'risc-extrem') e.darrers.risc = ara;
            if (!a.urgent) e.comptadorDia++;
            if (a.categoria === 'risc' && a.clau !== 'risc-calma') e.nivellAvisat = e.nivellPrevi;
            if (a.clau === 'risc-calma') e.nivellAvisat = null;

            lliurats.push(a);
        }

        return lliurats;
    }

    /* ---------------------------------------------------------------------
       LA CUA DE LA NIT
       El que s'ha retingut no es reprodueix tal qual al matí: una alerta de
       les tres de la matinada a les vuit del matí ja no és informació, és
       soroll. Es torna a mirar la lectura d'ara i s'explica què va passar.
       --------------------------------------------------------------------- */
    function drenarCua(prefs, e, lectura, ara) {
        if (!e.cua) return [];
        /* Encara és de nit, o el dia d'ahir ja anava ple: continua esperant. */
        if (esHoraDeSilenci(prefs, ara)) return [];
        if (e.comptadorDia >= POLITICA.maximDiari) return [];

        var cua = e.cua;
        e.cua = null;

        if (ara - cua.des > POLITICA.caducitatCua) return [];
        if (!prefs.risc) return [];

        var risc = lectura.risc, dades = lectura.dades;
        var nom = ['molt baix', 'baix', 'moderat', 'alt', 'extrem'][cua.nivell] || 'alt';

        /* Si encara hi som, l'avís normal ja el generarà avaluar(); aquí
           només cal explicar el que va passar mentre l'usuari dormia. */
        if (risc.idx >= cua.nivell) {
            e.nivellAvisat = risc.idx;
            e.darrers.risc = ara;
            e.comptadorDia++;
            return [{
                clau: 'resum-nit', categoria: 'risc', to: 'normal', urgent: false,
                titol: 'El risc segueix ' + risc.nom.toLowerCase(),
                cos: 'Va pujar a ' + nom + ' cap a les ' + horaCurta(cua.des) +
                     ' i encara hi és. ' + frase(risc, dades)
            }];
        }

        e.nivellAvisat = null;
        e.darrers.risc = ara;
        e.comptadorDia++;
        return [{
            clau: 'resum-nit', categoria: 'risc', to: 'silenciós', urgent: false,
            titol: 'Aquesta nit el risc va arribar a ' + nom,
            cos: 'Cap a les ' + horaCurta(cua.des) + '. Ara ja ha baixat: ' + frase(risc, dades)
        }];
    }

    /* ---------------------------------------------------------------------
       DECIDIR — l'entrada única
       --------------------------------------------------------------------- */
    function decidir(prefs, estat, lectura, ara) {
        ara = ara || Date.now();
        var e = completar(ESTAT_DEFECTE, estat);
        if (!e.darrers) e.darrers = {};

        var avui = diaDe(ara);
        if (e.dia !== avui) { e.dia = avui; e.comptadorDia = 0; }

        var delaCua = drenarCua(prefs, e, lectura, ara);
        var propis = filtrar(prefs, e, avaluar(prefs, e, lectura, ara), ara);

        /* Si la nit ja ha deixat un resum, un segon avís de risc seguit seria
           repetir-se: es queda només el resum. */
        var avisos = delaCua.concat(delaCua.length
            ? propis.filter(function (a) { return a.categoria !== 'risc'; })
            : propis);

        return { avisos: avisos, estat: e };
    }

    /* ---------------------------------------------------------------------
       MOSTRAR
       Un sol lloc decideix com es veu una notificació, de manera que la que
       envia la pàgina i la que envia el service worker són idèntiques.
       --------------------------------------------------------------------- */
    function opcions(avis) {
        var destacat = (avis.to === 'destacat');
        return {
            body: avis.cos,
            /* Una etiqueta per categoria: un avís nou substitueix el vell en
               comptes d'apilar-se. Mai s'acumula una columna de notificacions. */
            tag: 'pladrif-' + avis.categoria,
            renotify: destacat,
            icon: 'icon-192.png',
            badge: 'badge-96.png',
            lang: 'ca',
            dir: 'ltr',
            /* Silenciós de debò: ni so ni vibració per al que només és
               informatiu. Només el risc extrem es fa notar. */
            silent: (avis.to === 'silenciós'),
            requireInteraction: false,
            vibrate: destacat ? [90, 60, 90] : undefined,
            timestamp: Date.now(),
            data: { url: './index.html#inicio', clau: avis.clau, categoria: avis.categoria },
            actions: [{ action: 'obrir', title: 'Veure el panell' }]
        };
    }

    function mostrar(registre, avis) {
        if (!registre || !registre.showNotification) return Promise.resolve(false);
        return registre.showNotification(avis.titol, opcions(avis))
            .then(function () { return true; })
            .catch(function () { return false; });
    }

    /* Recorregut complet: llegeix preferències i estat, decideix, mostra i
       desa. El fan servir tant avisos.js com sw.js. */
    function processar(registre, lectura, ara) {
        if (!lectura || !lectura.risc) return Promise.resolve([]);

        return Promise.all([llegirPrefs(), llegirEstat()]).then(function (r) {
            var prefs = r[0], estat = r[1];
            if (!prefs.actiu) return [];

            var res = decidir(prefs, estat, lectura, ara);
            return desarEstat(res.estat).then(function () {
                return res.avisos.reduce(function (cadena, avis) {
                    return cadena.then(function (fets) {
                        return mostrar(registre, avis).then(function (ok) {
                            if (ok) fets.push(avis.clau);
                            return fets;
                        });
                    });
                }, Promise.resolve([]));
            });
        });
    }

    global.SadrifAvisosNucli = {
        PREFS_DEFECTE: PREFS_DEFECTE,
        POLITICA: POLITICA,
        llegirPrefs: llegirPrefs,
        desarPrefs: desarPrefs,
        llegirEstat: llegirEstat,
        desarEstat: desarEstat,
        esHoraDeSilenci: esHoraDeSilenci,
        decidir: decidir,
        opcions: opcions,
        mostrar: mostrar,
        processar: processar,
        avisDeBenvinguda: avisDeBenvinguda,
        avisDeProva: avisDeProva
    };
})(typeof self !== 'undefined' ? self : this);
