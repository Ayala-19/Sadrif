function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useMemo,
  useCallback,
  forwardRef,
  useImperativeHandle
} = React;
const {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame
} = window.Motion;
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/* =========================================================
   SISTEMA D'ICONES SVG (substitueix qualsevol emoji)
   Traç uniforme de 1.75, quadrícula de 24x24 i currentColor,
   perquè totes les icones tinguin exactament el mateix pes visual.
   ========================================================= */
const ICON_PATHS = {
  sun: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
  })),
  solar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "4",
    width: "19",
    height: "11",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.5 8.7h19M2.5 11.9h19M9 4v11M15 4v11M12 15v5M8.5 20h7"
  })),
  thermometer: /*#__PURE__*/React.createElement("path", {
    d: "M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4.5 4.5 0 1 0 5 0z"
  }),
  wifi: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 20h.01"
  })),
  layers: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polygon", {
    points: "12 2 2 7 12 12 22 7 12 2"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "2 17 12 22 22 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "2 12 12 17 22 12"
  })),
  chip: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "5",
    width: "14",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9.5",
    y: "9.5",
    width: "5",
    height: "5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 2v3M15 2v3M9 19v3M15 19v3M19 9h3M19 15h3M2 9h3M2 15h3"
  })),
  camera: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2.5h7L17 7h3a2 2 0 0 1 2 2z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "13.5",
    r: "3.5"
  })),
  air: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M17.5 17.5a4.5 4.5 0 0 0 0-9 6.5 6.5 0 0 0-12.3-1.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2.5 10.5h6M2.5 14h9M2.5 17.5h6"
  })),
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
  wind: /*#__PURE__*/React.createElement("path", {
    d: "M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"
  }),
  display: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "4",
    width: "20",
    height: "13",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 21h6M12 17v4"
  })),
  cable: /*#__PURE__*/React.createElement("path", {
    d: "M9 2v6M15 2v6M7 8h10v3.5a5 5 0 0 1-10 0zM12 16.5V22"
  }),
  batteryCharging: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6.5 6H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2M15 6h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 10.5v3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12.5 6l-3.5 5.5h4.5L10 18"
  })),
  battery: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "7",
    width: "17",
    height: "10",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M22 10.5v3"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "10",
    width: "6",
    height: "4",
    rx: "1",
    fill: "currentColor",
    stroke: "none"
  })),
  bolt: /*#__PURE__*/React.createElement("polygon", {
    points: "13 2 4 13.5 11 13.5 10 22 20 10 13 10 13 2"
  }),
  cube: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3.3 7 12 12 20.7 7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "22",
    x2: "12",
    y2: "12"
  })),
  wrench: /*#__PURE__*/React.createElement("path", {
    d: "M14.5 6.5a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.5-3.5a6 6 0 0 1-7.9 7.9l-6.7 6.7a2.1 2.1 0 0 1-3-3l6.7-6.7a6 6 0 0 1 7.9-7.9z"
  }),
  ar: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "2",
    width: "14",
    height: "20",
    rx: "2.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 6.6l3 1.6v3.4l-3 1.6-3-1.6V8.2z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 9.9v3.3M9 8.2l3 1.7 3-1.7"
  })),
  play: /*#__PURE__*/React.createElement("polygon", {
    points: "6 3.5 20.5 12 6 20.5 6 3.5",
    fill: "currentColor",
    stroke: "none"
  }),
  pause: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "4",
    width: "4",
    height: "16",
    rx: "1.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "4",
    width: "4",
    height: "16",
    rx: "1.2"
  })),
  rotate: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20.5 12a8.5 8.5 0 1 1-2.6-6.1"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "20.5 4 20.5 9 15.5 9"
  })),
  arrowRight: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "12",
    x2: "19",
    y2: "12"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "13 6 19 12 13 18"
  })),
  chevronDown: /*#__PURE__*/React.createElement("path", {
    d: "M6 9.5l6 6 6-6"
  }),
  cloud: /*#__PURE__*/React.createElement("path", {
    d: "M18 19H7a5 5 0 1 1 1-9.9A6.5 6.5 0 0 1 20.4 11 4 4 0 0 1 18 19z"
  }),
  shield: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-3.5 8-10V5.5l-8-3-8 3V12c0 6.5 8 10 8 10z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 12 11 14 15 9.5"
  })),
  clock: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 6.5 12 12 15.8 14.2"
  })),
  mapPin: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20 10.5c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "10.3",
    r: "2.8"
  })),
  ruler: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "8",
    width: "19",
    height: "8",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 8v3M11 8v4.5M15 8v3M19 8v4.5"
  })),
  youtube: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M22.2 7.4a2.7 2.7 0 0 0-1.9-1.9C18.6 5 12 5 12 5s-6.6 0-8.3.5A2.7 2.7 0 0 0 1.8 7.4 28 28 0 0 0 1.3 12a28 28 0 0 0 .5 4.6 2.7 2.7 0 0 0 1.9 1.9C5.4 19 12 19 12 19s6.6 0 8.3-.5a2.7 2.7 0 0 0 1.9-1.9 28 28 0 0 0 .5-4.6 28 28 0 0 0-.5-4.6z"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "9.9 15.1 15.4 12 9.9 8.9 9.9 15.1",
    fill: "currentColor",
    stroke: "none"
  })),
  instagram: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "5"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3.8"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "17.4",
    cy: "6.6",
    r: "1.1",
    fill: "currentColor",
    stroke: "none"
  })),
  twitch: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M4 3h16v10.5L15.5 18H12l-3 3H7v-3H4z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 7.5v4M15.5 7.5v4"
  })),
  github: /*#__PURE__*/React.createElement("path", {
    d: "M9 19c-4.3 1.3-4.3-2.2-6-2.6m12 5v-3.4c0-1 .1-1.4-.5-2 2.7-.3 5.5-1.3 5.5-6a4.7 4.7 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.4 3.2 5.4 3.5 5.4 3.5a4.3 4.3 0 0 0-.1 3.3A4.7 4.7 0 0 0 4 10c0 4.7 2.8 5.7 5.5 6-.4.4-.5.9-.5 1.5V21"
  })
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
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    ...rest
  } = props;
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const splitIntoCharacters = text => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', {
        granularity: 'grapheme'
      });
      return Array.from(segmenter.segment(text), segment => segment.segment);
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
  useEffect(() => {
    if (!auto) return;
    const intervalId = setInterval(next, rotationInterval);
    return () => clearInterval(intervalId);
  }, [next, rotationInterval, auto]);
  return /*#__PURE__*/React.createElement(motion.span, _extends({
    className: cn('text-rotate', mainClassName)
  }, rest, {
    layout: true,
    transition: transition
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-rotate-sr-only"
  }, texts[currentTextIndex]), /*#__PURE__*/React.createElement(AnimatePresence, {
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
function useElementWidth(ref) {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    function updateWidth() {
      if (ref.current) setWidth(ref.current.offsetWidth);
    }
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref]);
  return width;
}
const ScrollVelocity = ({
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6
}) => {
  function VelocityText({
    children,
    baseVelocity,
    className
  }) {
    const baseX = useMotionValue(0);
    const {
      scrollY
    } = useScroll();
    const scrollVelocity = useVelocity(scrollY);
    const smoothVelocity = useSpring(scrollVelocity, {
      damping,
      stiffness
    });
    const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
      clamp: false
    });
    const copyRef = useRef(null);
    const copyWidth = useElementWidth(copyRef);
    function wrap(min, max, v) {
      const range = max - min;
      const mod = ((v - min) % range + range) % range;
      return mod + min;
    }
    const x = useTransform(baseX, v => {
      if (copyWidth === 0) return '0px';
      return `${wrap(-copyWidth, 0, v)}px`;
    });
    const directionFactor = useRef(1);
    useAnimationFrame((t, delta) => {
      // Amb "reduir el moviment" activat, el marquesí es queda quiet.
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      let moveBy = directionFactor.current * baseVelocity * (delta / 1000);
      if (velocityFactor.get() < 0) directionFactor.current = -1;else if (velocityFactor.get() > 0) directionFactor.current = 1;
      moveBy += directionFactor.current * moveBy * velocityFactor.get();
      baseX.set(baseX.get() + moveBy);
    });
    const spans = [];
    for (let i = 0; i < numCopies; i++) {
      spans.push(/*#__PURE__*/React.createElement("span", {
        className: className,
        key: i,
        ref: i === 0 ? copyRef : null
      }, children, "\xA0\xA0\xA0"));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "parallax"
    }, /*#__PURE__*/React.createElement(motion.div, {
      className: "scroller",
      style: {
        x
      }
    }, spans));
  }
  return /*#__PURE__*/React.createElement("section", {
    className: "py-6 overflow-hidden"
  }, texts.map((text, index) => /*#__PURE__*/React.createElement(VelocityText, {
    key: index,
    className: className,
    baseVelocity: index % 2 !== 0 ? -velocity : velocity
  }, text)));
};

