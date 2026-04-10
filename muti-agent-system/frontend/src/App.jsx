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
      
      // 打开新窗口演绎场景
      const sceneData = {
        sceneMessages: data.messages,
        characters: characters.map(char => ({ name: char.name }))
      };
      
      // 创建新窗口
      const newWindow = window.open('', '_blank', 'width=1200,height=900');
      if (newWindow) {
        // 写入新窗口内容
        newWindow.document.write(`
          <!DOCTYPE html>
          <html lang="zh-CN">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>剧本演绎</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/framer-motion@10/dist/framer-motion.js"></script>
          </head>
          <body class="bg-gray-100">
            <div id="root"></div>
            <script>
              // 场景数据
              const sceneData = ${JSON.stringify(sceneData)};
              
              // 角色类
              class Character {
                constructor(name, color, x, y) {
                  this.name = name;
                  this.color = color;
                  this.x = x;
                  this.y = y;
                  this.speed = 20;
                  this.isSpeaking = false;
                  this.message = '';
                }

                move(direction, otherCharacters = []) {
                  let newX = this.x;
                  let newY = this.y;
                  
                  switch (direction) {
                    case 'up':
                      newY = Math.max(50, this.y - this.speed);
                      break;
                    case 'down':
                      newY = Math.min(700, this.y + this.speed);
                      break;
                    case 'left':
                      newX = Math.max(50, this.x - this.speed);
                      break;
                    case 'right':
                      newX = Math.min(700, this.x + this.speed);
                      break;
                    default:
                      break;
                  }
                  
                  // 检测碰撞，如果碰撞则不移动
                  let canMove = true;
                  for (const otherChar of otherCharacters) {
                    if (otherChar.name !== this.name) {
                      const distance = Math.sqrt(
                        Math.pow(newX - otherChar.x, 2) + Math.pow(newY - otherChar.y, 2)
                      );
                      if (distance < 50) {
                        canMove = false;
                        break;
                      }
                    }
                  }
                  
                  if (canMove) {
                    this.x = newX;
                    this.y = newY;
                  }
                }

                speak(message) {
                  this.isSpeaking = true;
                  this.message = message;
                  // 不使用setTimeout，因为它不会更新React状态
                  // 而是在外部通过状态更新来处理
                }

                checkCollision(otherCharacter) {
                  const distance = Math.sqrt(
                    Math.pow(this.x - otherCharacter.x, 2) + Math.pow(this.y - otherCharacter.y, 2)
                  );
                  return distance < 50;
                }
              }

              // 角色组件
              const CharacterComponent = ({ character }) => {
                return React.createElement('div', {
                  style: {
                    position: 'absolute',
                    left: character.x + 'px',
                    top: character.y + 'px',
                    transform: 'translate(-50%, -50%)'
                  }
                }, [
                  // 对话气泡
                  character.isSpeaking && React.createElement('div', {
                    key: 'dialog',
                    className: 'absolute top-[-80px] left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg border-2 border-gray-400 max-w-[200px] z-10'
                  }, [
                    React.createElement('div', {
                      key: 'message',
                      className: 'text-sm'
                    }, character.message),
                    React.createElement('div', {
                      key: 'tail',
                      className: 'absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-10px border-r-10px border-t-10px border-l-transparent border-r-transparent border-t-white'
                    })
                  ]),
                  
                  React.createElement('div', {
                    key: 'character',
                    className: 'relative w-16'
                  }, [
                    // 头部
                    React.createElement('div', {
                      key: 'head',
                      className: 'w-12 h-12 bg-gray-300 border-2 border-gray-400 mx-auto',
                      style: { backgroundColor: character.color }
                    }),
                    // 身体
                    React.createElement('div', {
                      key: 'body',
                      className: 'w-12 h-12 bg-gray-200 border-2 border-gray-400 mt-1 mx-auto'
                    }),
                    // 四肢
                    React.createElement('div', {
                      key: 'arms',
                      className: 'flex justify-between mt-1'
                    }, [
                      React.createElement('div', {
                        key: 'left-arm',
                        className: 'w-6 h-10 bg-gray-200 border-2 border-gray-400'
                      }),
                      React.createElement('div', {
                        key: 'right-arm',
                        className: 'w-6 h-10 bg-gray-200 border-2 border-gray-400'
                      })
                    ]),
                    // 脚
                    React.createElement('div', {
                      key: 'legs',
                      className: 'flex justify-between mt-1'
                    }, [
                      React.createElement('div', {
                        key: 'left-leg',
                        className: 'w-4 h-6 bg-gray-200 border-2 border-gray-400'
                      }),
                      React.createElement('div', {
                        key: 'right-leg',
                        className: 'w-4 h-6 bg-gray-200 border-2 border-gray-400'
                      })
                    ]),
                    // 角色名字
                    React.createElement('div', {
                      key: 'name',
                      className: 'mt-2 text-center font-bold text-sm text-gray-800'
                    }, character.name)
                  ])
                ]);
              };

              // 场景可视化组件
              const SceneVisualization = ({ sceneMessages, characters }) => {
                const [characterInstances, setCharacterInstances] = React.useState({});
                const [currentMessage, setCurrentMessage] = React.useState(null);
                const [messageIndex, setMessageIndex] = React.useState(0);
                const sceneRef = React.useRef(null);
                const characterInstancesRef = React.useRef(characterInstances);
                
                // 同步ref和state
                React.useEffect(() => {
                  characterInstancesRef.current = characterInstances;
                }, [characterInstances]);

                // 角色颜色映射
                const characterColors = {
                  '张三': '#FF6B6B',
                  '李四': '#4ECDC4',
                  '王五': '#FFD166',
                  '赵六': '#6A0572',
                  '钱七': '#1A535C',
                };

                // 初始化角色实例
                React.useEffect(() => {
                  if (characters && characters.length > 0) {
                    const initialCharacters = {};
                    characters.forEach((char, index) => {
                      const color = characterColors[char.name] || '#9B5DE5';
                      initialCharacters[char.name] = new Character(
                        char.name,
                        color,
                        150 + index * 100,
                        200 + Math.random() * 100
                      );
                    });
                    setCharacterInstances(initialCharacters);
                  }
                }, [characters]);

                // 自动移动角色到目标位置
                const moveCharacterTo = (characterName, targetX, targetY) => {
                  setCharacterInstances(prev => {
                    const updatedCharacters = { ...prev };
                    if (updatedCharacters[characterName]) {
                      // 创建角色的深拷贝
                      const character = updatedCharacters[characterName];
                      const newCharacter = new Character(character.name, character.color, character.x, character.y);
                      newCharacter.isSpeaking = character.isSpeaking;
                      newCharacter.message = character.message;
                      
                      // 计算移动方向
                      const dx = targetX - newCharacter.x;
                      const dy = targetY - newCharacter.y;
                      const distance = Math.sqrt(dx * dx + dy * dy);
                      
                      if (distance > 5) {
                        // 计算单位向量
                        const moveX = (dx / distance) * 5;
                        const moveY = (dy / distance) * 5;
                        
                        // 检查碰撞
                        const otherCharacters = Object.values(updatedCharacters).filter(char => char.name !== characterName);
                        let canMove = true;
                        
                        for (const otherChar of otherCharacters) {
                          const newX = newCharacter.x + moveX;
                          const newY = newCharacter.y + moveY;
                          const dist = Math.sqrt(
                            Math.pow(newX - otherChar.x, 2) + Math.pow(newY - otherChar.y, 2)
                          );
                          if (dist < 50) {
                            canMove = false;
                            break;
                          }
                        }
                        
                        if (canMove) {
                          newCharacter.x += moveX;
                          newCharacter.y += moveY;
                        }
                      }
                      
                      // 更新为新对象
                      updatedCharacters[characterName] = newCharacter;
                    }
                    return updatedCharacters;
                  });
                };

                // 播放场景对话
                React.useEffect(() => {
                  if (sceneMessages && sceneMessages.length > 0 && messageIndex < sceneMessages.length) {
                    const timer = setTimeout(() => {
                      const message = sceneMessages[messageIndex];
                      setCurrentMessage(message);
                      
                      // 让角色说话
                      if (characterInstances[message.character_name]) {
                        // 让所有角色移动到说话角色附近
                        const speaker = characterInstances[message.character_name];
                        const speakerX = speaker.x;
                        const speakerY = speaker.y;
                        
                        // 其他角色移动到说话角色周围
                        Object.keys(characterInstances).forEach(charName => {
                          if (charName !== message.character_name) {
                            // 计算目标位置（围绕说话者）
                            const angle = Math.random() * Math.PI * 2;
                            const distance = 80;
                            const targetX = speakerX + Math.cos(angle) * distance;
                            const targetY = speakerY + Math.sin(angle) * distance;
                            
                            // 移动角色
                            moveCharacterTo(charName, targetX, targetY);
                          }
                        });
                        
                        // 让说话角色说话
                        const updatedCharacters = { ...characterInstances };
                        const newSpeaker = new Character(speaker.name, speaker.color, speaker.x, speaker.y);
                        newSpeaker.isSpeaking = true;
                        newSpeaker.message = message.content;
                        updatedCharacters[message.character_name] = newSpeaker;
                        setCharacterInstances(updatedCharacters);
                        
                        // 3秒后关闭对话框
                        setTimeout(() => {
                          setCharacterInstances(prev => {
                            const updated = { ...prev };
                            if (updated[message.character_name]) {
                              const char = updated[message.character_name];
                              const newChar = new Character(char.name, char.color, char.x, char.y);
                              newChar.isSpeaking = false;
                              newChar.message = '';
                              updated[message.character_name] = newChar;
                            }
                            return updated;
                          });
                        }, 3000);
                      }
                      
                      setMessageIndex(prev => prev + 1);
                    }, 2000);
                    return () => clearTimeout(timer);
                  }
                }, [sceneMessages, messageIndex, characterInstances]);

                // 自动移动角色
                React.useEffect(() => {
                  const moveInterval = setInterval(() => {
                    Object.keys(characterInstancesRef.current).forEach(charName => {
                      // 随机移动或根据场景需要移动
                      const character = characterInstancesRef.current[charName];
                      if (character && !character.isSpeaking) {
                        // 轻微随机移动
                        const randomX = character.x + (Math.random() - 0.5) * 2;
                        const randomY = character.y + (Math.random() - 0.5) * 2;
                        moveCharacterTo(charName, randomX, randomY);
                      }
                    });
                  }, 100);
                  
                  return () => clearInterval(moveInterval);
                }, []);

                return React.createElement('div', {
                  ref: sceneRef,
                  className: 'relative w-full h-[800px] bg-cover bg-center rounded-2xl overflow-hidden',
                  style: {
                    backgroundImage: "url('/background.jpg')"
                  }
                }, [
                  // 场景标题
                  React.createElement('div', {
                    key: 'title',
                    className: 'absolute top-4 left-4 bg-white bg-opacity-80 p-3 rounded-lg border-2 border-gray-400'
                  }, [
                    React.createElement('h3', {
                      key: 'h3',
                      className: 'font-bold text-lg'
                    }, '小镇场景')
                  ]),

                  // 角色
                  ...Object.values(characterInstances).map((character) => {
                    return React.createElement(CharacterComponent, {
                      key: character.name,
                      character: character
                    });
                  }),

                  // 控制按钮
                  React.createElement('div', {
                    key: 'controls',
                    className: 'absolute bottom-4 right-4 flex gap-2'
                  }, [
                    React.createElement('button', {
                      key: 'replay',
                      className: 'bg-white p-2 rounded-lg border-2 border-gray-400 font-bold hover:bg-gray-100',
                      onClick: () => setMessageIndex(0)
                    }, '重新播放')
                  ])
                ]);
              };

              // 渲染应用
              ReactDOM.render(
                React.createElement(SceneVisualization, {
                  sceneMessages: sceneData.sceneMessages,
                  characters: sceneData.characters
                }),
                document.getElementById('root')
              );
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // 如果无法打开新窗口，在当前窗口显示
        setSceneMessages(data.messages);
        setShowScene(true);
      }
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
