import { defineConfig } from '@prisma/cli';

export default defineConfig({
  datasources: {
    db: {
      provider: 'postgresql',
      url: 'postgresql://usuario:contraseña@localhost:5432/nombre_base_datos',
    },
  },
});