// Datos del portafolio.
// NOTA: varios campos son marcadores de posición (alias, bio, enlaces de GitHub).
// Reemplázalos por los datos reales cuando los tengas.

export const PROFILE = {
  alias: 'CHOCOS',
  bio: 'Desarrollador full-stack y cacharrero. Construyo bots, hardware ' +
       'y herramientas raras — del firmware al frontend, pixel a pixel.',
  contacts: [
    { label: 'EMAIL',  value: 'g.lugo.dev@gmail.com',  href: 'mailto:g.lugo.dev@gmail.com' },
    { label: 'GITHUB', value: 'github.com/chocos',     href: 'https://github.com/chocos' },
  ],
};

export const PROJECTS = [
  {
    id: 'heart',
    code: 'P1',
    short: 'HEART',
    title: 'HEART PROJECT',
    color: '#1ee6e6',
    icon: 'heart',
    tagline: 'Monitor de ECG y pulso con sensor Polar H10.',
    bullets: [
      'Lectura de ECG raw, frecuencia cardiaca e intervalos RR via Bluetooth.',
      'App nativa en Swift para macOS.',
      'Datos de salud para entrenar un maraton.',
    ],
    link: 'https://github.com/chocos/heart-project',
    linkLabel: 'VER EN GITHUB',
  },
  {
    id: 'lipsync',
    code: 'P2',
    short: 'LIPSYNC',
    title: 'LIPSYNC CORRECTOR',
    color: '#ffe22e',
    icon: 'clapper',
    tagline: 'Corrige el lip-sync de videos de YouTube auto-doblados.',
    bullets: [
      'Pipeline en Python para macOS Apple Silicon.',
      'Face-swap como primera fase y correccion de labios despues.',
      'Procesa video con ffmpeg y modelos locales.',
    ],
    link: 'https://github.com/chocos/lipsync-corrector',
    linkLabel: 'VER EN GITHUB',
  },
  {
    id: 'bot',
    code: 'P3',
    short: 'BOT',
    title: 'CHOCOSFERA BOT',
    color: '#ff2e88',
    icon: 'robot',
    tagline: 'Bot de Telegram cripto con token propio y NFTs.',
    bullets: [
      'Registro de usuarios con tokens hasheados en base de datos.',
      'Token ERC-20 propio y minteo de NFTs sobre IPFS.',
      'Proyecto educativo de codigo abierto.',
    ],
    link: 'https://github.com/chocos/chocosferaBot',
    linkLabel: 'VER EN GITHUB',
  },
];
