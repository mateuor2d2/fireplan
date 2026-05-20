<script setup lang="ts">
definePageMeta({
  layout: false
})

useSeoMeta({
  titleTemplate: '',
  title: 'FirePlan — Plan de Emergencia y Autoprotección',
  ogTitle: 'FirePlan — Plan de Emergencia y Autoprotección',
  description: 'La plataforma integral para crear, gestionar y mantener planes de emergencia y autoprotección. Cumple con el RD 393/2007 y normativa vigente.',
  ogDescription: 'La plataforma integral para crear, gestionar y mantener planes de emergencia y autoprotección.'
})
</script>

<template>
  <div class="welcome-page">
    <!-- Section 1: Hero Splash -->
    <section class="hero-section">
      <LazyStarsBg class="stars-bg" />
      <div class="hero-glow" />

      <div class="hero-content">
        <div class="logo-wrapper">
          <LogoPro class="logo-anim" />
        </div>
        <p class="tagline tagline-anim">
          Plan de Emergencia y Autoprotección, Siempre Actualizado
        </p>
        <p class="subtitle subtitle-anim">
          Gestiona la seguridad de tu centro de trabajo con fichaje inteligente, equipos QR y simulacros.
        </p>
        <div class="hero-cta">
          <UButton
            to="/login"
            color="primary"
            size="xl"
            icon="i-heroicons-arrow-right"
            trailing
            class="cta-button"
          >
            Acceder a FirePlan
          </UButton>
          <UButton
            to="/register"
            color="neutral"
            variant="ghost"
            size="xl"
            class="cta-button"
          >
            Crear cuenta
          </UButton>
        </div>
      </div>

      <div class="scroll-indicator">
        <UIcon name="i-lucide-chevron-down" class="scroll-icon" />
      </div>
    </section>

    <!-- Section 2: Value Propositions -->
    <section class="values-section">
      <UContainer>
        <div class="values-header">
          <h2 class="values-title">
            Todo lo que necesitas para tu Plan de Emergencia
          </h2>
          <p class="values-desc">
            Desde el análisis de riesgos hasta los simulacros, FirePlan te acompaña en cada paso.
          </p>
        </div>

        <div class="values-grid">
          <UCard class="value-card value-card-1">
            <template #header>
              <UIcon name="i-heroicons-document-text" class="value-icon" />
              <h3>Plan de Emergencia Digital</h3>
            </template>
            <p>
              Crea y mantén tu plan de emergencia conforme al RD 393/2007. Capítulos 1-9 completos con anexos.
            </p>
          </UCard>

          <UCard class="value-card value-card-2">
            <template #header>
              <UIcon name="i-heroicons-qr-code" class="value-icon" />
              <h3>Equipos con QR</h3>
            </template>
            <p>
              Gestiona extintores, bocas de incendio y equipos de emergencia con códigos QR para revisión rápida.
            </p>
          </UCard>

          <UCard class="value-card value-card-3">
            <template #header>
              <UIcon name="i-heroicons-users" class="value-icon" />
              <h3>Fichaje Inteligente</h3>
            </template>
            <p>
              Al fichar, cada trabajador recibe por Telegram su rol en el plan de emergencia: evacuación, extinción o primeros auxilios.
            </p>
          </UCard>

          <UCard class="value-card value-card-4">
            <template #header>
              <UIcon name="i-heroicons-clipboard-document-check" class="value-icon" />
              <h3>Simulacros y Evaluación</h3>
            </template>
            <p>
              Programa simulacros de evacuación, registra participantes y genera informes de evaluación con acciones correctivas.
            </p>
          </UCard>

          <UCard class="value-card value-card-5">
            <template #header>
              <UIcon name="i-heroicons-map" class="value-icon" />
              <h3>Mapas de Emergencia</h3>
            </template>
            <p>
              Visualiza rutas de evacuación, puntos de encuentro y rutas para servicios de emergencia con OpenStreetMap.
            </p>
          </UCard>

          <UCard class="value-card value-card-6">
            <template #header>
              <UIcon name="i-heroicons-shield-check" class="value-icon" />
              <h3>Cumplimiento Normativo</h3>
            </template>
            <p>
              Mantén tu plan siempre actualizado y en cumplimiento de la normativa de prevención de riesgos laborales.
            </p>
          </UCard>
        </div>
      </UContainer>
    </section>

    <!-- Section 3: Social Proof -->
    <section class="social-section">
      <UContainer>
        <div class="social-content">
          <h2 class="social-title">
            Protege a tu equipo con FirePlan
          </h2>
          <p class="social-desc">
            Únete a empresas que ya gestionan su plan de emergencia y autoprotección con FirePlan.
          </p>
          <div class="social-cta">
            <UButton
              to="/register"
              color="primary"
              size="xl"
              icon="i-heroicons-arrow-right"
              trailing
            >
              Empieza Gratis
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: var(--ui-bg);
}

.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.stars-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 1;
  animation: pulse-glow 4s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.hero-content {
  position: relative;
  z-index: 2;
  text-align: center;
  max-width: 800px;
  padding: 2rem;
}

.logo-wrapper {
  margin-bottom: 2rem;
}

.logo-anim {
  width: 120px;
  height: 120px;
  animation: fade-in-up 0.8s ease-out;
}

.tagline {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--ui-primary) 0%, var(--ui-text) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.tagline-anim {
  animation: fade-in-up 0.8s ease-out 0.2s both;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--ui-text-dimmed);
  margin-bottom: 2rem;
}

.subtitle-anim {
  animation: fade-in-up 0.8s ease-out 0.4s both;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  animation: fade-in-up 0.8s ease-out 0.6s both;
}

.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  z-index: 2;
  animation: bounce 2s infinite;
}

.scroll-icon {
  width: 2rem;
  height: 2rem;
  color: var(--ui-text-dimmed);
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.values-section {
  padding: 6rem 0;
}

.values-header {
  text-align: center;
  margin-bottom: 4rem;
}

.values-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.values-desc {
  font-size: 1.125rem;
  color: var(--ui-text-dimmed);
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.value-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.value-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
}

.value-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--ui-primary);
  margin-bottom: 1rem;
}

.social-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, transparent 100%);
}

.social-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.social-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.social-desc {
  font-size: 1.125rem;
  color: var(--ui-text-dimmed);
  margin-bottom: 2rem;
}

.social-cta {
  animation: fade-in-up 0.8s ease-out both;
}
</style>
