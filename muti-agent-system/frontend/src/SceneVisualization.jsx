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
  const [isPerforming, setIsPerforming] = useState(false);
  const [isDeductionStarted, setIsDeductionStarted] = useState(false);
  const [performanceIndex, setPerformanceIndex] = useState(0);
  const performanceIndexRef = useRef(0);
  const characterPositionsRef = useRef({});
  const activeTimersRef = useRef([]);

  const addTimer = (callback, delay) => {
    const timer = setTimeout(() => {
      callback();
      activeTimersRef.current = activeTimersRef.current.filter(t => t !== timer);
    }, delay);
    activeTimersRef.current.push(timer);
    return timer;
  };

  const clearAllTimers = () => {
    activeTimersRef.current.forEach(timer => clearTimeout(timer));
    activeTimersRef.current = [];
  };
  const initialCharacterStateRef = useRef({});
  const isMovingRef = useRef({});
  const activeParticipantsRef = useRef([]); // 记录当前正在互动的角色
  
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
          720 // 地面高度
        );
        initialTargets[char.name] = {
          x: initialX,
          y: 720
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

  const isPerformingRef = useRef(false);
  useEffect(() => {
    isPerformingRef.current = isPerforming;
  }, [isPerforming]);

  // 执行动作序列
  const executeNextAction = async () => {
    if (performanceIndexRef.current >= actions.length) {
      setIsPerforming(false);
      setIsDeductionEnded(true);
      // 表演结束时，缩短保留时间到 2 秒，并确保状态更新
      addTimer(() => {
        if (!isPerformingRef.current) { 
          setCharacterInstances(prev => {
            const updated = { ...prev };
            Object.values(updated).forEach(char => {
              if (char.stopSpeaking) char.stopSpeaking();
            });
            return updated;
          });
          setCurrentMessage(null);
        }
      }, 2000);
      return;
    }

    const index = performanceIndexRef.current;
    const action = actions[index];
    console.log('Executing action at index:', index, action);

    const characterName = action.character;
    const char = characterInstances[characterName];
    
    // 更新当前活跃参与者
    if (action.target) {
      activeParticipantsRef.current = [characterName, action.target];
    } else {
      activeParticipantsRef.current = [characterName];
    }

    if (char) {
      if (action.type === 'movement') {
        const targetName = action.target;
        if (targetName && characterInstances[targetName]) {
          const targetChar = characterInstances[targetName];
          // 计算目标位置（保持一定距离）
          const direction = targetChar.x > char.x ? 1 : -1;
          const targetX = targetChar.x - direction * 80;
          
          setTargetPositions(prev => ({
            ...prev,
            [characterName]: { x: targetX, y: 720 }
          }));

          // 等待移动完成 (简单判断)
          addTimer(() => {
            performanceIndexRef.current += 1;
            setPerformanceIndex(prev => prev + 1);
          }, 2000);
        } else {
          // 随机移动或离开
          const dx = action.movement_type === '离开' ? (char.x > 1000 ? 500 : -500) : (Math.random() - 0.5) * 200;
          setTargetPositions(prev => ({
            ...prev,
            [characterName]: { x: char.x + dx, y: 720 }
          }));
          addTimer(() => {
            performanceIndexRef.current += 1;
            setPerformanceIndex(prev => prev + 1);
          }, 2000);
        }
      } else if (action.type === 'gesture') {
        if (action.gesture_type === 'sit') char.sit();
        else if (action.gesture_type === 'wave') char.wave();
        else if (action.gesture_type === 'jump') char.jump();
        else if (action.gesture_type === 'stand' && char.isSitting) char.sit();
        
        addTimer(() => {
          performanceIndexRef.current += 1;
          setPerformanceIndex(prev => prev + 1);
        }, 1500);
      } else if (action.type === 'dialogue') {
        const targetName = action.target;
        let moveDelay = 0;

        // 如果对话有目标，确保距离合适，支持角色相互运动保持固定间距
        if (targetName && characterInstances[targetName]) {
          const targetChar = characterInstances[targetName];
          const distance = Math.abs(char.x - targetChar.x);
          const idealDistance = 120; // 理想对话距离
          
          if (distance > idealDistance + 30 || distance < idealDistance - 30) {
            // 相互运动：计算中点，双方各自移动到中点两侧，保持 idealDistance
            const midpoint = (char.x + targetChar.x) / 2;
            const dirSelf = char.x < targetChar.x ? -1 : 1;
            const dirTarget = -dirSelf;
            
            const targetXSelf = midpoint + dirSelf * (idealDistance / 2);
            const targetXOther = midpoint + dirTarget * (idealDistance / 2);

            setTargetPositions(prev => ({
              ...prev,
              [characterName]: { x: Math.max(80, Math.min(worldWidth - 80, targetXSelf)), y: 720 },
              [targetName]: { x: Math.max(80, Math.min(worldWidth - 80, targetXOther)), y: 720 }
            }));
            moveDelay = 1500; // 给 1.5 秒走过去
          }
        }

        addTimer(() => {
          // 关键修复：同步更新顶部的对话显示状态
          const currentScriptMsg = sceneMessagesRef.current[messageIndexRef.current];
          
          if (currentScriptMsg && (currentScriptMsg.content === action.content || currentScriptMsg.character_name === characterName)) {
            // 如果脚本中下一条对话匹配，使用 advanceDialogue 同步推进
            advanceDialogue(true);
          } else {
            // 同步更新状态以触发重新渲染
            setCharacterInstances(prev => {
              const updated = { ...prev };
              // 独占说话机制：手动说话时也清空其他气泡
              Object.values(updated).forEach(c => {
                if (c.name !== characterName && c.stopSpeaking) c.stopSpeaking();
              });
              // 让对应角色说话
              if (updated[characterName]) {
                updated[characterName].speak(action.content);
              }
              return updated;
            });
          }

          addTimer(() => {
            // 改进的走位逻辑：判断是否有必要让位，并支持位置交换
            const nextIndex = performanceIndexRef.current + 1;
            const nextAction = nextIndex < actions.length ? actions[nextIndex] : null;
            const isLastAction = !nextAction;

            // 只有当阻挡了下一位行动者，或者表演结束，或者当前位置太挤时才移动
            let shouldMove = isLastAction;
            let targetX = char.x;

            if (nextAction) {
              const nextCharName = nextAction.character;
              const nextChar = characterInstances[nextCharName];
              
              if (nextChar) {
                // 如果下一位行动者离我很近（小于150像素），我需要让开
                const distToNext = Math.abs(char.x - nextChar.x);
                if (distToNext < 150) {
                  shouldMove = true;
                  // 避让方向：往远离下一位行动者的方向移动
                  const retreatDir = char.x < nextChar.x ? -1 : 1;
                  targetX = char.x + retreatDir * 150;
                }
                
                // 位置交换逻辑：如果下一位行动者的目标是我当前的位置附近，我主动与之交换位置或避让
                if (nextAction.target === characterName || (nextAction.type === 'movement' && Math.abs(nextAction.x - char.x) < 100)) {
                  shouldMove = true;
                  const nextChar = characterInstances[nextAction.character];
                  if (nextChar) {
                    // 更加平滑的交换逻辑：移动到对方原来的位置附近，而不是跳到屏幕边缘
                    targetX = nextChar.x;
                  } else {
                    const center = worldWidth / 2;
                    targetX = char.x < center ? char.x + 200 : char.x - 200;
                  }
                }
              }
            }

            if (shouldMove) {
              setTargetPositions(prev => ({
                ...prev,
                [characterName]: { x: Math.max(80, Math.min(worldWidth - 80, targetX)), y: 720 }
              }));
            }

            performanceIndexRef.current += 1;
            setPerformanceIndex(prev => prev + 1);
          }, 3500);
        }, moveDelay);
      } else {
        performanceIndexRef.current += 1;
        setPerformanceIndex(prev => prev + 1);
      }
    } else {
      performanceIndexRef.current += 1;
      setPerformanceIndex(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isPerforming) {
      executeNextAction();
    }
  }, [isPerforming, performanceIndex]);

  const startPerformance = () => {
    // 1. 清除所有正在运行的定时器，防止逻辑冲突
    clearAllTimers();

    // 2. 重置所有角色状态（位置、气泡、动作）
    if (initialCharacterStateRef.current && initialCharacterStateRef.current.instances) {
      const initialTargets = initialCharacterStateRef.current.targets;
      
      setCharacterInstances(prev => {
        const updated = {};
        // 重新创建实例或重置现有实例，确保位置回到初始点
        Object.keys(prev).forEach((name, index) => {
          const char = prev[name];
          const initialX = 150 + index * 200; // 对应初始化时的逻辑
          
          if (char.stopSpeaking) char.stopSpeaking();
          char.x = initialX;
          char.y = 720;
          char.isSitting = false;
          char.isWalking = false;
          char.vx = 0;
          updated[name] = char;
        });
        return { ...updated };
      });

      // 同步重置目标位置，防止角色立即走回原来的地方
      const resetTargets = {};
      Object.keys(initialCharacterStateRef.current.targets).forEach((name, index) => {
        resetTargets[name] = { x: 150 + index * 200, y: 720 };
      });
      setTargetPositions(resetTargets);
    }

    // 3. 彻底重置所有进度索引
    performanceIndexRef.current = 0;
    setPerformanceIndex(0);
    messageIndexRef.current = 0;
    setMessageIndex(0);
    activeParticipantsRef.current = [];
    setCurrentMessage(null);
    
    setIsDeductionStarted(true);
    setIsDeductionEnded(false);
    setIsPerforming(true);
    
    // 移除这里的 advanceDialogue(true)，改为在 executeNextAction 中同步
  };

  // 播放场景对话逻辑
  const advanceDialogue = (isAuto = false) => {
    if (!isAuto) setIsDeductionStarted(true);
    const currentSceneMessages = sceneMessagesRef.current;
    const index = messageIndexRef.current;
    
    if (currentSceneMessages && currentSceneMessages.length > 0 && index < currentSceneMessages.length) {
      const message = currentSceneMessages[index];
      setCurrentMessage(message);
      
      // 独占说话机制：新角色说话时，清空其他所有角色的气泡
      setCharacterInstances(prev => {
        const updated = { ...prev };
        Object.values(updated).forEach(char => {
          if (char.name !== message.character_name && char.stopSpeaking) {
            char.stopSpeaking();
          }
        });
        return updated;
      });

      // 让对应角色说话气泡显示
      if (instancesRef.current[message.character_name]) {
        instancesRef.current[message.character_name].speak(message.content);
      }
      
      const nextIndex = index + 1;
      messageIndexRef.current = nextIndex;
      setMessageIndex(nextIndex);
      
      // 如果播到了最后一句，且不是自动播放的第一句，才标记结束
      if (index === currentSceneMessages.length - 1 && !isAuto) {
        setIsDeductionEnded(true);
        // 清除所有角色的说话气泡，并触发状态更新
        setCharacterInstances(prev => {
          const updated = { ...prev };
          Object.values(updated).forEach(char => {
            if (char.stopSpeaking) char.stopSpeaking();
          });
          return updated;
        });
      }
      
      return true;
    }
    return false;
  };

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
    const characterNames = Object.keys(characterInstances);
    if (characterNames.length === 0) return;

    // 1. 性能期间的距离维持逻辑（必须在 early return 之前，因为它需要在表演时运行）
    if (isPerformingRef.current) {
      const currentAction = actions[performanceIndexRef.current];
      if (currentAction && currentAction.type === 'dialogue') {
        const char1Name = currentAction.character;
        const char2Name = currentAction.target;
        
        if (char1Name && char2Name && characterInstances[char1Name] && characterInstances[char2Name]) {
          const char1 = characterInstances[char1Name];
          const char2 = characterInstances[char2Name];
          
          const pos1 = characterPositionsRef.current[char1Name] || { x: char1.x };
          const pos2 = characterPositionsRef.current[char2Name] || { x: char2.x };
          
          const dist = Math.abs(pos1.x - pos2.x);
          const idealDist = 120;
          
          // 只有距离偏差较大时（>40px）才进行修正，防止频繁微调导致抖动
          if (dist > idealDist + 40 || dist < idealDist - 40) {
            const midpoint = (pos1.x + pos2.x) / 2;
            const dir1 = pos1.x < pos2.x ? -1 : 1;
            const dir2 = -dir1;
            
            setTargetPositions(prev => ({
              ...prev,
              [char1Name]: { x: Math.max(80, Math.min(worldWidth - 80, midpoint + dir1 * (idealDist / 2))), y: 720 },
              [char2Name]: { x: Math.max(80, Math.min(worldWidth - 80, midpoint + dir2 * (idealDist / 2))), y: 720 }
            }));
          }
        }
      }
    }

    // 2. 表演中、未开始或已结束时，不执行后续的自主移动逻辑
    if (isDeductionEnded || !isDeductionStarted || isPerforming) return;
    
    let allStopped = true;

    // 为每个角色生成移动指令，使用 Promise.all 实现同时移动
    const movementPromises = characterNames.map(async (characterName) => {
      try {
        const character = characterInstances[characterName];
        // 如果角色正在说话，或者正在与用户聊天，停止自主移动
        if (!character || character.isSpeaking || (showSmallDialog && clickedCharacter === characterName)) return { characterName, isMoving: false };

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
        /* 移除近距离停止逻辑，允许位置交换
        for (const otherChar of Object.values(characterInstances)) {
          if (otherChar.name === characterName) continue;
          const otherPos = characterPositionsRef.current[otherChar.name] || { x: otherChar.x, y: otherChar.y };
          const distance = Math.abs(realTimePosition.x - otherPos.x);
          if (distance < 100) { // 100 是距离阈值
            hasNearbyCharacter = true;
            break;
          }
        }
        */
        
        // 检查是否进入了对话区域
        let isInDialogueZone = false;
        const participants = activeParticipantsRef.current.map(name => characterInstances[name]).filter(Boolean);
        if (participants.length >= 1 && !activeParticipantsRef.current.includes(characterName)) {
          const x1 = participants[0].x;
          const x2 = participants[1]?.x ?? x1;
          const minX = Math.min(x1, x2) - 150;
          const maxX = Math.max(x1, x2) + 150;
          if (realTimePosition.x > minX && realTimePosition.x < maxX) {
            isInDialogueZone = true;
          }
        }
        
        // 如果有交互或在对话区域内，停止移动（移除 hasNearbyCharacter 判断）
        if (hasInteraction || isInDialogueZone) {
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
                const newY = 710; // 固定地面高度

                /* 移除目标位置强制间距逻辑，由动画循环处理碰撞
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
                */

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
            // 如果没有明显的移动指令，确保停止移动状态
            isMovingRef.current[characterName] = false;
            return { characterName, isMoving: false };
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
      // 智能体模式不再主动标记演绎结束，避免干扰剧本表演
      // setIsDeductionEnded(true);
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

  // 平滑移动角色到目标位置并更新动画状态
  useEffect(() => {
    const characterNames = Object.keys(characterInstances);
    if (characterNames.length === 0) return;

    const animationInterval = setInterval(() => {
      setCharacterInstances(prev => {
        const updatedInstances = {};
        const characterNames = Object.keys(prev);
        
        // 1. 首先确定对话区域和参与者
        const participants = activeParticipantsRef.current.map(name => prev[name]).filter(Boolean);
        let dialogueZone = null;
        if (participants.length >= 2) {
          const x1 = participants[0].x;
          const x2 = participants[1].x;
          dialogueZone = {
            min: Math.min(x1, x2) - 100,
            max: Math.max(x1, x2) + 100
          };
        } else if (participants.length === 1) {
          dialogueZone = {
            min: participants[0].x - 150,
            max: participants[0].x + 150
          };
        }

        characterNames.forEach((characterName) => {
          const currentChar = prev[characterName];
          let targetPos = targetPositions[characterName];
          
          if (currentChar) {
            const charCopy = Object.assign(Object.create(Object.getPrototypeOf(currentChar)), currentChar);
            
            // 2. 非对话人物主动避让逻辑
            const isParticipant = activeParticipantsRef.current.includes(characterName);
            if (!isParticipant && dialogueZone) {
              // 如果在对话区域内，或者离对话参与者太近，强制更新目标位置向外移
              if (charCopy.x > dialogueZone.min && charCopy.x < dialogueZone.max) {
                const mid = (dialogueZone.min + dialogueZone.max) / 2;
                const escapeDir = charCopy.x < mid ? -1 : 1;
                const escapeX = escapeDir === -1 ? dialogueZone.min - 50 : dialogueZone.max + 50;
                
                // 更新目标位置，让路人走开
                setTargetPositions(prevTargets => ({
                  ...prevTargets,
                  [characterName]: { x: Math.max(100, Math.min(worldWidth - 100, escapeX)), y: 720 }
                }));
                targetPos = { x: escapeX, y: 720 };
              }
            }

            // 3. 实时碰撞检测：防止人物重叠
            characterNames.forEach(otherName => {
              if (characterName === otherName) return;
              const otherChar = prev[otherName];
              if (!otherChar) return;

              const dist = Math.abs(charCopy.x - otherChar.x);
              if (dist < 70) { // 最小间距 70 像素
                // 检查是否正在移动且需要穿过对方
                const myTarget = targetPositions[characterName];
                const otherTarget = targetPositions[otherName];
                
                let canPassThrough = false;
                
                // 1. 如果我有目标，且目标在对方的另一侧，说明我要穿过他
                if (myTarget) {
                  const targetIsAcross = (charCopy.x <= otherChar.x && myTarget.x > otherChar.x) || 
                                       (charCopy.x >= otherChar.x && myTarget.x < otherChar.x);
                  if (targetIsAcross) {
                    canPassThrough = true;
                  }
                }
                
                // 2. 如果对方有目标，且目标在我这一侧，说明他要穿过我
                if (otherTarget) {
                  const otherTargetIsAcross = (otherChar.x <= charCopy.x && otherTarget.x > charCopy.x) || 
                                             (otherChar.x >= charCopy.x && otherTarget.x < charCopy.x);
                  if (otherTargetIsAcross) {
                    canPassThrough = true;
                  }
                }

                // 3. 参与者与路人相遇：双方都允许穿透
                const otherIsParticipant = activeParticipantsRef.current.includes(otherName);
                if ((isParticipant && !otherIsParticipant) || (!isParticipant && otherIsParticipant)) {
                  canPassThrough = true;
                  
                  // 如果我是路人，且我挡住了参与者，我主动触发避让
                  if (!isParticipant && otherIsParticipant) {
                    const pushDir = charCopy.x < otherChar.x ? -1 : 1;
                    const escapeX = pushDir === -1 ? Math.max(100, charCopy.x - 200) : Math.min(worldWidth - 100, charCopy.x + 200);
                    
                    setTargetPositions(prevTargets => {
                      const currentTarget = prevTargets[characterName];
                      // 只有当路人当前没有远距离目标时才更新，防止持续刷新导致“被带走”
                      if (!currentTarget || Math.abs(currentTarget.x - charCopy.x) < 50) {
                        return {
                          ...prevTargets,
                          [characterName]: { x: escapeX, y: 720 }
                        };
                      }
                      return prevTargets;
                    });
                  }
                }
                
                // 4. 正在说话的角色不被推开
                if (otherChar.isSpeaking || charCopy.isSpeaking) {
                  canPassThrough = true;
                }

                // 如果不需要穿过，才进行物理推开
                if (!canPassThrough) {
                  const pushDir = charCopy.x < otherChar.x ? -1 : 1;
                  charCopy.x += pushDir * 1.5; 
                } else {
                   // 穿过状态：为了视觉上不完全重叠，可以根据角色名字给一个微小的 Z 轴（层级）感
                   // 这里通过 render 时的 zIndex 处理，此处不需要修改坐标
                 }
              }
            });

            // 更新物理状态（重力、位置等）
            charCopy.update();

            // 动态调整对话气泡高度和水平偏移
            if (charCopy.isSpeaking) {
              let offsetYSelf = -140;
              let offsetXSelf = 0;
              
              const speakingChars = Object.values(prev)
                .filter(c => c.isSpeaking)
                .sort((a, b) => a.x - b.x);
              
              const myIndex = speakingChars.findIndex(c => c.name === characterName);
              if (myIndex !== -1) {
                // 1. 基础阶梯高度逻辑
                if (myIndex % 2 === 1) {
                  offsetYSelf = -280;
                }
                
                // 2. 水平偏移逻辑：如果太近，尝试向外侧推开
                if (speakingChars.length > 1) {
                  const leftChar = speakingChars[myIndex - 1];
                  const rightChar = speakingChars[myIndex + 1];
                  
                  if (leftChar && Math.abs(charCopy.x - leftChar.x) < 220) {
                    // 如果左边有人且太近，我往右移一点
                    offsetXSelf += 60;
                  }
                  if (rightChar && Math.abs(charCopy.x - rightChar.x) < 220) {
                    // 如果右边有人且太近，我往左移一点
                    offsetXSelf -= 60;
                  }
                }
                
                // 3. 垂直避让补充：如果水平偏移后仍然可能重叠
                speakingChars.forEach((otherChar, idx) => {
                  if (idx < myIndex && Math.abs((charCopy.x + offsetXSelf) - (otherChar.x + (updatedInstances[otherChar.name]?.bubbleX || 0))) < 180) {
                    if (offsetYSelf === (updatedInstances[otherChar.name]?.bubbleY || -140)) {
                      offsetYSelf = offsetYSelf === -140 ? -280 : -140;
                    }
                  }
                });
              }
              charCopy.bubbleY = offsetYSelf;
              charCopy.bubbleX = offsetXSelf;
            }
            
            // 如果有目标位置且不在说话，向目标移动
            if (targetPos && !charCopy.isSpeaking) {
              const dx = targetPos.x - charCopy.x;
              
              // 阈值应该略大于速度，防止在目标点来回抖动 (速度是 2.5)
              if (Math.abs(dx) > 3) {
                const moveDirection = dx > 0 ? 'right' : 'left';
                charCopy.move(moveDirection);
              } else {
                if (charCopy.isWalking) {
                  charCopy.move('stop');
                }
                charCopy.x = targetPos.x; // 到达位置后强制对齐
              }
            } else if (charCopy.isSpeaking) {
              // 说话时强制停止移动
              charCopy.move('stop');
            }
            
            updatedInstances[characterName] = charCopy;
          }
        });

        return { ...updatedInstances };
      });
    }, 50);

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

      {/* 演绎结束提示 - 只有在开始过且真正结束时才显示 */}
      {isDeductionStarted && isDeductionEnded && !isPerforming && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]">
          <div className="bg-black/90 text-white px-10 py-6 rounded-2xl shadow-2xl border-4 border-yellow-400 animate-in zoom-in duration-300">
            <h1 className="text-5xl font-black text-center mb-2">🎬 演绎结束</h1>
            <p className="text-yellow-400 text-center font-bold">所有剧本动作已表演完毕</p>
          </div>
        </div>
      )}
      
      {/* 顶部控制栏 */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="bg-white px-6 py-3 rounded-2xl border-4 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎬</span> {title || '星空冒险'}
            </h2>
          </div>
          <div className="flex gap-2">
            {actions.length > 0 && (
              <button
                onClick={startPerformance}
                disabled={isPerforming}
                className={`px-6 py-3 rounded-2xl border-4 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black flex items-center gap-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                  isPerforming ? 'bg-gray-200 text-gray-400' : 'bg-yellow-400 text-gray-800 hover:bg-yellow-300'
                }`}
              >
                <span>{isPerforming ? '🎭 表演中...' : '▶️ 开始表演'}</span>
              </button>
            )}
            <button 
              className="bg-white px-6 py-3 rounded-2xl border-4 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black flex items-center gap-2 hover:bg-gray-100 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              onClick={() => {
                // 1. 立即停止所有计时器和异步任务
                clearAllTimers();
                setIsPerforming(false);
                setIsDeductionStarted(false);
                setIsDeductionEnded(false);
                performanceIndexRef.current = 0;
                setPerformanceIndex(0);
                messageIndexRef.current = 0;
                setMessageIndex(0);
                activeParticipantsRef.current = [];
                setCurrentMessage(null);
                setShowSmallDialog(false);
                setClickedCharacter(null);
                
                // 2. 强制所有角色实例闭嘴并瞬移
                Object.values(characterInstances).forEach(char => {
                  if (char.stopSpeaking) char.stopSpeaking();
                  const initialPos = initialCharacterStateRef.current.targets[char.name];
                  if (char.resetState && initialPos) {
                    char.resetState(initialPos.x, initialPos.y);
                  }
                });
                
                // 3. 强制清空当前显示的消息状态，防止 advanceDialogue 拿到旧数据
                setCurrentMessage(null);

                // 4. 重置 React 状态镜像
                if (initialCharacterStateRef.current.instances) {
                  setCharacterInstances({ ...characterInstances });
                  setTargetPositions({ ...initialCharacterStateRef.current.targets });
                }

                // 5. 稍微加长延迟，确保上面的状态清理已经完全生效
                addTimer(() => {
                  messageIndexRef.current = 0;
                  // 不再自动调用 advanceDialogue(true)，保持界面干净
                }, 200);
              }}
            >
              <span>🔄 重置场景</span>
            </button>
          </div>
        </div>
      </div>
        
      {/* 底部提示栏 */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 z-50 pointer-events-none">
        <div className="bg-black bg-opacity-70 text-white p-2 px-4 rounded-lg border-2 border-white shadow-lg pointer-events-auto">
          <p className="text-xs font-bold flex items-center gap-2">
            <span className="animate-pulse">🖱️</span> 点击角色进行实时对话
          </p>
        </div>
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

      {/* 小对话框 - 聊天界面 */}
      {showSmallDialog && clickedCharacter && (
        <div className="absolute top-28 right-8 bg-white p-4 rounded-xl border-4 border-gray-800 w-[320px] z-[60] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between mb-2 border-b-4 border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border-2 border-gray-800" style={{ backgroundColor: characterColors[clickedCharacter] || '#9B5DE5' }}></div>
              <span className="font-black text-sm text-gray-800">与 {clickedCharacter} 交流</span>
            </div>
            <button 
              onClick={() => setShowSmallDialog(false)}
              className="text-gray-500 hover:text-red-500 font-bold"
            >
              ✕
            </button>
          </div>
          
          <div className="bg-gray-100 p-2 rounded-lg border-2 border-gray-800 mb-3 h-[200px] overflow-y-auto flex flex-col gap-2">
            {(!messages[clickedCharacter] || messages[clickedCharacter].length === 0) ? (
              <div className="text-center text-gray-400 mt-10 text-xs italic">
                点击下方发送消息...
              </div>
            ) : (
              messages[clickedCharacter].map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[85%] p-2 rounded-lg text-xs font-bold border-2 border-gray-800 ${
                    msg.character_name === '用户' 
                    ? 'bg-yellow-200 self-end rounded-br-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' 
                    : 'bg-white self-start rounded-bl-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
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
              placeholder="说点什么..."
              className="flex-1 p-2 border-2 border-gray-800 rounded-lg focus:bg-yellow-50 outline-none text-xs font-bold"
            />
            <button
              onClick={handleChat}
              disabled={!userMessage.trim() || isProcessing}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg border-2 border-gray-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-black hover:bg-blue-400 disabled:opacity-50 text-xs"
            >
              {isProcessing ? '...' : '发送'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default SceneVisualization;