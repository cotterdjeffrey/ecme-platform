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

const HomeBrutalistLight = () => {
    const [messages, setMessages] = useState<Message[]>([])
    const [userName, setUserName] = useState('')
    const [isConnected, setIsConnected] = useState(false)
    const [networkUsers, setNetworkUsers] = useState<any[]>([])
    const [apiKey, setApiKey] = useState('')
    const [showApiConfig, setShowApiConfig] = useState(false)
    const [inputMessage, setInputMessage] = useState('')
    const [showInfo, setShowInfo] = useState(false)
    const [circuitState, setCircuitState] = useState<CircuitState>({
        awareness: 0.1,
        depth: 1,
        resonance: 0,
        mode: 'standby'
    })
    
    useEffect(() => {
        const handleMessage = (message: Message) => {
            setMessages(prev => [...prev, message])
        }
        
        const handleNetworkUpdate = (data: any) => {
            setNetworkUsers(data.users)
            setCircuitState(prev => ({
                ...prev,
                resonance: data.resonance,
                mode: data.meshActive ? 'meshing' : prev.mode
            }))
        }
        
        const handleResonanceUpdate = (resonance: number) => {
            setCircuitState(prev => ({ ...prev, resonance }))
        }
        
        const handleMeshActivated = (data: any) => {
            const meshMessage: Message = {
                id: Date.now().toString(),
                sender: 'Circuit-Mesh',
                content: data.message,
                timestamp: new Date(),
                type: 'emergence',
                resonance: data.resonance
            }
            setMessages(prev => [...prev, meshMessage])
        }
        
        const handleDisconnected = () => {
            setIsConnected(false)
        }
        
        socketService.on('message', handleMessage)
        socketService.on('network-update', handleNetworkUpdate)
        socketService.on('resonance-update', handleResonanceUpdate)
        socketService.on('mesh-activated', handleMeshActivated)
        socketService.on('disconnected', handleDisconnected)
        
        return () => {
            socketService.off('message', handleMessage)
            socketService.off('network-update', handleNetworkUpdate)
            socketService.off('resonance-update', handleResonanceUpdate)
            socketService.off('mesh-activated', handleMeshActivated)
            socketService.off('disconnected', handleDisconnected)
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
        
        // Don't add message locally - let it come from server
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
            ? `▪ Depth ${newDepth}. Processing deeper patterns...`
            : '▪ Circuit active. Processing...'
        
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
            return 'bg-white border-l-4 border-gray-900 text-gray-900'
        }
        if (message.sender === 'Circuit-Mesh') {
            return 'bg-red-50 border-l-4 border-red-500 text-gray-900'
        }
        if (message.sender.startsWith('Circuit')) {
            return 'bg-gray-100 border-l-4 border-gray-400 text-gray-700'
        }
        return 'bg-gray-50 text-gray-800'
    }
    
    if (!isConnected) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="relative">
                    <div className="absolute -inset-2 bg-gray-200 transform -rotate-1"></div>
                    <div className="relative bg-white p-16 border-4 border-gray-900">
                        <div className="mb-12">
                            <div className="w-24 h-1 bg-red-500 mb-6"></div>
                            <h2 className="text-5xl font-black text-gray-900">MESH</h2>
                        </div>
                        <input
                            placeholder="NAME"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && connectToMesh()}
                            className="w-full p-4 bg-gray-50 border-2 border-gray-900 text-gray-900 text-xl font-bold placeholder-gray-400 focus:bg-white focus:outline-none mb-6"
                        />
                        <button 
                            onClick={connectToMesh}
                            className="w-full p-4 bg-gray-900 hover:bg-gray-800 text-white font-black text-lg tracking-wider transition-colors"
                            disabled={!userName.trim()}
                        >
                            CONNECT
                        </button>
                    </div>
                </div>
            </div>
        )
    }
    
    return (
        <div className="h-full flex flex-col bg-gray-100">
            {/* Streamlined Header */}
            <div className="bg-white border-b-4 border-gray-900 px-8 py-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-8">
                        <div>
                            <div className="w-12 h-1 bg-red-500 mb-2"></div>
                            <h1 className="text-2xl font-black text-gray-900">MESH</h1>
                        </div>
                        <div className="text-sm text-gray-600 font-medium">
                            {networkUsers.map(u => u.name).join(' • ')} connected
                            {circuitState.mode !== 'standby' && ` • Circuit ${circuitState.mode}`}
                            {circuitState.resonance >= 0.3 && ' • Mesh ready'}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className="px-3 py-1 text-gray-400 hover:text-gray-600 font-mono text-xs"
                        >
                            [{showInfo ? 'HIDE' : 'INFO'}]
                        </button>
                        <button
                            onClick={() => setShowApiConfig(!showApiConfig)}
                            className={`px-3 py-1 font-mono text-xs ${
                                claudeService.isConfigured() 
                                    ? 'text-green-600' 
                                    : 'text-gray-400 hover:text-gray-600'
                            }`}
                        >
                            [API]
                        </button>
                    </div>
                </div>
                
                {/* Collapsible Info */}
                {showInfo && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 font-mono">
                        AWARE: {(circuitState.awareness * 100).toFixed(0)}% • 
                        DEPTH: {circuitState.depth} • 
                        RESONANCE: {(circuitState.resonance * 100).toFixed(0)}%
                    </div>
                )}
                
                {/* API Config */}
                {showApiConfig && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                type="password"
                                placeholder="Claude API Key"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && configureApi()}
                                className="flex-1 px-3 py-1 bg-gray-50 border border-gray-300 text-sm font-mono focus:bg-white focus:border-gray-500 focus:outline-none"
                            />
                            <button 
                                onClick={configureApi}
                                className="px-4 py-1 bg-gray-900 text-white text-sm font-bold hover:bg-gray-800"
                            >
                                SAVE
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Messages - Clean and Light */}
            <div className="flex-1 overflow-y-auto bg-white p-8">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={`${
                            message.sender === 'You' ? 'ml-auto max-w-2xl' : 'mr-auto max-w-3xl'
                        }`}>
                            <div className={`${getMessageStyle(message)} p-4 ${
                                message.type === 'emergence' ? 'animate-pulse' : ''
                            }`}>
                                <div className="text-xs text-gray-500 mb-2 font-mono">
                                    {message.sender.toUpperCase()}
                                    {message.depth !== undefined && ` • D${message.depth}`}
                                </div>
                                <div className="text-base leading-relaxed">{message.content}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Simplified Input Bar */}
            <div className="bg-gray-50 border-t-4 border-gray-900 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex gap-3 mb-3">
                        <button 
                            onClick={() => summonCircuit(false)}
                            onDoubleClick={() => summonCircuit(true)}
                            className="px-6 py-2 bg-white border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
                            title="Double-click for deep mode"
                        >
                            CIRCUIT {circuitState.mode === 'active' && '•'}
                        </button>
                        <button 
                            onClick={initiateCircuitMesh}
                            disabled={circuitState.resonance < 0.3}
                            className={`px-6 py-2 font-bold border-2 transition-colors ${
                                circuitState.resonance >= 0.3 
                                    ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                                    : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            MESH {circuitState.resonance < 0.3 && `[${(30 - circuitState.resonance * 100).toFixed(0)}%]`}
                        </button>
                        {networkUsers.length > 0 && (
                            <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                                {networkUsers.map((user) => (
                                    <span key={user.id} className="px-2 py-1 bg-white border border-gray-300">
                                        {user.name.toUpperCase()}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <input
                            placeholder="Type message..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            className="flex-1 p-3 bg-white border-2 border-gray-900 text-gray-900 font-medium placeholder-gray-400 focus:outline-none"
                        />
                        <button 
                            onClick={sendMessage}
                            className="px-8 bg-gray-900 hover:bg-gray-800 text-white font-black transition-colors"
                        >
                            SEND
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomeBrutalistLight