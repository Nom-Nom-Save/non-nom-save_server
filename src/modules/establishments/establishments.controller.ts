import { ExpressHandler } from '../../shared/types/express.type';
import { updateEstablishment, getEstablishmentById } from './establishments.service';
import { UpdateEstablishmentInput } from './types/establishments.type';

export const updateEstablishmentProfile: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;
    const authenticatedId = (req as any).user?.id;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    if (establishmentId !== authenticatedId) {
      res.status(403).json({ error: 'Access denied: You can only edit your own profile' });
      return;
    }

    const updateData: UpdateEstablishmentInput = req.body;

    const existingEstablishment = await getEstablishmentById(establishmentId);
    if (!existingEstablishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    const updated = await updateEstablishment(establishmentId, updateData);

    if (!updated) {
      res.status(500).json({ error: 'Failed to update establishment profile' });
      return;
    }

    res.status(200).json({
      message: 'Establishment profile updated successfully',
      establishment: updated,
    });
  } catch (error) {
    console.error('Error in updateEstablishmentProfile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEstablishment: ExpressHandler = async (req, res) => {
  try {
    const { establishmentId } = req.params;

    if (!establishmentId) {
      res.status(400).json({ error: 'Establishment ID is required' });
      return;
    }

    const establishment = await getEstablishmentById(establishmentId);

    if (!establishment) {
      res.status(404).json({ error: 'Establishment not found' });
      return;
    }

    res.status(200).json({
      message: 'Establishment retrieved successfully',
      establishment,
    });
  } catch (error) {
    console.error('Error in getEstablishment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
