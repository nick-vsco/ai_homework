import React, { useState } from 'react';
import { motion } from 'framer-motion';

class Character {
  constructor(name, color, x, y) {
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 2.5; // 再次减慢一半速度
    this.jumpForce = -12; // 配合慢速降低跳跃力度
    this.gravity = 0.4; // 配合慢速减小重力
    this.groundLevel = 592; // 调整地面高度，适应新背景图的平面 (约 90% 高度处)
    this.isGrounded = true;
    this.isSpeaking = false;
    this.message = '';
    this.width = 64;
    this.height = 128; // 精确计算的高度：48(头) + 52(身) + 28(腿) = 128px
    
    // 冲刺 (Dash) 系统
    this.canDash = true;
    this.isDashing = false;
    this.dashTime = 0;
    this.dashDuration = 15; // 帧数
    this.dashSpeed = 12;
    this.dashCooldown = 0;
    this.dashCooldownMax = 40; // 帧数
    this.facing = 'right';
  }

  move(direction) {
    if (this.isDashing) return; // 冲刺中不能控制移动

    switch (direction) {
      case 'left':
        this.vx = -this.speed;
        this.facing = 'left';
        break;
      case 'right':
        this.vx = this.speed;
        this.facing = 'right';
        break;
      case 'stop':
        this.vx = 0;
        break;
      default:
        break;
    }
  }

  jump() {
    if (this.isGrounded && !this.isDashing) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
    }
  }

  dash() {
    if (this.canDash && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.canDash = false;
      this.dashTime = this.dashDuration;
      this.dashCooldown = this.dashCooldownMax;
      // 冲刺时垂直速度清零，实现短暂悬停感
      this.vy = 0;
      // 冲刺方向
      this.vx = this.facing === 'left' ? -this.dashSpeed : this.dashSpeed;
    }
  }

  update(otherCharacters = []) {
    // 冲刺计时
    if (this.isDashing) {
      this.dashTime--;
      if (this.dashTime <= 0) {
        this.isDashing = false;
        this.vx = 0;
      }
    } else {
      // 正常重力应用
      if (!this.isGrounded) {
        this.vy += this.gravity;
      }
    }

    // 冷却计时
    if (this.dashCooldown > 0) {
      this.dashCooldown--;
    }
    if (this.isGrounded && this.dashCooldown <= 0) {
      this.canDash = true;
    }

    // 更新位置
    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    // 使用动态世界宽度边界
    const currentWorldWidth = this.worldWidth || 5000;
    nextX = Math.max(0, Math.min(currentWorldWidth - this.width, nextX));

    // 地面检测
    if (nextY >= this.groundLevel) {
      nextY = this.groundLevel;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.x = nextX;
    this.y = nextY;
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
    return distance < 60;
  }
}

// 角色组件
const CharacterComponent = ({ character, onMove, onJump }) => {
  // 根据速度计算挤压拉伸
  const scaleY = character.isDashing ? 0.8 : (character.vy < 0 ? 1.2 : (character.vy > 0 ? 0.9 : 1));
  const scaleX = character.isDashing ? 1.3 : (character.vy < 0 ? 0.8 : (character.vy > 0 ? 1.1 : 1));

  return (
    <motion.div
      className="absolute"
      animate={{ 
        x: character.x, 
        y: character.y,
        scaleX: character.facing === 'left' ? -scaleX : scaleX,
        scaleY: scaleY
      }}
      transition={{ 
        x: { type: 'tween', duration: 0.01 },
        y: { type: 'tween', duration: 0.01 },
        scaleX: { type: 'spring', damping: 10, stiffness: 200 },
        scaleY: { type: 'spring', damping: 10, stiffness: 200 }
      }}
    >
      {/* 冲刺残影效果 */}
      {character.isDashing && (
        <motion.div
          initial={{ opacity: 0.5, x: 0 }}
          animate={{ opacity: 0, x: character.facing === 'left' ? 40 : -40 }}
          className="absolute inset-0 bg-white opacity-30 rounded-lg blur-sm"
          style={{ width: character.width, height: character.height }}
        />
      )}

      {/* 像素风格小人 */}
      <div className="relative w-16">
        {/* 对话气泡 */}
        {character.isSpeaking && (
          <motion.div
            initial={{ opacity: 0, y: 20, scaleX: character.facing === 'left' ? -1 : 1 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-[-140px] left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-xl border-4 border-gray-800 min-w-[180px] z-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]"
          >
            <div className="text-base font-black text-gray-800 text-center leading-tight">{character.message}</div>
            <div className="absolute bottom-[-14px] left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-gray-800"></div>
          </motion.div>
        )}

        {/* 角色主体 */}
        <div className="relative group cursor-pointer">
          {/* 头部 */}
          <div 
            className="w-12 h-12 border-4 border-gray-800 mx-auto shadow-md"
            style={{ backgroundColor: character.color }}
          >
            {/* 眼睛 - 冲刺时变成细线 */}
            <div className="flex justify-around mt-3 px-2">
              <div className={`bg-gray-800 rounded-full ${character.isDashing ? 'w-4 h-1' : 'w-2 h-2'}`}></div>
              <div className={`bg-gray-800 rounded-full ${character.isDashing ? 'w-4 h-1' : 'w-2 h-2'}`}></div>
            </div>
          </div>
          {/* 身体 */}
          <div className="w-12 h-14 bg-gray-100 border-4 border-gray-800 mt-[-4px] mx-auto shadow-md"></div>
          {/* 腿 */}
          <div className="flex justify-center gap-2 mt-[-4px]">
            <div className={`w-4 bg-gray-300 border-4 border-gray-800 transition-all ${character.isGrounded ? 'h-8' : 'h-6 mt-1'}`}></div>
            <div className={`w-4 bg-gray-300 border-4 border-gray-800 transition-all ${character.isGrounded ? 'h-8' : 'h-6 mt-1'}`}></div>
          </div>
          
          {/* 角色名字标签 - 移至头顶 */}
          <div 
            className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-bold"
            style={{ scaleX: character.facing === 'left' ? -1 : 1 }}
          >
            {character.name}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export { Character, CharacterComponent };