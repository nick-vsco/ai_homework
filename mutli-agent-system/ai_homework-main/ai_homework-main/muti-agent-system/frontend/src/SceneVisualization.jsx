import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Character, CharacterComponent } from './Character';

function SceneVisualization({ sceneMessages, characters, title }) {
  const [characterInstances, setCharacterInstances] = useState({});
  const [currentMessage, setCurrentMessage] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [interactingCharacters, setInteractingCharacters] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [nearbyCharacter, setNearbyCharacter] = useState(null);
  const [cameraX, setCameraX] = useState(0);
  const targetCameraXRef = useRef(0);
  
  // 背景配置：批量添加不同的背景图
  const backgrounds = [
    '/background.jpg', 
    '/background2.jpg',
  ];
  const bgWidth = 2000; // 每张背景图占据的宽度
  const worldWidth = backgrounds.length * bgWidth;
  const screenWidth = 1400;

  const sceneRef = useRef(null);
  const keysPressed = useRef({});
  const instancesRef = useRef({});
  const showDialogRef = useRef(false);
  const interactingCharactersRef = useRef(null);
  const messageIndexRef = useRef(0);
  const sceneMessagesRef = useRef([]);

  // 同步实例和状态到 Ref
  useEffect(() => {
    instancesRef.current = characterInstances;
  }, [characterInstances]);

  useEffect(() => {
    showDialogRef.current = showDialog;
  }, [showDialog]);

  useEffect(() => {
    interactingCharactersRef.current = interactingCharacters;
  }, [interactingCharacters]);

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
      characters.forEach((char, index) => {
        const color = characterColors[char.name] || '#9B5DE5';
        initialCharacters[char.name] = new Character(
          char.name,
          color,
          150 + index * 200,
          592 // 地面高度
        );
      });
      setCharacterInstances(initialCharacters);
    }
  }, [characters]);

  // 物理更新循环
  useEffect(() => {
    let animationFrameId;
    
    const updatePhysics = () => {
      setCharacterInstances(prev => {
        const next = { ...prev };
        const instances = Object.values(next);
        if (instances.length === 0) return prev;

        // 处理键盘持续按下的输入（左右移动）
        const mainChar = next['张三'];
        if (mainChar) {
          if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
            mainChar.move('left');
          } else if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
            mainChar.move('right');
          } else {
            mainChar.move('stop');
          }
        }

        instances.forEach(char => {
          char.worldWidth = worldWidth; // 同步世界宽度到角色实例
          char.update(instances);
        });

        // 检测靠近提示
        if (mainChar) {
          let foundNearby = null;
          instances.forEach(other => {
            if (other.name !== '张三') {
              const distance = Math.abs(mainChar.x - other.x);
              if (distance < 120) {
                foundNearby = other.name;
              }
            }
          });
          setNearbyCharacter(foundNearby);

          // 远离对话者自动关闭对话框
          const currentInteracting = interactingCharactersRef.current;
          if (showDialogRef.current && currentInteracting) {
            const speaker1 = next[currentInteracting[0]];
            const speaker2 = next[currentInteracting[1]];
            if (speaker1 && speaker2) {
              const dist = Math.abs(speaker1.x - speaker2.x);
              if (dist > 200) { // 缩短距离阈值，提高灵敏度
                setShowDialog(false);
              }
            } else {
              // 如果其中一个说话者找不到了，也关闭对话框
              setShowDialog(false);
            }
          }

          // 相机跟随逻辑：使张三处于视觉中心
          // 记录张三的目标中心点（不进行边界裁剪，以保证插值速度恒定）
          targetCameraXRef.current = mainChar.x - screenWidth / 2;
        }

        // 平滑相机跟随 (Lerp)
        setCameraX(prev => {
          const lerpFactor = 0.15; // 稍微调快平滑系数
          const nextX = prev + (targetCameraXRef.current - prev) * lerpFactor;
          // 在输出时进行裁剪，这样相机在边界停止时不会因为插值减速而导致人物相对速度变快
          return Math.max(0, Math.min(worldWidth - screenWidth, nextX));
        });

        return { ...next };
      });
      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // 键盘控制逻辑
  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;
      
      // 单次触发跳跃逻辑
      if (key === ' ' || key === 'w' || key === 'arrowup') {
        const mainChar = instancesRef.current['张三'];
        if (mainChar) {
          mainChar.jump();
        }
        if (key === ' ') e.preventDefault();
      }

      // 触发冲刺 (Dash)
      if (key === 'shift') {
        const mainChar = instancesRef.current['张三'];
        if (mainChar) {
          mainChar.dash();
        }
      }

      // 触发对话交互
      if (key === 'f') {
        if (showDialogRef.current) {
          // 尝试推进下一句对话
          const hasMore = advanceDialogue();
          if (!hasMore) {
            setShowDialog(false);
          }
          return;
        }

        const mainChar = instancesRef.current['张三'];
        if (mainChar) {
          // 查找最近的角色
          let nearest = null;
          let minDistance = 120;
          Object.values(instancesRef.current).forEach(other => {
            if (other.name !== '张三') {
              const distance = Math.abs(mainChar.x - other.x);
              if (distance < minDistance) {
                minDistance = distance;
                nearest = other.name;
              }
            }
          });

          if (nearest) {
            setInteractingCharacters(['张三', nearest]);
            setShowDialog(true);
            // 开启对话时，如果索引还在 0，可以先展示第一句
            if (messageIndexRef.current === 0) {
              advanceDialogue();
            }
          }
        }
      }
    };

    const handleKeyUp = (e) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // 移除依赖，通过 instancesRef 获取最新实例

  // 播放场景对话逻辑：修改为手动按 F 推进
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

  // 检测角色碰撞
  useEffect(() => {
    const checkCollision = () => {
      const characterArray = Object.values(characterInstances);
      for (let i = 0; i < characterArray.length; i++) {
        for (let j = i + 1; j < characterArray.length; j++) {
          const char1 = characterArray[i];
          const char2 = characterArray[j];
          
          if (char1.checkCollision(char2)) {
            setInteractingCharacters([char1.name, char2.name]);
            setShowDialog(true);
            return;
          }
        }
      }
      setInteractingCharacters(null);
      setShowDialog(false);
    };

    const interval = setInterval(checkCollision, 500);
    return () => clearInterval(interval);
  }, [characterInstances]);

  // 角色移动逻辑
  const moveCharacter = (characterName, direction) => {
    if (characterInstances[characterName]) {
      characterInstances[characterName].move(direction);
    }
  };

  const jumpCharacter = (characterName) => {
    if (characterInstances[characterName]) {
      characterInstances[characterName].jump();
    }
  };

  return (
    <div 
      ref={sceneRef}
      className="relative w-full h-[800px] rounded-2xl overflow-hidden border-4 border-gray-800 shadow-2xl bg-slate-900"
    >
      {/* 远景层 (Parallax Far) - 批量渲染且移动速度较慢 */}
      <div 
        className="absolute inset-0 w-full h-full pointer-events-none opacity-40 brightness-50 flex"
        style={{ transform: `translateX(${-cameraX * 0.3}px)` }}
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
        style={{ transform: `translateX(${-cameraX}px)` }}
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

      {/* 场景标题 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-4 rounded-lg border-2 border-white z-10">
        <h3 className="font-bold text-xl mb-1">{title || '星空冒险'}</h3>
        <p className="text-xs opacity-80">移动: WASD / 方向键 | 跳跃: 空格 | 冲刺: Shift | 交互: F</p>
      </div>

      {/* 角色容器 - 随相机平移 */}
      <div 
        className="relative w-full h-full"
        style={{ transform: `translateX(${-cameraX}px)` }}
      >
        {Object.values(characterInstances).map((character) => (
          <CharacterComponent
            key={character.name}
            character={character}
            onMove={moveCharacter}
            onJump={jumpCharacter}
          />
        ))}
      </div>

      {/* 靠近交互提示 */}
      {nearbyCharacter && !showDialog && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="absolute bottom-6 left-6 bg-black bg-opacity-80 text-white px-6 py-3 rounded-xl border-2 border-yellow-400 z-30 shadow-2xl flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-yellow-400 text-black rounded-lg flex items-center justify-center font-black text-xl animate-bounce">F</div>
          <span className="font-bold text-lg">与 {nearbyCharacter} 对话</span>
        </motion.div>
      )}

      {/* 关闭对话提示 */}
      {showDialog && (
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-6 left-6 bg-black bg-opacity-80 text-white px-6 py-3 rounded-xl border-2 border-red-400 z-30 shadow-2xl flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-red-400 text-black rounded-lg flex items-center justify-center font-black text-xl animate-pulse">F</div>
          <span className="font-bold text-lg">
            {messageIndex < (sceneMessages?.length || 0) ? '下一句' : '结束对话'}
          </span>
        </motion.div>
      )}

      {/* 角色交互对话框 - 剧情显示专用 */}
      {showDialog && interactingCharacters && characterInstances[interactingCharacters[0]] && characterInstances[interactingCharacters[1]] && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            x: (characterInstances[interactingCharacters[0]].x + characterInstances[interactingCharacters[1]].x) / 2 - cameraX,
            y: Math.min(characterInstances[interactingCharacters[0]].y, characterInstances[interactingCharacters[1]].y) - 300 + Math.sin(Date.now() / 500) * 10,
            rotate: [0, -1, 0, 1, 0]
          }}
          transition={{
            x: { type: 'spring', damping: 20, stiffness: 100 },
            y: { duration: 0.1 },
            rotate: { repeat: Infinity, duration: 4, ease: "easeInOut" }
          }}
          className="absolute left-0 top-0 transform -translate-x-1/2 bg-white p-4 rounded-xl border-4 border-gray-800 max-w-[350px] z-40 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-3 mb-2 border-b-2 border-gray-100 pb-1">
            <div className="w-8 h-8 rounded-full border-2 border-gray-800" style={{ backgroundColor: characterColors[interactingCharacters[0]] }}></div>
            <span className="font-black text-base text-gray-800">{interactingCharacters[0]} & {interactingCharacters[1]}</span>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border-2 border-gray-200 mb-3 min-h-[80px] flex items-center justify-center">
            <p className="text-gray-700 font-bold text-base text-center leading-snug">
              {currentMessage && (currentMessage.character_name === interactingCharacters[0] || currentMessage.character_name === interactingCharacters[1])
                ? `"${currentMessage.content}"`
                : "“点击重新播放或等待剧情触发。”"}
            </p>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
            <span>F 键关闭</span>
            <div className="flex gap-2">
              <button
                className="bg-red-500 text-white py-1 px-3 rounded border-2 border-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-xs"
                onClick={() => setShowDialog(false)}
              >
                关闭
              </button>
            </div>
          </div>
          {/* 小箭头指向人物中间 */}
          <div className="absolute bottom-[-14px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-gray-800"></div>
        </motion.div>
      )}

      {/* 控制按钮 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          className="bg-white p-2 rounded-lg border-2 border-gray-400 font-bold hover:bg-gray-100"
          onClick={() => {
            setMessageIndex(0);
            messageIndexRef.current = 0;
            setCurrentMessage(null);
            setShowDialog(false);
          }}
        >
          重新播放
        </button>
      </div>
    </div>
  );
}

export default SceneVisualization;