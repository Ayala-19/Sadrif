function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
  useLayoutEffect,
  forwardRef
} = React;
const {
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform
} = window.Motion;

/* Alguns sistemes operatius tenen activada l'opció "reduir el moviment"
   (per marejos, migranyes o epilèpsia fotosensible). Només en aquest cas
   aturem el que es mou tot sol; per a la resta de visitants la web
   conserva totes les animacions. */
const MENYS_MOVIMENT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/* =========================================================
   SISTEMA D'ICONES SVG (substitueix qualsevol emoji)
   Mateix traç i mateixa quadrícula que a producto3d.html.
   ========================================================= */
const ICON_PATHS = {
  flame: /*#__PURE__*/React.createElement("path", {
    d: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4.1 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3a2.5 2.5 0 0 0 2.5 2.5z"
  }),
  radio: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.25a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"
  })),
  thermometer: /*#__PURE__*/React.createElement("path", {
    d: "M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4.5 4.5 0 1 0 5 0z"
  }),
  droplet: /*#__PURE__*/React.createElement("path", {
    d: "M12 2.7l5.66 5.65a8 8 0 1 1-11.31 0z"
  }),
  wind: /*#__PURE__*/React.createElement("path", {
    d: "M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"
  }),
  gauge: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 12l4.2-3.2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 3v1.6M21 12h-1.6M3 12h1.6"
  })),
  alert: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9v4.5M12 17.5h.01"
  })),
  check: /*#__PURE__*/React.createElement("polyline", {
    points: "20 6.5 9.5 17.5 4 12"
  }),
  circleEmpty: /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "7.5"
  }),
  reset: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3.5 12a8.5 8.5 0 1 0 2.6-6.1"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3.5 4 3.5 9 8.5 9"
  })),
  mail: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "5",
    width: "19",
    height: "14",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 7l9 6 9-6"
  }))
};
const Icon = ({
  name,
  size = 20,
  stroke = 1.75,
  className = '',
  style
}) => {
  const content = ICON_PATHS[name];
  if (!content) return null;
  return /*#__PURE__*/React.createElement("svg", {
    className: cn('ico', className),
    style: style,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: stroke,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
  }, content);
};

/* ===== RotatingText (idèntic a producto3d.html) ===== */
const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    transition = {
      type: 'spring',
      damping: 25,
      stiffness: 300
    },
    initial = {
      y: '100%',
      opacity: 0
    },
    animate = {
      y: 0,
      opacity: 1
    },
    exit = {
      y: '-120%',
      opacity: 0
    },
    animatePresenceMode = 'wait',
    animatePresenceInitial = false,
    rotationInterval = 2500,
    staggerDuration = 0.02,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const splitIntoCharacters = text => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('ca', {
        granularity: 'grapheme'
      });
      return Array.from(segmenter.segment(text), s => s.segment);
    }
    return Array.from(text);
  };
  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex];
    if (splitBy === 'characters') {
      const words = currentText.split(' ');
      return words.map((word, i) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }));
    }
    return currentText.split(splitBy).map((part, i, arr) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }));
  }, [texts, currentTextIndex, splitBy]);
  const getStaggerDelay = useCallback((index, totalChars) => {
    if (staggerFrom === 'first') return index * staggerDuration;
    if (staggerFrom === 'last') return (totalChars - 1 - index) * staggerDuration;
    return index * staggerDuration;
  }, [staggerFrom, staggerDuration]);
  const next = useCallback(() => {
    setCurrentTextIndex(prev => prev === texts.length - 1 ? loop ? 0 : prev : prev + 1);
  }, [texts.length, loop]);
  React.useEffect(() => {
    if (!auto) return;
    const id = setInterval(next, rotationInterval);
    return () => clearInterval(id);
  }, [next, rotationInterval, auto]);
  return /*#__PURE__*/React.createElement(motion.span, _extends({
    className: cn('text-rotate', mainClassName)
  }, rest, {
    layout: true,
    transition: transition
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-rotate-sr-only"
  }, texts[currentTextIndex]), /*#__PURE__*/React.createElement(window.Motion.AnimatePresence, {
    mode: animatePresenceMode,
    initial: animatePresenceInitial
  }, /*#__PURE__*/React.createElement(motion.span, {
    key: currentTextIndex,
    className: "text-rotate",
    layout: true,
    "aria-hidden": "true"
  }, elements.map((wordObj, wordIndex, array) => {
    const previousCharsCount = array.slice(0, wordIndex).reduce((sum, word) => sum + word.characters.length, 0);
    return /*#__PURE__*/React.createElement("span", {
      key: wordIndex,
      className: cn('text-rotate-word', splitLevelClassName)
    }, wordObj.characters.map((char, charIndex) => /*#__PURE__*/React.createElement(motion.span, {
      key: charIndex,
      initial: initial,
      animate: animate,
      exit: exit,
      transition: {
        ...transition,
        delay: getStaggerDelay(previousCharsCount + charIndex, array.reduce((sum, word) => sum + word.characters.length, 0))
      },
      className: cn('text-rotate-element', elementLevelClassName)
    }, char)), wordObj.needsSpace && /*#__PURE__*/React.createElement("span", {
      className: "text-rotate-space"
    }, " "));
  }))));
});

/* ===== Hero rotate ===== */
function HeroRotate() {
  const words = ['un Treball de Recerca', 'un projecte de 4 estudiants', 'una eina de prevenció real', 'tecnologia per al nostre bosc'];
  return /*#__PURE__*/React.createElement(RotatingText, {
    texts: words,
    auto: !MENYS_MOVIMENT,
    mainClassName: "rotate-pill",
    staggerFrom: "first",
    initial: {
      y: '100%',
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1
    },
    exit: {
      y: '-120%',
      opacity: 0
    },
    staggerDuration: 0.02,
    splitLevelClassName: "overflow-hidden pb-1",
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 350
    },
    rotationInterval: 2800
  });
}