/* ===== CountUp (inspirat en el component de React Bits) =====
   Compta des de 0 fins al valor final la primera vegada que la xifra
   entra a la pantalla. Fa servir un IntersectionObserver i un sol
   requestAnimationFrame que s'atura tot sol quan acaba. */
const CountUp = ({
  to,
  duration = 1500,
  className = ''
}) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to);
      return;
    }
    let rafId = null;
    const run = () => {
      const start = performance.now();
      const tick = now => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setValue(Math.round(to * eased));
        if (p < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !doneRef.current) {
        doneRef.current = true;
        run();
        io.disconnect();
      }
    }, {
      threshold: 0.4
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [to, duration]);
  return /*#__PURE__*/React.createElement("span", {
    ref: ref,
    className: className
  }, value);
};

/* Marcador de posició mentre no hi hagi les fotografies reals dels components.
   És un SVG inline (no fa cap petició a la xarxa) amb l'estètica de la web. */
const PHOTO_PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#065f46"/>
        </linearGradient></defs>
        <rect width="800" height="1000" fill="url(#g)"/>
        <g fill="none" stroke="rgba(255,255,255,0.26)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
           transform="translate(340,440) scale(5)">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>
        </g>
      </svg>`);

/* Galeria acordió.
   Funciona en dues orientacions: en horitzontal a l'escriptori i en
   vertical al mòbil, amb la mateixa animació. Abans, per sota de 680 px,
   el CSS anul·lava l'efecte i quedava una simple llista d'imatges. */
const AccordionGallery = ({
  items
}) => {
  const rootRef = useRef(null);
  const panelRefs = useRef([]);
  const mediaRefs = useRef([]);
  const barRefs = useRef([]);
  const textRefs = useRef([]);
  const tlRef = useRef(null);
  const [active, setActive] = useState(0);
  const [vertical, setVertical] = useState(false);
  const count = items.length;

  /* Una sola font de veritat per a l'orientació: la mateixa consulta
     de mitjans que fa servir el CSS, escoltada des de JS. */
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 680px)');
    const sync = () => setVertical(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const applyLayout = useCallback(() => {
    const panels = panelRefs.current;
    if (!panels.length || !window.gsap) return;
    tlRef.current?.kill();
    const tl = window.gsap.timeline();
    panels.forEach((panel, i) => {
      if (!panel) return;
      const isActive = i === active;
      const media = mediaRefs.current[i];
      const bar = barRefs.current[i];
      const text = textRefs.current[i];
      const grow = count > 1 ? 0.48 * (count - 1) / (1 - 0.48) : 1;
      const tilt = isActive ? 0 : i < active ? 6 : -6;
      tl.to(panel, {
        flexGrow: isActive ? grow : 1,
        /* En vertical el gir ha de ser sobre l'eix X: amb rotateY
           la perspectiva aniria en contra del sentit de l'apilament. */
        rotateY: vertical ? 0 : tilt,
        rotateX: vertical ? -tilt : 0,
        duration: 0.6,
        ease: 'power3.out'
      }, 0);
      if (media) {
        tl.to(media, {
          xPercent: -50,
          yPercent: -50,
          '--ag-gray': isActive ? 0 : 1,
          '--ag-dim': isActive ? 0 : 0.15,
          duration: 0.6,
          ease: 'power3.out'
        }, 0);
      }
      if (bar && text) {
        if (isActive) {
          tl.to([bar, text], {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out',
            stagger: 0.06
          }, 0);
        } else {
          tl.to([bar, text], {
            opacity: 0,
            x: -14,
            duration: 0.36,
            ease: 'power3.out'
          }, 0);
        }
      }
    });
    tlRef.current = tl;
  }, [active, count, vertical]);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      // En vertical el que creix és l'alçada, no l'amplada.
      const along = vertical ? rect.height : rect.width;
      const usable = Math.max(along - 12 * (count - 1), 120);
      const size = Math.max(140, usable * 0.48 * 1.22);
      el.style.setProperty('--ag-media-size', `${size}px`);
      applyLayout();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [applyLayout, count, vertical]);
  useEffect(() => {
    applyLayout();
  }, [applyLayout]);
  const item = items[active];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    ref: rootRef,
    className: cn('accordion-gallery', vertical && 'accordion-gallery--vertical'),
    style: {
      height: vertical ? '520px' : '480px'
    },
    role: "tablist"
  }, items.map((it, i) => {
    const isActive = i === active;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      ref: el => panelRefs.current[i] = el,
      className: `ag-panel${isActive ? ' ag-panel--active' : ''}`,
      onClick: () => setActive(i)
      /* Al mòbil no hi ha hover; el clic ja cobreix el cas. */,
      onMouseEnter: () => {
        if (!vertical) setActive(i);
      },
      role: "tab",
      "aria-selected": isActive,
      "aria-label": it.label
    }, /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__frame"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__media",
      ref: el => mediaRefs.current[i] = el
    }, /*#__PURE__*/React.createElement("img", {
      src: it.image,
      alt: "",
      draggable: "false",
      loading: "lazy",
      onError: e => {
        e.target.onerror = null;
        e.target.src = PHOTO_PLACEHOLDER;
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__overlay",
      "aria-hidden": "true"
    })), /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__label",
      "aria-hidden": "true"
    }, /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__bar",
      ref: el => barRefs.current[i] = el
    }), /*#__PURE__*/React.createElement("span", {
      className: "ag-panel__text",
      ref: el => textRefs.current[i] = el
    }, it.label)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "ag-detail",
    key: active,
    role: "tabpanel"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ag-detail-index"
  }, String(active + 1).padStart(2, '0'), " / ", String(count).padStart(2, '0')), /*#__PURE__*/React.createElement("strong", null, item.label), /*#__PURE__*/React.createElement("p", null, item.desc)));
};
function App() {
  // ESTADO PARA CONTROLAR QUÉ MODELO 3D SE MUESTRA
  const [modelSrc, setModelSrc] = useState('sadrif_3d.glb');
  const [autoRotate, setAutoRotate] = useState(true);
  const [activeView, setActiveView] = useState('frontal');
  const [specOpen, setSpecOpen] = useState(false);
  const [openSpecItem, setOpenSpecItem] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [videoOn, setVideoOn] = useState(false);
  const modelRef = useRef(null);

  /* Alguns sistemes operatius tenen activada l'opció "reduir el moviment"
     (per marejos, migranyes o epilèpsia fotosensible). Només en aquest cas
     aturem el que es mou tot sol; per a la resta de visitants la web
     conserva totes les animacions. */
  const MENYS_MOVIMENT = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroWords = ['autònoma i alimentada amb energia solar', 'resistent a la intempèrie del bosc', 'equipada amb 4 sensors ambientals', 'dissenyada i impresa en 3D', 'connectada al núvol en temps real'];
  const marqueeTexts = ["DISPOSITIU SADRIF • ENERGIA SOLAR AUTÒNOMA • ESP32 + 4 SENSORS", "CARCASSA IMPRESA EN 3D • RESISTENT A LA INTEMPÈRIE • DADES EN TEMPS REAL"];
  const quickSpecs = [{
    icon: 'solar',
    label: 'Alimentació solar autònoma'
  }, {
    icon: 'thermometer',
    label: '4 sensors ambientals'
  }, {
    icon: 'wifi',
    label: 'Enviament de dades per Wi-Fi'
  }, {
    icon: 'layers',
    label: 'Carcassa impresa en 3D'
  }];

  /* ===== FITXA TÈCNICA =====
     Cada component és desplegable: capçalera curta i, en obrir-lo,
     l'explicació completa i les seves dades clau. */
  const specGroups = [{
    group: 'Cervell i comunicacions',
    items: [{
      ico: 'chip',
      name: 'ESP32 STEAMakers',
      sub: 'Microcontrolador principal',
      detail: "És el cervell del dispositiu. Llegeix els quatre sensors ambientals cada pocs segons, aplica el model de risc del 30-30-30 i envia el resultat al núvol per Wi-Fi. També és qui refresca la pantalla OLED perquè les dades es puguin consultar directament al bosc, sense connexió.",
      meta: ['Doble nucli a 240 MHz', 'Wi-Fi 2,4 GHz', 'Programat en C++ (Arduino)']
    }, {
      ico: 'camera',
      name: 'ESP32-CAM',
      sub: 'Mòdul de vigilància visual',
      detail: "Mòdul independent amb càmera integrada que permet veure l'entorn real de l'estació. Serveix per confirmar visualment què està passant quan les lectures dels sensors disparen el nivell de risc: no és el mateix una pujada de temperatura per una onada de calor que una columna de fum.",
      meta: ['Sensor OV2640', 'Captura sota demanda', 'Visor integrat al panell web']
    }, {
      ico: 'cloud',
      name: 'Connexió al núvol (ThingSpeak)',
      sub: 'Enviament i historial de dades',
      detail: "Cada lectura viatja per Wi-Fi fins a ThingSpeak, una plataforma d'IoT que guarda l'històric complet. D'allà les llegeix el panell web en temps real. Això vol dir que les dades no es perden si algú tanca la pàgina i que es pot consultar l'evolució de setmanes anteriors.",
      meta: ['Enviament periòdic', 'Historial permanent', 'Accés obert des del web']
    }]
  }, {
    group: 'Sensors ambientals',
    items: [{
      ico: 'thermometer',
      name: 'DHT11',
      sub: 'Temperatura i humitat relativa',
      detail: "Mesura dos dels tres factors de la regla del 30-30-30. Com més alta és la temperatura i més baixa la humitat, més sec està el combustible vegetal i més fàcil és que una espurna acabi en incendi. És el sensor que més pes té en el càlcul del risc.",
      meta: ['Temperatura: 0–50 °C', 'Humitat: 20–90 %', 'Llindars crítics: 30 °C / 30 %']
    }, {
      ico: 'gauge',
      name: 'BMP280',
      sub: 'Pressió baromètrica',
      detail: "Registra la pressió atmosfèrica. No forma part de la regla del 30-30-30, però contextualitza la resta de lectures: una baixada brusca de pressió acostuma a anunciar un canvi de temps que pot alterar completament les condicions del bosc en poques hores.",
      meta: ['Rang: 300–1100 hPa', 'Bus I²C', 'Indicador complementari']
    }, {
      ico: 'wind',
      name: 'Anemòmetre',
      sub: 'Velocitat del vent',
      detail: "El vent és el factor que més accelera la propagació del foc: aporta oxigen a les flames i transporta espurnes que obren nous focus lluny del punt inicial. Per sobre de 30 km/h, un incendi pot avançar més ràpid del que els equips terrestres poden reaccionar.",
      meta: ['Lectura en km/h', 'Llindar crític: 30 km/h', 'Tercer factor del 30-30-30']
    }, {
      ico: 'air',
      name: 'SEN-CCS811B',
      sub: "Qualitat de l'aire i CO₂",
      detail: "Detecta la concentració de CO₂ equivalent i de compostos orgànics volàtils. És l'indici més primerenc de combustió: quan alguna cosa comença a cremar-se, aquests valors pugen abans que el fum sigui visible a simple vista.",
      meta: ['eCO₂ i TVOC', 'Detecció precoç de combustió', 'Bus I²C']
    }]
  }, {
    group: 'Interfície local',
    items: [{
      ico: 'display',
      name: 'Pantalla OLED 0,96"',
      sub: 'Lectures visibles al mateix dispositiu',
      detail: "Mostra les mesures i el nivell de risc directament sobre la caixa. És clau perquè el dispositiu segueixi sent útil encara que la cobertura Wi-Fi falli: qui s'acosti a l'estació pot veure l'estat del bosc en aquell moment sense necessitat de cap pantalla externa.",
      meta: ['128 × 64 píxels', 'Funciona sense connexió', 'Consum molt baix']
    }]
  }, {
    group: 'Alimentació autònoma',
    power: true,
    items: [{
      ico: 'solar',
      name: 'Mini plaques solars',
      sub: 'Font d\'energia principal',
      detail: "Alimenten el dispositiu durant el dia i, alhora, recarreguen la bateria per a la nit. Són el motiu pel qual l'estació pot estar instal·lada enmig del bosc, lluny de qualsevol endoll, i seguir funcionant indefinidament.",
      meta: ['Orientació al sol', 'Recàrrega diürna', 'Sense manteniment']
    }, {
      ico: 'batteryCharging',
      name: 'Mòdul de càrrega TP4056',
      sub: 'Gestió segura de la bateria',
      detail: "Controla com es carrega la bateria de liti i la protegeix de sobrecàrregues i descàrregues profundes, els dos motius que més escurcen la vida d'aquest tipus de bateries. Sense aquest mòdul, l'estació duraria unes poques setmanes.",
      meta: ['Protecció de sobrecàrrega', 'Tall per descàrrega profunda', 'Càrrega per USB']
    }, {
      ico: 'battery',
      name: 'Bateria de liti',
      sub: 'Autonomia nocturna i dies ennuvolats',
      detail: "Guarda l'energia sobrant del dia per mantenir el dispositiu actiu quan no hi ha sol. La versió compacta munta entre 3.000 i 3.500 mAh; la versió d'autonomia estesa, entre 4.000 i 5.000 mAh, pensada per a èpoques de menys hores de llum.",
      meta: ['3,7 V nominals', '3.000–3.500 mAh (compacta)', '4.000–5.000 mAh (estesa)']
    }, {
      ico: 'bolt',
      name: 'Convertidor Step-Up MT3608',
      sub: 'Elevador de tensió',
      detail: "La bateria dona 3,7 V, però l'ESP32 i els sensors en necessiten 5. Aquest convertidor eleva la tensió i la manté estable encara que la bateria es vagi descarregant, de manera que les lectures no es distorsionen quan queda poca càrrega.",
      meta: ['3,7 V → 5 V', 'Sortida estabilitzada', 'Alt rendiment']
    }, {
      ico: 'cable',
      name: 'Cablejat i protoboard',
      sub: 'Connexionat del conjunt',
      detail: "Uneix tots els mòduls dins de la carcassa. El muntatge està pensat perquè qualsevol component es pugui substituir per separat sense desmuntar la resta de l'estació, cosa important per al manteniment al bosc.",
      meta: ['Muntatge modular', 'Components substituïbles', 'Cablejat protegit']
    }]
  }, {
    group: 'Estructura i desplegament',
    items: [{
      ico: 'layers',
      name: 'Carcassa impresa en 3D',
      sub: 'Disseny propi, resistent a la intempèrie',
      detail: "Dissenyada i impresa per nosaltres. Protegeix l'electrònica de la pluja i del sol directe, però deixa passar l'aire cap als sensors: si la caixa fos completament tancada, les lectures de temperatura i humitat serien les de dins de la caixa, no les del bosc.",
      meta: ['Disseny propi', 'Ventilació dirigida als sensors', 'Peces reimprimibles']
    }, {
      ico: 'shield',
      name: 'Model de risc 30-30-30',
      sub: 'Puntuació de 0 a 100',
      detail: "Les lectures no es mostren en cru: es converteixen en una puntuació de risc de 0 a 100. La regla del 30-30-30 marca l'escenari crític — 30 °C o més, 30 % d'humitat o menys i 30 km/h de vent o més alhora — i el sistema avisa quan s'hi acosta.",
      meta: ['Puntuació 0–100', 'Regla del 30-30-30', 'Avís automàtic al panell']
    }, {
      ico: 'mapPin',
      name: 'Ubicació actual',
      sub: 'Sabadell (Vallès Occidental)',
      detail: "L'estació està instal·lada en una zona forestal de Sabadell, al Vallès Occidental. És una zona de vegetació mediterrània amb risc real d'incendi durant l'estiu, cosa que permet validar el sistema amb dades autèntiques i no simulades.",
      meta: ['Sabadell, Vallès Occidental', 'Vegetació mediterrània', 'Dades reals, no simulades']
    }]
  }];

  /* Com funciona: el recorregut de la dada, de l'aire fins al teu mòbil */
  const flowSteps = [{
    ico: 'thermometer',
    n: 'PAS 01',
    title: 'Mesura',
    text: "Els quatre sensors prenen lectures de temperatura, humitat, vent i qualitat de l'aire de manera contínua, dia i nit."
  }, {
    ico: 'chip',
    n: 'PAS 02',
    title: 'Calcula',
    text: "L'ESP32 creua les quatre variables amb el model del 30-30-30 i les converteix en una puntuació de risc de 0 a 100."
  }, {
    ico: 'wifi',
    n: 'PAS 03',
    title: 'Envia',
    text: 'El resultat viatja per Wi-Fi fins a ThingSpeak, que guarda cada lectura i en manté tot l\'històric.'
  }, {
    ico: 'shield',
    n: 'PAS 04',
    title: 'Avisa',
    text: "El panell web es refresca en temps real i dispara una alerta visible quan els tres llindars crítics es compleixen alhora."
  }];
  const powerChain = [{
    ico: 'solar',
    name: 'Plaques solars',
    desc: "Capten l'energia del sol"
  }, {
    ico: 'batteryCharging',
    name: 'TP4056',
    desc: 'Regula i protegeix la càrrega'
  }, {
    ico: 'battery',
    name: 'Bateria de liti',
    desc: '3,7 V per a la nit'
  }, {
    ico: 'bolt',
    name: 'Step-Up MT3608',
    desc: 'Eleva 3,7 V fins a 5 V'
  }, {
    ico: 'chip',
    name: 'ESP32 i sensors',
    desc: 'Alimentats a 5 V estables'
  }];
  const stats = [{
    num: 24,
    unit: 'h',
    label: 'Vigilància contínua',
    sub: 'Cada dia de l\'any, sense pauses'
  }, {
    num: 4,
    unit: '',
    label: 'Sensors ambientals',
    sub: 'Temperatura, humitat, vent i aire'
  }, {
    num: 0,
    unit: 'W',
    label: 'Consum de xarxa',
    sub: 'Funciona només amb energia solar'
  }, {
    num: 100,
    unit: '%',
    label: 'Dades obertes',
    sub: 'Consultables per qualsevol persona'
  }];
  const faqs = [{
    q: 'Què passa de nit o els dies ennuvolats?',
    a: "La bateria de liti acumula durant el dia l'energia sobrant de les plaques solars. De nit, o quan hi ha poca llum, el dispositiu es continua alimentant d'aquesta reserva, de manera que la vigilància no s'interromp en cap moment."
  }, {
    q: 'Detecta el foc o el risc que es produeixi?',
    a: "Detecta el risc, que és precisament la diferència. Quan un incendi ja és visible, sovint ja s'ha propagat massa. SADRIF vigila les condicions ambientals que fan possible que el foc s'origini i avisa abans, no després."
  }, {
    q: 'Per què la carcassa és impresa en 3D?',
    a: "Perquè ens permet dissenyar-la exactament a mida dels components i reimprimir qualsevol peça si es fa malbé. També abarateix moltíssim el cost: replicar l'estació en una altra zona del bosc només requereix el material d'impressió i l'electrònica."
  }, {
    q: 'Les dades són reals o simulades?',
    a: "Les de l'estació de Sabadell són reals i venen directament del dispositiu instal·lat al bosc. Al mapa del panell, les altres províncies catalanes es mostren amb valors de referència per poder comparar, i estan identificades com a tals."
  }, {
    q: "Es pot veure l'estació en realitat augmentada?",
    a: "Sí. Des d'un mòbil o una tauleta compatible, el botó de realitat augmentada del visor 3D projecta el dispositiu a mida real a l'espai que tinguis al davant, de manera que en pots comprovar les dimensions autèntiques."
  }, {
    q: "Qui hi ha darrere del projecte?",
    a: "Quatre alumnes de 2n de Batxillerat de l'Institut Sabadell. SADRIF és el nostre Treball de Recerca: el disseny 3D, el muntatge electrònic, la programació i aquesta mateixa web els hem fet nosaltres."
  }];
  const setView = (name, orbit) => {
    setActiveView(name);
    if (modelRef.current) {
      modelRef.current.cameraOrbit = orbit;
    }
  };
  const handleAR = () => {
    const mv = modelRef.current;
    if (mv && typeof mv.activateAR === 'function') {
      mv.activateAR();
    }
  };

  /* Galeria de components.
     SUBSTITUIR per fotografies reals: veure ASSETS-NECESSARIS.md */
  const componentsItems = [{
    image: 'foto-caja-sadrif.jpeg',
    label: 'Dispositiu SADRIF — Muntatge complet',
    desc: "El conjunt acabat: la carcassa impresa en 3D amb les tres mini plaques solars al frontal, l'anemòmetre de cassoletes a la part superior i les reixes laterals que deixen circular l'aire fins als sensors. Tot el que hi ha a la resta de la galeria viu aquí dins."
  }, {
    image: 'foto-component-esp32.jpeg',
    label: 'ESP32 STEAMakers — Placa principal',
    desc: "La placa que ho controla tot, amb el mòdul ESP32-WROOM-32 al centre. Els connectors grocs i vermells són els ports on s'endollen directament els sensors, sense haver de soldar-los: per això vam triar aquesta placa i no una ESP32 pelada."
  }, {
    image: 'foto-component-sensors.jpeg',
    label: 'DHT11 i BMP280 — Temperatura, humitat i pressió',
    desc: "Els dos sensors que donen dos dels tres factors del 30-30-30. A dalt, el BMP280 (pressió atmosfèrica); a baix, el DHT11, el mòdul blau amb la reixeta, que mesura temperatura i humitat relativa de l'aire."
  }, {
    image: 'foto-component-anemometre.jpeg',
    label: 'Anemòmetre — Velocitat del vent',
    desc: "Les tres cassoletes giren amb el vent i el sensor compta les voltes per segon per traduir-les a km/h. És el tercer factor de la regla i el més determinant: el vent és el que fa que un foc petit es converteixi en un incendi."
  }, {
    image: 'foto-component-cam.jpeg',
    label: 'ESP32-CAM — Vigilància visual del bosc',
    desc: "Mòdul amb càmera OV2640 i el seu propi microcontrolador. Serveix per confirmar amb els ulls què està passant quan les dades disparen el risc: distingir una onada de calor d'una columna de fum."
  }, {
    image: 'foto-component-energia.jpeg',
    label: 'Plaques solars, TP4056 i bateria — Energia autònoma',
    desc: "A dalt, una de les mini plaques solars de 80 × 45 mm vista pel davant i pel darrere. A baix, el mòdul de càrrega TP4056, que és qui regula l'energia que entra a la bateria i evita sobrecàrregues."
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "font-sans"
  }, /*#__PURE__*/React.createElement("header", {
    className: "hero-container flex flex-col items-center text-center py-20 px-4 min-h-[50vh] justify-center relative"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-eyebrow-chip"
  }, "Dispositiu SADRIF"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl sm:text-5xl md:text-6xl font-extrabold flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 md:gap-4 text-slate-800 max-w-5xl"
  }, /*#__PURE__*/React.createElement("span", null, "L'estaci\xF3 SADRIF \xE9s"), /*#__PURE__*/React.createElement(RotatingText, {
    texts: heroWords,
    auto: !MENYS_MOVIMENT,
    mainClassName: "px-5 py-2 bg-emerald-500 text-white rounded-xl overflow-hidden justify-center inline-flex shadow-lg shadow-emerald-500/20",
    staggerFrom: "first",
    initial: {
      y: "100%",
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1
    },
    exit: {
      y: "-120%",
      opacity: 0
    },
    staggerDuration: 0.02,
    splitLevelClassName: "overflow-hidden pb-1",
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 350
    },
    rotationInterval: 3000
  })), /*#__PURE__*/React.createElement("p", {
    className: "mt-7 text-lg sm:text-xl text-slate-600 max-w-3xl leading-relaxed"
  }, "L'estaci\xF3 f\xEDsica que vigila el bosc les 24 hores del dia, instal\xB7lada a Sabadell."), /*#__PURE__*/React.createElement("div", {
    className: "quick-specs-grid mt-10 max-w-2xl w-full"
  }, quickSpecs.map((spec, i) => /*#__PURE__*/React.createElement("div", {
    className: "quick-spec-card",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "quick-spec-icon"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: spec.icon,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    className: "quick-spec-label"
  }, spec.label))))), /*#__PURE__*/React.createElement("div", {
    className: "bg-emerald-50 py-8 border-y border-emerald-100"
  }, /*#__PURE__*/React.createElement(ScrollVelocity, {
    texts: marqueeTexts,
    velocity: 30,
    className: "custom-scroll-text",
    numCopies: 4
  })), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-sadrif-seccion"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-5xl font-bold text-slate-900"
  }, "El Dispositiu al Detall"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-lg"
  }, "Gira'l, fes zoom, obre'l per veure'n l'interior o projecta'l a mida real amb Realitat Augmentada.")), /*#__PURE__*/React.createElement("div", {
    className: "viewer-shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "viewer-stage model-container"
  }, /*#__PURE__*/React.createElement("model-viewer", {
    ref: modelRef,
    src: modelSrc,
    alt: "Model 3D del dispositiu SADRIF",
    "auto-rotate": autoRotate ? true : undefined,
    "camera-controls": true,
    "camera-orbit": "0deg 75deg auto",
    ar: true,
    "ar-modes": "webxr scene-viewer quick-look",
    "shadow-intensity": "1",
    "environment-image": "neutral",
    exposure: "1",
    loading: "lazy",
    style: {
      width: '100%',
      height: '100%',
      borderRadius: '18px',
      outline: 'none'
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "viewer-hint"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "rotate",
    size: 14
  }), " Arrossega per girar \xB7 pessiga per fer zoom"))), /*#__PURE__*/React.createElement("div", {
    className: "model-toolbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "toolbar-group"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setModelSrc('sadrif_3d.glb'),
    className: `toolbar-btn ${modelSrc === 'sadrif_3d.glb' ? 'actiu' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "cube",
    size: 16
  }), " Dispositiu Tancat"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setModelSrc('sadrif_inside.glb'),
    className: `toolbar-btn ${modelSrc === 'sadrif_inside.glb' ? 'actiu' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "wrench",
    size: 16
  }), " Dispositiu Obert (Interior)")), /*#__PURE__*/React.createElement("div", {
    className: "toolbar-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "toolbar-group"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('frontal', '0deg 75deg auto'),
    className: `toolbar-btn ${activeView === 'frontal' ? 'actiu' : ''}`
  }, "Vista Frontal"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('lateral', '90deg 75deg auto'),
    className: `toolbar-btn ${activeView === 'lateral' ? 'actiu' : ''}`
  }, "Vista Lateral"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setView('superior', '0deg 20deg auto'),
    className: `toolbar-btn ${activeView === 'superior' ? 'actiu' : ''}`
  }, "Vista Superior")), /*#__PURE__*/React.createElement("div", {
    className: "toolbar-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "toolbar-group"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAutoRotate(v => !v),
    className: `toolbar-btn ${autoRotate ? 'actiu' : ''}`
  }, /*#__PURE__*/React.createElement(Icon, {
    name: autoRotate ? 'pause' : 'play',
    size: 15
  }), autoRotate ? 'Aturar rotació' : 'Rotació automàtica'), /*#__PURE__*/React.createElement("button", {
    onClick: handleAR,
    className: "toolbar-btn ar-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "ar",
    size: 16
  }), " Veure en Realitat Augmentada")))), /*#__PURE__*/React.createElement("section", {
    className: "video-section py-20 px-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "video-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "video-head"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hero-eyebrow-chip"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "youtube",
    size: 14
  }), " V\xEDdeo"), /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-5xl font-bold"
  }, "SADRIF en moviment"), /*#__PURE__*/React.createElement("p", null, "Del disseny 3D fins a l'estaci\xF3 instal\xB7lada al bosc de Sabadell, explicat en v\xEDdeo.")), videoOn ? /*#__PURE__*/React.createElement("div", {
    className: "yt-facade"
  }, /*#__PURE__*/React.createElement("iframe", {
    src: "https://www.youtube-nocookie.com/embed/5t9_Szm1RwA?autoplay=1&rel=0&modestbranding=1",
    title: "V\xEDdeo del projecte SADRIF",
    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
    referrerPolicy: "strict-origin-when-cross-origin",
    allowFullScreen: true
  })) : /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "yt-facade",
    onClick: () => setVideoOn(true),
    "aria-label": "Reproduir el v\xEDdeo del projecte SADRIF"
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://i.ytimg.com/vi/5t9_Szm1RwA/maxresdefault.jpg",
    alt: "Miniatura del v\xEDdeo del projecte SADRIF",
    loading: "lazy",
    onError: e => {
      e.target.onerror = null;
      e.target.src = 'https://i.ytimg.com/vi/5t9_Szm1RwA/hqdefault.jpg';
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "yt-veil"
  }), /*#__PURE__*/React.createElement("span", {
    className: "yt-play"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "play",
    size: 34
  })), /*#__PURE__*/React.createElement("span", {
    className: "yt-caption"
  }, /*#__PURE__*/React.createElement("span", {
    className: "yt-badge"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "youtube",
    size: 13
  }), " YouTube"), /*#__PURE__*/React.createElement("strong", null, "Pla DRIF \u2014 El projecte SADRIF"))))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-sadrif-seccion"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-5xl font-bold text-slate-900"
  }, "Com funciona"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-lg"
  }, "El recorregut complet d'una dada: des de l'aire del bosc fins a l'alerta de la teva pantalla.")), /*#__PURE__*/React.createElement("div", {
    className: "flow-grid"
  }, flowSteps.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "flow-step",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "flow-step-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flow-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.ico,
    size: 22
  })), /*#__PURE__*/React.createElement("span", {
    className: "flow-n"
  }, s.n)), /*#__PURE__*/React.createElement("h4", null, s.title), /*#__PURE__*/React.createElement("p", null, s.text)))), /*#__PURE__*/React.createElement("div", {
    className: "power-card"
  }, /*#__PURE__*/React.createElement("h4", null, "I tot aix\xF2, sense endoll"), /*#__PURE__*/React.createElement("p", null, "L'estaci\xF3 \xE9s al mig del bosc, aix\xED que ha de generar-se la seva pr\xF2pia energia. Aquesta \xE9s la cadena que la mant\xE9 funcionant les 24 hores."), /*#__PURE__*/React.createElement("div", {
    className: "power-chain"
  }, powerChain.map((n, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "power-node",
    style: {
      '--n': i
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "power-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.ico,
    size: 22
  })), /*#__PURE__*/React.createElement("strong", null, n.name), /*#__PURE__*/React.createElement("span", null, n.desc)), i < powerChain.length - 1 && /*#__PURE__*/React.createElement("span", {
    className: "power-link",
    style: {
      '--n': i
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrowRight",
    size: 18
  }))))))), /*#__PURE__*/React.createElement("section", {
    className: "py-16 px-4 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stats-band"
  }, stats.map((s, i) => /*#__PURE__*/React.createElement("div", {
    className: "stat-card",
    key: i
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-num"
  }, /*#__PURE__*/React.createElement(CountUp, {
    to: s.num,
    duration: 1400 + i * 120
  }), /*#__PURE__*/React.createElement("small", null, s.unit)), /*#__PURE__*/React.createElement("div", {
    className: "stat-label"
  }, s.label), /*#__PURE__*/React.createElement("div", {
    className: "stat-sub"
  }, s.sub))))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spec-sheet-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "text-xl sm:text-2xl font-extrabold text-slate-900 m-0"
  }, "Fitxa T\xE8cnica"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-500 text-sm mt-1"
  }, "Tots els components del dispositiu. Obre'n qualsevol per veure'n l'explicaci\xF3 completa.")), /*#__PURE__*/React.createElement("button", {
    className: `spec-sheet-toggle-btn ${specOpen ? 'obert' : ''}`,
    onClick: () => setSpecOpen(v => !v),
    "aria-expanded": specOpen
  }, specOpen ? 'Amagar fitxa' : 'Veure fitxa completa', /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    size: 16,
    stroke: 2
  }))), /*#__PURE__*/React.createElement("div", {
    className: `spec-sheet-body ${specOpen ? 'obert' : ''}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "spec-sheet-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "spec-groups"
  }, specGroups.map((g, gi) => /*#__PURE__*/React.createElement("div", {
    key: gi
  }, /*#__PURE__*/React.createElement("div", {
    className: "spec-group-title"
  }, g.group), /*#__PURE__*/React.createElement("ul", {
    className: "spec-list"
  }, g.items.map((it, ii) => {
    const id = `${gi}-${ii}`;
    const obert = openSpecItem === id;
    return /*#__PURE__*/React.createElement("li", {
      className: cn('spec-item', g.power && 'spec-item--power', obert && 'obert'),
      key: ii
    }, /*#__PURE__*/React.createElement("button", {
      className: "spec-item-head",
      onClick: () => setOpenSpecItem(obert ? null : id),
      "aria-expanded": obert
    }, /*#__PURE__*/React.createElement("span", {
      className: "spec-item-ico"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: it.ico,
      size: 19
    })), /*#__PURE__*/React.createElement("span", {
      className: "spec-item-txt"
    }, /*#__PURE__*/React.createElement("strong", null, it.name), /*#__PURE__*/React.createElement("span", null, it.sub)), /*#__PURE__*/React.createElement(Icon, {
      name: "chevronDown",
      size: 18,
      className: "spec-item-chev"
    })), /*#__PURE__*/React.createElement("div", {
      className: "spec-item-body"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "spec-item-detail"
    }, /*#__PURE__*/React.createElement("p", null, it.detail), /*#__PURE__*/React.createElement("div", {
      className: "spec-meta"
    }, it.meta.map((m, mi) => /*#__PURE__*/React.createElement("span", {
      key: mi
    }, m)))))));
  }))))))))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-sadrif-seccion"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-5xl font-bold text-slate-900"
  }, "Arquitectura del Sistema"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-lg"
  }, "Explora els components que fan possible la detecci\xF3 immediata: toca o passa el ratol\xED per cada pe\xE7a.")), /*#__PURE__*/React.createElement("div", {
    className: "gallery-wrap-card"
  }, /*#__PURE__*/React.createElement(AccordionGallery, {
    items: componentsItems
  }))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-white"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-sadrif-seccion"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-5xl font-bold text-slate-900"
  }, "Preguntes freq\xFCents"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-lg"
  }, "Els dubtes que ens plantegen m\xE9s sovint sobre el dispositiu.")), /*#__PURE__*/React.createElement("div", {
    className: "faq-list"
  }, faqs.map((f, i) => /*#__PURE__*/React.createElement("div", {
    className: cn('faq-item', openFaq === i && 'obert'),
    key: i
  }, /*#__PURE__*/React.createElement("button", {
    className: "faq-q",
    onClick: () => setOpenFaq(openFaq === i ? null : i),
    "aria-expanded": openFaq === i
  }, f.q, /*#__PURE__*/React.createElement(Icon, {
    name: "chevronDown",
    size: 19
  })), /*#__PURE__*/React.createElement("div", {
    className: "faq-a"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", null, f.a))))))), /*#__PURE__*/React.createElement("section", {
    className: "py-20 px-4 bg-slate-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "header-sadrif-seccion"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-3xl sm:text-4xl font-bold text-slate-900"
  }, "Segueix explorant"), /*#__PURE__*/React.createElement("p", {
    className: "text-slate-600 text-lg"
  }, "El dispositiu \xE9s nom\xE9s una part del projecte.")), /*#__PURE__*/React.createElement("div", {
    className: "explore-cta-grid"
  }, /*#__PURE__*/React.createElement("a", {
    href: "index.html",
    className: "explore-cta-card"
  }, /*#__PURE__*/React.createElement("strong", null, "Panell en Directe"), /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "Consulta les dades en temps real de temperatura, humitat, vent i risc d'incendi de l'estaci\xF3."), /*#__PURE__*/React.createElement("span", {
    className: "explore-cta-arrow"
  }, "Veure el panell ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrowRight",
    size: 15
  }))), /*#__PURE__*/React.createElement("a", {
    href: "sobre-nosotros.html",
    className: "explore-cta-card"
  }, /*#__PURE__*/React.createElement("strong", null, "La Hist\xF2ria del Projecte"), /*#__PURE__*/React.createElement("span", {
    className: "sub"
  }, "Descobreix per qu\xE8 vam crear SADRIF, com l'hem constru\xEFt i qui hi ha darrere."), /*#__PURE__*/React.createElement("span", {
    className: "explore-cta-arrow"
  }, "Descobrir el projecte ", /*#__PURE__*/React.createElement(Icon, {
    name: "arrowRight",
    size: 15
  }))))), /*#__PURE__*/React.createElement("footer", {
    className: "site-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-brand"
  }, /*#__PURE__*/React.createElement("a", {
    href: "index.html",
    className: "footer-brand-logo"
  }, /*#__PURE__*/React.createElement("img", {
    src: "logo-sadrif.svg",
    alt: "",
    onError: e => {
      e.target.onerror = null;
      e.target.src = 'logo-sadrif.svg.svg';
    }
  }), /*#__PURE__*/React.createElement("span", null, "PLA DRIF")), /*#__PURE__*/React.createElement("p", null, "Estaci\xF3 aut\xF2noma de detecci\xF3 de risc d'incendis forestals, instal\xB7lada en una zona forestal de Sabadell. Treball de Recerca de 2n de Batxillerat."), /*#__PURE__*/React.createElement("div", {
    className: "footer-social"
  }, /*#__PURE__*/React.createElement("a", {
    href: "https://www.youtube.com/@PlaDRIF_Oficial",
    target: "_blank",
    rel: "noopener",
    "aria-label": "Canal de YouTube"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "youtube",
    size: 19
  })), /*#__PURE__*/React.createElement("a", {
    href: "https://www.instagram.com/pladrif_cat",
    target: "_blank",
    rel: "noopener",
    "aria-label": "Instagram"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "instagram",
    size: 19
  })), /*#__PURE__*/React.createElement("a", {
    href: "https://www.twitch.tv/pla_drif",
    target: "_blank",
    rel: "noopener",
    "aria-label": "Directe a Twitch"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "twitch",
    size: 19
  })))), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h5", null, "El projecte"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "index.html"
  }, "Panell en directe")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "producto3d.html"
  }, "Dispositiu en 3D")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "sobre-nosotros.html"
  }, "Sobre el projecte")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "index.html#contenedor-visor"
  }, "C\xE0mera de vigil\xE0ncia")))), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h5", null, "El dispositiu"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "producto3d.html"
  }, "Fitxa t\xE8cnica")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "producto3d.html"
  }, "Com funciona")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "producto3d.html"
  }, "Preguntes freq\xFCents")), /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: "https://www.youtube.com/watch?v=5t9_Szm1RwA",
    target: "_blank",
    rel: "noopener"
  }, "V\xEDdeo del projecte")))), /*#__PURE__*/React.createElement("div", {
    className: "footer-col"
  }, /*#__PURE__*/React.createElement("h5", null, "Amb el suport de"), /*#__PURE__*/React.createElement("div", {
    className: "footer-partners"
  }, /*#__PURE__*/React.createElement("div", {
    className: "footer-partner-chip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "logo-sabadell.png",
    alt: "Ajuntament de Sabadell",
    onError: e => {
      e.target.onerror = null;
      e.target.src = 'logo-sabadell.png.png';
    }
  }), /*#__PURE__*/React.createElement("span", null, "Ajuntament", /*#__PURE__*/React.createElement("br", null), "de Sabadell")), /*#__PURE__*/React.createElement("div", {
    className: "footer-partner-chip"
  }, /*#__PURE__*/React.createElement("img", {
    src: "logo-generalitat.png",
    alt: "Generalitat de Catalunya",
    onError: e => {
      e.target.onerror = null;
      e.target.src = 'logo-generalitat.png.png';
    }
  }), /*#__PURE__*/React.createElement("span", null, "Generalitat", /*#__PURE__*/React.createElement("br", null), "de Catalunya"))))), /*#__PURE__*/React.createElement("div", {
    className: "footer-bottom"
  }, /*#__PURE__*/React.createElement("p", {
    className: "footer-legal"
  }, /*#__PURE__*/React.createElement("strong", null, "Pla DRIF"), " \xE9s un Treball de Recerca de 2n de Batxillerat. No tenim cap vinculaci\xF3 oficial amb les entitats mostrades ni en representem cap."), /*#__PURE__*/React.createElement("p", null, "\xA9 2026 Pla DRIF. Tots els drets reservats."))));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(/*#__PURE__*/React.createElement(App, null));