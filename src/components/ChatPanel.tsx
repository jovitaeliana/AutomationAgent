import React, { useState } from 'react';

// Define the structure for a single chat message
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const ChatPanel: React.FC = () => {
  // State to hold the list of messages
  const [messages, setMessages] = useState<Message[]>([]);
  // State to hold the current value of the input box
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return; // Don't send empty messages

    // Add the user's message to the list
    const newUserMessage: Message = { sender: 'user', text: inputValue };
    
    const aiResponse: Message = { sender: 'ai', text: "Instruction received. What's next?" };
    setMessages(prevMessages => [...prevMessages, newUserMessage, aiResponse]);

    // Clear the input box
    setInputValue('');
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-app-text mb-6">Test Instructions & Conversation</h2>
      <div className="border border-app-border rounded-lg p-4 bg-app-bg-highlight flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {/* Loop through messages and render them */}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-3 py-2 text-sm max-w-xs ${msg.sender === 'user' ? 'bg-secondary text-app-text' : 'bg-app-bg-content border border-app-border'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 px-3 py-2 border border-app-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Type your test instruction..."
          />
          <button onClick={handleSendMessage} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;