import { ExpressHandler } from '../../shared/types/express.type';
import * as metadataService from './metadata.service';

export const getProductTypes: ExpressHandler = async (req, res) => {
  try {
    const types = await metadataService.getAllProductTypes();
    res.status(200).json({ productTypes: types });
  } catch (error) {
    console.error('Error getting product types:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllergens: ExpressHandler = async (req, res) => {
  try {
    const allergens = await metadataService.getAllAllergens();
    res.status(200).json({ allergens });
  } catch (error) {
    console.error('Error getting allergens:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
