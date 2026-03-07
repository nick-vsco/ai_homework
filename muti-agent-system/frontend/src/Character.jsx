import React, { useState } from 'react';
import { motion } from 'framer-motion';

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

  move(direction) {
    switch (direction) {
      case 'up':
        this.y = Math.max(50, this.y - this.speed);
        break;
      case 'down':
        this.y = Math.min(500, this.y + this.speed);
        break;
      case 'left':
        this.x = Math.max(50, this.x - this.speed);
        break;
      case 'right':
        this.x = Math.min(700, this.x + this.speed);
        break;
      default:
        break;
    }
  }

  speak(message) {
    this.isSpeaking = true;
    this.message = message;
    setTimeout(() => {
      this.isSpeaking = false;
      this.message = '';
    }, 3000);
  }

  checkCollision(otherCharacter) {
    const distance = Math.sqrt(
      Math.pow(this.x - otherCharacter.x, 2) + Math.pow(this.y - otherCharacter.y, 2)
    );
    return distance < 50;
  }
}

// 角色组件
const CharacterComponent = ({ character, onMove }) => {
  const handleMove = (direction) => {
    onMove(character.name, direction);
  };

  return (
    <motion.div
      className="relative"
      initial={{ x: character.x, y: character.y }}
      animate={{ x: character.x, y: character.y }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      {/* 像素风格小人 - 参考我的世界风格 */}
      <div className="relative w-16">
        {/* 头部 */}
        <div 
          className="w-12 h-12 bg-gray-300 border-2 border-gray-400 mx-auto"
          style={{ backgroundColor: character.color }}
        ></div>
        {/* 身体 */}
        <div className="w-12 h-12 bg-gray-200 border-2 border-gray-400 mt-1 mx-auto"></div>
        {/* 四肢 */}
        <div className="flex justify-between mt-1">
          <div className="w-6 h-10 bg-gray-200 border-2 border-gray-400"></div>
          <div className="w-6 h-10 bg-gray-200 border-2 border-gray-400"></div>
        </div>
        {/* 脚 */}
        <div className="flex justify-between mt-1">
          <div className="w-4 h-6 bg-gray-200 border-2 border-gray-400"></div>
          <div className="w-4 h-6 bg-gray-200 border-2 border-gray-400"></div>
        </div>
        {/* 角色名字 */}
        <div className="mt-2 text-center font-bold text-sm text-gray-800">
          {character.name}
        </div>
        
        {/* 移动控制按钮 */}
        <div className="mt-2 grid grid-cols-3 gap-1">
          <button 
            className="w-6 h-6 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('left');
            }}
          >
            ←
          </button>
          <button 
            className="w-6 h-6 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('up');
            }}
          >
            ↑
          </button>
          <button 
            className="w-6 h-6 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('right');
            }}
          >
            →
          </button>
          <div></div>
          <button 
            className="w-6 h-6 bg-gray-200 border border-gray-400 rounded hover:bg-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              handleMove('down');
            }}
          >
            ↓
          </button>
          <div></div>
        </div>
      </div>

      {/* 对话气泡 */}
      {character.isSpeaking && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-[-100px] left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg border-2 border-gray-400 max-w-[200px] z-10"
        >
          <div className="text-sm">{character.message}</div>
          <div className="absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-10px border-r-10px border-t-10px border-l-transparent border-r-transparent border-t-white"></div>
        </motion.div>
      )}
    </motion.div>
  );
};

export { Character, CharacterComponent };