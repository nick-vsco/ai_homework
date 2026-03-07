import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Character, CharacterComponent } from './Character';

function SceneVisualization({ sceneMessages, characters }) {
  const [characterInstances, setCharacterInstances] = useState({});
  const [currentMessage, setCurrentMessage] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [interactingCharacters, setInteractingCharacters] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const sceneRef = useRef(null);

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
          150 + index * 100,
          200 + Math.random() * 100
        );
      });
      setCharacterInstances(initialCharacters);
    }
  }, [characters]);

  // 播放场景对话
  useEffect(() => {
    if (sceneMessages && sceneMessages.length > 0 && messageIndex < sceneMessages.length) {
      const timer = setTimeout(() => {
        const message = sceneMessages[messageIndex];
        setCurrentMessage(message);
        
        // 让角色说话
        if (characterInstances[message.character_name]) {
          characterInstances[message.character_name].speak(message.content);
        }
        
        setMessageIndex(prev => prev + 1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sceneMessages, messageIndex, characterInstances]);

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
    setCharacterInstances(prev => {
      const updatedCharacters = { ...prev };
      if (updatedCharacters[characterName]) {
        updatedCharacters[characterName].move(direction);
      }
      return updatedCharacters;
    });
  };

  return (
    <div 
      ref={sceneRef}
      className="relative w-full h-[600px] bg-cover bg-center rounded-2xl overflow-hidden"
      style={{
        backgroundImage: `url('/town_map.png')`
      }}
    >
      {/* 场景标题 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-80 p-3 rounded-lg border-2 border-gray-400">
        <h3 className="font-bold text-lg">小镇场景</h3>
      </div>

      {/* 角色 */}
      {Object.values(characterInstances).map((character) => (
        <CharacterComponent
          key={character.name}
          character={character}
          onMove={moveCharacter}
        />
      ))}

      {/* 角色交互对话框 */}
      {showDialog && interactingCharacters && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg border-2 border-gray-400 max-w-[400px] z-20"
        >
          <h4 className="font-bold text-lg mb-4">{interactingCharacters[0]} 和 {interactingCharacters[1]} 相遇了！</h4>
          <p className="mb-4">他们开始交谈...</p>
          <button
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
            onClick={() => setShowDialog(false)}
          >
            关闭
          </button>
        </motion.div>
      )}

      {/* 控制按钮 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          className="bg-white p-2 rounded-lg border-2 border-gray-400 font-bold hover:bg-gray-100"
          onClick={() => setMessageIndex(0)}
        >
          重新播放
        </button>
      </div>
    </div>
  );
}

export default SceneVisualization;