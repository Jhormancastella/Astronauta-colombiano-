// --- INTERNACIONALIZACIÓN (ES / EN) ---
export const LANGS = ['ES', 'EN'];
let _lang = localStorage.getItem('lang') ?? 'ES';

export function getLang()    { return _lang; }
export function setLang(l)   { _lang = l; localStorage.setItem('lang', l); }
export function toggleLang() { setLang(_lang === 'ES' ? 'EN' : 'ES'); }

const T = {
    // Menú principal
    newGame:   { ES: 'NUEVA PARTIDA', EN: 'NEW GAME'    },
    options:   { ES: 'OPCIONES',      EN: 'OPTIONS'     },
    credits:   { ES: 'CRÉDITOS',      EN: 'CREDITS'     },
    gallery:   { ES: 'GALERÍA',       EN: 'GALLERY'     },
    best:      { ES: '★ MEJOR',       EN: '★ BEST'      },
    tapSelect: { ES: 'Toca para seleccionar', EN: 'Tap to select' },
    navHint:   { ES: '↑↓ Navegar  ·  Enter Confirmar', EN: '↑↓ Navigate  ·  Enter Confirm' },

    // Nueva partida
    newGameTitle: { ES: 'NUEVA PARTIDA',        EN: 'NEW GAME'          },
    continueGame: { ES: '▶  CONTINUAR (CHECKPOINT)', EN: '▶  CONTINUE (CHECKPOINT)' },
    storyPlay:    { ES: '▶  VER HISTORIA + JUGAR', EN: '▶  STORY + PLAY'  },
    playDirect:   { ES: '▶▶ INICIAR DIRECTO',    EN: '▶▶ PLAY DIRECT'    },
    back:         { ES: '◀  VOLVER',             EN: '◀  BACK'           },
    navHint2:     { ES: '↑↓ Navegar  ·  Enter  ·  Esc Volver', EN: '↑↓ Navigate  ·  Enter  ·  Esc Back' },

    // Opciones tabs
    tabAudio:     { ES: 'AUDIO',      EN: 'AUDIO'      },
    tabDiff:      { ES: 'DIFICULTAD', EN: 'DIFFICULTY' },
    tabGfx:       { ES: 'GRÁFICOS',   EN: 'GRAPHICS'   },
    tabControls:  { ES: 'CONTROLES',  EN: 'CONTROLS'   },
    tabLang:      { ES: 'IDIOMA',     EN: 'LANGUAGE'   },
    optTitle:     { ES: 'OPCIONES',   EN: 'OPTIONS'    },
    back2:        { ES: '◀  VOLVER',  EN: '◀  BACK'    },

    // Audio
    sfxLabel:     { ES: 'Efectos de sonido', EN: 'Sound effects' },
    musicLabel:   { ES: 'Música',            EN: 'Music'         },
    muteLabel:    { ES: 'Silenciar todo',    EN: 'Mute all'      },
    audioInfo:    { ES: 'Audio cargado desde Cloudinary', EN: 'Audio loaded from Cloudinary' },
    audioInfo2:   { ES: 'El juego funciona sin audio (modo silencioso)', EN: 'Game works without audio (silent mode)' },

    // Dificultad
    diffTitle:    { ES: 'Nivel de dificultad', EN: 'Difficulty level' },
    diffEasy:     { ES: 'FÁCIL',   EN: 'EASY'   },
    diffNormal:   { ES: 'NORMAL',  EN: 'NORMAL' },
    diffHard:     { ES: 'DIFÍCIL', EN: 'HARD'   },
    diffDescE:    { ES: 'Menos fragmentos · Más oxígeno · Ideal para aprender', EN: 'Fewer fragments · More oxygen · Ideal for learning' },
    diffDescN:    { ES: 'Experiencia balanceada · Dificultad progresiva',        EN: 'Balanced experience · Progressive difficulty'        },
    diffDescH:    { ES: 'Fragmentos rápidos · Oxígeno escaso · Para expertos',   EN: 'Fast fragments · Scarce oxygen · For experts'        },
    rowSpeed:     { ES: 'Velocidad fragmentos', EN: 'Fragment speed'  },
    rowSpawn:     { ES: 'Frecuencia spawn',     EN: 'Spawn rate'      },
    rowOxy:       { ES: 'Drenaje de oxígeno',   EN: 'Oxygen drain'    },
    rowDrops:     { ES: 'Drops de items',       EN: 'Item drops'      },
    rowWeapon:    { ES: 'Mejora de arma',        EN: 'Weapon upgrade'  },
    valNormal:    { ES: 'Normal', EN: 'Normal' },
    valFast:      { ES: 'Rápida', EN: 'Fast'   },
    valLow:       { ES: 'Baja',   EN: 'Low'    },
    valMed:       { ES: 'Media',  EN: 'Medium' },
    valHigh:      { ES: 'Alta',   EN: 'High'   },
    valSlow:      { ES: 'Lento',  EN: 'Slow'   },
    valMore:      { ES: 'Más',    EN: 'More'   },
    valLess:      { ES: 'Menos',  EN: 'Less'   },

    // Gráficos
    gfxTitle:     { ES: 'Calidad visual',          EN: 'Visual quality'       },
    gfxLow:       { ES: 'BAJO',   EN: 'LOW'    },
    gfxMed:       { ES: 'MEDIO',  EN: 'MEDIUM' },
    gfxHigh:      { ES: 'ALTO',   EN: 'HIGH'   },
    gfxDescL:     { ES: 'Sin partículas · Sin viñeta · Máximo rendimiento', EN: 'No particles · No vignette · Max performance' },
    gfxDescM:     { ES: 'Configuración balanceada recomendada',              EN: 'Recommended balanced settings'                },
    gfxDescH:     { ES: 'Todos los efectos activos · Requiere GPU decente',  EN: 'All effects active · Requires decent GPU'     },
    partTitle:    { ES: 'Cantidad de partículas', EN: 'Particle count' },
    partFew:      { ES: 'POCAS',  EN: 'FEW'    },
    partNorm:     { ES: 'NORMAL', EN: 'NORMAL' },
    partMany:     { ES: 'MUCHAS', EN: 'MANY'   },
    shakeLabel:   { ES: 'Vibración de pantalla', EN: 'Screen shake'  },
    vigLabel:     { ES: 'Efecto viñeta',         EN: 'Vignette effect' },

    // Controles
    ctrlMove:     { ES: 'Mover',    EN: 'Move'    },
    ctrlShoot:    { ES: 'Disparar', EN: 'Shoot'   },
    ctrlPause:    { ES: 'Pausa',    EN: 'Pause'   },
    ctrlMenu:     { ES: 'Menú',     EN: 'Menu'    },
    ctrlMute:     { ES: 'Silenciar',EN: 'Mute'    },
    ctrlMoveM:    { ES: 'Mitad izquierda (joystick)',  EN: 'Left half (joystick)'    },
    ctrlShootM:   { ES: 'Mitad derecha (toca y mantén)', EN: 'Right half (hold)'     },
    ctrlPauseM:   { ES: 'Botón ❚❚ (arriba derecha)',   EN: 'Button ❚❚ (top right)'  },
    weaponInfo:   { ES: 'Mejoras de arma automáticas:', EN: 'Automatic weapon upgrades:' },
    weaponChain:  { ES: 'Simple → Doble → Triple → Láser', EN: 'Single → Double → Triple → Laser' },

    // Idioma
    langTitle:    { ES: 'Idioma del juego', EN: 'Game language' },
    langHint:     { ES: 'Selecciona el idioma de la interfaz', EN: 'Select interface language' },

    // Créditos
    credTitle:    { ES: 'CRÉDITOS',      EN: 'CREDITS'     },
    credDev:      { ES: 'Desarrollador', EN: 'Developer'   },
    credArt:      { ES: 'Arte & Sprites',EN: 'Art & Sprites'},
    credEngine:   { ES: 'Motor',         EN: 'Engine'      },
    credAudio:    { ES: 'Audio',         EN: 'Audio'       },
    credThanks:   { ES: 'Agradecimientos', EN: 'Special Thanks' },
    credVersion:  { ES: 'Versión',       EN: 'Version'     },

    // HUD en juego
    hudOxyLow:    { ES: '⚠ OXÍGENO BAJO ⚠',     EN: '⚠ LOW OXYGEN ⚠'    },
    hudFuelLow:   { ES: '⚠ COMBUSTIBLE BAJO ⚠', EN: '⚠ LOW FUEL ⚠'      },
    hudNextUpg:   { ES: 'próx. mejora:',          EN: 'next upgrade:'      },

    // Pausa
    pauseTitle: { ES: 'PAUSA',          EN: 'PAUSE'          },
    pauseCont:  { ES: '▶  CONTINUAR',    EN: '▶  CONTINUE'    },
    pauseOpt:   { ES: '⚙  OPCIONES',     EN: '⚙  OPTIONS'     },
    pauseExit:  { ES: '✖  SALIR AL MENÚ', EN: '✖  EXIT TO MENU' },
    pauseContPC: { ES: 'P / Space / Enter = Continuar', EN: 'P / Space / Enter = Continue' },
    pauseOptPC:  { ES: 'O = Opciones',                 EN: 'O = Options'                },
    pauseExitPC: { ES: 'Esc / Q = Salir al menú',      EN: 'Esc / Q = Exit to menu'     },

    // Game Over
    goTitle:      { ES: 'GAME OVER',       EN: 'GAME OVER'      },
    goOxy:        { ES: '💀 Sin oxígeno',   EN: '💀 No oxygen'   },
    goFuel:       { ES: '💀 Sin combustible', EN: '💀 No fuel'   },
    goDestroyed:  { ES: '💀 Destruido',     EN: '💀 Destroyed'   },
    goScore:      { ES: 'PUNTUACIÓN:',      EN: 'SCORE:'         },
    goTime:       { ES: 'TIEMPO:',          EN: 'TIME:'          },
    goLevel:      { ES: 'NIVEL:',           EN: 'LEVEL:'         },
    goRecord:     { ES: '★ NUEVO RÉCORD ★', EN: '★ NEW RECORD ★' },
    goBest:       { ES: 'MEJOR:',           EN: 'BEST:'          },
    goRestart:    { ES: 'TOCA PARA REINICIAR', EN: 'TAP TO RESTART' },
    goRestartPC:  { ES: 'ENTER  REINICIAR',    EN: 'ENTER  RESTART' },
    goMenuPC:     { ES: 'ESC  →  Menú principal', EN: 'ESC  →  Main menu' },

    // Historia
    storyControls: { ES: 'CONTROLES', EN: 'CONTROLS' },
    storyContinue: { ES: '▶ continuar', EN: '▶ continue' },
    storySkip:     { ES: 'ESC = saltar', EN: 'ESC = skip' },

    // Galería
    galTitle:     { ES: 'GALERÍA DE LOGROS', EN: 'ACHIEVEMENTS GALLERY' },
    galLocked:    { ES: 'BLOQUEADO',         EN: 'LOCKED'               },
    galLevel:     { ES: 'NIVEL',             EN: 'LEVEL'                },
    galUnlock:    { ES: 'Desbloqueado al nivel', EN: 'Unlocked at level' },
};

export function t(key) { return T[key]?.[_lang] ?? key; }