/* ===== Problema vs Resposta ===== */
function ContrastCards() {
  const cards = [{
    mod: 'problema',
    tag: 'El problema',
    icon: 'flame',
    title: 'Quan es veu el foc, ja és tard',
    text: "Moltes vegades, quan un incendi es detecta visualment ja s'ha propagat massa ràpid per poder-lo controlar amb facilitat. La resposta arriba després que el foc s'hagi originat."
  }, {
    mod: 'resposta',
    tag: 'La nostra resposta',
    icon: 'radio',
    title: 'Vigilar les condicions, no les flames',
    text: "SADRIF (Sistema Autònom de Detecció de Risc d'Incendis Forestals) monitoritza les condicions ambientals del bosc en temps real i avisa del risc abans que l'incendi arribi a originar-se."
  }];
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15
      }
    }
  };
  const item = {
    hidden: {
      opacity: 0,
      y: 30
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };
  return /*#__PURE__*/React.createElement(motion.div, {
    className: "contrast-grid",
    variants: container,
    initial: "hidden",
    whileInView: "show",
    viewport: {
      once: true,
      amount: 0.3
    }
  }, cards.map((c, i) => /*#__PURE__*/React.createElement(motion.div, {
    className: `contrast-card contrast-card--${c.mod}`,
    variants: item,
    key: i,
    whileHover: {
      y: -6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "contrast-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: c.icon,
    size: 26
  })), /*#__PURE__*/React.createElement("span", {
    className: "contrast-tag"
  }, c.tag), /*#__PURE__*/React.createElement("h3", null, c.title), /*#__PURE__*/React.createElement("p", null, c.text))));
}

/* =========================================================
   ELASTIC SLIDER — adaptació del component de React Bits
   https://reactbits.dev/components/elastic-slider  (MIT)
    Comportament original: la barra creix en apropar-s'hi i, si
   s'arrossega més enllà d'un extrem, s'estira amb resistència
   (funció `decay`, una sigmoide que satura a MAX_OVERFLOW) i
   torna al seu lloc amb un rebot de molla.
    Adaptacions pròpies:
     · un sol valor de desbordament amb signe, en comptes de
       l'estat 'left' | 'right' + valor absolut;
     · control accessible amb teclat (role="slider", fletxes,
       Inici/Fi), que el component original no porta;
     · `touch-action: pan-y`, perquè a mòbil lliscar amunt i avall
       continuï desplaçant la pàgina.
   Tot és càlcul local: no carrega ni executa res de fora.
   ========================================================= */
const MAX_OVERFLOW = 50;

/* Resistència elàstica: com més s'estira, menys cedeix. */
function decay(value, max) {
  if (max === 0) return 0;
  const entry = value / max;
  const sigmoid = 2 * (1 / (1 + Math.exp(-entry)) - 0.5);
  return sigmoid * max;
}
function ElasticSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  color = 'var(--accent)',
  label,
  leftIcon = null,
  rightIcon = null
}) {
  const rootRef = useRef(null);
  /* Desbordament amb signe: negatiu = s'estira per l'esquerra. */
  const overflow = useMotionValue(0);
  const scale = useMotionValue(1);
  const [actiu, setActiu] = useState(false);
  const valorDesDeX = useCallback(px => {
    const el = rootRef.current;
    if (!el) return value;
    const {
      left,
      width
    } = el.getBoundingClientRect();
    if (!width) return value;
    let v = min + (px - left) / width * (max - min);
    v = Math.round(v / step) * step;
    return Math.min(Math.max(v, min), max);
  }, [min, max, step, value]);
  const aplicaDesbordament = useCallback(px => {
    const el = rootRef.current;
    if (!el) return;
    const {
      left,
      right
    } = el.getBoundingClientRect();
    let d = 0;
    if (px < left) d = -decay(left - px, MAX_OVERFLOW);else if (px > right) d = decay(px - right, MAX_OVERFLOW);
    overflow.jump(d);
  }, [overflow]);
  const onPointerMove = e => {
    if (e.buttons > 0) {
      onChange(valorDesDeX(e.clientX));
      aplicaDesbordament(e.clientX);
    }
  };
  const onPointerDown = e => {
    setActiu(true);
    animate(scale, 1.2, {
      duration: 0.18
    });
    onChange(valorDesDeX(e.clientX));
    aplicaDesbordament(e.clientX);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const deixarAnar = () => {
    setActiu(false);
    animate(overflow, 0, {
      type: 'spring',
      bounce: 0.5
    });
    animate(scale, 1, {
      duration: 0.25
    });
  };
  const onKeyDown = e => {
    const gran = (max - min) / 10;
    let nou = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') nou = value - step;else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') nou = value + step;else if (e.key === 'PageDown') nou = value - gran;else if (e.key === 'PageUp') nou = value + gran;else if (e.key === 'Home') nou = min;else if (e.key === 'End') nou = max;
    if (nou === null) return;
    e.preventDefault();
    onChange(Math.min(Math.max(Math.round(nou / step) * step, min), max));
  };

  /* Transformacions derivades (cap re-render de React) */
  const opacitat = useTransform(scale, [1, 1.2], [0.75, 1]);
  const alcada = useTransform(scale, [1, 1.2], [8, 14]);
  const marge = useTransform(scale, [1, 1.2], [0, -3]);
  const escalaX = useTransform(overflow, o => {
    const el = rootRef.current;
    const w = el ? el.getBoundingClientRect().width : 0;
    return w ? 1 + Math.abs(o) / w : 1;
  });
  const escalaY = useTransform(overflow, o => 1 - 0.2 * Math.min(Math.abs(o) / MAX_OVERFLOW, 1));
  const origen = useTransform(overflow, o => o < 0 ? 'right' : 'left');
  const xEsquerra = useTransform([overflow, scale], ([o, s]) => o < 0 ? o / s : 0);
  const xDreta = useTransform([overflow, scale], ([o, s]) => o > 0 ? o / s : 0);
  const pct = max === min ? 0 : (value - min) / (max - min) * 100;
  return /*#__PURE__*/React.createElement(motion.div, {
    className: "elastic-slider",
    onHoverStart: () => animate(scale, 1.2, {
      duration: 0.18
    }),
    onHoverEnd: () => {
      if (!actiu) animate(scale, 1, {
        duration: 0.25
      });
    },
    style: {
      opacity: opacitat
    }
  }, /*#__PURE__*/React.createElement(motion.span, {
    className: "elastic-slider__icon",
    style: {
      x: xEsquerra
    },
    "aria-hidden": "true"
  }, leftIcon), /*#__PURE__*/React.createElement("div", {
    ref: rootRef,
    className: "elastic-slider__root",
    role: "slider",
    tabIndex: 0,
    "aria-label": label,
    "aria-valuemin": min,
    "aria-valuemax": max,
    "aria-valuenow": value,
    onKeyDown: onKeyDown,
    onPointerDown: onPointerDown,
    onPointerMove: onPointerMove,
    onPointerUp: deixarAnar,
    onPointerCancel: deixarAnar,
    onLostPointerCapture: deixarAnar,
    onFocus: () => animate(scale, 1.2, {
      duration: 0.18
    }),
    onBlur: () => animate(scale, 1, {
      duration: 0.25
    })
  }, /*#__PURE__*/React.createElement(motion.div, {
    className: "elastic-slider__track-wrapper",
    style: {
      scaleX: escalaX,
      scaleY: escalaY,
      transformOrigin: origen,
      height: alcada,
      marginTop: marge,
      marginBottom: marge
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "elastic-slider__track"
  }, /*#__PURE__*/React.createElement("div", {
    className: "elastic-slider__range",
    style: {
      width: pct + '%',
      backgroundColor: color
    }
  })))), /*#__PURE__*/React.createElement(motion.span, {
    className: "elastic-slider__icon",
    style: {
      x: xDreta
    },
    "aria-hidden": "true"
  }, rightIcon));
}

