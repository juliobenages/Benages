# OpoHacienda

Aplicación web inicial para practicar preguntas de la oposición de Agente de Hacienda Pública. Diseñada para móvil, iPad y ordenador.

## Funciones actuales

- Test de cuatro respuestas con explicación y fuente.
- Filtro por temas.
- Estadísticas y repaso de preguntas falladas.
- Importación/exportación del banco en JSON.
- Alta manual de preguntas.
- Guardado local en el navegador.
- Preparada para añadir sincronización con Supabase.

## Desarrollo

Requiere Node.js 20 o posterior.

```bash
npm install
npm run dev
```

## Publicar en Vercel

1. Sube todo el contenido del repositorio a GitHub.
2. En Vercel, importa el repositorio `juliobenages/Benages`.
3. Vercel detectará Vite. Comando de build: `npm run build`. Directorio de salida: `dist`.
4. Pulsa Deploy.

## Supabase

La conexión se encuentra preparada en `src/supabase.js`, pero la sincronización todavía no está implementada. Añade en Vercel las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` cuando se configure el proyecto y su esquema seguro.

No pongas nunca una clave `service_role` en el frontend.

## Banco de preguntas

La aplicación incluye tres preguntas de demostración para probar la interfaz. No constituyen un banco oficial ni un temario completo. Las preguntas para preparación real deben contrastarse con el texto consolidado vigente de las normas y con la convocatoria aplicable.

Formato JSON:

```json
{
  "questions": [
    {
      "id": "LGT-001",
      "topic": "Normativa tributaria: conceptos generales",
      "question": "Enunciado de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correct": 0,
      "explanation": "Explicación de la respuesta correcta",
      "source": "Norma y artículo concretos"
    }
  ]
}
```

`correct` es el índice de la respuesta correcta, empezando por cero.
