import { defineConfig } from 'vite'
import autoprefixer from 'autoprefixer'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
    root: 'src',
    publicDir: '../public',
    base: process.env.GITHUB_PAGES ? '/greengo-utility' : '/',

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@fonts': fileURLToPath(new URL('./src/fonts', import.meta.url)),
            '@scripts': fileURLToPath(new URL('./src/scripts', import.meta.url)),
            '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
        },
    },

    css: {
        devSourcemap: false,
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler',
                additionalData: `@use "@styles/helpers" as *;`,
            },
        },

        postcss: {
            plugins:[autoprefixer()],
        },
    },

    build: {
        outDir: '../dist',
        emptyOutDir: true,

        rollupOptions: {
            output: {
                entryFileNames: 'assets/js/[name]-[hash].js',
                chunkFileNames: 'assets/js/[name]-[hash].js',
                assetFileNames: ({ names }) => {
                    const name = names?.[0] ?? ''
                    if (/\.(woff2?|ttf|otf|eot)$/i.test(name))
                        return 'assets/fonts/[name]-[hash][extname]'
                    if (/\.css$/i.test(name))
                        return 'assets/css/[name]-[hash][extname]'
                    if (/\.(png|jpe?g|webp|avif|gif|svg)$/i.test(name))
                        return 'assets/img/[name]-[hash][extname]'
                    return 'assets/[name]-[hash][extname]'
                },
            },
        },
    },

    server: {
        open: true,
    },
})