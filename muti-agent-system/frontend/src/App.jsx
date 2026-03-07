import React, { useState } from 'react';
import { User, MessageSquare, Play, Settings, Sparkles, Film } from 'lucide-react';
import SceneVisualization from './SceneVisualization';

function App() {
  const [text, setText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sceneMessages, setSceneMessages] = useState([]);
  const [showScene, setShowScene] = useState(false);

  const extractCharacters = async () => {
    if (!text.trim()) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5001/api/characters/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      setCharacters(data.characters);
    } catch (error) {
      console.error('提取角色失败:', error);
    }
    setIsProcessing(false);
  };

  const directScene = async () => {
    if (!text.trim() || characters.length === 0) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5001/api/scene/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: text,
          characters: characters,
        }),
      });
      
      const data = await response.json();
      setSceneMessages(data.messages);
      setShowScene(true);
    } catch (error) {
      console.error('演绎剧本失败:', error);
    }
    setIsProcessing(false);
  };

  const handleChat = async () => {
    if (!userMessage.trim() || !selectedCharacter) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          character: selectedCharacter,
          characters: characters,
        }),
      });
      
      const data = await response.json();
      setMessages([...messages, data]);
      setUserMessage('');
    } catch (error) {
      console.error('聊天失败:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            <Sparkles className="inline-block mr-2 text-yellow-500" />
            多智能体角色扮演系统
          </h1>
          <p className="text-gray-600">基于 DeepSeek AI 的多角色互动平台</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：输入区域 */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="mr-2" />
              输入剧本
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入一段小说或剧本文本，系统将自动提取角色并演绎..."
              className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none transition-all"
            />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <button
                onClick={extractCharacters}
                disabled={!text.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Play className="mr-2" />
                {isProcessing ? '正在提取...' : '提取角色'}
              </button>
              <button
                onClick={directScene}
                disabled={!text.trim() || characters.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Film className="mr-2" />
                {isProcessing ? '正在演绎...' : '演绎剧本'}
              </button>
            </div>
          </div>

          {/* 右侧：角色、演绎和聊天 */}
          <div className="space-y-6">
            {/* 角色列表 */}
            {characters.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="mr-2" />
                  提取的角色 ({characters.length})
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedCharacter(char.name);
                        setMessages([]);
                        setUserMessage('');
                      }}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedCharacter === char.name
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{char.name}</div>
                      <div className="text-sm text-gray-600">{char.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 演绎场景 */}
            {showScene && sceneMessages.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Film className="mr-2" />
                  剧本演绎
                </h2>
                
                <SceneVisualization 
                  sceneMessages={sceneMessages} 
                  characters={characters.map(char => ({ name: char.name }))} 
                />
                
                <button
                  onClick={() => setShowScene(false)}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 px-4 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all mt-4"
                >
                  关闭演绎
                </button>
              </div>
            )}

            {/* 聊天区域 */}
            {selectedCharacter && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <MessageSquare className="mr-2" />
                  与 {selectedCharacter} 对话
                </h2>
                
                <div className="h-64 overflow-y-auto mb-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      开始与角色互动吧！
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl ${
                          msg.character_name === selectedCharacter
                            ? 'bg-blue-50 ml-12'
                            : 'bg-gray-50 mr-12'
                        }`}
                      >
                        <div className="font-semibold text-sm text-gray-600 mb-1">
                          {msg.character_name}
                        </div>
                        <div className="text-gray-800">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="输入消息..."
                    className="flex-1 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleChat}
                    disabled={!userMessage.trim() || isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? '...' : '发送'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
