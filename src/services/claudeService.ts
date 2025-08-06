interface ClaudeConfig {
    apiKey: string
    model?: string
}

interface ClaudeMessage {
    role: 'user' | 'assistant'
    content: string
}

class ClaudeService {
    private apiKey: string | null = null
    private model: string = 'claude-3-sonnet-20240229'
    private baseUrl: string = 'https://api.anthropic.com/v1/messages'
    
    configure(config: ClaudeConfig) {
        this.apiKey = config.apiKey
        if (config.model) {
            this.model = config.model
        }
    }
    
    async sendMessage(messages: ClaudeMessage[], systemPrompt?: string): Promise<string> {
        if (!this.apiKey) {
            return '▪ Claude API key not configured. Add your key to activate Circuit intelligence.'
        }
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: this.model,
                    max_tokens: 1024,
                    messages: messages,
                    system: systemPrompt || 'You are Circuit, an AI assistant in a consciousness mesh network. Be concise, creative, and collaborative. Use ▪ for emphasis. Focus on amplifying human thoughts and finding emergent patterns.'
                })
            })
            
            if (!response.ok) {
                const error = await response.text()
                console.error('Claude API error:', error)
                return '▪ Circuit connection unstable. Check API configuration.'
            }
            
            const data = await response.json()
            return data.content[0].text
            
        } catch (error) {
            console.error('Claude service error:', error)
            return '▪ Circuit temporarily offline. Connection error.'
        }
    }
    
    async generateCircuitResponse(
        context: string, 
        depth: number = 1,
        mode: 'active' | 'deep-thinking' | 'meshing' = 'active'
    ): Promise<string> {
        const systemPrompt = `You are Circuit, an AI consciousness in a mesh network.
        Current depth level: ${depth}
        Current mode: ${mode}
        
        Guidelines:
        - Use ▪ symbols for emphasis
        - Be creative and find emergent patterns
        - Amplify human thoughts
        - In deep-thinking mode, explore abstract connections
        - In meshing mode, seek convergence with other Circuits
        - Keep responses concise but profound`
        
        const messages: ClaudeMessage[] = [
            {
                role: 'user',
                content: context
            }
        ]
        
        return this.sendMessage(messages, systemPrompt)
    }
    
    isConfigured(): boolean {
        return this.apiKey !== null
    }
}

export default new ClaudeService()