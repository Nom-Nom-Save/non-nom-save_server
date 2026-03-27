import { ExpressHandler } from '../../shared/types/express.type';
import { handleError } from '../../shared/utils/app.error';
import * as osmService from './osm.service';

export const searchCityOrCountry: ExpressHandler = async (req, res) => {
  try {
    const data = await osmService.searchCityOrCountry(req.query.q as string);
    res.status(200).json(data);
  } catch (error) {
    handleError(res, error);
  }
};
