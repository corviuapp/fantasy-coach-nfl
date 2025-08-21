// backend/src/server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import pg from 'pg';
import yahooRoutes from './src/routes/yahoo.js';

// Cargar variables de entorno
dotenv.config();

const { Pool } = pg;

class FantasyCoachServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.setupDatabase();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async setupDatabase() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    // Test connection
    try {
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connected');
    } catch (error) {
      console.log('⚠️  Database not connected (this is normal on first run)');
    }
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging
    this.app.use(morgan('dev'));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString()
      });
    });

    // Test route
    this.app.get('/api/test', (req, res) => {
      res.json({ 
        message: 'Fantasy Coach NFL API is working!',
        version: '1.0.0'
      });
    });

    // Yahoo OAuth routes
    this.app.use('/api/auth/yahoo', yahooRoutes);

    // Auth routes (básicas por ahora)
    this.app.post('/api/auth/register', async (req, res) => {
      const { email, username, password } = req.body;
      
      // Por ahora, solo retornamos success para testing
      res.json({
        success: true,
        user: { email, username },
        token: 'fake-jwt-token-for-testing'
      });
    });

    this.app.post('/api/auth/login', async (req, res) => {
      const { email, password } = req.body;
      
      // Login de prueba
      if (email === 'demo@example.com' && password === 'demo123') {
        res.json({
          success: true,
          user: { 
            email: 'demo@example.com', 
            username: 'demo',
            id: 1 
          },
          token: 'fake-jwt-token-for-testing'
        });
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    });

    // Mock recommendations
    this.app.get('/api/recommendations/draft', (req, res) => {
      res.json([
        {
          player: { name: 'Justin Jefferson', position: 'WR', team: 'MIN' },
          score: 92,
          confidence: 88,
          explanation: 'Elite WR1 with consistent production. Great value here.',
          factors: {
            expert: { display: 'Expert Rank: #3', value: 95 },
            projection: { display: 'Projected: 320 pts', value: 90 },
            need: { display: 'Team Need: High', value: 88 }
          }
        },
        {
          player: { name: 'Breece Hall', position: 'RB', team: 'NYJ' },
          score: 88,
          confidence: 82,
          explanation: 'Top-5 RB with massive upside. Fully healthy.',
          factors: {
            expert: { display: 'Expert Rank: #7', value: 87 },
            projection: { display: 'Projected: 285 pts', value: 86 },
            need: { display: 'Team Need: Critical', value: 92 }
          }
        }
      ]);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Route not found' });
    });
  }

  async start() {
    this.server = createServer(this.app);
    
    this.server.listen(this.port, () => {
      console.log('');
      console.log('🏈 ================================');
      console.log(`🚀 Fantasy Coach NFL API`);
      console.log(`📡 Running on: http://localhost:${this.port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log('🏈 ================================');
      console.log('');
    });
  }
}

// Start server
const server = new FantasyCoachServer();
server.start();

export default server;
