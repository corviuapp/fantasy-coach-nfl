import React, { useState, useEffect } from 'react';

const ScoringRulesTab = ({ scoringRules, leagueType }) => (
  <div className="space-y-2 animate-fadeIn text-xs">
    <div className="bg-gray-50 p-2 rounded">
      <h3 className="text-sm font-semibold mb-1 text-gray-800">QB</h3>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <span className="font-medium">Pass Yds:</span> <span className="text-blue-600">{scoringRules[leagueType].passing.yards}</span>
        </div>
        <div>
          <span className="font-medium">Pass TDs:</span> <span className="text-green-600">{scoringRules[leagueType].passing.touchdowns}</span>
        </div>
        <div>
          <span className="font-medium">INTs:</span> <span className="text-red-600">{scoringRules[leagueType].passing.interceptions}</span>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 p-2 rounded">
      <h3 className="text-sm font-semibold mb-1 text-gray-800">RB</h3>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <span className="font-medium">Rush Yds:</span> <span className="text-blue-600">{scoringRules[leagueType].rushing.yards}</span>
        </div>
        <div>
          <span className="font-medium">Rush TDs:</span> <span className="text-green-600">{scoringRules[leagueType].rushing.touchdowns}</span>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 p-2 rounded">
      <h3 className="text-sm font-semibold mb-1 text-gray-800">WR/TE</h3>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <span className="font-medium">Recs:</span> <span className="text-purple-600">{scoringRules[leagueType].receiving.receptions}</span>
        </div>
        <div>
          <span className="font-medium">Rec Yds:</span> <span className="text-blue-600">{scoringRules[leagueType].receiving.yards}</span>
        </div>
        <div>
          <span className="font-medium">Rec TDs:</span> <span className="text-green-600">{scoringRules[leagueType].receiving.touchdowns}</span>
        </div>
      </div>
    </div>

    <div className="bg-red-50 p-2 rounded border border-red-200">
      <h3 className="text-sm font-semibold mb-1 text-red-800">Penalties</h3>
      <div>
        <span className="font-medium">Fumbles:</span> <span className="text-red-600">{scoringRules[leagueType].fumbles}</span>
      </div>
    </div>
  </div>
);