/* ===== Spotlight — adaptació del component de React Bits ==============
   https://reactbits.dev/components/spotlight-card  (MIT)
   Un halo que segueix el cursor per dins de la targeta. Escriu dues
   variables CSS directament sobre l'element, així que no provoca cap
   re-render de React: la resta la fa un ::before amb un degradat radial.
   Només s'activa on hi ha cursor de debò (mai a mòbil).
   ==================================================================== */
function useSpotlight() {
  return useCallback(e => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', e.clientX - r.left + 'px');
    el.style.setProperty('--mouse-y', e.clientY - r.top + 'px');
  }, []);
}

/* ===== Sensors interactius + simulador 30-30-30 ===== */
/* Aquestes fitxes NO repeteixen les lectures del panell principal: aquí
   s'explica quin sensor hi ha, quin rang cobreix i, sobretot, com ho
   mesura físicament. El valor en directe es consulta a la píndola del
   menú o al panell. */
const SENSORS = [{
  id: 'temp',
  icon: 'thermometer',
  name: 'Temperatura',
  color: '#ef4444',
  hint: 'DHT11 + BMP280',
  rang: '0 – 50 °C',
  precisio: '± 2 °C',
  detail: "És un dels tres factors de la regla del 30-30-30: com més calor fa, més s'asseca el combustible vegetal i més fàcil és que una espurna es converteixi en incendi.",
  comHoMesura: "El DHT11 porta un termistor: una resistència el valor de la qual canvia amb la temperatura. L'ESP32 mesura aquesta resistència i la converteix en graus. El BMP280 fa una segona lectura pel seu compte, cosa que ens permet detectar si un dels dos sensors ha començat a fallar.",
  extra: "A Sabadell, les temperatures d'estiu poden superar fàcilment el llindar crític durant les hores centrals del dia."
}, {
  id: 'hum',
  icon: 'droplet',
  name: 'Humitat',
  color: '#0ea5e9',
  hint: 'DHT11',
  rang: '20 – 90 %',
  precisio: '± 5 %',
  detail: "És el factor invers de la temperatura: com més baixa és la humitat relativa, més sec està tot i més de pressa es propaga el foc. Per sota del 30% les condicions ja es consideren perilloses.",
  comHoMesura: "Dins del sensor hi ha un condensador amb un polímer entre les dues plaques. El polímer absorbeix vapor d'aigua de l'aire i, en fer-ho, canvia la capacitat elèctrica del conjunt. Com més humit és l'aire, més capacitat: aquesta variació és la que es tradueix en percentatge.",
  extra: "La humitat baixa afecta especialment les plantes resinoses, molt presents a la vegetació mediterrània."
}, {
  id: 'vent',
  icon: 'wind',
  name: 'Vent',
  color: '#10b981',
  hint: 'Anemòmetre de cassoletes',
  rang: '0 – 120 km/h',
  precisio: '1 pols per volta',
  detail: "És el factor que més accelera la propagació: el vent aporta oxigen al foc i transporta espurnes a distància, obrint nous focus lluny del punt inicial.",
  comHoMesura: "L'anemòmetre no mesura velocitat directament. El vent fa girar les cassoletes i, a cada volta completa, un imant tanca un interruptor magnètic. L'ESP32 compta quants polsos arriben per segon i els converteix a km/h a partir del radi de les cassoletes.",
  extra: "Per sobre de 30 km/h, un incendi pot avançar més ràpid del que els equips terrestres poden reaccionar."
}, {
  id: 'pres',
  icon: 'gauge',
  name: 'Pressió',
  color: '#f59e0b',
  hint: 'BMP280',
  rang: '300 – 1100 hPa',
  precisio: '± 1 hPa',
  detail: "No forma part de la regla del 30-30-30, però sí que entra al càlcul del risc amb un pes petit: una pressió baixa indica inestabilitat atmosfèrica i ajuda a anticipar canvis de temps o entrades d'aire sec.",
  comHoMesura: "El BMP280 té una membrana de silici molt fina amb una cambra segellada a sota. L'aire de fora l'empeny i la corba; uns elements piezoresistius integrats detecten quant s'ha corbat i tradueixen aquesta deformació a hectopascals.",
  extra: "Una baixada brusca de pressió sol indicar un canvi de temps imminent que pot alterar el risc."
}];
function SensorsSection() {
  const spotlight = useSpotlight();
  const [actiu, setActiu] = useState('temp');
  const [temp, setTemp] = useState(24);
  const [hum, setHum] = useState(55);
  const [vent, setVent] = useState(12);
  const sensor = SENSORS.find(s => s.id === actiu);

  // Regla del 30-30-30
  const cTemp = temp >= 30,
    cHum = hum <= 30,
    cVent = vent >= 30;
  const complerts = [cTemp, cHum, cVent].filter(Boolean).length;
  const estat = useMemo(() => {
    if (complerts === 3) return {
      titol: 'Perill extrem',
      label: 'Regla 30-30-30 complerta',
      color: '#dc2626',
      bg: 'rgba(220,38,38,0.12)',
      text: "Els tres factors superen el llindar alhora. En aquestes condicions un incendi es propagaria molt de pressa: és l'escenari que SADRIF vol anticipar."
    };
    if (complerts === 2) return {
      titol: 'Risc alt',
      label: '2 de 3 factors crítics',
      color: '#ea580c',
      bg: 'rgba(234,88,12,0.12)',
      text: 'Dos dels tres factors ja superen el llindar. La situació és delicada i cal vigilància activa.'
    };
    if (complerts === 1) return {
      titol: 'Risc moderat',
      label: '1 de 3 factors crítics',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.12)',
      text: 'Un dels factors ja és crític. Encara no hi ha perill extrem, però les condicions poden empitjorar.'
    };
    return {
      titol: 'Risc baix',
      label: 'Cap factor crític',
      color: '#059669',
      bg: 'rgba(5,150,105,0.12)',
      text: 'Cap dels tres factors supera el llindar de perill. Són condicions favorables per al bosc.'
    };
  }, [complerts]);
  const reset = () => {
    setTemp(24);
    setHum(55);
    setVent(12);
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(motion.div, {
    className: "sensor-grid",
    initial: "hidden",
    whileInView: "show",
    viewport: {
      once: true,
      amount: 0.3
    },
    variants: {
      hidden: {},
      show: {
        transition: {
          staggerChildren: 0.09
        }
      }
    }
  }, SENSORS.map(s => /*#__PURE__*/React.createElement(motion.div, {
    key: s.id,
    className: `sensor-card ${actiu === s.id ? 'actiu' : ''}`,
    onClick: () => setActiu(s.id),
    onMouseMove: spotlight,
    variants: {
      hidden: {
        opacity: 0,
        y: 26
      },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1]
        }
      }
    },
    style: {
      borderColor: actiu === s.id ? s.color : undefined,
      '--spotlight-color': s.color + '2e'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "sensor-icon",
    style: {
      color: actiu === s.id ? s.color : undefined
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 24
  })), /*#__PURE__*/React.createElement("h4", null, s.name), /*#__PURE__*/React.createElement("p", {
    className: "sensor-hint"
  }, s.hint), /*#__PURE__*/React.createElement("dl", {
    className: "sensor-spec"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Rang"), /*#__PURE__*/React.createElement("dd", {
    style: {
      color: s.color
    }
  }, s.rang)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("dt", null, "Precisi\xF3"), /*#__PURE__*/React.createElement("dd", null, s.precisio)))))), /*#__PURE__*/React.createElement(motion.div, {
    className: "sensor-detail",
    key: sensor.id,
    style: {
      borderLeftColor: sensor.color
    },
    initial: {
      opacity: 0,
      y: 14
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1]
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: sensor.icon,
    size: 20,
    style: {
      color: sensor.color
    }
  }), " ", sensor.name, /*#__PURE__*/React.createElement("span", {
    className: "sensor-detail-model"
  }, sensor.hint)), /*#__PURE__*/React.createElement("p", null, sensor.detail), /*#__PURE__*/React.createElement("div", {
    className: "sensor-com"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sensor-com-tag",
    style: {
      color: sensor.color
    }
  }, "Com ho mesura"), /*#__PURE__*/React.createElement("p", null, sensor.comHoMesura)), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: '0.9rem',
      fontStyle: 'italic'
    }
  }, sensor.extra)), /*#__PURE__*/React.createElement("div", {
    className: "simulador-box"
  }, /*#__PURE__*/React.createElement("h4", null, "Prova-ho tu: simulador 30-30-30"), /*#__PURE__*/React.createElement("p", {
    className: "simulador-intro"
  }, "Mou els controls i mira com canvia el nivell de risc. La regla diu que quan els ", /*#__PURE__*/React.createElement("strong", null, "tres"), " factors superen el llindar alhora, el perill d'incendi \xE9s extrem."), /*#__PURE__*/React.createElement("div", {
    className: "slider-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slider-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "slider-label"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "thermometer",
    size: 17,
    style: {
      color: "#ef4444"
    }
  }), " Temperatura"), /*#__PURE__*/React.createElement("span", {
    className: "slider-value",
    style: {
      color: cTemp ? '#dc2626' : 'var(--texto-principal)'
    }
  }, temp, " \xB0C")), /*#__PURE__*/React.createElement(ElasticSlider, {
    value: temp,
    onChange: setTemp,
    min: 0,
    max: 45,
    step: 1,
    label: "Temperatura en graus Celsius",
    color: cTemp ? '#dc2626' : '#ef4444',
    leftIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "thermometer",
      size: 15
    }),
    rightIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "thermometer",
      size: 22
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "elastic-slider__scale"
  }, /*#__PURE__*/React.createElement("span", null, "0 \xB0C"), /*#__PURE__*/React.createElement("span", null, "45 \xB0C")), /*#__PURE__*/React.createElement("div", {
    className: "slider-threshold",
    style: {
      color: cTemp ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, cTemp ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 14
  }), " Supera el llindar de 30 \xB0C") : 'Llindar crític: 30 °C o més')), /*#__PURE__*/React.createElement("div", {
    className: "slider-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slider-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "slider-label"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "droplet",
    size: 17,
    style: {
      color: "#0ea5e9"
    }
  }), " Humitat relativa"), /*#__PURE__*/React.createElement("span", {
    className: "slider-value",
    style: {
      color: cHum ? '#dc2626' : 'var(--texto-principal)'
    }
  }, hum, " %")), /*#__PURE__*/React.createElement(ElasticSlider, {
    value: hum,
    onChange: setHum,
    min: 0,
    max: 100,
    step: 1,
    label: "Humitat relativa en percentatge",
    color: cHum ? '#dc2626' : '#0ea5e9',
    leftIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "droplet",
      size: 15
    }),
    rightIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "droplet",
      size: 22
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "elastic-slider__scale"
  }, /*#__PURE__*/React.createElement("span", null, "0 %"), /*#__PURE__*/React.createElement("span", null, "100 %")), /*#__PURE__*/React.createElement("div", {
    className: "slider-threshold",
    style: {
      color: cHum ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, cHum ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 14
  }), " Per sota del llindar del 30 %") : 'Llindar crític: 30 % o menys')), /*#__PURE__*/React.createElement("div", {
    className: "slider-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "slider-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "slider-label"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wind",
    size: 17,
    style: {
      color: "#10b981"
    }
  }), " Velocitat del vent"), /*#__PURE__*/React.createElement("span", {
    className: "slider-value",
    style: {
      color: cVent ? '#dc2626' : 'var(--texto-principal)'
    }
  }, vent, " km/h")), /*#__PURE__*/React.createElement(ElasticSlider, {
    value: vent,
    onChange: setVent,
    min: 0,
    max: 70,
    step: 1,
    label: "Velocitat del vent en quil\xF2metres per hora",
    color: cVent ? '#dc2626' : '#10b981',
    leftIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "wind",
      size: 15
    }),
    rightIcon: /*#__PURE__*/React.createElement(Icon, {
      name: "wind",
      size: 22
    })
  }), /*#__PURE__*/React.createElement("div", {
    className: "elastic-slider__scale"
  }, /*#__PURE__*/React.createElement("span", null, "0 km/h"), /*#__PURE__*/React.createElement("span", null, "70 km/h")), /*#__PURE__*/React.createElement("div", {
    className: "slider-threshold",
    style: {
      color: cVent ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, cVent ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    name: "alert",
    size: 14
  }), " Supera el llindar de 30 km/h") : 'Llindar crític: 30 km/h o més')), /*#__PURE__*/React.createElement(motion.div, {
    className: "sim-result",
    style: {
      backgroundColor: estat.bg,
      borderColor: estat.color,
      color: estat.color
    },
    animate: {
      scale: complerts === 3 ? [1, 1.02, 1] : 1
    },
    transition: {
      duration: 0.45
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "sim-result-label"
  }, estat.label), /*#__PURE__*/React.createElement("div", {
    className: "sim-result-title"
  }, estat.titol), /*#__PURE__*/React.createElement("p", {
    className: "sim-result-text",
    style: {
      color: 'var(--texto-principal)'
    }
  }, estat.text), /*#__PURE__*/React.createElement("div", {
    className: "sim-badges"
  }, /*#__PURE__*/React.createElement("span", {
    className: "sim-badge",
    style: {
      color: cTemp ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: cTemp ? "check" : "circleEmpty",
    size: 14
  }), " Temp \u2265 30\xB0"), /*#__PURE__*/React.createElement("span", {
    className: "sim-badge",
    style: {
      color: cHum ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: cHum ? "check" : "circleEmpty",
    size: 14
  }), " Humitat \u2264 30%"), /*#__PURE__*/React.createElement("span", {
    className: "sim-badge",
    style: {
      color: cVent ? '#dc2626' : 'var(--texto-mutado)'
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: cVent ? "check" : "circleEmpty",
    size: 14
  }), " Vent \u2265 30 km/h"))), /*#__PURE__*/React.createElement("button", {
    className: "btn-reset-sim",
    onClick: reset
  }, "Restablir valors")));
}

