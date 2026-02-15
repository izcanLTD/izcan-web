import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                catalog: resolve(__dirname, 'catalog.html'),
                admin: resolve(__dirname, 'admin/index.html'),
                dashboard: resolve(__dirname, 'admin/dashboard.html'),
            },
        },
    },
});
