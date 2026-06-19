const OLLAMA_BASE_URL = 'http://localhost:11434';

/**
 * Chat with Ollama model
 * @param {string} prompt - The user prompt
 * @param {string} systemPrompt - System context/instructions
 * @param {string} model - Model name (default: llama3)
 * @returns {Promise<string>} AI response text
 */
async function chatWithAI(prompt, systemPrompt = '', model = 'llama3.2:latest') {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("Ollama FULL error:", errText); // 👈 important
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response generated.';
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('Ollama is not running. Please start Ollama first: run "ollama serve" in terminal.');
    }
    throw error;
  }
}

/**
 * Chat with conversation history
 * @param {Array} messages - Array of {role, content} messages
 * @param {string} systemPrompt - System context
 * @param {string} model - Model name
 * @returns {Promise<string>} AI response
 */
async function chatWithHistory(messages, systemPrompt = '', model = 'llama3.2:latest') {
  try {
    const allMessages = [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      ...messages
    ];

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: allMessages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response generated.';
  } catch (error) {
    if (error.cause?.code === 'ECONNREFUSED') {
      throw new Error('Ollama is not running. Please start Ollama first.');
    }
    throw error;
  }
}

/**
 * Check if Ollama is running and get available models
 */
async function checkOllamaStatus() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    const data = await response.json();
    return {
      running: true,
      models: data.models?.map(m => m.name) || []
    };
  } catch {
    return { running: false, models: [] };
  }
}

module.exports = { chatWithAI, chatWithHistory, checkOllamaStatus };
