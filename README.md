# BookApp

Aplicacion Expo para Android con una pantalla de lectura en ingles.

Funciones actuales:
- lectura en pantalla completa con scroll
- tap sobre una palabra
- deteccion de la oracion completa a la que pertenece
- traduccion real de la oracion con Google ML Kit en el dispositivo

## Stack actual

- Expo SDK 54
- React 19.1.0
- React Native 0.81.5
- `@react-native-ml-kit/translate-text`
- `expo-dev-client`

## Importante

La traduccion con ML Kit usa codigo nativo. Por eso no funciona en Expo Go.
Necesitas una development build de Android.

## Instalar dependencias

```bash
npm install
```

## Configurar Google AI

Crea un archivo `.env.local` con esta variable:

```bash
EXPO_PUBLIC_GOOGLE_AI_API_KEY=tu_api_key
```

Expo necesita reiniciarse para leer cambios en variables `EXPO_PUBLIC_*`.

## Generar proyecto nativo Android

```bash
npx expo prebuild --platform android
```

## Probar en Android

Si tienes Android Studio o el SDK de Android configurado:

```bash
npm run android:dev
```

Eso compila e instala la app nativa de desarrollo en Android.

Luego levanta Metro para esa app:

```bash
npm run start:dev
```

## Flujo de traduccion actual

1. Tocas una palabra del texto.
2. La app detecta la oracion completa y un snippet corto de contexto.
3. En modo `ML Kit`, se traduce solo el fragmento cercano a la palabra.
4. En modo `Google AI`, se consulta Gemini para obtener la traduccion completa de la oracion y la traduccion contextual de la palabra seleccionada.
5. El modal muestra la palabra, el contexto original y la traduccion resultante.

## Archivos principales

- `App.js`: pantalla de lectura, deteccion de oracion y llamada a ML Kit
- `android/`: proyecto nativo generado por Expo prebuild
- `app.json`: configuracion Expo
- `package.json`: dependencias y scripts de desarrollo

## Nota tecnica

El paquete `@react-native-ml-kit/translate-text` indica en su README que todavia esta en alpha, asi que sirve para pruebas pero no conviene asumir estabilidad de produccion sin evaluarlo antes.