const PositionStrategyTab = ({ leagueType }) => (
  <div className="space-y-2 animate-fadeIn text-xs">
    <div className="bg-blue-50 p-2 rounded border border-blue-200">
      <h3 className="text-sm font-semibold mb-1 text-blue-800">{leagueType} Strategy</h3>
      <div className="grid grid-cols-2 gap-1">
        {leagueType === 'PPR' && (
          <>
            <div>• Slot WRs valuable</div>
            <div>• Pass-catching RBs</div>
            <div>• Target volume key</div>
          </>
        )}
        {leagueType === 'Half-PPR' && (
          <>
            <div>• Balanced approach</div>
            <div>• Receptions matter</div>
            <div>• Yards important</div>
          </>
        )}
        {leagueType === 'Standard' && (
          <>
            <div>• Big-play WRs</div>
            <div>• TD dependency</div>
            <div>• Volume less critical</div>
          </>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 gap-2">
      <div className="bg-green-50 p-2 rounded border border-green-200">
        <h4 className="text-sm font-semibold text-green-800 mb-1">RBs</h4>
        {leagueType === 'PPR' && (
          <div className="text-green-600">
            • Pass-catching backs<br/>
            • 3rd down specialists<br/>
            • Target share key
          </div>
        )}
        {leagueType === 'Half-PPR' && (
          <div className="text-green-600">
            • Balanced rushers<br/>
            • Workload key<br/>
            • Red zone touches
          </div>
        )}
        {leagueType === 'Standard' && (
          <div className="text-green-600">
            • Pure rushers<br/>
            • Goal line backs<br/>
            • TD upside
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
        <h4 className="text-sm font-semibold text-yellow-800 mb-1">WRs</h4>
        {leagueType === 'PPR' && (
          <div className="text-yellow-600">
            • Slot receivers<br/>
            • High-target WRs<br/>
            • Consistent floor
          </div>
        )}
        {leagueType === 'Half-PPR' && (
          <div className="text-yellow-600">
            • Mix of possession/deep<br/>
            • Air yards + targets<br/>
            • Red zone looks
          </div>
        )}
        {leagueType === 'Standard' && (
          <div className="text-yellow-600">
            • Deep threat WRs<br/>
            • Big-play capability<br/>
            • TD-dependent viable
          </div>
        )}
      </div>
    </div>
  </div>
);

const PointsCalculatorTab = ({ leagueType, calculatorStats, handleStatChange, calculatePoints }) => (
  <div className="space-y-2 animate-fadeIn">
    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-2 rounded border">
      
      <div className="grid grid-cols-2 gap-1 mb-3">
        <div>
          <label className="block text-xs text-gray-600">Pass Yds</label>
          <input
            key="passingYards"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.passingYards}
            onChange={(e) => handleStatChange('passingYards', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Pass TDs</label>
          <input
            key="passingTDs"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.passingTDs}
            onChange={(e) => handleStatChange('passingTDs', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">INTs</label>
          <input
            key="interceptions"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.interceptions}
            onChange={(e) => handleStatChange('interceptions', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Rush Yds</label>
          <input
            key="rushingYards"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.rushingYards}
            onChange={(e) => handleStatChange('rushingYards', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Rush TDs</label>
          <input
            key="rushingTDs"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.rushingTDs}
            onChange={(e) => handleStatChange('rushingTDs', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Recs</label>
          <input
            key="receptions"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.receptions}
            onChange={(e) => handleStatChange('receptions', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Rec Yds</label>
          <input
            key="receivingYards"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.receivingYards}
            onChange={(e) => handleStatChange('receivingYards', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Rec TDs</label>
          <input
            key="receivingTDs"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.receivingTDs}
            onChange={(e) => handleStatChange('receivingTDs', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600">Fumbles</label>
          <input
            key="fumbles"
            type="number"
            className="w-full text-sm p-1 border border-gray-300 rounded"
            value={calculatorStats.fumbles}
            onChange={(e) => handleStatChange('fumbles', e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white p-2 rounded border border-blue-200">
        <div className="text-center">
          <p className="text-sm font-bold text-blue-600">Points: {calculatePoints()}</p>
          <p className="text-xs text-gray-500">{leagueType}</p>
        </div>
      </div>
    </div>
  </div>
);

const RulesExplainer = () => {
  const [leagueType, setLeagueType] = useState('PPR');
  const [activeTab, setActiveTab] = useState('scoring');
  const [isLoading, setIsLoading] = useState(true);
  const [calculatorStats, setCalculatorStats] = useState({
    passingYards: '',
    passingTDs: '',
    interceptions: '',
    rushingYards: '',
    rushingTDs: '',
    receptions: '',
    receivingYards: '',
    receivingTDs: '',
    fumbles: ''
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const scoringRules = {
    PPR: {
      passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
      rushing: { yards: 0.1, touchdowns: 6 },
      receiving: { receptions: 1, yards: 0.1, touchdowns: 6 },
      fumbles: -2
    },
    'Half-PPR': {
      passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
      rushing: { yards: 0.1, touchdowns: 6 },
      receiving: { receptions: 0.5, yards: 0.1, touchdowns: 6 },
      fumbles: -2
    },
    Standard: {
      passing: { yards: 0.04, touchdowns: 4, interceptions: -2 },
      rushing: { yards: 0.1, touchdowns: 6 },
      receiving: { receptions: 0, yards: 0.1, touchdowns: 6 },
      fumbles: -2
    }
  };

  const calculatePoints = () => {
    const rules = scoringRules[leagueType];
    let totalPoints = 0;
    
    totalPoints += (Number(calculatorStats.passingYards) || 0) * rules.passing.yards;
    totalPoints += (Number(calculatorStats.passingTDs) || 0) * rules.passing.touchdowns;
    totalPoints += (Number(calculatorStats.interceptions) || 0) * rules.passing.interceptions;
    totalPoints += (Number(calculatorStats.rushingYards) || 0) * rules.rushing.yards;
    totalPoints += (Number(calculatorStats.rushingTDs) || 0) * rules.rushing.touchdowns;
    totalPoints += (Number(calculatorStats.receptions) || 0) * rules.receiving.receptions;
    totalPoints += (Number(calculatorStats.receivingYards) || 0) * rules.receiving.yards;
    totalPoints += (Number(calculatorStats.receivingTDs) || 0) * rules.receiving.touchdowns;
    totalPoints += (Number(calculatorStats.fumbles) || 0) * rules.fumbles;
    
    return totalPoints.toFixed(2);
  };

  const handleStatChange = (stat, value) => {
    setCalculatorStats(prev => ({
      ...prev,
      [stat]: parseInt(value) || 0
    }));
  };


  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {['PPR', 'Half-PPR', 'Standard'].map((type) => (
            <button
              key={type}
              onClick={() => setLeagueType(type)}
              className={`text-xs py-1 px-3 rounded font-medium ${
                leagueType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'scoring', label: 'Rules' },
            { id: 'strategy', label: 'Strategy' },
            { id: 'calculator', label: 'Calc' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs py-1 px-2 font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading fantasy rules...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-96 transition-opacity duration-500 opacity-100">
          {activeTab === 'scoring' && <ScoringRulesTab scoringRules={scoringRules} leagueType={leagueType} />}
          {activeTab === 'strategy' && <PositionStrategyTab leagueType={leagueType} />}
          {activeTab === 'calculator' && <PointsCalculatorTab 
            leagueType={leagueType} 
            calculatorStats={calculatorStats} 
            handleStatChange={handleStatChange} 
            calculatePoints={calculatePoints} 
          />}
        </div>
      )}
      </div>
    </>
  );
};

export default RulesExplainer;