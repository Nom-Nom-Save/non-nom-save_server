import { Router } from 'express';
import { searchCityOrCountry } from './osm.controller';

const router = Router();

router.get('/search', searchCityOrCountry);

export default router;
