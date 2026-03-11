import swaggerJSDoc from 'swagger-jsdoc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bontė API',
      version: '1.0.0',
      description: 'API documentation for the Bontė application',
      contact: {
        name: 'API Support',
        email: 'andrejsalogub3@gmail.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server',
      },
    ],
  },
  apis: [
    path.join(__dirname, './modules/**/*.routes.{ts,js}'),
    path.join(__dirname, './modules/**/*.controller.{ts,js}'),
    path.join(__dirname, './modules/**/*.types.{ts,js}'),
  ],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