/* ===== Objectius del projecte ===== */
function ObjectiveCards() {
  const items = [{
    n: '01',
    title: 'Estació autònoma',
    text: 'Dissenyar una estació de monitoratge autònoma i de baix cost.'
  }, {
    n: '02',
    title: 'Model científic',
    text: 'Aplicar un model científic de càlcul de risc (regla del 30-30-30).'
  }, {
    n: '03',
    title: 'Dades obertes',
    text: 'Oferir la informació en temps real, de forma oberta i entenedora.'
  }];
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12
      }
    }
  };
  const item = {
    hidden: {
      opacity: 0,
      y: 28
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };
  return /*#__PURE__*/React.createElement(motion.div, {
    className: "objective-grid",
    variants: container,
    initial: "hidden",
    whileInView: "show",
    viewport: {
      once: true,
      amount: 0.3
    }
  }, items.map((it, i) => /*#__PURE__*/React.createElement(motion.div, {
    className: "objective-card",
    variants: item,
    key: i,
    whileHover: {
      y: -8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "objective-num"
  }, it.n), /*#__PURE__*/React.createElement("h4", null, it.title), /*#__PURE__*/React.createElement("p", null, it.text))));
}

/* ===== ScrollStack (port del component de React Bits, amb scroll de finestra) ===== */
const ScrollStackItem = ({
  children,
  itemClassName = '',
  style
}) => /*#__PURE__*/React.createElement("div", {
  className: "scroll-stack-item"
}, /*#__PURE__*/React.createElement("div", {
  className: `scroll-stack-card ${itemClassName}`.trim(),
  style: style
}, children));

