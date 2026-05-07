<script setup lang="ts">
definePageMeta({
  layout: false
})

useSeoMeta({
  titleTemplate: '',
  title: 'Prevenius — Planes de Seguridad y Salud',
  ogTitle: 'Prevenius — Planes de Seguridad y Salud',
  description: 'La plataforma integral para crear, gestionar y generar planes de seguridad para proyectos de construcción. Cumple con el RD 1627/1997.',
  ogDescription: 'La plataforma integral para crear, gestionar y generar planes de seguridad para proyectos de construcción.'
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
          Planes de Seguridad y Salud, Fáciles y Reales
        </p>
        <p class="subtitle subtitle-anim">
          Pensado por Ingenieros y Arquitectos para resolver el plan de seguridad fácilmente.
        </p>
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
            Todo lo que necesitas para tus Planes de Seguridad
          </h2>
          <p class="values-desc">
            De la normativa a la obra, Prevenius te acompaña en cada paso.
          </p>
        </div>

        <div class="values-grid">
          <div class="value-card value-card-1">
            <div class="value-icon-wrap">
              <UIcon name="i-lucide-zap" class="value-icon" />
            </div>
            <h3 class="value-heading">Crea Planes Rápidamente</h3>
            <p class="value-text">
              Diseña planes de seguridad completos en horas, no en días. Plantillas inteligentes y flujos optimizados.
            </p>
          </div>

          <div class="value-card value-card-2">
            <div class="value-icon-wrap">
              <UIcon name="i-lucide-shield-check" class="value-icon" />
            </div>
            <h3 class="value-heading">Cumple con el RD 1627/1997</h3>
            <p class="value-text">
              Generación automática de documentación conforme a la normativa vigente de seguridad en construcción.
            </p>
          </div>

          <div class="value-card value-card-3">
            <div class="value-icon-wrap">
              <UIcon name="i-lucide-smartphone" class="value-icon" />
            </div>
            <h3 class="value-heading">Accede desde Cualquier Dispositivo</h3>
            <p class="value-text">
              Gestiona tus planes desde la oficina o desde la obra. Códigos QR para acceso instantáneo in situ.
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Section 3: CTA -->
    <section class="cta-section">
      <div class="cta-glow" />
      <UContainer>
        <div class="cta-content">
          <h2 class="cta-title">Comienza Ahora</h2>
          <p class="cta-desc">
            Únete a más de 1.000 empresas constructoras que ya gestionan su seguridad con Prevenius.
          </p>
          <div class="cta-buttons">
            <UButton
              label="Registrarse Gratis"
              size="xl"
              to="/signup"
              class="cta-btn-primary"
            />
            <UButton
              label="Ver Plataforma"
              size="xl"
              color="neutral"
              variant="outline"
              to="/home"
              class="cta-btn-secondary"
            />
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Section 4: Full landing link -->
    <section class="landing-link-section">
      <UContainer>
        <div class="landing-link-content">
          <p class="landing-link-text">
            Explora todas las funcionalidades de Prevenius
          </p>
          <UButton
            label="Descubre Prevenius"
            trailing-icon="i-lucide-arrow-right"
            size="lg"
            to="/home"
            variant="ghost"
          />
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* ============================================
   WELCOME PAGE — Scroll-driven animations
   ============================================ */

.welcome-page {
  background: var(--ui-bg);
  min-height: 100vh;
  overflow-x: hidden;
}

/* --- Section 1: Hero --- */
.hero-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  overflow: hidden;
  background: #020617;
}

.dark .hero-section {
  background: #020617;
}

:root:not(.dark) .hero-section {
  background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
}

.hero-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: var(--ui-primary);
  opacity: 0.08;
  filter: blur(120px);
  pointer-events: none;
}

.stars-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.logo-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.logo-wrapper :deep(svg) {
  width: auto;
  height: 3rem;
}

@media (min-width: 640px) {
  .logo-wrapper :deep(svg) {
    height: 4rem;
  }
}

/* Logo entrance animation */
.logo-anim {
  animation: logoEnter 1.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes logoEnter {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tagline {
  font-size: 1.25rem;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.85);
  max-width: 36rem;
  line-height: 1.6;
}

@media (min-width: 640px) {
  .tagline {
    font-size: 1.5rem;
  }
}

.tagline-anim {
  animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
}

.subtitle {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
  max-width: 28rem;
  line-height: 1.6;
}

.subtitle-anim {
  animation: fadeUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scroll indicator */
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  color: rgba(255, 255, 255, 0.4);
}

.scroll-icon {
  width: 2rem;
  height: 2rem;
  animation: bounceDown 2s ease-in-out infinite;
}

@keyframes bounceDown {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  50% {
    transform: translateY(12px);
    opacity: 0.8;
  }
}

/* --- Section 2: Value Propositions --- */
.values-section {
  padding: 6rem 0;
  background: var(--ui-bg);
}

.values-header {
  text-align: center;
  margin-bottom: 4rem;
}

.values-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--ui-text);
  margin-bottom: 1rem;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .values-title {
    font-size: 2.25rem;
  }
}

.values-desc {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  max-width: 32rem;
  margin: 0 auto;
}

.values-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .values-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Scroll-driven card reveal animation */
.value-card {
  padding: 2rem;
  border-radius: 1rem;
  border: 1px solid var(--ui-border);
  background: var(--ui-bg-elevated);
  animation: cardReveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}

@keyframes cardReveal {
  from {
    opacity: 0;
    transform: translateY(60px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.value-card-2 {
  animation-delay: 0.1s;
}

.value-card-3 {
  animation-delay: 0.2s;
}

.value-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--ui-primary) 12%, transparent);
  margin-bottom: 1.25rem;
}

.value-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--ui-primary);
}

.value-heading {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--ui-text);
  margin-bottom: 0.75rem;
}

.value-text {
  font-size: 0.9rem;
  color: var(--ui-text-muted);
  line-height: 1.6;
}

/* --- Section 3: CTA --- */
.cta-section {
  position: relative;
  padding: 6rem 0;
  background: var(--ui-bg);
  overflow: hidden;
}

.cta-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 300px;
  border-radius: 50%;
  background: var(--ui-primary);
  opacity: 0.06;
  filter: blur(100px);
  pointer-events: none;
}

.cta-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ui-text);
  margin-bottom: 1rem;
  animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-timeline: view();
  animation-range: entry 0% entry 20%;
}

.cta-desc {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
  max-width: 28rem;
  margin: 0 auto 2.5rem;
}

.cta-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

/* --- Section 4: Landing Link --- */
.landing-link-section {
  padding: 3rem 0 4rem;
  border-top: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
}

.landing-link-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.landing-link-text {
  font-size: 1.1rem;
  color: var(--ui-text-muted);
}

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .logo-anim,
  .tagline-anim,
  .subtitle-anim,
  .scroll-icon,
  .value-card,
  .cta-title {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
