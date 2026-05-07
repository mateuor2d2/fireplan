<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-3xl font-bold text-gray-900">
          Historial de Cambios
        </h1>
        <p class="mt-4 text-lg text-gray-600">
          Mantente al día con las últimas mejoras y características.
        </p>
      </div>

      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="divide-y divide-gray-200">
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-semibold text-gray-900">
                Versión 2.1.0
              </h2>
              <span class="text-sm text-gray-500">Agosto 2024</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li>Nueva funcionalidad de gestión de imágenes en memorias</li>
              <li>Mejoras en la generación de PDFs con imágenes externas</li>
              <li>Integración mejorada con AWS S3 para almacenamiento de archivos</li>
              <li>Optimización del rendimiento en la carga de planes</li>
            </ul>
          </div>

          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-semibold text-gray-900">
                Versión 2.0.0
              </h2>
              <span class="text-sm text-gray-500">Julio 2024</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li>Rediseño completo de la interfaz de usuario</li>
              <li>Nuevo sistema de plantillas personalizables</li>
              <li>Integración con Stripe para pagos</li>
              <li>Sistema de autenticación mejorado con OAuth</li>
              <li>Panel de administración para usuarios premium</li>
            </ul>
          </div>

          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <h2 class="text-lg font-semibold text-gray-900">
                Versión 1.5.0
              </h2>
              <span class="text-sm text-gray-500">Junio 2024</span>
            </div>
            <ul class="list-disc list-inside space-y-1 text-gray-600">
              <li>Sistema de presupuestos mejorado</li>
              <li>Nuevos campos de validación en formularios</li>
              <li>Exportación mejorada a PDF</li>
              <li>Correcciones de bugs menores</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
