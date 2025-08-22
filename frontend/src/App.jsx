import { useState, useEffect } from 'react';
import RulesExplainer from './components/RulesExplainer';
import ExpertConsensus from './components/ExpertConsensus';
import AskCoach from './components/AskCoach';
import { API_URL } from './config';

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginData, setLoginData] = useState({ 
    email: 'demo@example.com', 
    password: 'demo123' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [draftRecs, setDraftRecs] = useState([]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setShowLogin(false);
      } else {
        setError('Invalid credentials. Use demo@example.com / demo123');
      }
    } catch (err) {
      setError(`Cannot connect to backend. Make sure it's running on ${API_URL}`);
    }
    
    setLoading(false);
  };

  const loadDraftRecommendations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/recommendations/draft`);
      const data = await response.json();
      setDraftRecs(data);
    } catch (err) {
      console.error('Error loading recommendations:', err);
    }
  };

  useEffect(() => {
    if (!showLogin && activeTab === 'draft') {
      loadDraftRecommendations();
    }
  }, [showLogin, activeTab]);

  // Close mobile menu on window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detectar callback de Yahoo
  useEffect(() => {
    // Verificar hash params
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const yahooSuccess = hashParams.get('yahoo-success');
      const yahooError = hashParams.get('yahoo-error');
      
      if (yahooSuccess === 'true') {
        console.log('Yahoo connected successfully!');
        // Limpiar el hash
        window.location.hash = '';
        
        // Si no hay usuario, usar el demo automáticamente
        if (!user && showLogin) {
          setUser({ id: 1, username: 'demo', email: 'demo@example.com' });
          setShowLogin(false);
        }
        
        // Mostrar mensaje de éxito
        setTimeout(() => {
          alert('✅ Yahoo Fantasy connected successfully! Your leagues have been imported.');
        }, 500);
      }
      
      if (yahooError) {
        console.error('Yahoo connection error:', yahooError);
        // Limpiar el hash
        window.location.hash = '';
        
        // Si no hay usuario, usar el demo automáticamente
        if (!user && showLogin) {
          setUser({ id: 1, username: 'demo', email: 'demo@example.com' });
          setShowLogin(false);
        }
        
        setTimeout(() => {
          if (yahooError === 'token_failed') {
            alert('❌ Error: Could not get access token from Yahoo. Please check your Client Secret in the backend .env file.');
          } else if (yahooError === 'no_code') {
            alert('❌ Error: No authorization code received from Yahoo.');
          } else {
            alert('❌ Error connecting to Yahoo: ' + yahooError);
          }
        }, 500);
      }
    }
  }, []); // Solo ejecutar una vez al cargar

  const styles = {
    container: {
      minHeight: '100vh',
      background: showLogin ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: showLogin ? 'flex' : 'flex',
      flexDirection: 'column',
      overflow: showLogin ? 'auto' : 'hidden'
    },
    loginBox: {
      background: 'white',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      maxWidth: '400px',
      width: '100%',
      margin: '0 20px'
    },
    input: {
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      marginBottom: '15px',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '12px',
      background: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer'
    },
    header: {
      background: 'white',
      padding: window.innerWidth < 640 ? '10px 15px' : '15px 30px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0
    },
    nav: {
      background: 'white',
      padding: window.innerWidth < 640 ? '0 15px' : '0 30px',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      gap: window.innerWidth < 640 ? '10px' : '30px',
      transition: 'all 0.3s ease',
      flexShrink: 0,
      overflowX: 'auto'
    },
    navTab: {
      padding: window.innerWidth < 640 ? '10px 8px' : '15px 5px',
      background: 'none',
      border: 'none',
      borderBottom: '3px solid transparent',
      cursor: 'pointer',
      fontSize: window.innerWidth < 640 ? '13px' : '15px',
      color: '#666',
      transition: 'all 0.2s ease',
      whiteSpace: 'nowrap',
      minWidth: 'fit-content'
    },
    navTabActive: {
      borderBottom: '3px solid #667eea',
      color: '#667eea',
      fontWeight: 'bold',
      transform: 'translateY(-1px)'
    },
    content: {
      maxWidth: '1200px',
      margin: '20px auto',
      padding: '0 20px',
      '@media (min-width: 640px)': {
        margin: '30px auto',
        padding: '0 30px'
      }
    },
    card: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    },
    statCard: {
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      textAlign: 'center'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px'
    }
  };

  if (showLogin) {
    return (
      <div style={{...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div style={styles.loginBox}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>
              🏈 Fantasy Coach NFL
            </h1>
            <p style={{ color: '#666', margin: 0 }}>
              Your AI-powered fantasy assistant
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                Email
              </label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                style={styles.input}
                placeholder="demo@example.com"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '14px' }}>
                Password
              </label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                style={styles.input}
                placeholder="demo123"
                required
              />
            </div>

            {error && (
              <div style={{ 
                background: '#fee', 
                color: '#c00', 
                padding: '10px', 
                borderRadius: '5px', 
                marginBottom: '15px',
                fontSize: '14px' 
              }}>
                {error}
              </div>
            )}

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#f5f5f5', 
            borderRadius: '8px',
            textAlign: 'center',
            fontSize: '14px',
            color: '#666'
          }}>
            Demo credentials:<br/>
            <strong>demo@example.com / demo123</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Navigation only - no header */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        gap: '5px',
        transition: 'all 0.3s ease',
        flexShrink: 0,
        overflowX: 'auto',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 10px'
      }}>
        {['dashboard', 'draft', 'lineup', 'waivers', 'coach', 'experts', 'rules'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setMobileMenuOpen(false);
            }}
            style={{
              padding: '2px 4px',
              background: activeTab === tab ? '#667eea' : 'none',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px',
              color: activeTab === tab ? 'white' : '#666',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            {tab === 'dashboard' ? 'Dash' : 
             tab === 'experts' ? 'Exp' :
             tab === 'rules' ? 'Rules' :
             tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
        <button 
          onClick={() => {
            setShowLogin(true);
            setUser(null);
          }}
          style={{ 
            background: 'none', 
            border: '1px solid #ddd', 
            padding: '2px 6px', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          🚪
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-40px)] overflow-y-auto p-2">
        {activeTab === 'dashboard' && (
          <>
            <h2>Dashboard</h2>
            <div style={styles.grid}>
              <div style={styles.statCard}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>3rd</div>
                <div style={{ color: '#666', marginTop: '5px' }}>Current Standing</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#22c55e' }}>71%</div>
                <div style={{ color: '#666', marginTop: '5px' }}>Win Rate</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#3b82f6' }}>1,247</div>
                <div style={{ color: '#666', marginTop: '5px' }}>Points For</div>
              </div>
              <div style={styles.statCard}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#a855f7' }}>$67</div>
                <div style={{ color: '#666', marginTop: '5px' }}>FAAB Left</div>
              </div>
            </div>

            <div style={{...styles.card, background: '#fef3c7', border: '1px solid #fde68a'}}>
              <h3 style={{ margin: '0 0 10px 0', color: '#92400e' }}>⚠️ Action Required</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
                <li>Davante Adams is Questionable - Check lineup</li>
                <li>Waivers process tonight at 3 AM</li>
                <li>Trade deadline in 2 weeks</li>
              </ul>
            </div>

            {/* BOTÓN DE YAHOO */}
            <div style={{
              background: '#7c3aed',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0' }}>Connect Yahoo Fantasy</h3>
              <p style={{ margin: '0 0 15px 0', opacity: 0.9 }}>
                Import your real leagues from Yahoo
              </p>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`${API_URL}/api/auth/yahoo`, {
                      credentials: 'include'
                    });
                    const data = await response.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      console.error('No URL received from backend');
                      alert('Error: No URL received from backend');
                    }
                  } catch (err) {
                    console.error('Error connecting to Yahoo:', err);
                    alert('Error connecting to Yahoo. Check console for details.');
                  }
                }}
                style={{
                  background: 'white',
                  color: '#7c3aed',
                  padding: '10px 30px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Connect Yahoo Account
              </button>
            </div>
            {/* FIN DEL BOTÓN DE YAHOO */}
          </>
        )}

        {activeTab === 'draft' && (
          <>
            <h2>Draft Recommendations</h2>
            {draftRecs.length > 0 ? (
              draftRecs.map((rec, idx) => (
                <div key={idx} style={styles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 5px 0' }}>
                        {idx + 1}. {rec.player.name} - {rec.player.position} ({rec.player.team})
                      </h3>
                      <p style={{ color: '#666', margin: '10px 0' }}>{rec.explanation}</p>
                      <div style={{ color: '#667eea', fontWeight: 'bold' }}>
                        Score: {rec.score} | Confidence: {rec.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={styles.card}>
                <p>Loading recommendations...</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'lineup' && (
          <>
            <h2>Lineup Optimizer</h2>
            <div style={styles.card}>
              <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                🔧 Connect your league to get lineup recommendations!
              </p>
            </div>
          </>
        )}

        {activeTab === 'waivers' && (
          <>
            <h2>Waiver Wire</h2>
            <div style={styles.card}>
              <p style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                💎 Connect your league to see waiver recommendations!
              </p>
            </div>
          </>
        )}

        {activeTab === 'coach' && <AskCoach />}

        {activeTab === 'experts' && <ExpertConsensus />}

        {activeTab === 'rules' && <RulesExplainer />}
      </div>
    </div>
  );
}

export default App;