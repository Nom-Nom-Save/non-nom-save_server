import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.config';
import cookieParser from 'cookie-parser';
import usersRoutes from './modules/users/users.routes';
import adminRoutes from './modules/auth/auth.routes';
import establishmentsRoutes from './modules/establishments/establishments.routes';
import productsRoutes from './modules/products/products.routes';
import boxesRoutes from './modules/boxes/boxes.routes';
import menuRoutes from './modules/menu/menu.routes';
import ordersRoutes from './modules/orders/orders.routes';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      process.env.FRONT_END_URL_DEV!,
      process.env.FRONT_END_URL_STAGING!,
      process.env.FRONT_END_URL_PRED!,
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/users', usersRoutes);
app.use('/api/auth', adminRoutes);
app.use('/api/establishments', establishmentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/boxes', boxesRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);

const PORT = parseInt(process.env.PORT || '10000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
});
