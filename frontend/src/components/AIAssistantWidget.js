import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { askAgent } from '../utils/api';

const quickPrompts = [
  'Find electronics under 3000',
  'I need books for semester',
  'Price for Good furniture',
  'Show trending rentals'
];

const AIAssistantWidget = () => {
  const navigate = useNavigate();
  const [sessionId] = useState(() => {
    const key = 'unilend_agent_session';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(key, created);
    return created;
  });
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! I am your UniLend AI Agent. I can help you find items, compare buy vs rent, and suggest prices.'
    }
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading]);

  const openSuggestion = (item) => {
    if (item.route) {
      navigate(item.route);
      return;
    }

    if (item.queryParams) {
      const params = new URLSearchParams(item.queryParams);
      navigate(`/listings?${params.toString()}`);
    }
  };

  const sendMessage = async (messageText) => {
    const content = messageText.trim();
    if (!content) return;

    setMessages(prev => [...prev, { role: 'user', text: content }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await askAgent({ message: content, sessionId });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || 'I could not process that. Please try again.',
          suggestions: data.suggestions || [],
          listings: data.listings || []
        }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Something went wrong. Please try again in a moment.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <button
        type="button"
        className="ai-fab"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle AI assistant"
        title="AI Assistant"
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-stars'}`} />
      </button>

      {open && (
        <div className="ai-widget">
          <div className="ai-widget-header">
            <div>
              <div className="ai-widget-title">UniLend AI Assistant</div>
              <div className="ai-widget-subtitle">Your marketplace copilot</div>
            </div>
          </div>

          <div className="ai-widget-body">
            {messages.map((msg, idx) => (
              <div key={`${msg.role}-${idx}`} className={`ai-msg ${msg.role === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}>
                <div>{msg.text}</div>

                {msg.listings?.length > 0 && (
                  <div className="ai-listings-preview">
                    {msg.listings.map(item => (
                      <button
                        type="button"
                        key={item._id}
                        className="ai-listing-pill"
                        onClick={() => navigate(`/listings/${item._id}`)}
                      >
                        {item.title}
                      </button>
                    ))}
                  </div>
                )}

                {msg.suggestions?.length > 0 && (
                  <div className="ai-suggestions">
                    {msg.suggestions.map((s, i) => (
                      <button type="button" key={`${s.label}-${i}`} className="ai-chip" onClick={() => openSuggestion(s)}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="ai-msg ai-msg-assistant">
                <span className="spinner-border spinner-border-sm me-2" /> Thinking...
              </div>
            )}
          </div>

          <div className="ai-widget-prompts">
            {quickPrompts.map(prompt => (
              <button key={prompt} type="button" className="ai-chip" onClick={() => sendMessage(prompt)} disabled={loading}>
                {prompt}
              </button>
            ))}
          </div>

          <form className="ai-widget-input" onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Ask anything about buying/selling..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!canSend}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
