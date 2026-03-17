# 🌐 Language Validator - Chrome Extension

Extensión experta en semántica de idiomas español e inglés que valida el contenido de páginas web y sugiere mejoras de escritura.

## ✨ Características Principales

### 🔍 Validación de Idioma
- **Selector de idioma**: Elige entre Español o Inglés como idioma objetivo
- **Detección inteligente**: Analiza cada elemento de texto en la página
- **Patrones lingüísticos**: Usa palabras comunes, caracteres especiales y terminaciones verbales
- **Confianza de detección**: Solo reporta problemas con alta confianza (>60%)

### 📝 Análisis Semántico
Detecta problemas de escritura y contenido incompleto:
- Espacios excesivos entre palabras
- Números sin contexto claro
- URLs sin texto descriptivo
- Uso excesivo de mayúsculas
- Puntos suspensivos excesivos
- Fragmentos incompletos

### 💡 Sugerencias de Mejora
**Para Español:**
- Redundancias temporales ("actualmente", "hoy en día")
- Dqueísmo (uso incorrecto de "de que")
- Quesuismo (construcciones con "que su")

**Para Inglés:**
- Voz pasiva excesiva
- Frases redundantes o wordy
- Intensificadores redundantes

### 🎯 Resaltado Selectivo en el DOM
- **Elige qué resaltar**: No se resaltan todos los errores automáticamente
- **Botón individual**: Cada problema tiene su botón "🔍 Resaltar"
- **Visualización clara**: Elementos resaltados con fondo amarillo y borde rojo
- **Scroll automático**: La página se desplaza suavemente al elemento resaltado
- **Quitar resaltado**: Botón para eliminar el resaltado individual o todos a la vez

## 📁 Estructura de Archivos

```
language-validator/
├── manifest.json          # Configuración de la extensión (Manifest V3)
├── popup.html             # Interfaz de usuario del popup
├── popup.js               # Lógica del popup
├── content.js             # Script de contenido (análisis y resaltado)
├── background.js          # Service worker
├── icons/                 # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # Este archivo
```

## 🚀 Instalación

1. Abre Google Chrome
2. Ve a `chrome://extensions/`
3. Activa el **"Modo de desarrollador"** (toggle en la esquina superior derecha)
4. Haz clic en **"Cargar descomprimida"**
5. Selecciona la carpeta `/workspace` (donde está esta extensión)
6. ¡Listo! La extensión aparecerá en tu barra de extensiones

## 📖 Cómo Usar

1. **Selecciona el idioma** que quieres validar (Español o English)
2. Haz clic en **"Validar Página"**
3. Revisa los resultados en las tres pestañas:
   - **Idioma**: Elementos detectados en idioma incorrecto
   - **Semántica**: Problemas de escritura y contenido incompleto
   - **Sugerencias**: Recomendaciones de mejora agregadas
4. Para resaltar un elemento en la página:
   - Haz clic en **"🔍 Resaltar"** en el problema que te interese
   - La página hará scroll hasta ese elemento y lo resaltará
5. Usa **"Quitar Resaltados"** para limpiar todos los resaltados

## 🎨 Interfaz

La extensión muestra:
- **Estadísticas**: Elementos analizados, correctos y problemas
- **Resumen**: Porcentaje de contenido en el idioma correcto
- **Lista de problemas**: Cada uno con:
  - Etiqueta del elemento HTML
  - Texto detectado (truncado si es largo)
  - Idioma detectado y nivel de confianza
  - Botones de acción (resaltar/quitar resaltado)
  - Sugerencias adicionales si aplican

## 🔧 Personalización

Puedes modificar los patrones de detección en `content.js`:
- `languagePatterns.es` y `languagePatterns.en`: Patrones por idioma
- `semanticIssues`: Patrones para problemas semánticos
- `writingSuggestions`: Sugerencias de escritura específicas

## 📝 Notas Técnicas

- **Manifest V3**: Compatible con las últimas versiones de Chrome
- **Offline**: Funciona sin conexión a internet
- **Rendimiento**: Análisis eficiente usando TreeWalker
- **Privacidad**: No envía datos a servidores externos

## 🛠️ Desarrollo

Para hacer cambios:
1. Edita los archivos en `/workspace`
2. En `chrome://extensions/`, haz clic en el botón de recargar 🔄
3. Prueba los cambios en una página web

## 📄 Licencia

MIT License - Libre uso y modificación.
