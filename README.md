# 🎮 GAMEBIT - Plataforma de Juegos Online

Una plataforma web moderna y responsive para juegos online, desarrollada como parte del curso de Interfaces de Usuario. El proyecto presenta una experiencia de usuario completa con diseño modular, interacciones dinámicas y una interfaz intuitiva.

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Tecnologías Utilizadas](#-tecnologías-utilizadas)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Trabajos Prácticos](#-trabajos-prácticos)
- [Funcionalidades](#-funcionalidades)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Contribución](#-contribución)
- [Autores](#-autores)
- [Licencia](#-licencia)

## 🎯 Descripción

GAMEBIT es una plataforma web que simula una tienda/biblioteca de juegos online. El proyecto está diseñado para demostrar principios de diseño de interfaces de usuario, incluyendo:

- Diseño responsive y mobile-first
- Arquitectura CSS modular y escalable
- Interacciones JavaScript dinámicas
- Experiencia de usuario intuitiva
- Accesibilidad web
- Navegación fluida entre secciones

## ✨ Características

### 🎨 Diseño y UX
- **Diseño Responsive**: Adaptable a todos los dispositivos (móvil, tablet, desktop)
- **Tema Moderno**: Interfaz limpia con esquema de colores atractivo
- **Navegación Intuitiva**: Menú hamburguesa, breadcrumbs y navegación contextual
- **Micro-interacciones**: Animaciones suaves y feedback visual
- **Accesibilidad**: Cumple con estándares de accesibilidad web

### 🚀 Funcionalidades
- **Sistema de Autenticación**: Login y registro de usuarios
- **Catálogo de Juegos**: Galería interactiva con filtros y búsqueda
- **Páginas de Juego**: Páginas detalladas con información, capturas y gameplay
- **Sistema de Comentarios**: Interacción entre usuarios
- **Carrito de Compras**: Funcionalidad de e-commerce básica
- **Perfil de Usuario**: Gestión de cuenta y preferencias

## 📁 Estructura del Proyecto

```
Interfaces-de-Usuario/
├── README.md
├── TP1/                          # Trabajo Práctico 1 - Fundamentos
│   ├── index.html
│   └── css/
│       └── Style.css
├── TP2/                          # Trabajo Práctico 2 - GAMEBIT
│   ├── index.html               # Página principal
│   ├── loader.html              # Pantalla de carga
│   ├── css/                     # Estilos modularizados
│   │   ├── Variables.css        # Variables CSS y tema
│   │   ├── Utils.css           # Utilidades y helpers
│   │   ├── Header.css          # Estilos del header
│   │   ├── Footer.css          # Estilos del footer
│   │   ├── Home.css            # Página principal
│   │   ├── Game.css            # Páginas de juegos
│   │   ├── Login.css           # Formularios de acceso
│   │   ├── Register.css        # Formulario de registro
│   │   └── SVGContainers.css   # Contenedores SVG
│   ├── js/                     # JavaScript modular
│   │   ├── main.js             # Funcionalidad principal
│   │   ├── carrusel.js         # Carrusel de imágenes
│   │   ├── gallery.js          # Galería interactiva
│   │   ├── gameLoader.js       # Cargador de juegos
│   │   ├── loader.js           # Pantalla de carga
│   │   ├── pegSolitaire.js     # Juego Peg Solitaire
│   │   └── api.js              # Conexiones API
│   ├── Pages/                  # Páginas adicionales
│   │   ├── game.html           # Página de juego individual
│   │   ├── login.html          # Página de login
│   │   ├── register.html       # Página de registro
│   │   ├── card.html           # Tarjeta de juego
│   │   └── loader.html         # Cargador alternativo
│   └── assets/                 # Recursos multimedia
│       ├── img/                # Imágenes de juegos
│       └── icons/              # Iconografía del sitio
└── api-vj-interfaces/          # API backend (submódulo)
```

## 🛠 Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: 
  - Flexbox y CSS Grid para layouts
  - Variables CSS para theming
  - Animaciones y transiciones
  - Media queries para responsividad
- **JavaScript (Vanilla)**: 
  - DOM manipulation
  - Event handling
  - Módulos ES6
  - Async/await para APIs

### Herramientas de Desarrollo
- **Git**: Control de versiones
- **VS Code**: Editor de código
- **Live Server**: Servidor de desarrollo local
- **Browser DevTools**: Debugging y optimización

### Metodologías
- **Mobile-First Design**: Diseño que prioriza dispositivos móviles
- **BEM CSS**: Nomenclatura de clases CSS
- **Modular Architecture**: Código organizado en módulos reutilizables
- **Progressive Enhancement**: Mejora progresiva de funcionalidades

## 🚀 Instalación

### Prerrequisitos
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Editor de código (recomendado: VS Code)
- Git (para clonación del repositorio)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/Geronimo02/Interfaces-de-Usuario.git
   cd Interfaces-de-Usuario
   ```

2. **Abrir el proyecto**
   ```bash
   # Con VS Code
   code .
   
   # O abrir manualmente la carpeta en tu editor preferido
   ```

3. **Iniciar servidor local** (opcional pero recomendado)
   ```bash
   # Con Live Server (VS Code extension)
   # Click derecho en index.html > "Open with Live Server"
   
   # Con Python (si tienes Python instalado)
   python -m http.server 8000
   
   # Con Node.js (si tienes Node.js instalado)
   npx serve .
   ```

4. **Acceder a la aplicación**
   - Abrir `TP2/index.html` en el navegador
   - O navegar a `http://localhost:8000/TP2/` si usas servidor local

## 💻 Uso

### Navegación Principal
1. **Página de Inicio**: Explora el catálogo de juegos destacados
2. **Menú Hamburguesa**: Accede a categorías específicas
3. **Buscador**: Encuentra juegos por nombre
4. **Perfil de Usuario**: Gestiona tu cuenta

### Funcionalidades Principales
- **Explorar Juegos**: Navega por las diferentes categorías
- **Ver Detalles**: Click en cualquier juego para ver información detallada
- **Sistema de Login**: Accede con tu cuenta o regístrate
- **Carrito**: Agrega juegos a tu lista de deseos
- **Comentarios**: Participa en la comunidad

### Páginas Disponibles
- **`/TP2/index.html`**: Página principal con catálogo
- **`/TP2/Pages/game.html`**: Página de juego individual (Peg Solitaire)
- **`/TP2/Pages/login.html`**: Formulario de inicio de sesión
- **`/TP2/Pages/register.html`**: Formulario de registro
- **`/TP2/loader.html`**: Pantalla de carga animada

## 📚 Trabajos Prácticos

### TP1 - Fundamentos de CSS
- **Objetivo**: Introducción a CSS y maquetación básica
- **Contenido**: Página simple con estilos fundamentales
- **Conceptos**: Selectores, propiedades básicas, box model

### TP2 - GAMEBIT (Proyecto Principal)
- **Objetivo**: Desarrollo completo de una interfaz web moderna
- **Contenido**: Plataforma completa de juegos online
- **Conceptos Avanzados**:
  - Diseño responsive
  - CSS Grid y Flexbox
  - JavaScript interactivo
  - Arquitectura modular
  - UX/UI design patterns

## 🎮 Funcionalidades

### Sistema de Navegación
- **Header Responsive**: Se adapta a diferentes tamaños de pantalla
- **Menú Hamburguesa**: Navegación lateral en dispositivos móviles
- **Breadcrumbs**: Navegación contextual en páginas internas
- **Footer Informativo**: Enlaces adicionales y redes sociales

### Componentes Interactivos
- **Carrusel de Juegos**: Navegación horizontal con controles
- **Galería de Screenshots**: Visualización de capturas de pantalla
- **Formularios Validados**: Inputs con validación en tiempo real
- **Modales y Dropdowns**: Interfaces contextuales

### Características Técnicas
- **Lazy Loading**: Carga optimizada de imágenes
- **Animaciones CSS**: Transiciones suaves y micro-interacciones
- **Accesibilidad**: Navegación por teclado y lectores de pantalla
- **SEO Optimizado**: Estructura semántica y meta tags

## 📱 Capturas de Pantalla

### Desktop
![Página Principal Desktop](docs/screenshots/desktop-home.png)
*Página principal en vista desktop con header completo y carrusel*

### Mobile
![Página Principal Mobile](docs/screenshots/mobile-home.png)
*Versión móvil con menú hamburguesa y diseño adaptativo*

### Página de Juego
![Página de Juego](docs/screenshots/game-page.png)
*Página individual de juego con información detallada*

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Si quieres colaborar:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. **Push** a la rama (`git push origin feature/AmazingFeature`)
5. **Abre** un Pull Request

### Guías de Contribución
- Seguir las convenciones de código existentes
- Documentar nuevas funcionalidades
- Probar en múltiples navegadores
- Mantener el diseño responsive

## 👨‍💻 Autores

- **Gerónimo** - *Desarrollo Frontend* - [@Geronimo02](https://github.com/Geronimo02)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 📞 Contacto

- **Proyecto**: [https://github.com/Geronimo02/Interfaces-de-Usuario](https://github.com/Geronimo02/Interfaces-de-Usuario)
- **Reportar Bug**: [Issues](https://github.com/Geronimo02/Interfaces-de-Usuario/issues)

## 🎯 Próximas Funcionalidades

- [ ] Sistema de favoritos
- [ ] Chat en tiempo real
- [ ] Modo oscuro/claro
- [ ] PWA (Progressive Web App)
- [ ] Integración con APIs reales de juegos
- [ ] Sistema de puntuaciones y rankings
- [ ] Multiplayer básico

---

⭐ **¡No olvides darle una estrella al repositorio si te gustó el proyecto!**