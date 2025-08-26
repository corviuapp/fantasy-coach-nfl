import React, { useState, useEffect } from 'react';
// Removed API_URL import - using hardcoded URLs

const ExpertConsensus = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlayersData();
  }, []);

  useEffect(() => {
    const validPlayers = Array.isArray(players) ? players : [];
    
    if (searchTerm.trim() === '') {
      setFilteredPlayers(validPlayers);
    } else {
      const filtered = validPlayers.filter(player =>
        player && player.name && player.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlayers(filtered);
    }
  }, [searchTerm, players]);

  const fetchPlayersData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("https://fantasy-coach-backend-jyzu879f4-albertos-projects-d995ef2b.vercel.app/api/expert-consensus", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      
      const playersData = Array.isArray(data) ? data : [];
      setPlayers(playersData);
      setFilteredPlayers(playersData);
    } catch (err) {
      console.error('Error fetching expert consensus data:', err);
      setError('Failed to fetch player data. Please try again.');
      setPlayers([]);
      setFilteredPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateConsensusScore = (player) => {
    const espnRank = player.espnRank || null;
    const sleeperADP = player.sleeperADP || null;
    
    let espnScore = espnRank ? (100 - espnRank) : 50;
    let sleeperScore = sleeperADP ? (100 - sleeperADP) : 50;
    
    const consensusScore = Math.round((espnScore + sleeperScore) / 2);
    
    return Math.max(0, Math.min(100, consensusScore));
  };

  const getPositionBadge = (position) => {
    const badges = {
      QB: 'bg-red-500 text-white',
      RB: 'bg-blue-500 text-white',
      WR: 'bg-green-500 text-white',
      TE: 'bg-purple-500 text-white',
      K: 'bg-gray-500 text-white',
      DST: 'bg-gray-500 text-white'
    };
    return badges[position] || 'bg-gray-500 text-white';
  };

  const getSentimentEmoji = (sentiment) => {
    if (sentiment >= 75) return '😍';
    if (sentiment >= 50) return '😐';
    return '😟';
  };

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  if (loading && players.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading expert consensus data...</p>
              <p className="text-gray-400 text-sm mt-2">Fetching rankings from multiple sources</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Search Bar only */}
        <div className="mb-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search..."
              className="p-1 text-sm border rounded flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              onClick={fetchPlayersData}
              disabled={loading}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
            >
              🔄
            </button>
          </div>
        </div>

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-red-800 font-semibold mb-2">Error loading data</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={fetchPlayersData}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading indicator for refresh */}
      {loading && players.length > 0 && (
        <div className="mb-4 text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <span className="text-blue-700 text-sm font-medium">Refreshing data...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!Array.isArray(filteredPlayers) || filteredPlayers.length === 0) && !loading && (
        <div className="text-center py-16 bg-white rounded-lg border">
          <div className="text-6xl mb-6">
            {searchTerm ? '🔍' : '📊'}
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchTerm ? 'No players found' : 'No data available'}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? `No players found matching "${searchTerm}". Try a different search term.` 
              : 'No player data available at this time. Try refreshing the page.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Clear Search
            </button>
          )}
          {!searchTerm && (
            <button
              onClick={fetchPlayersData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200"
            >
              Refresh Data
            </button>
          )}
        </div>
      )}

      {/* Players List */}
      <div className="space-y-4">
        {Array.isArray(filteredPlayers) && filteredPlayers.map((player, index) => {
          const consensusScore = calculateConsensusScore(player);
          
          const getConsensusScoreStyle = (score) => {
            if (score > 90) return 'bg-green-500 text-white';
            if (score >= 70) return 'bg-yellow-500 text-white';
            return 'bg-red-500 text-white';
          };

          return (
            <div 
              key={index} 
              className="bg-white rounded border p-2 mb-1 text-xs"
            >
              {/* Everything in one line */}
              <div className="flex items-center justify-between gap-1">
                <div className="flex-1 font-medium truncate">{player.name}</div>
                <span className={`px-1 rounded text-xs ${getPositionBadge(player.position)}`}>
                  {player.position}
                </span>
                <span className="text-gray-600">ESPN:{player.espnRank || '-'}</span>
                <span className="text-gray-600">ADP:{player.sleeperADP || '-'}</span>
                <span className="text-gray-600">Score:{consensusScore}</span>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default ExpertConsensus;