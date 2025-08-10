/**
 * MATIC Studio Chat Agent - Website Integration
 * 
 * Add this script to your website to integrate the chat agent.
 * Replace 'YOUR_RENDER_URL' with your actual Render.com deployment URL.
 */

(function() {
    'use strict';
    
    // Configuration
    const CHAT_API_URL = 'https://maticstudio-chat-agent.onrender.com'; // Render API

    const CHAT_CONTAINER_ID = 'maticstudio-chat';
    
    // Chat state
    let sessionId = null;
    let conversationHistory = [];
    let isProcessing = false;
    
    // Create chat widget HTML
    function createChatWidget() {
        const chatHTML = `
            <div id="${CHAT_CONTAINER_ID}" class="maticstudio-chat-widget">
                <div class="chat-header" style="display: none;">
                    <div class="chat-title">
                        <h3>MATIC Studio Assistant</h3>
                        <span class="status-indicator">🟢 Online</span>
                    </div>
                    <div class="chat-controls">
                        <button class="chat-reset" onclick="resetChat()" title="Reset Chat">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                        <button class="chat-minimize" onclick="toggleChat()" title="Minimize Chat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="chat-body" id="chat-body" style="display: none;">
                    <div class="chat-messages" id="chat-messages" style="display: none;">
                        <div class="message bot-message">
                            <p>Hello! I'm your MATIC Studio assistant. I'm here to help you discover how automation can transform your business processes. I can answer questions about our services, help you schedule consultations, and guide you through our solutions. What would you like to learn about today?</p>
                        </div>
                    </div>
                    
                    <div class="quick-replies" id="quick-replies" style="display: none;">
                        <button class="quick-reply-btn" onclick="openCalendly()">Schedule a Tune-up Call</button>
                        <button class="quick-reply-btn" onclick="sendQuickReply('What do you offer?')">What do you offer?</button>
                        <button class="quick-reply-btn" onclick="sendQuickReply('Learn more about MATICStudio')">Learn more about MATICStudio</button>
                    </div>
                    
                    <div class="chat-input" id="chat-input" style="display: none;">
                        <input type="text" id="message-input" placeholder="Type your message..." onkeypress="handleKeyPress(event)">
                        <button onclick="sendMessage()" id="send-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22,2 15,22 11,13 2,9"></polygon>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.insertAdjacentHTML('beforeend', chatHTML);
        
        // Add floating chat icon
        const floatingChatHTML = `
            <div id="floating-chat-icon" class="floating-chat-icon" onclick="toggleChat()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', floatingChatHTML);
        
        // Add CSS
        addChatStyles();
    }
    
    // Add chat styles
    function addChatStyles() {
        const styles = `
            <style>
                .maticstudio-chat-widget {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 350px;
                    max-height: 800px;
                    background: #000;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,255,255,0.2);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    z-index: 10000;
                    border: 1px solid #333;
                }
                
                .chat-header {
                    background: #000;
                    color: #00ffff;
                    padding: 15px 20px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #333;
                    position: relative;
                    z-index: 10001;
                }
                
                .chat-controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .chat-reset {
                    background: none;
                    border: none;
                    color: #00ffff;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                
                .chat-reset:hover {
                    background: rgba(0, 255, 255, 0.1);
                }
                
                .chat-title h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 500;
                }
                
                .status-indicator {
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .chat-minimize {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    transition: all 0.2s;
                }
                
                .chat-minimize:hover {
                    color: #00ffff;
                    background: rgba(0, 255, 255, 0.1);
                    border-radius: 4px;
                }
                
                .floating-chat-icon {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    background: #00ffff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(0,255,255,0.3);
                    z-index: 10000;
                    transition: all 0.3s ease;
                    color: #000;
                }
                
                .floating-chat-icon:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 25px rgba(0,255,255,0.4);
                }
                
                .chat-body {
                    min-height: 200px;
                    max-height: 600px;
                    display: flex;
                    flex-direction: column;
                    background: #000;
                }
                
                .chat-messages {
                    flex: 1;
                    padding: 15px;
                    overflow-y: auto;
                    max-height: 450px;
                    min-height: 200px;
                }
                
                .message {
                    margin-bottom: 15px;
                    padding: 12px 15px;
                    border-radius: 8px;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                }
                
                .bot-message {
                    background: #111;
                    color: #fff;
                    border: 1px solid #333;
                }
                
                .user-message {
                    background: #00ffff;
                    color: #000;
                    margin-left: 20px;
                }
                
                .quick-replies {
                    padding: 6px 15px;
                    background: #000;
                    max-height: 120px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    align-items: flex-start;
                }
                
                .quick-reply-btn {
                    display: inline-block;
                    background: #00ffff;
                    border: none;
                    border-radius: 18px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 500;
                    color: #000;
                    cursor: pointer;
                    text-align: center;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(0, 255, 255, 0.3);
                    max-width: 80%;
                    word-wrap: break-word;
                    margin: 0;
                }
                
                .quick-reply-btn:hover {
                    background: #00e6e6;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(0, 255, 255, 0.5);
                }
                
                .chat-input {
                    padding: 15px;
                    border-top: 1px solid #333;
                    display: flex;
                    gap: 8px;
                    background: #000;
                    position: relative;
                    z-index: 10001;
                    flex-shrink: 0;
                    min-height: 60px;
                }
                
                .chat-input input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #333;
                    border-radius: 20px;
                    font-size: 14px;
                    outline: none;
                    background: #111;
                    color: #fff;
                    caret-color: #00ffff;
                }
                
                .chat-input input:focus {
                    border-color: #00ffff;
                }
                
                .chat-input button {
                    width: 32px;
                    height: 32px;
                    background: #00ffff;
                    border: none;
                    border-radius: 50%;
                    color: #000;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .chat-input button:hover {
                    background: #00cccc;
                }
                
                .chat-input button:disabled {
                    background: #adb5bd;
                    cursor: not-allowed;
                }
                
                .typing-indicator {
                    padding: 10px 12px;
                    background: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    font-size: 14px;
                    color: #6c757d;
                    margin-bottom: 10px;
                }
                
                @media (max-width: 480px) {
                    .maticstudio-chat-widget {
                        width: calc(100vw - 40px);
                        right: 20px;
                        left: 20px;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
    
    // Toggle chat visibility
    window.toggleChat = function() {
        const chatBody = document.getElementById('chat-body');
        const isVisible = chatBody && chatBody.style.display !== 'none';
        
        if (isVisible) {
            // Minimize - hide entire chat body and header, show only chat icon
            const chatBody = document.getElementById('chat-body');
            const chatHeader = document.querySelector('.chat-header');
            if (chatBody) {
                chatBody.style.display = 'none';
            }
            if (chatHeader) {
                chatHeader.style.display = 'none';
            }
            
            // Show floating chat icon when minimized
            const floatingIcon = document.getElementById('floating-chat-icon');
            if (floatingIcon) {
                floatingIcon.style.display = 'flex';
            }
        } else {
            // Expand - show entire chat body, header, and all its elements
            const chatBody = document.getElementById('chat-body');
            const chatHeader = document.querySelector('.chat-header');
            const chatMessages = document.getElementById('chat-messages');
            const quickReplies = document.getElementById('quick-replies');
            const chatInput = document.getElementById('chat-input');
            
            if (chatBody) {
                chatBody.style.display = 'flex';
            }
            if (chatHeader) {
                chatHeader.style.display = 'flex';
            }
            if (chatMessages) {
                chatMessages.style.display = 'block';
            }
            if (quickReplies) {
                quickReplies.style.display = 'block';
            }
            if (chatInput) {
                chatInput.style.display = 'flex';
            }
            
            // Hide floating chat icon when expanded
            const floatingIcon = document.getElementById('floating-chat-icon');
            if (floatingIcon) {
                floatingIcon.style.display = 'none';
            }
            
            if (!sessionId) {
                // Initialize session on first open
                sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
        }
    };
    
    // Reset chat
    window.resetChat = function() {
        const chatMessages = document.getElementById('chat-messages');
        const quickReplies = document.getElementById('quick-replies');
        const messageInput = document.getElementById('message-input');
        
        // Clear conversation history
        conversationHistory = [];
        sessionId = null;
        
        // Reset messages to initial state
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <p>Hello! I'm your MATIC Studio assistant. I'm here to help you discover how automation can transform your business processes. I can answer questions about our services, help you schedule consultations, and guide you through our solutions. What would you like to learn about today?</p>
            </div>
        `;
        
        // Show quick replies
        quickReplies.style.display = 'block';
        
        // Clear input
        messageInput.value = '';
        messageInput.focus();
        

    };
    
    // Send message
    window.sendMessage = function() {
        const input = document.getElementById('message-input');
        const message = input.value.trim();
        
        if (message && !isProcessing) {
            addUserMessage(message);
            input.value = '';
            hideQuickReplies();
            sendToAPI(message);
        }
    };
    
    // Send quick reply
    window.sendQuickReply = function(message) {
        if (!isProcessing) {
            addUserMessage(message);
            sendToAPI(message);
            hideQuickReplies();
        }
    };
    
    // Handle Enter key
    window.handleKeyPress = function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };
    
    // Add user message to chat
    function addUserMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.textContent = message;
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // Hide quick replies when user sends a message
        hideQuickReplies();
    }
    
    // Add bot message to chat
    function addBotMessage(message) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        messageDiv.innerHTML = formatMessage(message);
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }
    
    // Format message with markdown-like formatting
    function formatMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/•/g, '•');
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '🤖 Thinking...';
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
    }
    
    // Hide typing indicator
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // Hide quick replies
    function hideQuickReplies() {
        const quickReplies = document.getElementById('quick-replies');
        quickReplies.style.display = 'none';
    }
    
    // Scroll to bottom of messages
    function scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Calendly integration
    function openCalendly() {

        // Prevent multiple tabs from opening
        if (window.calendlyWindow && !window.calendlyWindow.closed) {
            window.calendlyWindow.focus();
            return;
        }
        // Open Calendly link in new tab
        window.calendlyWindow = window.open('https://calendly.com/maticsolutionsph/30min', '_blank');
        
        // Add a message to the chat
        addBotMessage("Perfect! I've opened our scheduling calendar for you. You can book a 30-minute tune-up call with our team. If you need any help or have questions while scheduling, feel free to ask me!");
    }

    // Send message to API
    async function sendToAPI(message) {
        isProcessing = true;
        showTypingIndicator();
        
        // Ensure session ID exists
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        // Disable input
        const input = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        input.disabled = true;
        sendBtn.disabled = true;
        
        try {
            // Check if message contains scheduling keywords
            const schedulingKeywords = ['schedule', 'booking', 'appointment', 'call', 'meeting', 'consultation', 'tune-up'];
            const hasSchedulingIntent = schedulingKeywords.some(keyword => 
                message.toLowerCase().includes(keyword)
            );
            
            if (hasSchedulingIntent) {
                hideTypingIndicator();
                addBotMessage("Great! I'd be happy to help you schedule a consultation. Let me open our booking calendar for you.");
                setTimeout(() => {
                    openCalendly();
                }, 1000);
                return;
            }
            
            const apiUrl = `${CHAT_API_URL}/api/chat`;
            
            const requestBody = {
                message: message,
                conversation_history: conversationHistory,
                session_id: sessionId
            };
            

            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            

            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            

            
            hideTypingIndicator();
            
            if (data.status === 'success') {
                addBotMessage(data.response);
                conversationHistory.push(
                    { role: 'user', content: message },
                    { role: 'assistant', content: data.response }
                );
                
                if (data.session_id) {
                    sessionId = data.session_id;
                }
            } else {
                // Fallback responses for common questions
                const fallbackResponses = {
                    'what do you offer': "MATIC Studio specializes in business process automation solutions. We help businesses streamline operations, reduce manual tasks, and improve efficiency through intelligent automation. Our services include workflow automation, custom scheduling systems, AI integration, and process optimization. Would you like to schedule a consultation to discuss your specific needs?",
                    'learn more about maticstudio': "MATIC Studio is a leading business process automation company. We help organizations transform their operations through intelligent automation solutions. Our expertise includes workflow optimization, custom scheduling, AI integration, and process streamlining. We work with businesses of all sizes to improve efficiency and reduce operational costs. Would you like to schedule a consultation to learn more?",
                    'schedule': "I'd be happy to help you schedule a consultation! Let me open our booking calendar for you.",
                    'consultation': "Perfect! I can help you schedule a consultation with our team. Let me open our booking calendar.",
                    'pricing': "Our pricing varies based on your specific needs and project scope. I'd recommend scheduling a consultation so we can discuss your requirements and provide a detailed quote tailored to your business.",
                    'contact': "You can reach us through our contact form, schedule a consultation through our calendar, or continue chatting with me for immediate assistance. I'm here to help!"
                };
                
                const lowerMessage = message.toLowerCase();
                let fallbackResponse = "I apologize, but I'm having trouble connecting right now. Please try again later or contact us directly at inquire@maticstudio.net.";
                
                for (const [keyword, response] of Object.entries(fallbackResponses)) {
                    if (lowerMessage.includes(keyword)) {
                        fallbackResponse = response;
                        break;
                    }
                }
                
                addBotMessage(fallbackResponse);
                
                // If it's a scheduling request, open Calendly
                if (lowerMessage.includes('schedule') || lowerMessage.includes('consultation')) {
                    setTimeout(() => {
                        openCalendly();
                    }, 2000);
                }
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            console.error('Error details:', {
                message: error.message,
                type: error.type,
                name: error.name
            });
            hideTypingIndicator();
            
            // Fallback responses for common questions
            const fallbackResponses = {
                'what do you offer': "MATIC Studio specializes in business process automation solutions. We help businesses streamline operations, reduce manual tasks, and improve efficiency through intelligent automation. Our services include workflow automation, custom scheduling systems, AI integration, and process optimization. Would you like to schedule a consultation to discuss your specific needs?",
                'learn more about maticstudio': "MATIC Studio is a leading business process automation company. We help organizations transform their operations through intelligent automation solutions. Our expertise includes workflow optimization, custom scheduling, AI integration, and process streamlining. We work with businesses of all sizes to improve efficiency and reduce operational costs. Would you like to schedule a consultation to learn more?",
                'schedule': "I'd be happy to help you schedule a consultation! Let me open our booking calendar for you.",
                'consultation': "Perfect! I can help you schedule a consultation with our team. Let me open our booking calendar.",
                'pricing': "Our pricing varies based on your specific needs and project scope. I'd recommend scheduling a consultation so we can discuss your requirements and provide a detailed quote tailored to your business.",
                'contact': "You can reach us through our contact form, schedule a consultation through our calendar, or continue chatting with me for immediate assistance. I'm here to help!"
            };
            
            const lowerMessage = message.toLowerCase();
            let fallbackResponse = "I apologize, but I'm having trouble connecting right now. Please try again later or contact us directly at inquire@maticstudio.net.";
            
            for (const [keyword, response] of Object.entries(fallbackResponses)) {
                if (lowerMessage.includes(keyword)) {
                    fallbackResponse = response;
                    break;
                }
            }
            
            addBotMessage(fallbackResponse);
            
            // If it's a scheduling request, open Calendly
            if (lowerMessage.includes('schedule') || lowerMessage.includes('consultation')) {
                setTimeout(() => {
                    openCalendly();
                }, 2000);
            }
        } finally {
            // Re-enable input
            input.disabled = false;
            sendBtn.disabled = false;
            input.focus();
            isProcessing = false;
        }
    }
    
    // Initialize chat widget when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatWidget);
    } else {
        createChatWidget();
    }
    
})();
