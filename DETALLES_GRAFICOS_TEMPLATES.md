# Detalles Gráficos - Guía de Plantillas

## Resumen
El sistema de detalles gráficos permite incluir imágenes en los planes de seguridad mediante variables de plantilla. Las imágenes se almacenan como URLs de S3 y se renderizan como markdown en el documento final.

## Variables de Plantilla Disponibles

### Variables Principales
- `{{detalles_graficos}}` - Todas las imágenes seleccionadas como markdown
- `{{detalles_graficos_count}}` - Número total de imágenes
- `{{detalles_graficos_admin}}` - Solo imágenes de administrador
- `{{detalles_graficos_user}}` - Solo imágenes del usuario

## Ejemplos de Uso

### Ejemplo 1: Sección Simple
```handlebars
### 16. Detalles Gráficos
{{#if detalles_graficos_count}}
Se incluyen {{detalles_graficos_count}} imágenes de detalles gráficos:

{{detalles_graficos}}
{{else}}
No se han incluido detalles gráficos para este proyecto.
{{/if}}
```

### Ejemplo 2: Con Separación por Tipo
```handlebars
### 16. Detalles Gráficos

{{#if detalles_graficos_count}}
Se incluyen **{{detalles_graficos_count}}** imágenes de detalles gráficos:

{{#if detalles_graficos_admin}}
#### 16.1. Imágenes de Administrador
{{detalles_graficos_admin}}
{{/if}}

{{#if detalles_graficos_user}}
#### 16.2. Imágenes del Usuario
{{detalles_graficos_user}}
{{/if}}

{{else}}
#### 16.1. Sin Imágenes
No se han incluido detalles gráficos para este proyecto.
{{/if}}
```

### Ejemplo 3: Integración con Otros Datos
```handlebars
### 15. Relación de Puestos de Trabajo

{{#each partidas}}
#### {{nom_concepto}}

**Descripción:** {{desc_concepto}}

**Imágenes de referencia:**
{{#if ../detalles_graficos_count}}
{{#each (filterImagesByChapter ../detalles_graficos @index)}}
![{{this.name}}]({{this.url}})
{{/each}}
{{else}}
- Sin imágenes de referencia
{{/if}}

{{/each}}
```

## Formato de las Imágenes

Las imágenes se renderizan como markdown estándar:
```markdown
![Nombre de la Imagen](https://s3-url-de-la-imagen.jpg)
```

Esto produce:
- Texto alternativo con el nombre de la imagen
- Imagen incrustada en el documento
- Soporte para PDF (las imágenes externas se convierten a base64)

## Estructura de Datos

Cada imagen en `detalles_graficos` tiene esta estructura:
```typescript
{
  url: string,           // URL de S3
  name: string,          // Nombre de la imagen
  description?: string,  // Descripción opcional
  date?: string,         // Fecha de carga
  isAdminShared?: boolean, // Es de administrador
  uploadedBy?: string    // Usuario que la subió
}
```

## Plantilla Completa Recomendada

```handlebars
# Plan de Seguridad y Salud
## {{nom_obra}}

### 1. Información General
**Dirección:** {{dir_obra}}, {{poblacion_obra}} ({{cp_obra}})
**Duración:** {{duracion_meses}} meses
**Presupuesto:** €{{presupuesto_total_obra}}

### 2. Detalles Gráficos
{{#if detalles_graficos_count}}
Este plan incluye **{{detalles_graficos_count}}** imágenes de detalles gráficos que muestran aspectos importantes del proyecto:

{{detalles_graficos}}

{{#if detalles_graficos_admin}}
**Imágenes de Administrador:**
{{detalles_graficos_admin}}
{{/if}}

{{#if detalles_graficos_user}}
**Imágenes del Usuario:**
{{detalles_graficos_user}}
{{/if}}

{{else}}
No se han incluido detalles gráficos en este plan.
{{/if}}

### 3. Relación de Puestos de Trabajo
{{#each partidas}}
#### {{nom_concepto}}
**Descripción:** {{desc_concepto}}
**Prevención:** {{desc_concepto_preventivo}}
{{/each}}
```

## Notas Importantes

1. **Condicional**: Siempre use `{{#if detalles_graficos_count}}` para verificar si hay imágenes
2. **Markdown**: Las imágenes se renderizan como markdown, compatible con PDF
3. **CORS**: Las imágenes de S3 se manejan automáticamente con CORS
4. **Tamaño**: Las imágenes mantienen su proporción con `object-contain`
5. **Alternativas**: Use `detalles_graficos_admin` o `detalles_graficos_user` para separar por tipo

## Solución de Problemas

### Imágenes No Se Muestran
- Verifique que `{{detalles_graficos_count}}` > 0
- Revise la consola del navegador para errores de CORS
- Asegúrese de que las imágenes estén correctamente seleccionadas

### Imágenes Se Cortan
- Esto es normal con `object-contain` que mantiene la proporción
- Use imágenes con orientación adecuada para su espacio

### Error en PDF
- El sistema convierte automáticamente las URLs de S3 a base64
- Revise los logs del servidor si hay problemas de conversión