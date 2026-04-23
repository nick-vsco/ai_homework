import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Character, CharacterComponent } from './Character';

function SceneVisualization({ sceneMessages, characters, title, onCharacterSelect, messages, selectedCharacter, userMessage, setUserMessage, handleChat, isProcessing, actions = [] }) {
  const [characterInstances, setCharacterInstances] = useState({});
  const [currentMessage, setCurrentMessage] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [showSmallDialog, setShowSmallDialog] = useState(false);
  const [clickedCharacter, setClickedCharacter] = useState(null);
  const [targetPositions, setTargetPositions] = useState({});
  const [isDeductionEnded, setIsDeductionEnded] = useState(false);
  const characterPositionsRef = useRef({});
  const initialCharacterStateRef = useRef({});
  const isMovingRef = useRef({});
  
  // 背景配置：批量添加不同的背景图
  const backgrounds = [
    '/background.jpg', 
    '/background2.jpg',
  ];
  const bgWidth = 2000; // 每张背景图占据的宽度
  const worldWidth = backgrounds.length * bgWidth;
  const screenWidth = 1400;

  const instancesRef = useRef({});
  const messageIndexRef = useRef(0);
  const sceneMessagesRef = useRef([]);

  // 同步实例和状态到 Ref
  useEffect(() => {
    instancesRef.current = characterInstances;
    // 更新角色位置到 ref
    const positions = {};
    Object.values(characterInstances).forEach(char => {
      positions[char.name] = { x: char.x, y: char.y };
    });
    characterPositionsRef.current = positions;
  }, [characterInstances]);



  useEffect(() => {
    messageIndexRef.current = messageIndex;
  }, [messageIndex]);

  useEffect(() => {
    sceneMessagesRef.current = sceneMessages;
  }, [sceneMessages]);

  // 角色颜色映射
  const characterColors = {
    '张三': '#FF6B6B',
    '李四': '#4ECDC4',
    '王五': '#FFD166',
    '赵六': '#6A0572',
    '钱七': '#1A535C',
  };

  // 初始化角色实例
  useEffect(() => {
    if (characters && characters.length > 0) {
      const initialCharacters = {};
      const initialTargets = {};
      characters.forEach((char, index) => {
        const color = characterColors[char.name] || '#9B5DE5';
        const initialX = 150 + index * 200;
        initialCharacters[char.name] = new Character(
          char.name,
          color,
          initialX,
          592 // 地面高度
        );
        initialTargets[char.name] = {
          x: initialX,
          y: 592
        };
      });
      setCharacterInstances(initialCharacters);
      setTargetPositions(initialTargets);
      // 保存初始状态
      initialCharacterStateRef.current = {
        instances: initialCharacters,
        targets: initialTargets
      };
    }
  }, [characters]);

  // 播放场景对话逻辑
  const advanceDialogue = () => {
    const messages = sceneMessagesRef.current;
    const index = messageIndexRef.current;
    
    if (messages && messages.length > 0 && index < messages.length) {
      const message = messages[index];
      setCurrentMessage(message);
      
      // 让对应角色说话气泡显示
      if (instancesRef.current[message.character_name]) {
        instancesRef.current[message.character_name].speak(message.content);
      }
      
      setMessageIndex(prev => prev + 1);
      return true;
    }
    return false;
  };

  // 初始化或重置时显示第一句
  useEffect(() => {
    if (sceneMessages && sceneMessages.length > 0 && messageIndex === 0) {
      advanceDialogue();
    }
  }, [sceneMessages]);

  // 处理角色点击事件
  const handleCharacterClick = (characterName) => {
    console.log('Character clicked:', characterName);
    // 显示小对话框
    setClickedCharacter(characterName);
    setShowSmallDialog(true);
    // 同时调用父组件的回调函数，通知选中了哪个角色
    if (onCharacterSelect) {
      onCharacterSelect(characterName);
    }
  };

  // 智能体控制角色移动
  const agentControlMovement = async () => {
    if (isDeductionEnded) return;
    
    const characterNames = Object.keys(characterInstances);
    if (characterNames.length === 0) return;

    let allStopped = true;

    // 为每个角色生成移动指令，使用 Promise.all 实现同时移动
    const movementPromises = characterNames.map(async (characterName) => {
      try {
        const character = characterInstances[characterName];
        if (!character) return { characterName, isMoving: false };

        // 获取角色的实时位置
        const realTimePosition = characterPositionsRef.current[characterName] || { x: character.x, y: character.y };

        // 检查是否有针对该角色的移动操作
        const characterActions = actions.filter(action => action.character === characterName);
        
        // 检查是否有其他角色与当前角色发生交互
        const hasInteraction = actions.some(action => 
          (action.type === 'dialogue' && (action.character === characterName || action.target === characterName))
        );
        
        // 检查是否有其他角色距离较近
        let hasNearbyCharacter = false;
        for (const otherChar of Object.values(characterInstances)) {
          if (otherChar.name === characterName) continue;
          const otherPos = characterPositionsRef.current[otherChar.name] || { x: otherChar.x, y: otherChar.y };
          const distance = Math.abs(realTimePosition.x - otherPos.x);
          if (distance < 100) { // 100 是距离阈值
            hasNearbyCharacter = true;
            break;
          }
        }
        
        // 如果有交互或有其他角色距离较近，停止移动
        if (hasInteraction || hasNearbyCharacter) {
          isMovingRef.current[characterName] = false;
          return { characterName, isMoving: false };
        }
        
        // 构建上下文，包含当前场景和角色状态
        const context = {
          scene: sceneMessages,
          character: {
            name: character.name,
            x: realTimePosition.x,
            y: realTimePosition.y
          },
          otherCharacters: Object.values(characterInstances).filter(c => c.name !== characterName).map(c => ({
            name: c.name,
            x: characterPositionsRef.current[c.name]?.x || c.x,
            y: characterPositionsRef.current[c.name]?.y || c.y
          })),
          actions: characterActions
        };

        // 发送请求到后端，获取角色的移动指令
        const response = await fetch('http://localhost:5001/api/agent/movement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            character: {
              id: character.name,
              name: character.name,
              description: '角色描述',
              personality: '角色性格',
              role: '角色定位',
              x: realTimePosition.x,
              y: realTimePosition.y
            },
            context: JSON.stringify(context)
          }),
        });

        const data = await response.json();
        if (data.movement) {
          // 使用后端返回的移动指令
          let dx = data.movement.dx;
          const dy = 0; // 固定 y 坐标，只左右移动

          // 只有当移动距离大于 0.1 时才更新目标位置，避免角色不必要的移动
          if (Math.abs(dx) > 0.1) {
            // 更新目标位置，角色会平滑移动到这个位置
            setCharacterInstances(prev => {
              if (prev[characterName]) {
                let newX = prev[characterName].x + dx;
                const newY = 592; // 固定地面高度

                // 确保角色之间至少有一定的距离，避免完全覆盖
                const otherCharacters = Object.values(prev).filter(c => c.name !== characterName);
                for (const otherChar of otherCharacters) {
                  const distance = Math.abs(newX - otherChar.x);
                  if (distance < 50) { // 50 是最小距离阈值
                    // 调整位置，确保至少有 50 像素的距离
                    if (newX < otherChar.x) {
                      newX = otherChar.x - 50;
                    } else {
                      newX = otherChar.x + 50;
                    }
                  }
                }

                // 更新目标位置
                setTargetPositions(prevTargets => ({
                  ...prevTargets,
                  [characterName]: {
                    x: newX,
                    y: newY
                  }
                }));

                return prev;
              }
              return prev;
            });

            // 标记角色正在移动
            isMovingRef.current[characterName] = true;
            return { characterName, isMoving: true };
          } else {
            // 检查是否有散步等小范围移动操作
            const hasWalkingAction = characterActions.some(action => 
              (action.type === 'movement' && (action.movement_type === '散步' || action.movement_type === '走动')) ||
              (action.type === 'dialogue' && action.target) // 对话操作也需要移动到目标角色身边
            );
            
            if (hasWalkingAction) {
              // 生成小范围的随机移动
              const randomDx = (Math.random() - 0.5) * 20; // -10 到 10 之间的随机数
              
              // 更新目标位置，角色会平滑移动到这个位置
              setCharacterInstances(prev => {
                if (prev[characterName]) {
                  let newX = prev[characterName].x + randomDx;
                  const newY = 592; // 固定地面高度

                  // 确保角色之间至少有一定的距离，避免完全覆盖
                  const otherCharacters = Object.values(prev).filter(c => c.name !== characterName);
                  for (const otherChar of otherCharacters) {
                    const distance = Math.abs(newX - otherChar.x);
                    if (distance < 50) { // 50 是最小距离阈值
                      // 调整位置，确保至少有 50 像素的距离
                      if (newX < otherChar.x) {
                        newX = otherChar.x - 50;
                      } else {
                        newX = otherChar.x + 50;
                      }
                    }
                  }

                  // 更新目标位置
                  setTargetPositions(prevTargets => ({
                    ...prevTargets,
                    [characterName]: {
                      x: newX,
                      y: newY
                    }
                  }));

                  return prev;
                }
                return prev;
              });

              // 标记角色正在移动
              isMovingRef.current[characterName] = true;
              return { characterName, isMoving: true };
            } else {
              // 标记角色停止移动
              isMovingRef.current[characterName] = false;
              return { characterName, isMoving: false };
            }
          }
        }
      } catch (error) {
        console.error('智能体控制移动失败:', error);
        // 发生错误时，标记角色停止移动
        isMovingRef.current[characterName] = false;
        return { characterName, isMoving: false };
      }
    });

    // 等待所有角色的移动指令处理完成
    const results = await Promise.all(movementPromises);

    // 检查是否所有角色都停止移动
    allStopped = results.every(result => !result.isMoving);

    if (allStopped && characterNames.length > 0) {
      // 标记演绎结束
      setIsDeductionEnded(true);
    }
  };

  // 开始智能体控制
  useEffect(() => {
    const characterNames = Object.keys(characterInstances);
    if (characterNames.length > 0) {
      // 每3秒执行一次智能体控制
      const interval = setInterval(agentControlMovement, 3000);
      // 立即执行一次，确保角色能够开始移动
      agentControlMovement();
      return () => clearInterval(interval);
    }
  }, [characterInstances, sceneMessages]);

  // 平滑移动角色到目标位置
  useEffect(() => {
    const characterNames = Object.keys(characterInstances);
    if (characterNames.length === 0) return;

    const animationInterval = setInterval(() => {
      setCharacterInstances(prev => {
        const updatedInstances = { ...prev };
        Object.keys(targetPositions).forEach(characterName => {
          const targetPos = targetPositions[characterName];
          const currentChar = updatedInstances[characterName];
          if (currentChar && targetPos) {
            // 计算当前位置与目标位置的距离
            const dx = targetPos.x - currentChar.x;
            
            // 如果距离大于 1，则继续移动
            if (Math.abs(dx) > 1) {
              // 计算移动距离，使用缓动效果
              const moveDistance = dx * 0.1; // 每次移动 10% 的距离
              updatedInstances[characterName] = new Character(
                characterName,
                currentChar.color,
                currentChar.x + moveDistance,
                592 // 固定地面高度
              );
            }
          }
        });
        return updatedInstances;
      });
    }, 50); // 每 50 毫秒执行一次，实现平滑动画

    return () => clearInterval(animationInterval);
  }, [targetPositions]);

  return (
    <div 
      className="relative w-full h-[800px] rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl bg-slate-900"
    >
      {/* 远景层 (Parallax Far) - 批量渲染且移动速度较慢 */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 brightness-50 flex"
      >
        {backgrounds.map((bg, index) => (
          <div 
            key={`far-${index}`}
            className="h-full flex-shrink-0"
            style={{
              backgroundImage: `url('${bg}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              width: `${bgWidth}px`,
              filter: 'blur(2px)'
            }}
          />
        ))}
      </div>

      {/* 近景层 (Background) - 批量拼接排列 */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none flex"
      >
        {backgrounds.map((bg, index) => (
          <div 
            key={`near-${index}`}
            className="h-full flex-shrink-0"
            style={{
              backgroundImage: `url('${bg}')`,
              backgroundSize: '100% 100%',
              backgroundPosition: 'bottom',
              width: `${bgWidth}px`
            }}
          />
        ))}
      </div>

      {/* 演绎结束提示 */}
      {isDeductionEnded && (
        <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="bg-black/80 text-white px-10 py-6 rounded-lg shadow-xl">
            <h1 className="text-4xl font-bold text-center">演绎结束</h1>
          </div>
        </div>
      )}
      
      {/* 场景标题 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg border-2 border-white z-10">
        <h3 className="font-bold text-xl mb-1">{title || '星空冒险'}</h3>
        <p className="text-xs opacity-80">点击角色开始对话</p>
      </div>

      {/* 角色容器 */}
      <div 
        className="relative w-full h-full"
      >
        {Object.values(characterInstances).map((character) => (
          <CharacterComponent
            key={character.name}
            character={character}
            onClick={() => handleCharacterClick(character.name)}
          />
        ))}
      </div>

      {/* 小对话框 - 显示在屏幕左上方 */}
      {showSmallDialog && clickedCharacter && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-xl border-4 border-gray-800 max-w-[350px] z-40 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3 mb-2 border-b-2 border-gray-100 pb-1">
            <div className="w-8 h-8 rounded-full border-2 border-gray-800" style={{ backgroundColor: '#9B5DE5' }}></div>
            <span className="font-black text-base text-gray-800">与 {clickedCharacter} 对话</span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 mb-3 min-h-[80px] max-h-[150px] overflow-y-auto">
            {(!messages[clickedCharacter] || messages[clickedCharacter].length === 0) ? (
              <div className="text-center text-gray-500">
                开始与角色互动吧！
              </div>
            ) : (
              messages[clickedCharacter].map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl mb-2 ${msg.character_name === '用户' ? 'bg-gray-50 mr-4' : 'bg-blue-50 ml-4'}`}
                >
                  <div className="font-semibold text-xs text-gray-600 mb-1">
                    {msg.character_name}
                  </div>
                  <div className="text-gray-800 text-sm">{msg.content}</div>
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
              className="flex-1 p-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
            />
            <button
              onClick={handleChat}
              disabled={!userMessage.trim() || isProcessing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 text-sm"
            >
              {isProcessing ? '...' : '发送'}
            </button>
          </div>
          
          <div className="flex justify-end mt-2">
            <button
              className="bg-red-500 text-white py-1 px-3 rounded border-2 border-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs"
              onClick={() => setShowSmallDialog(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 控制按钮 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          className="bg-white p-2 rounded-lg border-2 border-gray-400 font-bold hover:bg-gray-100"
          onClick={() => {
            setMessageIndex(0);
            messageIndexRef.current = 0;
            setCurrentMessage(null);
            setShowSmallDialog(false);
            setClickedCharacter(null);
            setIsDeductionEnded(false);
            // 重置角色实例和目标位置，使用保存的初始状态
            if (initialCharacterStateRef.current.instances) {
              setCharacterInstances(initialCharacterStateRef.current.instances);
              setTargetPositions(initialCharacterStateRef.current.targets);
            }
          }}
        >
          重新播放
        </button>
      </div>
    </div>
  );
}

export default SceneVisualization;