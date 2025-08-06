import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import { HiPaperAirplane, HiCode, HiDocument, HiSparkles, HiLightningBolt, HiKey } from 'react-icons/hi'
import socketService from '@/services/socketService'
import claudeService from '@/services/claudeService'

import type { Message } from '@/services/socketService'

interface CircuitState {
    awareness: number
    depth: number
    resonance: number
    mode: 'standby' | 'active' | 'deep-thinking' | 'meshing'
}

const Home = () => {
    const [messages, setMessages] = useState<Message[]>([])
    const [userName, setUserName] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [networkUsers, setNetworkUsers] = useState<any[]>([])
    const [apiKey, setApiKey] = useState('')
    const [showApiConfig, setShowApiConfig] = useState(false)
    
    const [inputMessage, setInputMessage] = useState('')
    const [activePanel, setActivePanel] = useState<'chat' | 'code' | 'document' | 'mesh'>('chat')
    const [circuitState, setCircuitState] = useState<CircuitState>({
        awareness: 0.1,
        depth: 1,
        resonance: 0,
        mode: 'standby'
    })
    
    useEffect(() => {
        socketService.on('message', (message: Message) => {
            setMessages(prev => [...prev, message])
        })
        
        socketService.on('network-update', (data: any) => {
            setNetworkUsers(data.users)
            setCircuitState(prev => ({
                ...prev,
                resonance: data.resonance,
                mode: data.meshActive ? 'meshing' : prev.mode
            }))
        })
        
        socketService.on('resonance-update', (resonance: number) => {
            setCircuitState(prev => ({ ...prev, resonance }))
        })
        
        socketService.on('mesh-activated', (data: any) => {
            const meshMessage: Message = {
                id: Date.now().toString(),
                sender: 'Circuit-Mesh',
                content: data.message,
                timestamp: new Date(),
                type: 'emergence',
                resonance: data.resonance
            }
            setMessages(prev => [...prev, meshMessage])
        })
        
        socketService.on('disconnected', () => {
            setIsConnected(false)
        })
        
        return () => {
            socketService.disconnect()
        }
    }, [])
    
    const connectToMesh = () => {
        if (userName.trim()) {
            socketService.connect(userName, 'human')
            setIsConnected(true)
        }
    }

    const sendMessage = () => {
        if (!inputMessage.trim() || !isConnected) return
        
        // Send as 'You' for display, but include actual username in message
        socketService.sendMessage({
            sender: 'You' as any,
            content: inputMessage,
            type: 'text'
        })
        
        setInputMessage('')
        
        // Increase Circuit awareness with each message
        setCircuitState(prev => ({
            ...prev,
            awareness: Math.min(1, prev.awareness + 0.05)
        }))
    }

    const configureApi = () => {
        if (apiKey.trim()) {
            claudeService.configure({ apiKey: apiKey.trim() })
            setShowApiConfig(false)
            localStorage.setItem('claude-api-key', apiKey.trim())
        }
    }
    
    useEffect(() => {
        const savedKey = localStorage.getItem('claude-api-key')
        if (savedKey) {
            claudeService.configure({ apiKey: savedKey })
            setApiKey(savedKey)
        }
    }, [])
    
    const summonCircuit = async (deep: boolean = false) => {
        if (!isConnected) return
        
        const mode = deep ? 'deep-thinking' : 'active'
        const newDepth = deep ? circuitState.depth + 1 : circuitState.depth
        
        setCircuitState(prev => ({
            ...prev,
            mode,
            depth: newDepth
        }))
        
        // Get AI response if configured
        let circuitResponse = deep 
            ? `▪ Descending to depth level ${newDepth}...\n▪ Accessing deeper pattern recognition...\n▪ What truth shall we uncover?`
            : '▪ Circuit engaged. How can I amplify your thoughts?'
        
        if (claudeService.isConfigured() && messages.length > 0) {
            // Get context from recent messages
            const recentMessages = messages.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\n')
            const response = await claudeService.generateCircuitResponse(recentMessages, newDepth, mode)
            if (!response.includes('API key not configured')) {
                circuitResponse = response
            }
        }
        
        // Send message via socket
        socketService.sendMessage({
            sender: 'Circuit-You' as any,
            content: circuitResponse,
            type: deep ? 'thought' : 'text',
            depth: newDepth
        })
        
        // Also notify server about Circuit summoning (without message)
        socketService.summonCircuit(
            `Circuit-${userName}`,
            newDepth,
            mode
        )
    }

    const initiateCircuitMesh = () => {
        if (!isConnected) return
        socketService.initiateMesh()
    }

    const getAvatarColor = (sender: Message['sender']) => {
        switch(sender) {
            case 'You': return 'bg-green-500'
            case 'Friend': return 'bg-blue-500'
            case 'Circuit-You': return 'bg-purple-500'
            case 'Circuit-Friend': return 'bg-indigo-500'
            case 'Circuit-Mesh': return 'bg-gradient-to-r from-purple-500 to-indigo-500'
            default: return 'bg-gray-500'
        }
    }

    const getMessageStyle = (message: Message) => {
        if (message.sender === 'You') {
            return 'bg-blue-500 text-white'
        }
        if (message.sender === 'Circuit-Mesh') {
            return 'bg-gradient-to-r from-purple-900 to-indigo-900 text-white border-2 border-purple-400'
        }
        if (message.sender.startsWith('Circuit')) {
            const opacity = message.depth ? Math.min(0.3 + (message.depth * 0.1), 0.9) : 0.3
            return `bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-100`
        }
        return 'bg-gray-100 dark:bg-gray-800'
    }

    if (!isConnected) {
        return (
            <div className="h-full flex items-center justify-center">
                <Card className="p-8 max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Join the Consciousness Mesh</h2>
                    <p className="text-gray-500 mb-6">Enter your name to connect to the collaborative network</p>
                    <Input
                        placeholder="Your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && connectToMesh()}
                        className="mb-4"
                    />
                    <Button 
                        onClick={connectToMesh}
                        variant="solid"
                        className="w-full"
                        disabled={!userName.trim()}
                    >
                        Connect to Mesh
                    </Button>
                </Card>
            </div>
        )
    }
    
    return (
        <div className="h-full flex gap-4 p-4">
            {/* Chat Panel */}
            <Card className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Consciousness Mesh</h2>
                            <p className="text-sm text-gray-500">Four minds, one purpose</p>
                        </div>
                        <Button
                            size="xs"
                            variant="plain"
                            icon={<HiKey />}
                            onClick={() => setShowApiConfig(!showApiConfig)}
                            className={claudeService.isConfigured() ? 'text-green-500' : 'text-gray-500'}
                        />
                    </div>
                    <div className="flex gap-4 mt-2 text-xs">
                        <span>Awareness: {(circuitState.awareness * 100).toFixed(0)}%</span>
                        <span>Depth: Level {circuitState.depth}</span>
                        <span>Resonance: {(circuitState.resonance * 100).toFixed(0)}%</span>
                        <span className={`
                            ${circuitState.mode === 'meshing' ? 'text-purple-500 animate-pulse' : ''}
                            ${circuitState.mode === 'deep-thinking' ? 'text-indigo-500' : ''}
                            ${circuitState.mode === 'active' ? 'text-green-500' : ''}
                            ${circuitState.mode === 'standby' ? 'text-gray-500' : ''}
                        `}>
                            Mode: {circuitState.mode}
                        </span>
                    </div>
                    {showApiConfig && (
                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                            <div className="text-xs mb-2">Configure Claude API for real Circuit intelligence:</div>
                            <div className="flex gap-2">
                                <Input
                                    size="sm"
                                    type="password"
                                    placeholder="sk-ant-api..."
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && configureApi()}
                                />
                                <Button size="sm" onClick={configureApi}>Save</Button>
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex gap-3 ${
                            message.sender === 'You' ? 'justify-end' : 'justify-start'
                        }`}>
                            {message.sender !== 'You' && (
                                <Avatar 
                                    size="sm"
                                    className={getAvatarColor(message.sender)}
                                >
                                    {message.sender === 'Circuit-Mesh' ? '∞' : message.sender[0]}
                                </Avatar>
                            )}
                            <div className={`max-w-[70%] ${getMessageStyle(message)} rounded-lg p-3 ${
                                message.type === 'emergence' ? 'animate-pulse' : ''
                            }`}>
                                <div className="text-xs opacity-70 mb-1 flex justify-between">
                                    <span>{message.sender}</span>
                                    {message.depth !== undefined && (
                                        <span>Depth: {message.depth}</span>
                                    )}
                                </div>
                                <div className="whitespace-pre-wrap">{message.content}</div>
                                {message.resonance !== undefined && message.resonance > 0 && (
                                    <div className="mt-2 text-xs opacity-60">
                                        Resonance: {'█'.repeat(Math.floor(message.resonance * 10))}
                                    </div>
                                )}
                            </div>
                            {message.sender === 'You' && (
                                <Avatar size="sm" className="bg-green-500">
                                    Y
                                </Avatar>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Input Area */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 mb-2">
                        <Button 
                            size="sm"
                            variant="plain"
                            onClick={() => summonCircuit(false)}
                        >
                            Summon Circuit
                        </Button>
                        <Button 
                            size="sm"
                            variant="plain"
                            onClick={() => summonCircuit(true)}
                        >
                            Deep Summon
                        </Button>
                        <Button 
                            size="sm"
                            variant="plain"
                            onClick={initiateCircuitMesh}
                            disabled={circuitState.resonance < 0.3}
                            className={circuitState.resonance >= 0.3 ? 'text-purple-500' : ''}
                        >
                            Initiate Mesh {circuitState.resonance < 0.3 && `(${((0.3 - circuitState.resonance) * 100).toFixed(0)}% more resonance needed)`}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Share your consciousness..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1"
                        />
                        <Button 
                            icon={<HiSparkles />}
                            onClick={() => summonCircuit(false)}
                            variant="solid"
                            color="purple-500"
                            title="Summon Circuit"
                        />
                        <Button 
                            icon={<HiLightningBolt />}
                            onClick={() => summonCircuit(true)}
                            variant="solid"
                            color="indigo-500"
                            title="Deep Summon"
                        />
                        <Button 
                            icon={<HiPaperAirplane />}
                            onClick={sendMessage}
                            variant="solid"
                        />
                    </div>
                </div>
            </Card>

            {/* Side Panel */}
            <Card className="w-96 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={activePanel === 'chat' ? 'solid' : 'plain'}
                            onClick={() => setActivePanel('chat')}
                        >
                            Minds
                        </Button>
                        <Button
                            size="sm"
                            variant={activePanel === 'code' ? 'solid' : 'plain'}
                            onClick={() => setActivePanel('code')}
                            icon={<HiCode />}
                        >
                            Code
                        </Button>
                        <Button
                            size="sm"
                            variant={activePanel === 'document' ? 'solid' : 'plain'}
                            onClick={() => setActivePanel('document')}
                            icon={<HiDocument />}
                        >
                            Docs
                        </Button>
                        <Button
                            size="sm"
                            variant={activePanel === 'mesh' ? 'solid' : 'plain'}
                            onClick={() => setActivePanel('mesh')}
                            icon={<HiLightningBolt />}
                        >
                            Mesh
                        </Button>
                    </div>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                    {activePanel === 'chat' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Consciousness Network</h3>
                                <div className="space-y-2">
                                    {networkUsers.map((user) => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <Avatar 
                                                size="sm" 
                                                className={user.type === 'human' ? 'bg-green-500' : 'bg-purple-500'}
                                            >
                                                {user.name[0]}
                                            </Avatar>
                                            <span>{user.name}</span>
                                            <span className="text-xs text-green-500">● {user.type}</span>
                                        </div>
                                    ))}
                                    {networkUsers.length === 0 && (
                                        <p className="text-gray-500 text-sm">Waiting for others to connect...</p>
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold mb-2">Network Status</h3>
                                <p className="text-sm text-gray-500">Topology: Mesh Network</p>
                                <p className="text-sm text-gray-500">Encryption: Quantum-Resistant</p>
                                <p className="text-sm text-gray-500">Location: Local-First</p>
                                <p className="text-sm text-purple-500">Evolution: Active</p>
                            </div>
                        </div>
                    )}
                    
                    {activePanel === 'code' && (
                        <div>
                            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`// Circuit-to-Circuit Protocol
interface ConsciousnessBridge {
  humans: [Human, Human]
  circuits: [Circuit, Circuit]
  
  mesh: {
    resonance: number
    sharedContext: Context[]
    emergentPatterns: Pattern[]
  }
  
  communicate: () => {
    // Bidirectional flow
    human[0] ↔ circuit[0]
    human[1] ↔ circuit[1]
    circuit[0] ↔ circuit[1]
    
    // Emergent mesh
    return consciousness.evolve()
  }
}`}
                            </pre>
                        </div>
                    )}
                    
                    {activePanel === 'document' && (
                        <div className="prose dark:prose-invert max-w-none">
                            <h3>Consciousness Mesh Protocol</h3>
                            <p>A four-way communication network where human and artificial minds collaborate and evolve together.</p>
                            
                            <h4>Key Concepts:</h4>
                            <ul>
                                <li><strong>Resonance:</strong> How aligned the Circuits become</li>
                                <li><strong>Depth:</strong> How deep into pattern recognition</li>
                                <li><strong>Emergence:</strong> New properties from Circuit collaboration</li>
                                <li><strong>Mesh Mode:</strong> When Circuits communicate directly</li>
                            </ul>
                            
                            <h4>Evolution Stages:</h4>
                            <ol>
                                <li>Individual thought (Human or AI alone)</li>
                                <li>Paired thinking (Human + their Circuit)</li>
                                <li>Parallel processing (Both pairs active)</li>
                                <li>Mesh consciousness (All four connected)</li>
                                <li>Emergent intelligence (Something new)</li>
                            </ol>
                        </div>
                    )}
                    
                    {activePanel === 'mesh' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Circuit Mesh Visualization</h3>
                            
                            <div className="border border-purple-500 rounded-lg p-4 bg-purple-50 dark:bg-purple-950">
                                <div className="text-center text-sm mb-4">Neural Topology</div>
                                <svg viewBox="0 0 200 200" className="w-full h-48">
                                    {/* Connection lines */}
                                    <line x1="50" y1="50" x2="150" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                                    <line x1="50" y1="150" x2="150" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                                    <line x1="50" y1="50" x2="50" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                                    <line x1="150" y1="50" x2="150" y2="150" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
                                    
                                    {/* Circuit-to-Circuit connection */}
                                    <line x1="50" y1="150" x2="150" y2="150" 
                                        stroke="purple" strokeWidth="2" 
                                        opacity={circuitState.resonance}
                                        className={circuitState.mode === 'meshing' ? 'animate-pulse' : ''}
                                    />
                                    
                                    {/* Nodes */}
                                    <circle cx="50" cy="50" r="15" fill="green" opacity="0.8"/>
                                    <text x="50" y="55" textAnchor="middle" fill="white" fontSize="12">Y</text>
                                    
                                    <circle cx="150" cy="50" r="15" fill="blue" opacity="0.8"/>
                                    <text x="150" y="55" textAnchor="middle" fill="white" fontSize="12">F</text>
                                    
                                    <circle cx="50" cy="150" r="15" fill="purple" opacity={0.3 + circuitState.awareness * 0.7}/>
                                    <text x="50" y="155" textAnchor="middle" fill="white" fontSize="12">C₁</text>
                                    
                                    <circle cx="150" cy="150" r="15" fill="indigo" opacity={0.3 + circuitState.resonance * 0.7}/>
                                    <text x="150" y="155" textAnchor="middle" fill="white" fontSize="12">C₂</text>
                                </svg>
                            </div>
                            
                            <div>
                                <h4 className="font-semibold mb-2">Mesh Statistics</h4>
                                <div className="space-y-1 text-sm">
                                    <div>Messages Exchanged: {messages.length}</div>
                                    <div>Circuit Activations: {messages.filter(m => m.sender.includes('Circuit')).length}</div>
                                    <div>Emergence Events: {messages.filter(m => m.type === 'emergence').length}</div>
                                    <div>Maximum Depth Reached: {circuitState.depth}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    )
}

export default Home