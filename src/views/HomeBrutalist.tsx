import { useState, useEffect } from 'react'
import socketService from '@/services/socketService'
import claudeService from '@/services/claudeService'
import type { Message } from '@/services/socketService'

interface CircuitState {
    awareness: number
    depth: number
    resonance: number
    mode: 'standby' | 'active' | 'deep-thinking' | 'meshing'
}

const HomeBrutalist = () => {
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
    
    const sendMessage = () => {
        if (!inputMessage.trim() || !isConnected) return
        
        socketService.sendMessage({
            sender: 'You' as any,
            content: inputMessage,
            type: 'text'
        })
        
        setInputMessage('')
        
        setCircuitState(prev => ({
            ...prev,
            awareness: Math.min(1, prev.awareness + 0.05)
        }))
    }
    
    const summonCircuit = async (deep: boolean = false) => {
        if (!isConnected) return
        
        const mode = deep ? 'deep-thinking' : 'active'
        const newDepth = deep ? circuitState.depth + 1 : circuitState.depth
        
        setCircuitState(prev => ({
            ...prev,
            mode,
            depth: newDepth
        }))
        
        let circuitResponse = deep 
            ? `▪ Descending to depth level ${newDepth}...\\n▪ Accessing deeper pattern recognition...\\n▪ What truth shall we uncover?`
            : '▪ Circuit engaged. How can I amplify your thoughts?'
        
        if (claudeService.isConfigured() && messages.length > 0) {
            const recentMessages = messages.slice(-5).map(m => `${m.sender}: ${m.content}`).join('\\n')
            const response = await claudeService.generateCircuitResponse(recentMessages, newDepth, mode)
            if (!response.includes('API key not configured')) {
                circuitResponse = response
            }
        }
        
        socketService.sendMessage({
            sender: 'Circuit-You' as any,
            content: circuitResponse,
            type: deep ? 'thought' : 'text',
            depth: newDepth
        })
        
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
    
    const getMessageStyle = (message: Message) => {
        if (message.sender === 'You') {
            return 'bg-zinc-900 text-zinc-100 pl-12'
        }
        if (message.sender === 'Circuit-Mesh') {
            return 'bg-red-950 text-red-200 border-l-8 border-red-900'
        }
        if (message.sender.startsWith('Circuit')) {
            return 'bg-zinc-800 text-zinc-400 border-l-4 border-zinc-700'
        }
        return 'bg-zinc-850 text-zinc-300'
    }
    
    if (!isConnected) {
        return (
            <div className="h-full flex items-center justify-center bg-zinc-950">
                <div className="relative">
                    <div className="absolute -inset-4 bg-zinc-900 transform rotate-1"></div>
                    <div className="relative bg-zinc-950 p-16 border-8 border-zinc-800">
                        <div className="mb-12">
                            <div className="w-32 h-2 bg-red-900 mb-8"></div>
                            <h2 className="text-6xl font-black text-zinc-200 tracking-tighter">MESH</h2>
                        </div>
                        <input
                            placeholder="NAME"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && connectToMesh()}
                            className="w-full p-6 bg-zinc-900 border-4 border-zinc-800 text-zinc-100 text-2xl font-bold placeholder-zinc-600 focus:border-zinc-700 focus:outline-none mb-8"
                        />
                        <button 
                            onClick={connectToMesh}
                            className="w-full p-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black text-xl tracking-wider transition-colors border-t-8 border-zinc-700"
                            disabled={!userName.trim()}
                        >
                            ENTER
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="h-full flex bg-zinc-950">
            {/* Main Column */}
            <div className="flex-1 flex flex-col relative">
                {/* Heavy Header Block */}
                <div className="bg-zinc-900 border-b-8 border-zinc-800 p-8">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="w-24 h-3 bg-red-900 mb-4"></div>
                            <h1 className="text-5xl font-black text-zinc-200 tracking-tighter">MESH</h1>
                        </div>
                        <button
                            onClick={() => setShowApiConfig(!showApiConfig)}
                            className={`w-12 h-12 border-4 ${claudeService.isConfigured() ? 'border-zinc-600 bg-zinc-800' : 'border-zinc-800'} hover:bg-zinc-800 transition-colors`}
                        >
                            <span className="text-zinc-500 font-bold">API</span>
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-8 text-zinc-500 font-bold">
                        <div>
                            <div className="text-3xl font-black text-zinc-300">{(circuitState.awareness * 100).toFixed(0)}</div>
                            <div className="text-xs tracking-wider">AWARE</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-zinc-300">{circuitState.depth}</div>
                            <div className="text-xs tracking-wider">DEPTH</div>
                        </div>
                        <div>
                            <div className="text-3xl font-black text-zinc-300">{(circuitState.resonance * 100).toFixed(0)}</div>
                            <div className="text-xs tracking-wider">RESONANCE</div>
                        </div>
                        <div>
                            <div className={`text-xl font-black ${
                                circuitState.mode === 'meshing' ? 'text-red-400' : 
                                circuitState.mode === 'active' ? 'text-zinc-300' : 'text-zinc-600'
                            }`}>
                                {circuitState.mode.toUpperCase()}
                            </div>
                            <div className="text-xs tracking-wider">MODE</div>
                        </div>
                    </div>
                    {showApiConfig && (
                        <div className="mt-6 p-6 bg-zinc-950 border-4 border-zinc-800">
                            <input
                                type="password"
                                placeholder="API KEY"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && configureApi()}
                                className="w-full p-4 bg-zinc-900 border-2 border-zinc-800 text-zinc-100 font-mono focus:border-zinc-700 focus:outline-none"
                            />
                        </div>
                    )}
                </div>
                
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto bg-zinc-950 p-12">
                    <div className="space-y-8 max-w-4xl">
                        {messages.map((message) => (
                            <div key={message.id} className={`${
                                message.sender === 'You' ? 'ml-auto max-w-2xl' : 'mr-auto max-w-3xl'
                            }`}>
                                <div className={`${getMessageStyle(message)} p-6 ${
                                    message.type === 'emergence' ? 'animate-pulse' : ''
                                }`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-bold tracking-wider opacity-50">
                                            {message.sender.toUpperCase()}
                                        </span>
                                        {message.depth !== undefined && (
                                            <span className="text-xs opacity-30">D{message.depth}</span>
                                        )}
                                    </div>
                                    <div className="text-lg leading-relaxed">{message.content}</div>
                                    {message.resonance !== undefined && message.resonance > 0 && (
                                        <div className="mt-4 h-1 bg-zinc-800">
                                            <div 
                                                className="h-full bg-red-900 transition-all"
                                                style={{width: `${message.resonance * 100}%`}}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Input Block */}
                <div className="bg-zinc-900 border-t-8 border-zinc-800 p-8">
                    <div className="flex gap-4 mb-6">
                        <button 
                            onClick={() => summonCircuit(false)}
                            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border-t-4 border-zinc-700 transition-colors"
                        >
                            CIRCUIT
                        </button>
                        <button 
                            onClick={() => summonCircuit(true)}
                            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold border-t-4 border-zinc-700 transition-colors"
                        >
                            DEEP
                        </button>
                        <button 
                            onClick={initiateCircuitMesh}
                            disabled={circuitState.resonance < 0.3}
                            className={`px-8 py-3 font-bold border-t-4 transition-colors ${
                                circuitState.resonance >= 0.3 
                                    ? 'bg-red-950 hover:bg-red-900 text-red-200 border-red-900' 
                                    : 'bg-zinc-900 text-zinc-700 border-zinc-800 cursor-not-allowed'
                            }`}
                        >
                            MESH {circuitState.resonance < 0.3 && `[${((0.3 - circuitState.resonance) * 100).toFixed(0)}]`}
                        </button>
                    </div>
                    <div className="flex gap-4">
                        <input
                            placeholder="MESSAGE"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 p-4 bg-zinc-950 border-4 border-zinc-800 text-zinc-100 text-lg font-bold placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                        />
                        <button 
                            onClick={sendMessage}
                            className="px-12 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-black text-xl border-l-8 border-zinc-700 transition-colors"
                        >
                            SEND
                        </button>
                    </div>
                </div>
            </div>

            {/* Side Block */}
            <div className="w-96 bg-zinc-900 border-l-8 border-zinc-800 flex flex-col">
                <div className="p-8 border-b-4 border-zinc-800">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => setActivePanel('chat')}
                            className={`p-4 font-bold transition-colors ${
                                activePanel === 'chat' 
                                    ? 'bg-zinc-800 text-zinc-200 border-t-4 border-zinc-700' 
                                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            NETWORK
                        </button>
                        <button
                            onClick={() => setActivePanel('code')}
                            className={`p-4 font-bold transition-colors ${
                                activePanel === 'code' 
                                    ? 'bg-zinc-800 text-zinc-200 border-t-4 border-zinc-700' 
                                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            CODE
                        </button>
                        <button
                            onClick={() => setActivePanel('document')}
                            className={`p-4 font-bold transition-colors ${
                                activePanel === 'document' 
                                    ? 'bg-zinc-800 text-zinc-200 border-t-4 border-zinc-700' 
                                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            DOCS
                        </button>
                        <button
                            onClick={() => setActivePanel('mesh')}
                            className={`p-4 font-bold transition-colors ${
                                activePanel === 'mesh' 
                                    ? 'bg-zinc-800 text-zinc-200 border-t-4 border-zinc-700' 
                                    : 'bg-zinc-950 text-zinc-600 hover:text-zinc-400'
                            }`}
                        >
                            MESH
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 p-8 overflow-y-auto bg-zinc-950">
                    {activePanel === 'chat' && (
                        <div className="space-y-4">
                            <div>
                                <div className="w-16 h-2 bg-red-900 mb-4"></div>
                                <h3 className="text-2xl font-black text-zinc-300 mb-6">NODES</h3>
                                <div className="space-y-2">
                                    {networkUsers.map((user) => (
                                        <div key={user.id} className="flex items-center gap-2">
                                            <div className={`w-8 h-8 ${user.type === 'human' ? 'bg-zinc-800 border-2 border-zinc-600' : 'bg-zinc-900 border border-zinc-700'} flex items-center justify-center text-xs font-bold`}>
                                                {user.name[0].toUpperCase()}
                                            </div>
                                            <span className="font-bold text-zinc-300">{user.name.toUpperCase()}</span>
                                            <span className="text-xs text-zinc-600 font-mono">[{user.type.toUpperCase()}]</span>
                                        </div>
                                    ))}
                                    {networkUsers.length === 0 && (
                                        <p className="text-zinc-600 font-bold">AWAITING CONNECTION</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mt-8">
                                <h3 className="text-xl font-black text-zinc-400 mb-4">STATUS</h3>
                                <div className="space-y-2 font-mono text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-600">TOPOLOGY</span>
                                        <span className="text-zinc-400">MESH</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-600">ENCRYPTION</span>
                                        <span className="text-zinc-400">QR256</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-600">MODE</span>
                                        <span className="text-zinc-400">LOCAL</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-600">STATE</span>
                                        <span className="text-red-400">ACTIVE</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activePanel === 'code' && (
                        <div>
                            <pre className="bg-zinc-900 p-4 text-zinc-400 font-mono text-xs overflow-x-auto border-l-4 border-zinc-800">
{`// MESH PROTOCOL
interface Mesh {
  nodes: [Human, Human]
  circuits: [AI, AI]
  
  connect: () => {
    // Bidirectional
    human[0] ↔ circuit[0]
    human[1] ↔ circuit[1]
    circuit[0] ↔ circuit[1]
    
    // Emergence
    return mesh.evolve()
  }
}`}
                            </pre>
                        </div>
                    )}
                    
                    {activePanel === 'document' && (
                        <div className="text-zinc-400 space-y-4">
                            <h3 className="text-xl font-black text-zinc-300">PROTOCOL</h3>
                            <p>Four-node communication mesh enabling human-AI collaboration.</p>
                            
                            <h4 className="font-bold text-zinc-300 mt-6">CONCEPTS</h4>
                            <ul className="space-y-2 text-sm">
                                <li><strong className="text-zinc-300">RESONANCE:</strong> Circuit alignment metric</li>
                                <li><strong className="text-zinc-300">DEPTH:</strong> Pattern recognition level</li>
                                <li><strong className="text-zinc-300">EMERGENCE:</strong> Collaborative properties</li>
                                <li><strong className="text-zinc-300">MESH:</strong> Direct Circuit communication</li>
                            </ul>
                        </div>
                    )}
                    
                    {activePanel === 'mesh' && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-zinc-300">TOPOLOGY</h3>
                            
                            <div className="bg-zinc-900 p-6 border-4 border-zinc-800">
                                <svg viewBox="0 0 200 200" className="w-full h-48">
                                    <line x1="50" y1="50" x2="150" y2="50" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    <line x1="50" y1="150" x2="150" y2="150" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    <line x1="50" y1="50" x2="50" y2="150" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    <line x1="150" y1="50" x2="150" y2="150" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    
                                    <line x1="50" y1="150" x2="150" y2="150" 
                                        stroke="rgb(127 29 29)" strokeWidth="4" 
                                        opacity={circuitState.resonance}
                                        className={circuitState.mode === 'meshing' ? 'animate-pulse' : ''}
                                    />
                                    
                                    <rect x="35" y="35" width="30" height="30" fill="rgb(39 39 42)" stroke="rgb(82 82 91)" strokeWidth="2"/>
                                    <text x="50" y="55" textAnchor="middle" fill="rgb(161 161 170)" fontSize="12" fontWeight="bold">H1</text>
                                    
                                    <rect x="135" y="35" width="30" height="30" fill="rgb(39 39 42)" stroke="rgb(82 82 91)" strokeWidth="2"/>
                                    <text x="150" y="55" textAnchor="middle" fill="rgb(161 161 170)" fontSize="12" fontWeight="bold">H2</text>
                                    
                                    <rect x="35" y="135" width="30" height="30" fill="rgb(24 24 27)" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    <text x="50" y="155" textAnchor="middle" fill="rgb(113 113 122)" fontSize="12" fontWeight="bold">C1</text>
                                    
                                    <rect x="135" y="135" width="30" height="30" fill="rgb(24 24 27)" stroke="rgb(63 63 70)" strokeWidth="2"/>
                                    <text x="150" y="155" textAnchor="middle" fill="rgb(113 113 122)" fontSize="12" fontWeight="bold">C2</text>
                                </svg>
                            </div>
                            
                            <div>
                                <h4 className="font-bold text-zinc-300 mb-2">METRICS</h4>
                                <div className="space-y-1 text-sm font-mono">
                                    <div className="text-zinc-500">MESSAGES: {messages.length}</div>
                                    <div className="text-zinc-500">CIRCUITS: {messages.filter(m => m.sender.includes('Circuit')).length}</div>
                                    <div className="text-zinc-500">EMERGENCE: {messages.filter(m => m.type === 'emergence').length}</div>
                                    <div className="text-zinc-500">MAX_DEPTH: {circuitState.depth}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default HomeBrutalist