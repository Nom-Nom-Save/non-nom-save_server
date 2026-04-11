import axios from 'axios';
import { AccessTokenResponse } from './types/subscriptions.types';

export const paypalClient = axios.create({
  headers: {
    'Accept-Encoding': 'gzip, deflate',
  },
});

export async function getAccessToken(): Promise<string> {
  const sanitize = (val: string | undefined) => (val || '').trim().replace(/^["']|["']$/g, '');

  const PAYPAL_API = sanitize(process.env.PAYPAL_API);
  const CLIENT_ID = sanitize(process.env.PAYPAL_CLIENT_ID);
  const CLIENT_SECRET = sanitize(process.env.PAYPAL_CLIENT_SECRET);

  if (!PAYPAL_API || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('PayPal configuration missing in .env');
    throw new Error('PayPal configuration missing');
  }

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const res = await paypalClient.post<AccessTokenResponse>(
    `${PAYPAL_API}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return res.data.access_token;
}
