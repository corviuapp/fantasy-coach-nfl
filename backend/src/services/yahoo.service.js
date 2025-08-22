import axios from 'axios';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export class YahooService {
  constructor() {
    this.clientId = process.env.YAHOO_CLIENT_ID;
    this.clientSecret = process.env.YAHOO_CLIENT_SECRET;
    this.redirectUri = process.env.YAHOO_REDIRECT_URI;
    
    // Debug logs temporales
    console.log('YahooService initialized:');
    console.log('Client ID:', this.clientId ? 'SET (' + this.clientId.substring(0, 20) + '...)' : 'NOT SET');
    console.log('Client Secret:', this.clientSecret ? 'SET' : 'NOT SET');
    console.log('Redirect URI:', this.redirectUri);
  }

  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'fspt-r',
      language: 'en-us'
    });
    
    return `https://api.login.yahoo.com/oauth2/request_auth?${params}`;
  }

  async getAccessToken(code) {
  try {
    // Yahoo requiere Basic Auth, NO enviar client_id/secret en params
    const params = new URLSearchParams({
      redirect_uri: this.redirectUri,
      code: code,
      grant_type: 'authorization_code'
    });

    // Crear Basic Auth header
    const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    console.log('Requesting token with Basic Auth...');
    console.log('Redirect URI:', this.redirectUri);

    const response = await axios.post(
      'https://api.login.yahoo.com/oauth2/get_token',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Yahoo token error:', error.response?.data);
    throw error;
  }
}

async getUserLeagues(accessToken) {
  try {
    const response = await fetch(
      'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    console.log('Yahoo API Response:', JSON.stringify(data, null, 2));
    
    return data;
  } catch (error) {
    console.error('Error fetching leagues:', error);
    throw error;
  }
}
}
