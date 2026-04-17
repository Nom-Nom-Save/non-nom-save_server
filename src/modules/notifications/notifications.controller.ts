import { Request, Response } from 'express';
import { db } from '../../database';
import { establishments } from '../../database/schema/establishments.schema';
import { menu } from '../../database/schema/menu.schema';
import { eq, and, sql, exists } from 'drizzle-orm';
import { NotificationService } from './notification.service';

export const handleTestNotification = async (req: Request, res: Response) => {
  const { deviceToken, title, body } = req.body;

  if (!deviceToken) {
    return res.status(400).json({ message: 'deviceToken is required' });
  }

  try {
    await NotificationService.sendToDevice(
      deviceToken,
      title || 'Test Notification',
      body || 'This is a test notification from Non-Nom Save Server'
    );

    res.status(200).json({ success: true, message: 'Notification sent' });
  } catch (error) {
    console.error('Error in handleTestNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleTopicTestNotification = async (req: Request, res: Response) => {
  const { topic, title, body } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'topic is required' });
  }

  try {
    await NotificationService.sendToTopic(
      topic,
      title || 'Test Topic Notification',
      body || `This is a test notification for topic: ${topic}`
    );

    res.status(200).json({ success: true, message: `Notification sent to topic: ${topic}` });
  } catch (error) {
    console.error('Error in handleTopicTestNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handleNearbyNotification = async (req: Request, res: Response) => {
  const { lat, lon, deviceToken } = req.body;

  if (!lat || !lon || !deviceToken) {
    return res.status(400).json({ message: 'lat, lon and deviceToken are required' });
  }

  try {
    const radius = 3;
    const distanceSql = sql`6371 * acos(
      cos(radians(${lat})) * cos(radians(${establishments.latitude})) * 
      cos(radians(${establishments.longitude}) - radians(${lon})) + 
      sin(radians(${lat})) * sin(radians(${establishments.latitude}))
    )`;

    const nearbyEstablishments = await db
      .select({
        id: establishments.id,
        name: establishments.name,
      })
      .from(establishments)
      .where(
        and(
          eq(establishments.isEmailVerified, true),
          sql`${distanceSql} <= ${radius}`,
          exists(
            db
              .select()
              .from(menu)
              .where(and(eq(menu.establishmentId, establishments.id), eq(menu.status, 'Active')))
          )
        )
      )
      .limit(3);

    if (nearbyEstablishments.length > 0) {
      const names = nearbyEstablishments.map(e => e.name).join(', ');
      await NotificationService.sendToDevice(
        deviceToken,
        'Offers nearby!',
        `There are active offers at ${names} near you. Don't miss out!`
      );
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in handleNearbyNotification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