/* L'apilament el fa `position: sticky` (compositor natiu del navegador), de manera
   que la posició va sempre enganxada al scroll. El JS només calcula l'escala i,
   en muntar-se, iguala l'alçada dels contenidors perquè totes les targetes
   s'alliberin alhora en arribar al final del bloc — així mai no se solapen amb
   la secció següent. */
const ScrollStack = ({
  children,
  className = '',
  itemDistance = 90,
  itemScale = 0.03,
  itemStackDistance = 26,
  stackPosition = '20vh',
  scaleEndPosition = '10vh',
  baseScale = 0.86
}) => {
  const scrollerRef = useRef(null);
  const itemsRef = useRef([]);
  const cardsRef = useRef([]);
  const naturalTopsRef = useRef([]);
  const lastScalesRef = useRef([]);
  const rafRef = useRef(null);

  /* '20vh' | '20%' | 220  ->  px respecte a l'alçada de la finestra */
  const toPx = useCallback(value => {
    if (typeof value === 'number') return value;
    const n = parseFloat(value);
    return /vh|%/.test(value) ? n / 100 * window.innerHeight : n;
  }, []);

  /* Mesura les posicions naturals (sense sticky ni transform) i iguala
     l'alçada dels contenidors. Només s'executa en muntar i en redimensionar. */
  const measure = useCallback(() => {
    const items = itemsRef.current;
    const cards = cardsRef.current;
    if (!items.length) return;
    const n = items.length;

    // 1) alçada real de cada targeta, sense escalar
    const prevTransforms = cards.map(c => c.style.transform);
    cards.forEach(c => {
      c.style.transform = '';
    });
    const cardHeights = cards.map(c => c.getBoundingClientRect().height);

    // 2) farciment que iguala el punt on cada contenidor deixa d'estar enganxat
    const maxBottom = Math.max(...cardHeights.map((h, i) => i * itemStackDistance + h));
    items.forEach((it, i) => {
      it.style.top = `calc(${stackPosition} + ${i * itemStackDistance}px)`;
      it.style.paddingBottom = `${Math.max(0, maxBottom - i * itemStackDistance - cardHeights[i])}px`;
      it.style.marginBottom = i < n - 1 ? `${itemDistance}px` : '0px';
    });

    // 3) posició natural de cada targeta amb el sticky desactivat
    const prevPos = items.map(it => it.style.position);
    items.forEach(it => {
      it.style.position = 'static';
    });
    naturalTopsRef.current = cards.map(c => c.getBoundingClientRect().top + window.scrollY);
    items.forEach((it, i) => {
      it.style.position = prevPos[i] || '';
    });
    cards.forEach((c, i) => {
      c.style.transform = prevTransforms[i];
    });
  }, [itemDistance, itemStackDistance, stackPosition]);

  /* Única feina per fotograma: l'escala de cada targeta. */
  const updateScales = useCallback(() => {
    const cards = cardsRef.current;
    const tops = naturalTopsRef.current;
    if (!cards.length || tops.length !== cards.length) return;
    const scrollTop = window.scrollY;
    const stackPx = toPx(stackPosition);
    const endPx = toPx(scaleEndPosition);
    cards.forEach((card, i) => {
      const triggerStart = tops[i] - stackPx - itemStackDistance * i;
      const triggerEnd = tops[i] - endPx;
      let p = triggerEnd > triggerStart ? (scrollTop - triggerStart) / (triggerEnd - triggerStart) : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      const target = baseScale + i * itemScale;
      const scale = Math.round((1 - p * (1 - target)) * 1000) / 1000;
      if (lastScalesRef.current[i] !== scale) {
        lastScalesRef.current[i] = scale;
        card.style.transform = scale === 1 ? '' : `scale(${scale})`;
      }
    });
  }, [baseScale, itemScale, itemStackDistance, scaleEndPosition, stackPosition, toPx]);
  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const items = Array.from(scroller.querySelectorAll('.scroll-stack-item'));
    itemsRef.current = items;
    cardsRef.current = items.map(it => it.querySelector('.scroll-stack-card'));
    lastScalesRef.current = [];
    measure();
    updateScales();

    /* Cancel·lem i reprogramem: si la pestanya passa a segon pla els rAF
       pendents no s'executen, i un guard del tipus "si n'hi ha un de pendent,
       surt" es quedaria bloquejat per sempre. */
    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        updateScales();
      });
    };
    const onResize = () => {
      measure();
      updateScales();
    };
    const onVisible = () => {
      if (!document.hidden) {
        measure();
        updateScales();
      }
    };
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisible);

    // Si canvien mides per fonts o imatges tardanes, re-mesurem.
    const ro = new ResizeObserver(onResize);
    ro.observe(scroller);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisible);
      ro.disconnect();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [measure, updateScales]);
  return /*#__PURE__*/React.createElement("div", {
    className: `scroll-stack ${className}`.trim(),
    ref: scrollerRef
  }, children, /*#__PURE__*/React.createElement("div", {
    className: "scroll-stack-end"
  }));
};

