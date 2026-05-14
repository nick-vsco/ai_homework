import React, { useState } from 'react';
import { User, MessageSquare, Play, Settings, Sparkles, Film } from 'lucide-react';
import SceneVisualization from './SceneVisualization';

function App() {
  const [text, setText] = useState('');
  const [characters, setCharacters] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [sceneMessages, setSceneMessages] = useState([]);
  const [sceneTitle, setSceneTitle] = useState('星空冒险');
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
      setActions(data.actions);
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
          actions: actions,
        }),
      });
      
      const data = await response.json();
      
      // 直接在当前窗口显示演绎结果，使用统一的 SceneVisualization 组件
      setSceneMessages(data.messages);
      setSceneTitle(data.title || '星空冒险');
      // 不要覆盖 actions，保持之前的
      setShowScene(true);
    } catch (error) {
      console.error('演绎剧本失败:', error);
    }
    setIsProcessing(false);
  };
  
  const continueDeduction = async (continuationScript) => {
    if (!continuationScript.trim()) return;
    
    setIsProcessing(true);
    try {
      // 先从续集中提取角色和动作
      const extractResponse = await fetch('http://localhost:5001/api/characters/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: continuationScript }),
      });
      
      const extractData = await extractResponse.json();
      
      // 保存提取到的 actions
      if (extractData.actions && extractData.actions.length > 0) {
        setActions(extractData.actions);
      }
      
      // 然后演绎续集
      const response = await fetch('http://localhost:5001/api/scene/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: continuationScript,
          characters: characters,
          actions: extractData.actions || [],
        }),
      });
      
      const data = await response.json();
      
      // 更新场景消息
      setSceneMessages(data.messages);
      setSceneTitle(data.title || '续集演绎');
      // 确保 actions 也更新了
      if (data.actions && data.actions.length > 0) {
        setActions(data.actions);
      }
    } catch (error) {
      console.error('演绎续集失败:', error);
    }
    setIsProcessing(false);
  };

  const handleChat = async () => {
    if (!userMessage.trim() || !selectedCharacter) return;
    
    // 保存用户输入的消息
    const userInputMessage = {
      character_name: '用户',
      content: userMessage,
    };
    
    // 更新当前角色的消息记录
    setMessages(prev => ({
      ...prev,
      [selectedCharacter]: [...(prev[selectedCharacter] || []), userInputMessage]
    }));
    
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
      // 更新角色的回复
      setMessages(prev => ({
        ...prev,
        [selectedCharacter]: [...(prev[selectedCharacter] || []), data]
      }));
      setUserMessage('');
    } catch (error) {
      console.error('聊天失败:', error);
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-[2800px] mx-auto px-8 py-12">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-4">
            <Sparkles className="inline-block mr-4 text-yellow-500" />
            多智能体角色扮演系统
          </h1>
          <p className="text-2xl text-gray-600">基于 DeepSeek AI 的多角色互动平台</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* 左侧：输入区域 */}
          <div className="bg-white rounded-3xl shadow-2xl p-10">
            <h2 className="text-3xl font-semibold mb-6 flex items-center">
              <Settings className="mr-3 w-10 h-10" />
              输入剧本
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="输入一段小说或剧本文本，系统将自动提取角色并演绎..."
              className="w-full h-96 p-6 text-xl border-4 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none resize-none transition-all"
            />
            <div className="grid grid-cols-2 gap-6 mt-6">
              <button
                onClick={extractCharacters}
                disabled={!text.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Play className="mr-3 w-8 h-8" />
                {isProcessing ? '正在提取...' : '提取角色'}
              </button>
              <button
                onClick={directScene}
                disabled={!text.trim() || characters.length === 0 || isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-5 px-8 rounded-2xl font-bold text-xl hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Film className="mr-3 w-8 h-8" />
                {isProcessing ? '正在演绎...' : '演绎剧本'}
              </button>
            </div>
          </div>

          {/* 右侧：角色、演绎和聊天 */}
          <div className="space-y-8">
            {/* 角色列表 */}
            {characters.length > 0 && (
              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <h2 className="text-3xl font-semibold mb-6 flex items-center">
                  <User className="mr-3 w-10 h-10" />
                  提取的角色 ({characters.length})
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedCharacter(char.name);
                        setUserMessage('');
                      }}
                      className={`p-5 rounded-2xl text-left transition-all ${
                        selectedCharacter === char.name
                          ? 'bg-blue-100 border-4 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-4 border-transparent'
                      }`}
                    >
                      <div className="font-bold text-2xl text-gray-800">{char.name}</div>
                      <div className="text-lg text-gray-600 mt-1">{char.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 聊天区域 */}
            {selectedCharacter && (
              <div className="bg-white rounded-3xl shadow-2xl p-10">
                <h2 className="text-3xl font-semibold mb-6 flex items-center">
                  <MessageSquare className="mr-3 w-10 h-10" />
                  与 {selectedCharacter} 对话
                </h2>
                
                <div className="h-96 overflow-y-auto mb-6 space-y-4">
                  {(!messages[selectedCharacter] || messages[selectedCharacter].length === 0) ? (
                    <div className="text-center text-gray-500 mt-32 text-2xl">
                      开始与角色互动吧！
                    </div>
                  ) : (
                    messages[selectedCharacter].map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl ${
                          msg.character_name === '用户'
                            ? 'bg-gray-50 mr-16'
                            : 'bg-blue-50 ml-16'
                        }`}
                      >
                        <div className="font-bold text-xl text-gray-600 mb-2">
                          {msg.character_name}
                        </div>
                        <div className="text-gray-800 text-xl">{msg.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-4">
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="输入消息..."
                    className="flex-1 p-5 text-xl border-4 border-gray-200 rounded-2xl focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleChat}
                    disabled={!userMessage.trim() || isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? '...' : '发送'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 全屏横屏场景展示 */}
      {showScene && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full max-w-[2600px] max-h-[1400px] bg-white rounded-2xl shadow-2xl overflow-hidden border-8 border-gray-800">
            {/* 退出按钮 */}
            <button 
              onClick={() => setShowScene(false)}
              className="absolute top-10 right-10 z-50 bg-red-500 text-white px-10 py-5 rounded-full font-bold text-3xl shadow-2xl hover:bg-red-600 transition-all transform hover:scale-105 border-4 border-white"
            >
              退出场景
            </button>
            
            <SceneVisualization 
              sceneMessages={sceneMessages} 
              characters={characters.map(char => ({ name: char.name }))} 
              title={sceneTitle}
              onCharacterSelect={(characterName) => {
                setSelectedCharacter(characterName);
                setUserMessage('');
              }}
              messages={messages}
              selectedCharacter={selectedCharacter}
              userMessage={userMessage}
              setUserMessage={setUserMessage}
              handleChat={handleChat}
              isProcessing={isProcessing}
              actions={actions}
              scriptText={text}
              onContinueDeduction={continueDeduction}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
