// OPTIMIZED nuxt.config.ts - Copy relevant sections to your existing config

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@pinia/nuxt'
  ],
  
  ssr: false,
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // ... keep your existing runtimeConfig
  },

  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-11-25',

  // ====== OPTIMIZED NITRO CONFIG ======
  nitro: {
    preset: 'vercel',
    
    // Externalize heavy dependencies
    externals: {
      external: [
        'sharp',
        'pdfmake',
        'jspdf',
        'html2canvas',
        'qrcode',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
        'mongoose'
      ],
      inline: [
        // Keep these in bundle
        'zod',
        'bcryptjs',
        'jsonwebtoken'
      ]
    },
    
    // Rollup configuration for chunking
    rollupConfig: {
      external: [
        'sharp',
        'pdfmake',
        'jspdf',
        'html2canvas',
        'qrcode'
      ],
      output: {
        manualChunks(id) {
          // Split PDF generation into separate chunk
          if (id.includes('pdfmake') || id.includes('vfs_fonts')) {
            return 'pdf-worker'
          }
          // Split AWS SDK
          if (id.includes('@aws-sdk')) {
            return 'aws-sdk'
          }
          // Split heavy image processing
          if (id.includes('sharp')) {
            return 'image-processing'
          }
        }
      }
    },
    
    // Disable WASM to reduce bundle
    experimental: {
      wasm: false
    }
  },

  // ====== OPTIMIZED VITE CONFIG ======
  vite: {
    build: {
      sourcemap: false, // Disable sourcemaps in production
      minify: 'terser', // Better minification
      
      rollupOptions: {
        output: {
          // Manual chunk splitting
          manualChunks: {
            'vendor': ['vue', 'vue-router', 'pinia'],
            'ui': ['@nuxt/ui', 'reka-ui', '@vueuse/core'],
            'markdown': ['marked', 'markdown-it', 'md-editor-v3']
          },
          
          // Optimize chunk size
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop() 
              : 'chunk'
            return `_nuxt/${facadeModuleId}-[hash].js`
          }
        }
      },
      
      // Reduce chunk size warnings threshold
      chunkSizeWarningLimit: 500
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        '@vueuse/core'
      ],
      exclude: [
        'pdfmake',
        'sharp',
        '@aws-sdk/client-s3'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: false,
  
  // ====== ADDITIONAL OPTIMIZATIONS ======
  
  // Disable features not needed
  components: [
    {
      path: '~/components',
      extensions: ['.vue'],
      pathPrefix: false
    }
  ],
  
  // Optimize imports
  imports: {
    dirs: [
      'composables/**',
      'utils/**'
    ]
  },
  
  // Reduce build time
  experimental: {
    defaults: {
      useNuxtImport: true
    }
  }
})
