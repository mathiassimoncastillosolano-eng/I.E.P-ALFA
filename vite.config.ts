import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Alias "@" -> /src (ruta desde la raíz del proyecto). No usa módulos de Node,
// así `tsc -b` no necesita @types/node.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': '/src' } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
