# BookApp

Aplicacion Expo para Android orientada a lectura de EPUB en ingles con traduccion contextual al tocar palabras o phrasal verbs.

## Estado real de la app

Hoy la app ya incluye mas que una simple pantalla de lectura:

- biblioteca local con libro de ejemplo y EPUB importados
- importacion de archivos `.epub` desde el dispositivo
- extraccion de portada, capitulos, subtitulos e imagenes inline del EPUB
- paginacion por capitulo
- selector de capitulo y selector de pagina
- guardado de progreso por libro
- restauracion de scroll al volver a abrir un libro
- tema `light` y `dark`
- ajuste de tamano de texto
- seleccion de palabras y phrasal verbs
- traduccion local con `ML Kit`
- traduccion contextual con `Google AI`

## Stack

- Expo SDK 54
- React 19.1.0
- React Native 0.81.5
- `@react-native-async-storage/async-storage`
- `@react-native-ml-kit/translate-text`
- `expo-document-picker`
- `expo-file-system`
- `fast-xml-parser`
- `jszip`
- `expo-dev-client`

## Como funciona

### Biblioteca

La pantalla inicial muestra:

- un libro de ejemplo integrado
- libros EPUB importados y persistidos localmente
- controles de tema
- controles de tamano de texto

Los metadatos de biblioteca, ultimo libro abierto, tema y tamano de fuente se guardan en `AsyncStorage`.

### Importacion EPUB

Al importar un EPUB, la app:

1. selecciona el archivo con `expo-document-picker`
2. lee el ZIP del EPUB
3. resuelve `container.xml` y el `opf`
4. reconstruye el indice de capitulos desde NCX o documento NAV
5. extrae texto, subtitulos e imagenes
6. guarda un JSON procesado en el almacenamiento local de la app

### Lector

El lector permite:

- abrir capitulos concretos
- moverse entre paginas del capitulo
- mantener progreso por libro
- tocar una palabra o phrasal verb para ver una tarjeta contextual

### Traduccion

Hay dos modos:

- `ML Kit`: traduce localmente el fragmento cercano a la palabra seleccionada
- `Google AI`: traduce con contexto y ademas intenta explicar phrasal verbs

Para `Google AI`, la app llama al modelo configurado en `App.js`:

```js
const GOOGLE_AI_MODEL = 'gemini-2.5-flash'
```

## Estructura del proyecto

- `App.js`: contiene casi toda la logica de la app
- `index.js`: registro del root component
- `app.json`: configuracion Expo y package Android
- `android/`: proyecto nativo generado por Expo prebuild
- `assets/`: iconos e imagenes base
- `scripts/list-gemini-models.mjs`: util para listar modelos disponibles con tu API key

## Zonas importantes dentro de `App.js`

`App.js` esta centralizado en un solo archivo grande. Antes de modificar, conviene pensar en estos bloques:

- parsing EPUB y utilidades de contenido
- deteccion de palabras, lemas y phrasal verbs
- integracion con ML Kit y Google AI
- estado de biblioteca, progreso, tema y fuente
- UI del lector, tooltips, menus y paginacion

## Variables de entorno

Crea `.env.local` con:

```bash
EXPO_PUBLIC_GOOGLE_AI_API_KEY=tu_api_key
```

Expo necesita reiniciarse para leer cambios en variables `EXPO_PUBLIC_*`.

El script de listado de modelos tambien acepta:

```bash
GEMINI_API_KEY=tu_api_key
```

## Desarrollo

Instalar dependencias:

```bash
npm install
```

Generar Android nativo:

```bash
npx expo prebuild --platform android
```

Compilar e instalar build de desarrollo:

```bash
npm run android:dev
```

Levantar Metro para dev client:

```bash
npm run start:dev
```

## Importante

- `ML Kit` no funciona en Expo Go porque requiere codigo nativo.
- La app hoy esta pensada principalmente para Android.
- `@react-native-ml-kit/translate-text` sigue siendo una dependencia delicada para escenarios de produccion.
- El archivo `App.js` ya supero las 2700 lineas, asi que cualquier cambio mediano conviene separarlo en modulos antes de seguir creciendo.

## Sugerencias para siguientes cambios

Si vas a modificar la app, lo mas razonable es empezar por uno de estos frentes:

- separar `App.js` en modulos (`epub`, `translation`, `reader`, `library`)
- mejorar la UX del tooltip de traduccion
- agregar busqueda dentro del libro
- guardar notas o palabras marcadas
- preparar un build release firmable distinto del dev client
