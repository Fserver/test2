# Language Validator - Chrome Extension

Una extensión para Google Chrome que valida si el contenido de una página web está en el idioma seleccionado (español o inglés).

## Características

- ✅ **Detección de idioma inteligente**: Analiza el texto de la página usando patrones lingüísticos específicos para español e inglés
- ✅ **Selección de idioma**: Permite elegir entre validar contenido en español o inglés
- ✅ **Análisis detallado**: Revisa cada elemento de texto visible en la página
- ✅ **Reporte de problemas**: Muestra qué elementos no están en el idioma seleccionado
- ✅ **Estadísticas**: Proporciona un resumen del porcentaje de contenido correcto
- ✅ **Persistencia**: Recuerda tu preferencia de idioma entre sesiones

## Cómo instalar

1. Abre Google Chrome y navega a `chrome://extensions/`
2. Activa el "Modo de desarrollador" en la esquina superior derecha
3. Haz clic en "Cargar descomprimida"
4. Selecciona la carpeta `/workspace` donde se encuentra esta extensión
5. La extensión aparecerá en tu barra de herramientas

## Cómo usar

1. Navega a cualquier página web
2. Haz clic en el icono de la extensión (círculo morado con "ES/EN")
3. Selecciona el idioma que quieres validar (Español o English)
4. Haz clic en "Validar Página"
5. Revisa los resultados:
   - ✅ Verde: Todo el contenido está en el idioma seleccionado
   - ⚠️ Amarillo: La mayoría del contenido es correcto (>80%)
   - ❌ Rojo: Hay problemas significativos de idioma

## Estructura de archivos

```
/workspace
├── manifest.json       # Configuración de la extensión
├── popup.html          # Interfaz de usuario del popup
├── popup.js            # Lógica del popup
├── content.js          # Script que analiza el contenido de la página
├── background.js       # Service worker en segundo plano
├── icons/              # Iconos de la extensión
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md           # Este archivo
```

## Tecnología de detección de idioma

La extensión utiliza un algoritmo basado en:

- **Palabras comunes**: Compara el texto con listas de palabras frecuentes en cada idioma
- **Caracteres especiales**: Detecta caracteres únicos como ñ, á, é, í, ó, ú, ¿, ¡ para español
- **Terminaciones verbales**: Identifica patrones como -ar, -er, -ir (español) o -ing, -ed (inglés)
- **Artículos y pronombres**: Analiza el uso de artículos específicos de cada idioma

## Notas

- La extensión solo analiza texto visible, ignorando scripts, estilos y otros elementos no visibles
- Textos muy cortos (< 3 caracteres) pueden no ser analizados
- La detección es más precisa con textos más largos
- La extensión funciona sin conexión a internet (todo el análisis es local)

## Licencia

Esta extensión es de código abierto y puede ser modificada libremente.