/* ===== Línia de temps com a ScrollStack ===== */
function TimelineComponent() {
  const steps = [{
    n: '01',
    step: 'Fase 1',
    title: 'Investigació i marc teòric',
    bg: 'linear-gradient(140deg, #0f172a 0%, #1e293b 100%)',
    text: "Estudi del risc d'incendis forestals a Catalunya, la regla del 30-30-30 i les tecnologies IoT existents per a la detecció precoç."
  }, {
    n: '02',
    step: 'Fase 2',
    title: "Disseny 3D de l'estació",
    bg: 'linear-gradient(140deg, #134e4a 0%, #115e59 100%)',
    text: "Modelatge de la carcassa del dispositiu SADRIF, pensada per protegir l'electrònica a la intempèrie i permetre la ventilació dels sensors."
  }, {
    n: '03',
    step: 'Fase 3',
    title: 'Muntatge electrònic',
    bg: 'linear-gradient(140deg, #065f46 0%, #047857 100%)',
    text: 'Integració del microcontrolador ESP32 amb els sensors de temperatura, humitat, pressió i vent, i les proves de connexió i alimentació.'
  }, {
    n: '04',
    step: 'Fase 4',
    title: 'Programació i enviament de dades',
    bg: 'linear-gradient(140deg, #047857 0%, #059669 100%)',
    text: 'Desenvolupament del firmware i connexió amb ThingSpeak per emmagatzemar i consultar les lectures en temps real.'
  }, {
    n: '05',
    step: 'Fase 5',
    title: 'Desplegament al bosc de Sabadell',
    bg: 'linear-gradient(140deg, #059669 0%, #10b981 100%)',
    text: "Instal·lació de l'estació en una zona forestal de Sabadell i validació de les lectures en condicions reals."
  }, {
    n: '06',
    step: 'Fase 6',
    title: 'Web i divulgació',
    bg: 'linear-gradient(140deg, #10b981 0%, #34d399 100%)',
    text: 'Creació del panell web en temps real, el model 3D interactiu, el canal de YouTube i el directe de Twitch per divulgar el projecte.'
  }];
  return /*#__PURE__*/React.createElement(ScrollStack, null, steps.map((s, i) => /*#__PURE__*/React.createElement(ScrollStackItem, {
    key: i,
    style: {
      background: s.bg
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "ss-step"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ss-num"
  }, s.n), " \xB7 ", s.step), /*#__PURE__*/React.createElement("h4", null, s.title), /*#__PURE__*/React.createElement("p", null, s.text))));
}

