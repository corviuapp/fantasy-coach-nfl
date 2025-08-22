import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { db, createTables } from './database.js';
import yahooRoutes from './routes/yahoo.js';
import expertRoutes from './routes/experts.js';
import coachRoutes from './routes/coach.js';

dotenv.config();

const tokenStore = new Map();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://frontend-production-f269.up.railway.app',
    'https://frontend-production-5421.up.railway.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Backend is running!'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend connected successfully!',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Login funcional sin base de datos
  if (email === 'demo@example.com' && password === 'demo123') {
    res.json({
      success: true,
      user: { 
        email: 'demo@example.com', 
        username: 'Demo User',
        id: 1
      },
      token: 'demo-token-123'
    });
  } else {
    res.status(401).json({ 
      success: false,
      error: 'Invalid credentials' 
    });
  }
});

/*
app.get('/api/recommendations/draft', (req, res) => {
  try {
    const players = db.prepare('SELECT * FROM players ORDER BY projected_points DESC LIMIT 3').all();
    
    const recommendations = players.map((player, idx) => ({
      player: { 
        name: player.name, 
        position: player.position, 
        team: player.team 
      },
      score: Math.round(90 - idx * 3),
      confidence: Math.round(85 - idx * 5),
      explanation: `Projected for ${player.projected_points} points this season.`
    }));
    
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
*/

// Yahoo OAuth - Agregar ANTES de app.listen
import { YahooService } from './services/yahoo.service.js';
const yahoo = new YahooService();

// Ruta para iniciar OAuth con Yahoo
app.get('/api/auth/yahoo', (req, res) => {
  const authUrl = yahoo.getAuthUrl();
  res.json({ url: authUrl });
});

/*
// Callback de Yahoo
app.get('/auth/yahoo/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const tokens = await yahoo.getAccessToken(code);
    
    // Guardar tokens en la DB
    const stmt = db.prepare('INSERT OR REPLACE INTO users (email, username, password_hash) VALUES (?, ?, ?)');
    stmt.run('yahoo@user.com', 'Yahoo User', JSON.stringify(tokens));
    
    // Obtener ligas del usuario
    const leagues = await yahoo.getUserLeagues(tokens.access_token);
    console.log('Yahoo leagues:', leagues);
    
    // Redirigir al frontend con éxito
    res.redirect('http://localhost:5173/#yahoo-success');
  } catch (error) {
    console.error('Yahoo auth error:', error);
    res.redirect('http://localhost:5173/#yahoo-error');
  }
});
*/
/*
// Obtener ligas de Yahoo
app.get('/api/yahoo/leagues', async (req, res) => {
  try {
    // Aquí obtendrías el token del usuario de la DB
    // Por ahora retornamos mock data
    res.json([
      { id: 1, name: 'My Yahoo League', teams: 12, platform: 'yahoo' }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
*/
// Yahoo OAuth callback
app.get('/auth/yahoo/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    if (!code) {
      return res.redirect('https://frontend-production-f269.up.railway.app#yahoo-error');
    }

    // 1) Intercambiar el código por un access token
    const tokens = await yahoo.getAccessToken(code);
    console.log('Token exchange successful!');
    console.log('Access token received:', tokens.access_token ? 'YES' : 'NO');
    console.log('Refresh token received:', tokens.refresh_token ? 'YES' : 'NO');
    
    // 2) Generar un sessionId único
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // 3) Guardar el token en el Map temporal
    tokenStore.set(sessionId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      timestamp: Date.now()
    });
    
    // 4) Redirigir al frontend con el sessionId como parámetro
    console.log('Redirecting to frontend with session:', sessionId);
    res.redirect(`https://frontend-production-f269.up.railway.app#yahoo-success?sessionId=${sessionId}`);
  } catch (error) {
    console.error('Error in callback:', error.message, error.stack);
    res.redirect('https://frontend-production-f269.up.railway.app#yahoo-error');
  }
});

app.get('/api/yahoo/test-leagues', async (req, res) => {
  try {
    const { access_token } = req.query;
    
    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }
    
    const leagues = await yahoo.getUserLeagues(access_token);
    res.json(leagues);
  } catch (error) {
    console.error('Error fetching Yahoo leagues:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener ligas de Yahoo usando sessionId
app.get('/api/yahoo/leagues', async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Obtener el token del Map usando el sessionId
    const tokenData = tokenStore.get(sessionId);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    // Usar el token guardado para obtener las ligas del usuario
    const leagues = await yahoo.getUserLeagues(tokenData.access_token);
    res.json(leagues);
  } catch (error) {
    console.error('Error fetching Yahoo leagues:', error);
    res.status(500).json({ error: error.message });
  }
});

app.use('/api/auth/yahoo', yahooRoutes);
app.use('/api/expert-consensus', expertRoutes);
app.use('/api/coach', coachRoutes);
app.listen(PORT, () => {
  console.log('================================');
  console.log('Fantasy Coach NFL Backend');
  console.log('Server running on port:', PORT);
  console.log('http://localhost:' + PORT);
  console.log('================================');
});
