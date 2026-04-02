# 👨‍🚀 Astronauta colombiano

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-E34C26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Canvas](https://img.shields.io/badge/Canvas-2D-purple.svg)
![Mobile](https://img.shields.io/badge/Mobile-Friendly-22c55e.svg)
![Cloudinary](https://img.shields.io/badge/Assets-Cloudinary-blue.svg)

---

## Imagen principal

<div align="center">
  <img 
    src="img/Ast.png" 
    alt="Astronauta colombiano - Personaje principal" 
    width="180" 
  >
</div>

---

## Web en vivo

<div align="center">
  <a href="https://jhormancastella.github.io/Astronauta-colombiano-/" target="_blank">
    <img src="https://img.shields.io/badge/Ver_web_en_vivo-Astronauta_colombiano-2EA043?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Ver web en vivo">
  </a>
</div>

---

## Descripción

**Astronauta colombiano** es un emocionante juego de acción y supervivencia espacial desarrollado en JavaScript puro. Ambientado en el año 2157, tomas el control del único sobreviviente de la estación orbital **KEPLER-9** tras un impacto catastrófico. Tu misión es navegar por el vacío, esquivar peligros cósmicos y recolectar suministros vitales mientras recuperas las reliquias de tus compañeros caídos.

---

## Características principales

- **Narrativa Envolvente**:
  - Modo historia con efecto de escritura (typewriter).
  - Créditos cinematográficos con efecto de perspectiva **Star Wars**.

- **Sistema de Progresión y Guardado**:
  - **Checkpoints (Reliquias)**: Encuentra restos de astronautas cada 5 niveles para guardar tu nivel y puntuación actual.
  - **Mejora de Armas**: Evolución automática del disparo (Simple → Doble → Triple → Láser).

- **Amenazas Dinámicas**:
  - **Agujeros Negros**: Te succionan y drenan tu vida continuamente si te acercas demasiado.
  - **Tormentas Solares**: Eventos aleatorios que duplican el consumo de oxígeno y sacuden la pantalla.
  - **Escombros Variados**: Fragmentos normales, resistentes y explosivos.

- **Galería de Logros**:
  - Desbloquea imágenes espaciales exclusivas alojadas en Cloudinary al alcanzar ciertos puntajes.

- **Experiencia Multiplataforma**:
  - **PC**: Controles precisos con teclado.
  - **Móvil**: Joystick virtual táctil y botón de pausa circular ergonómico.
  - **Multilenguaje**: Disponible en Español (ES) e Inglés (EN).

---

## Vista rápida del juego

| Característica | Estado |
|---|---|
| Menú Principal | ✅ |
| Galería de Logros | ✅ |
| Sistema de Checkpoints | ✅ |
| Agujeros Negros | ✅ |
| Tormentas Solares | ✅ |
| Evolución de Armas | ✅ |
| Historia Animada | ✅ |
| Idioma ES / EN | ✅ |
| Controles Táctiles | ✅ |
| Guardado en LocalStorage | ✅ |
| Audio Dinámico | ✅ |
| Efectos Star Wars | ✅ |

---

## Flujo general del juego

```mermaid
flowchart TD
    A[Inicio] --> B[Menú Principal]
    B --> C[Nueva Partida]
    C --> D{Continuar?}
    D -->|Sí| E[Cargar Nivel y Score]
    D -->|No| F[Ver Historia / Inicio Directo]
    E --> G[Juego: Supervivencia]
    F --> G
    G --> H{Evento?}
    H -->|Agujero Negro| I[Drenaje de Vida y Atracción]
    H -->|Tormenta Solar| J[Doble Consumo O2 + Shake]
    H -->|Reliquia| K[Punto de Control Guardado]
    G --> L{HP, O2 o Fuel = 0?}
    L -->|Sí| M[Game Over]
    L -->|No| G
    M --> B

    style A fill:#1f2937,stroke:#fff,color:#fff
    style G fill:#0ea5e9,stroke:#fff,color:#fff
    style K fill:#e8c840,stroke:#000,color:#000
    style M fill:#ef4444,stroke:#fff,color:#fff
```

---

## Tecnologías utilizadas

- **HTML5**: Estructura base y contenedor de Canvas.
- **CSS3**: Estilos de interfaz, diseño responsive y efectos de pantalla.
- **JavaScript (ES6+)**: Motor del juego, lógica de entidades y gestión de estados.
- **Canvas 2D API**: Renderizado completo de gráficos y partículas.
- **Cloudinary**: Alojamiento dinámico de activos y galería de imágenes.
- **LocalStorage**: Persistencia de High Score, Checkpoints y configuración.

---

## Instalación y ejecución local

1. Clona el repositorio:
   ```bash
   git clone https://github.com/Jhormancastella/Astronauta-colombiano-.git
   ```
2. Abre `index.html` en cualquier navegador moderno o usa **Live Server**.

---

## Controles del juego

### Teclado (PC)

| Tecla | Acción |
|---|---|
| `W, A, S, D` / `Flechas` | Movimiento del Astronauta |
| `Espacio` | Disparar Armas |
| `P` | Pausar Juego |
| `O` | Opciones (en Pausa) |
| `Esc` / `Q` | Menú / Salir |

### Táctil (Móvil)

| Control | Acción |
|---|---|
| **Lado Izquierdo** | Joystick virtual para movimiento |
| **Lado Derecho** | Mantener para disparar |
| **Botón Circular** | Pausar juego |

---

## Sistema de Checkpoints

Las reliquias de los antiguos astronautas aparecen cada **5 niveles**. Al recoger una:
1. Tu **puntuación** y **nivel** se guardan.
2. Al morir, puedes seleccionar **"CONTINUAR"** desde el menú de Nueva Partida.
3. Reaparecerás con salud, oxígeno y combustible al 100%.

---

## Licencia

Este proyecto es de código abierto bajo la autoría de **Jhorman Jesus Castellanos Morales**. Puedes usarlo, adaptarlo y mejorarlo libremente.

---

## Autor

**Jhorman Jesus Castellanos Morales**  
[GitHub Profile](https://github.com/Jhormancastella)