/* =========================================================
   EQUIP — ProfileCard, port del component de React Bits
   https://reactbits.dev/components/profile-card
   El motor de tilt és un seguiment amortit (interpolació
   exponencial) dins d'un sol requestAnimationFrame, i escriu
   directament variables CSS: no provoca cap re-render de React.
   ========================================================= */

const clamp = (v, min = 0, max = 100) => Math.min(Math.max(v, min), max);
const round = (v, p = 3) => parseFloat(v.toFixed(p));
const adjust = (v, fMin, fMax, tMin, tMax) => round(tMin + (tMax - tMin) * (v - fMin) / (fMax - fMin));
const PC_ANIM = {
  INITIAL_DURATION: 1200,
  INITIAL_X_OFFSET: 70,
  INITIAL_Y_OFFSET: 60,
  ENTER_TRANSITION_MS: 180
};
function ProfileCard({
  avatarBase,
  initials,
  name,
  title,
  handle,
  status = 'Pla DRIF',
  innerGradient,
  behindGlowColor,
  enableTilt = true
}) {
  const wrapRef = useRef(null);
  const shellRef = useRef(null);
  const enterTimerRef = useRef(null);
  const leaveRafRef = useRef(null);
  /* Provem les extensions habituals en ordre. Així tant fa que la
     fotografia s'exporti com a .png (retallada, amb transparència)
     com a .jpeg: la que existeixi és la que es mostrarà. Si no n'hi
     ha cap, es queda el monograma d'inicials. */
  const candidats = useMemo(() => avatarBase ? [avatarBase + '.png', avatarBase + '.jpeg', avatarBase + '.jpg'] : [], [avatarBase]);
  const [intent, setIntent] = useState(0);
  const [miniIntent, setMiniIntent] = useState(0);
  const avatarSrc = candidats[intent];
  const miniSrc = candidats[miniIntent];
  const tiltEngine = useMemo(() => {
    if (!enableTilt) return null;
    let rafId = null,
      running = false,
      lastTs = 0;
    let currentX = 0,
      currentY = 0,
      targetX = 0,
      targetY = 0;
    const DEFAULT_TAU = 0.14,
      INITIAL_TAU = 0.6;
    let initialUntil = 0;
    const setVarsFromXY = (x, y) => {
      const shell = shellRef.current,
        wrap = wrapRef.current;
      if (!shell || !wrap) return;
      const width = shell.clientWidth || 1,
        height = shell.clientHeight || 1;
      const percentX = clamp(100 / width * x),
        percentY = clamp(100 / height * y);
      const centerX = percentX - 50,
        centerY = percentY - 50;
      const props = {
        '--pointer-x': `${percentX}%`,
        '--pointer-y': `${percentY}%`,
        '--background-x': `${adjust(percentX, 0, 100, 35, 65)}%`,
        '--background-y': `${adjust(percentY, 0, 100, 35, 65)}%`,
        '--pointer-from-center': `${clamp(Math.hypot(percentY - 50, percentX - 50) / 50, 0, 1)}`,
        '--pointer-from-top': `${percentY / 100}`,
        '--pointer-from-left': `${percentX / 100}`,
        '--rotate-x': `${round(-(centerX / 5))}deg`,
        '--rotate-y': `${round(centerY / 4)}deg`
      };
      for (const k in props) wrap.style.setProperty(k, props[k]);
    };
    const step = ts => {
      if (!running) return;
      if (lastTs === 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      const tau = ts < initialUntil ? INITIAL_TAU : DEFAULT_TAU;
      const k = 1 - Math.exp(-dt / tau);
      currentX += (targetX - currentX) * k;
      currentY += (targetY - currentY) * k;
      setVarsFromXY(currentX, currentY);
      const stillFar = Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (stillFar) {
        rafId = requestAnimationFrame(step);
      } else {
        running = false;
        lastTs = 0;
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };
    const start = () => {
      if (running) return;
      running = true;
      lastTs = 0;
      rafId = requestAnimationFrame(step);
    };
    return {
      setImmediate(x, y) {
        currentX = x;
        currentY = y;
        setVarsFromXY(x, y);
      },
      setTarget(x, y) {
        targetX = x;
        targetY = y;
        start();
      },
      toCenter() {
        const shell = shellRef.current;
        if (!shell) return;
        this.setTarget(shell.clientWidth / 2, shell.clientHeight / 2);
      },
      beginInitial(ms) {
        initialUntil = performance.now() + ms;
        start();
      },
      getCurrent() {
        return {
          x: currentX,
          y: currentY,
          tx: targetX,
          ty: targetY
        };
      },
      cancel() {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = null;
        running = false;
        lastTs = 0;
      }
    };
  }, [enableTilt]);
  useEffect(() => {
    const shell = shellRef.current;
    if (!enableTilt || !tiltEngine || !shell) return;
    const offsets = evt => {
      const rect = shell.getBoundingClientRect();
      return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
      };
    };
    const onEnter = event => {
      shell.classList.add('active', 'entering');
      wrapRef.current && wrapRef.current.classList.add('active');
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      enterTimerRef.current = setTimeout(() => shell.classList.remove('entering'), PC_ANIM.ENTER_TRANSITION_MS);
      const {
        x,
        y
      } = offsets(event);
      tiltEngine.setTarget(x, y);
    };
    const onMove = event => {
      const {
        x,
        y
      } = offsets(event);
      tiltEngine.setTarget(x, y);
    };
    const onLeave = () => {
      tiltEngine.toCenter();
      const settle = () => {
        const {
          x,
          y,
          tx,
          ty
        } = tiltEngine.getCurrent();
        if (Math.hypot(tx - x, ty - y) < 0.6) {
          shell.classList.remove('active');
          wrapRef.current && wrapRef.current.classList.remove('active');
          leaveRafRef.current = null;
        } else {
          leaveRafRef.current = requestAnimationFrame(settle);
        }
      };
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      leaveRafRef.current = requestAnimationFrame(settle);
    };
    shell.addEventListener('pointerenter', onEnter);
    shell.addEventListener('pointermove', onMove);
    shell.addEventListener('pointerleave', onLeave);

    /* Animació d'entrada: la targeta arriba lleugerament girada
       i s'endreça sola, com a la demo de React Bits. */
    tiltEngine.setImmediate((shell.clientWidth || 0) - PC_ANIM.INITIAL_X_OFFSET, PC_ANIM.INITIAL_Y_OFFSET);
    tiltEngine.toCenter();
    tiltEngine.beginInitial(PC_ANIM.INITIAL_DURATION);
    return () => {
      shell.removeEventListener('pointerenter', onEnter);
      shell.removeEventListener('pointermove', onMove);
      shell.removeEventListener('pointerleave', onLeave);
      if (enterTimerRef.current) clearTimeout(enterTimerRef.current);
      if (leaveRafRef.current) cancelAnimationFrame(leaveRafRef.current);
      tiltEngine.cancel();
      shell.classList.remove('entering', 'active');
    };
  }, [enableTilt, tiltEngine]);
  const cardStyle = useMemo(() => ({
    '--inner-gradient': innerGradient || 'linear-gradient(145deg, #0f766e8c 0%, #10b98144 100%)',
    '--behind-glow-color': behindGlowColor || 'rgba(16, 185, 129, 0.55)'
  }), [innerGradient, behindGlowColor]);
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "pc-card-wrapper",
    style: cardStyle
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-behind"
  }), /*#__PURE__*/React.createElement("div", {
    ref: shellRef,
    className: "pc-card-shell"
  }, /*#__PURE__*/React.createElement("section", {
    className: "pc-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-inside"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-glare"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pc-content pc-avatar-content"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pc-fallback",
    "aria-hidden": "true"
  }, initials), avatarSrc && /*#__PURE__*/React.createElement("img", {
    key: avatarSrc,
    className: "avatar",
    src: avatarSrc,
    alt: `Fotografia de ${name}`,
    loading: "lazy",
    decoding: "async",
    onError: () => setIntent(n => n + 1)
  }), /*#__PURE__*/React.createElement("div", {
    className: "pc-user-info"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-user-details"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-mini-avatar"
  }, miniSrc ? /*#__PURE__*/React.createElement("img", {
    key: miniSrc,
    src: miniSrc,
    alt: "",
    loading: "lazy",
    decoding: "async",
    onError: () => setMiniIntent(n => n + 1)
  }) : /*#__PURE__*/React.createElement("span", {
    className: "pc-mini-fallback"
  }, initials)), /*#__PURE__*/React.createElement("div", {
    className: "pc-user-text"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-handle"
  }, "@", handle), /*#__PURE__*/React.createElement("div", {
    className: "pc-status"
  }, /*#__PURE__*/React.createElement("i", null), status))))), /*#__PURE__*/React.createElement("div", {
    className: "pc-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pc-details"
  }, /*#__PURE__*/React.createElement("h3", null, name), /*#__PURE__*/React.createElement("p", null, title)))))));
}
function TeamGrid() {
  /* Només cal deixar la fotografia a la carpeta amb el nom d'`avatarBase`
     i l'extensió .png, .jpeg o .jpg. Mentre no hi sigui, la targeta
     mostra el monograma d'inicials. */
  const members = [{
    initials: 'AA',
    name: 'Abraham Ayala',
    title: 'Autor del TdR',
    handle: 'abraham',
    avatarBase: 'equip-abraham',
    innerGradient: 'linear-gradient(145deg, #0f766e8c 0%, #10b98144 100%)',
    behindGlowColor: 'rgba(16, 185, 129, 0.55)'
  }, {
    initials: 'KJ',
    name: 'Kevin Juan',
    title: 'Autor del TdR',
    handle: 'kevin',
    avatarBase: 'equip-kevin',
    innerGradient: 'linear-gradient(145deg, #0369a18c 0%, #0ea5e944 100%)',
    behindGlowColor: 'rgba(14, 165, 233, 0.5)'
  }, {
    initials: 'GL',
    name: 'Guillem Llamas',
    title: 'Autor del TdR',
    handle: 'guillem',
    avatarBase: 'equip-guillem',
    innerGradient: 'linear-gradient(145deg, #b453098c 0%, #f59e0b44 100%)',
    behindGlowColor: 'rgba(245, 158, 11, 0.5)'
  }, {
    initials: 'UC',
    name: 'Unai Cañas',
    title: 'Autor del TdR',
    handle: 'unai',
    avatarBase: 'equip-unai',
    innerGradient: 'linear-gradient(145deg, #b91c1c8c 0%, #ef444444 100%)',
    behindGlowColor: 'rgba(239, 68, 68, 0.5)'
  }];
  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const cardVariant = {
    hidden: {
      opacity: 0,
      y: 30
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };
  return /*#__PURE__*/React.createElement(motion.div, {
    className: "team-grid",
    variants: container,
    initial: "hidden",
    whileInView: "show",
    viewport: {
      once: true,
      amount: 0.2
    }
  }, members.map((m, i) => /*#__PURE__*/React.createElement(motion.div, {
    variants: cardVariant,
    key: i
  }, /*#__PURE__*/React.createElement(ProfileCard, m))));
}
ReactDOM.createRoot(document.getElementById('hero-rotate-root')).render(/*#__PURE__*/React.createElement(HeroRotate, null));
ReactDOM.createRoot(document.getElementById('contrast-root')).render(/*#__PURE__*/React.createElement(ContrastCards, null));
ReactDOM.createRoot(document.getElementById('objective-root')).render(/*#__PURE__*/React.createElement(ObjectiveCards, null));
ReactDOM.createRoot(document.getElementById('sensors-root')).render(/*#__PURE__*/React.createElement(SensorsSection, null));
ReactDOM.createRoot(document.getElementById('timeline-root')).render(/*#__PURE__*/React.createElement(TimelineComponent, null));
ReactDOM.createRoot(document.getElementById('team-root')).render(/*#__PURE__*/React.createElement(TeamGrid, null));