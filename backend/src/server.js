import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import { db, createTables } from './database.js';
import yahooRoutes from './routes/yahoo.js';
import expertRoutes from './routes/experts.js';
import coachRoutes from './routes/coach.js';

dotenv.config();

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

/*
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (user && password === 'demo123') {
      res.json({
        success: true,
        user: { 
          email: user.email, 
          username: user.username,
          id: user.id 
        },
        token: 'fake-jwt-token-for-testing'
      });
    } else {
      res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});
*/

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
