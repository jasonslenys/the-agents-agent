import { NextResponse } from 'next/server'

export async function GET() {
  const widgetJs = `
(function() {
  // Get widget key from script tag (support both data-widget-key and data-widget-id for backwards compatibility)
  const script = document.currentScript || document.querySelector('script[data-widget-key], script[data-widget-id]');
  const widgetKey = script?.getAttribute('data-widget-key') || script?.getAttribute('data-widget-id');
  
  if (!widgetKey) {
    console.error('Widget key not found. Please add data-widget-key attribute to script tag.');
    return;
  }

  // Widget state
  let isOpen = false;
  let conversationId = null;
  let widgetConfig = null;
  let sessionId = generateSessionId();
  const API_BASE = script?.getAttribute('data-api-base') || window.location.protocol + '//' + script?.src.split('/')[2];
  let conversationState = {
    hasGreeted: false,
    hasName: false,
    hasEmail: false,
    hasIntent: false,
    visitorName: null,
    visitorEmail: null,
    visitorIntent: null
  };

  // Generate unique session ID
  function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Track analytics events
  function trackEvent(eventType) {
    try {
      fetch(\`\${API_BASE}/api/analytics/events\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetKey,
          eventType,
          sessionId,
          userAgent: navigator.userAgent,
          referrer: document.referrer || window.location.href
        }),
      }).catch(error => {
        // Silently fail analytics to not break widget functionality
        console.debug('Analytics tracking failed:', error);
      });
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  }

  // Create or find widget container
  function ensureWidgetContainer() {
    let widgetContainer = document.getElementById('realestate-ai-widget');
    if (!widgetContainer) {
      // Create container dynamically if not present
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'realestate-ai-widget';
      widgetContainer.style.cssText = 'position: fixed; z-index: 999999; pointer-events: none;';
      document.body.appendChild(widgetContainer);
    }
    return widgetContainer;
  }

  // Create widget HTML
  function createWidget() {
    const widgetContainer = ensureWidgetContainer();
    if (!widgetContainer) {
      console.error('Failed to create widget container');
      return;
    }

    // Widget bubble (closed state)
    const bubble = document.createElement('div');
    const position = widgetConfig?.position || 'bottom-right';
    const [vPos, hPos] = position.split('-');
    
    bubble.innerHTML = \`
      <div id="ai-widget-bubble" style="
        position: fixed;
        \${vPos}: 24px;
        \${hPos}: 24px;
        width: auto;
        min-width: 60px;
        height: 60px;
        background-color: \${widgetConfig?.primaryColor || '#0ea5e9'};
        border-radius: 30px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: transform 0.2s;
        padding: 0 20px;
        gap: 8px;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
        <span style="color: white; font-weight: 500; font-size: 14px; white-space: nowrap;">
          \${widgetConfig?.bubbleText || 'Chat with my AI assistant'}
        </span>
      </div>
    \`;

    // Chat window (open state)
    const chatWindow = document.createElement('div');
    const chatPosition = position.split('-');
    chatWindow.innerHTML = \`
      <div id="ai-widget-chat" style="
        position: fixed;
        \${vPos}: 24px;
        \${hPos}: 24px;
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        display: none;
        flex-direction: column;
        z-index: 10001;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header -->
        <div style="
          background: \${widgetConfig?.primaryColor || '#0ea5e9'};
          color: white;
          padding: 16px;
          border-radius: 12px 12px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <div style="font-weight: 600; font-size: 16px;">
              \${widgetConfig?.agentName || 'AI Assistant'}
            </div>
            <div style="font-size: 12px; opacity: 0.9;">
              \${widgetConfig?.companyName || 'How can we help?'}
            </div>
          </div>
          <button id="ai-widget-close" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            opacity: 0.8;
          ">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Messages -->
        <div id="ai-widget-messages" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        ">
          <!-- Messages will be inserted here -->
        </div>

        <!-- Input -->
        <div style="
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        ">
          <input
            id="ai-widget-input"
            type="text"
            placeholder="Type your message..."
            style="
              flex: 1;
              padding: 8px 12px;
              border: 1px solid #d1d5db;
              border-radius: 20px;
              outline: none;
              font-size: 14px;
            "
          />
          <button
            id="ai-widget-send"
            style="
              background: \${widgetConfig?.primaryColor || '#0ea5e9'};
              border: none;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            "
          >
            Send
          </button>
        </div>
      </div>
    \`;

    widgetContainer.appendChild(bubble);
    widgetContainer.appendChild(chatWindow);

    // Event listeners
    bubble.addEventListener('click', openChat);
    chatWindow.querySelector('#ai-widget-close').addEventListener('click', closeChat);
    chatWindow.querySelector('#ai-widget-send').addEventListener('click', sendMessage);
    chatWindow.querySelector('#ai-widget-input').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Load widget configuration
  async function loadConfig() {
    try {
      const response = await fetch(\`\${API_BASE}/api/widget-config?key=\${widgetKey}\`);
      const data = await response.json();
      
      if (data.success && data.config) {
        widgetConfig = data.config;
        createWidget();
        
        // Track widget view
        trackEvent('widget_view');
        
        // Start conversation
        startConversation();
      } else {
        console.error('Failed to load widget config:', data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to load widget config:', error);
    }
  }

  // Start conversation
  async function startConversation() {
    try {
      const response = await fetch(\`\${API_BASE}/api/conversations\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          widgetId: widgetKey,
          sessionId,
          userAgent: navigator.userAgent,
          referrer: document.referrer || window.location.href
        }),
      });
      const data = await response.json();
      conversationId = data.conversationId;
      
      // Track conversation started
      trackEvent('conversation_started');
      
      // Add personalized greeting message
      const greeting = widgetConfig?.greetingText || 
        \`Hi! I'm \${widgetConfig?.agentName || 'your AI assistant'}. How can I help you with your real estate needs today?\`;
      
      addMessage('system', greeting);
      conversationState.hasGreeted = true;
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }

  // Open chat
  function openChat() {
    isOpen = true;
    document.getElementById('ai-widget-bubble').style.display = 'none';
    document.getElementById('ai-widget-chat').style.display = 'flex';
  }

  // Close chat
  function closeChat() {
    isOpen = false;
    document.getElementById('ai-widget-bubble').style.display = 'flex';
    document.getElementById('ai-widget-chat').style.display = 'none';
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById('ai-widget-input');
    const message = input.value.trim();
    
    if (!message || !conversationId) return;

    // Add user message to UI
    addMessage('user', message);
    input.value = '';

    // Process message for lead qualification
    processMessageForLead(message);

    try {
      // Send to backend with conversation state
      const response = await fetch(\`\${API_BASE}/api/messages\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          message,
          senderType: 'VISITOR',
          conversationState
        }),
      });

      const data = await response.json();
      
      // Update conversation state from response
      if (data.updatedState) {
        Object.assign(conversationState, data.updatedState);
      }
      
      // Add AI response
      if (data.response) {
        addMessage('ai', data.response);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage('system', 'Sorry, I had trouble processing your message. Please try again.');
    }
  }

  // Process user message for lead qualification
  function processMessageForLead(message) {
    const lowerMessage = message.toLowerCase();
    
    // Extract name if not already captured
    if (!conversationState.hasName) {
      // Simple name detection - first message with "i'm" or "my name is"
      if (lowerMessage.includes("i'm ") || lowerMessage.includes("my name is") || lowerMessage.includes("im ")) {
        const nameMatch = message.match(/(?:i'm|my name is|im)\s+([a-zA-Z]+)/i);
        if (nameMatch) {
          conversationState.visitorName = nameMatch[1];
          conversationState.hasName = true;
        }
      }
    }
    
    // Extract email if present
    const emailMatch = message.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
    if (emailMatch && !conversationState.hasEmail) {
      conversationState.visitorEmail = emailMatch[0];
      conversationState.hasEmail = true;
    }
    
    // Extract intent
    if (!conversationState.hasIntent) {
      if (lowerMessage.includes('buy') || lowerMessage.includes('purchase')) {
        conversationState.visitorIntent = 'buying';
        conversationState.hasIntent = true;
      } else if (lowerMessage.includes('sell') || lowerMessage.includes('selling')) {
        conversationState.visitorIntent = 'selling';
        conversationState.hasIntent = true;
      } else if (lowerMessage.includes('rent') || lowerMessage.includes('rental')) {
        conversationState.visitorIntent = 'renting';
        conversationState.hasIntent = true;
      } else if (lowerMessage.includes('invest') || lowerMessage.includes('investment')) {
        conversationState.visitorIntent = 'investing';
        conversationState.hasIntent = true;
      }
    }
  }

  // Add message to UI
  function addMessage(sender, text) {
    const messagesContainer = document.getElementById('ai-widget-messages');
    const messageDiv = document.createElement('div');
    
    const isUser = sender === 'user';
    const isAI = sender === 'ai' || sender === 'system';
    
    messageDiv.style.cssText = \`
      max-width: 80%;
      padding: 8px 12px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      \${isUser ? 
        \`background: \${widgetConfig?.primaryColor || '#0ea5e9'}; color: white; align-self: flex-end; margin-left: auto;\` : 
        'background: #f3f4f6; color: #1f2937; align-self: flex-start; margin-right: auto;'
      }
    \`;
    
    messageDiv.textContent = text;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadConfig);
  } else {
    loadConfig();
  }
})();
`;

  return new NextResponse(widgetJs, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  })
}