import React, { useState, useEffect, useRef } from 'react';
// Removed API_URL import - using hardcoded URLs

const AskCoach = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getCoachResponse = (userMessage) => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('start') || message.includes('sit')) {
      return "Start Jefferson over Diggs this week - better matchup against weak secondary. Also consider Ekeler if he's healthy.";
    }
    
    if (message.includes('trade')) {
      return "That trade looks fair, but try to get a pick too. Always aim for the best player in the deal and consider position scarcity.";
    }
    
    if (message.includes('waiver') || message.includes('pickup')) {
      return "Pick up Pacheco if available - he's the lead back now. Also check for any emerging WR2s with target share increases.";
    }
    
    if (message.includes('draft')) {
      return "Go RB-RB in early rounds, then stack QB-WR from same team. Target high-floor players in middle rounds and take flyers late.";
    }
    
    if (message.includes('injury') || message.includes('hurt')) {
      return "Always check the injury reports Wednesday-Friday. Have handcuffs for your RB1s and monitor snap counts for returning players.";
    }
    
    if (message.includes('matchup')) {
      return "Look at target share, red zone usage, and defensive rankings. Weather matters for outdoor games - wind over 20mph hurts passing.";
    }
    
    // Default response
    return "¡Buena pregunta! Como tu coach personal, te recomiendo siempre revisar las tendencias recientes, matchups y reports de lesiones. ¿Tienes alguna decisión específica de lineup?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputValue,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    
    // Small delay to show typing indicator
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const response = await fetch("https://fantasy-coach-backend-production.up.railway.app/api/coach/ask", {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: currentInput
        })
      });

      const data = await response.json();
      
      const coachResponse = {
        id: Date.now() + 1,
        text: data.answer || getCoachResponse(currentInput),
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      // Simulate typing delay for better UX
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
      setMessages(prev => [...prev, coachResponse]);
    } catch (error) {
      console.error('Error fetching coach response:', error);
      
      const fallbackResponse = {
        id: Date.now() + 1,
        text: 'Lo siento, no pude conectar con el coach en este momento. ' + getCoachResponse(currentInput),
        isUser: false,
        timestamp: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const copyMessage = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] bg-white">

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-2">
            <span className="text-sm">💬 Ask coach</span>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-2 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs flex ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-1`}>
              <div className={`rounded p-2 text-sm ${
                message.isUser 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white border'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          </div>
        ))}
        
        {(isLoading || isTyping) && (
          <div className="mb-2 flex justify-start">
            <div className="bg-white border rounded p-2 text-xs">
              <span>💭</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask coach..."
            className="flex-1 p-3 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading || isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isTyping}
            className="bg-blue-500 text-white p-3 rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default AskCoach;