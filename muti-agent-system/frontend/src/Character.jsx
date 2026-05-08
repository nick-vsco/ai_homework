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
    this.groundLevel = 720; // 调低一点点，微调对齐位置
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
    this.isWalking = false;
    this.isJumping = false;
    this.isWaving = false;
    this.isSitting = false;
    this.bubbleY = -140; // 默认气泡高度
    this.zIndexOffset = Math.random() * 10; 
    
    // 形象特征：随机生成一些视觉差异
    this.style = {
      hairType: Math.floor(Math.random() * 3), // 0: 短发, 1: 长发, 2: 爆炸头
      clothingColor: ['#f3f4f6', '#3b82f6', '#ef4444', '#10b981', '#f59e0b'][Math.floor(Math.random() * 5)],
      eyeColor: '#374151'
    };
  }

  resetState(initialX, initialY) {
    this.x = initialX;
    this.y = initialY;
    this.vx = 0;
    this.vy = 0;
    this.isWalking = false;
    this.isJumping = false;
    this.isWaving = false;
    this.isSitting = false;
    this.isSpeaking = false;
    this.message = '';
    this.facing = 'right';
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
  }

  move(direction) {
    if (this.isDashing || this.isSitting) return; 

    switch (direction) {
      case 'left':
        this.vx = -this.speed;
        this.facing = 'left';
        this.isWalking = true;
        break;
      case 'right':
        this.vx = this.speed;
        this.facing = 'right';
        this.isWalking = true;
        break;
      case 'stop':
        this.vx = 0;
        this.isWalking = false;
        break;
      default:
        break;
    }
  }

  jump() {
    if (this.isGrounded && !this.isDashing && !this.isSitting) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
    }
  }

  wave() {
    this.isWaving = true;
    setTimeout(() => {
      this.isWaving = false;
    }, 2000);
  }

  sit() {
    this.isSitting = !this.isSitting;
    if (this.isSitting) {
      this.vx = 0;
      this.isWalking = false;
    }
  }

  dash() {
    if (this.canDash && this.dashCooldown <= 0 && !this.isSitting) {
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

    // 落地检测
    if (this.y >= this.groundLevel) {
      this.y = this.groundLevel;
      this.vy = 0;
      this.isGrounded = true;
      this.isJumping = false;
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

  speak(text, duration = 4000) {
    // 过滤掉括号内的内容（如：(走进店里...)）以及角色名前缀（如：张三: ）
    let cleanText = text.replace(/\([^)]*\)/g, '').replace(/^[^：:]*[：:]\s*/, '').trim();
    
    // 如果过滤后没内容了，就保留原样（防止全是动作描述的情况）
    if (!cleanText) cleanText = text;

    // 再次精简：如果文本还是太长（超过60字），进行截断并加省略号
    if (cleanText.length > 60) {
      cleanText = cleanText.substring(0, 57) + '...';
    }

    this.isSpeaking = true;
    this.message = cleanText;
    this.vx = 0; // 说话时停止移动
    this.isWalking = false;
    
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
    this.speakTimeout = setTimeout(() => {
      this.isSpeaking = false;
      this.message = '';
    }, duration);
  }

  stopSpeaking() {
    this.isSpeaking = false;
    this.message = '';
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
  }

  checkCollision(otherCharacter) {
    const distance = Math.sqrt(
      Math.pow(this.x - otherCharacter.x, 2) + Math.pow(this.y - otherCharacter.y, 2)
    );
    return distance < 60;
  }
}

// 角色组件
const CharacterComponent = ({ character, onClick }) => {
  // 根据速度计算挤压拉伸 - 仅用于 Y 轴动画
  const scaleY = character.isDashing ? 0.8 : (character.vy < 0 ? 1.2 : (character.vy > 0 ? 0.9 : 1));
  
  // 头发样式
  const renderHair = () => {
    switch(character.style.hairType) {
      case 1: // 长发
        return <div className="absolute -top-2 -left-1 -right-1 h-6 bg-gray-800 rounded-t-lg z-0" />;
      case 2: // 爆炸头
        return <div className="absolute -top-4 -left-2 -right-2 h-8 bg-gray-800 rounded-full z-0" />;
      default: // 短发
        return <div className="absolute -top-2 left-0 right-0 h-3 bg-gray-800 rounded-t-sm z-0" />;
    }
  };

  return (
    <motion.div
      className="absolute cursor-pointer flex flex-col items-center"
      animate={{ 
        x: character.x, 
        y: character.y - 140, // 减去高度，使 y 坐标对应人物脚部（地面）
        scaleY: scaleY
      }}
      transition={{ 
        x: { type: 'tween', duration: 0.01 },
        y: { type: 'tween', duration: 0.01 },
        scaleY: { type: 'spring', damping: 10, stiffness: 200 }
      }}
      style={{ 
        zIndex: Math.floor(character.y + (character.zIndexOffset || 0)),
        width: '80px', 
        height: '140px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
      onClick={onClick}
    >
      {/* 脚底阴影 - 放在最底层 */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-3 bg-black/20 rounded-full blur-[2px]" />

      <div className="relative w-full flex flex-col items-center">
        {/* 对话气泡 */}
        {character.isSpeaking && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute z-50 pointer-events-none"
            style={{ 
              bottom: '100%',
              marginBottom: '50px', // 增加间距，避免挡住名字
              left: '50%',
              transform: `translateX(-50%) translateX(${character.bubbleX || 0}px) translateY(${character.bubbleY || 0}px)`
            }}
          >
            <div className="relative bg-white text-gray-800 p-3 rounded-2xl border-4 border-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[120px] max-w-[240px]">
              <p className="text-sm font-black leading-tight whitespace-normal break-words text-center">
                {character.message}
              </p>
              {/* 小三角 */}
              <div 
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-gray-800"
                style={{
                  left: `calc(50% - ${character.bubbleX || 0}px)`
                }}
              ></div>
            </div>
          </motion.div>
        )}

        {/* 角色主体 - 彻底禁用 scaleX 动画，改用 rotateY 翻转 */}
        <div 
          className="relative flex flex-col items-center transition-transform duration-300" 
          style={{ 
            transform: character.facing === 'left' ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          {/* 头部 */}
          <div className="relative w-14 h-14 z-10">
            {renderHair()}
            <div 
              className="w-full h-full border-4 border-gray-800 bg-[#ffdbac] relative overflow-hidden shadow-inner"
              style={{ borderRadius: '12% 12% 15% 15%' }}
            >
              {/* 脸部细节 */}
              <div className="absolute top-1/2 left-0 right-0 flex justify-around px-2 transform -translate-y-1/2">
                <div className="w-2.5 h-2.5 bg-gray-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-gray-800 rounded-full" />
              </div>
              {/* 腮红 */}
              <div className="absolute top-8 left-1 w-2 h-1 bg-red-300/50 rounded-full" />
              <div className="absolute top-8 right-1 w-2 h-1 bg-red-300/50 rounded-full" />
            </div>
          </div>
          
          {/* 身体/衣服 */}
          <motion.div 
            className="w-12 border-4 border-gray-800 -mt-1 relative z-0"
            style={{ 
              backgroundColor: character.color,
              borderRadius: '4px 4px 8px 8px'
            }}
            animate={character.isSitting ? { height: 35, y: 15 } : { height: 50, y: 0 }}
          >
            {/* 领口细节 */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-white/30 rounded-b-full" />
            
            {/* 手臂 */}
            <motion.div 
              className="absolute -right-3 top-2 w-4 h-10 border-4 border-gray-800 rounded-full"
              style={{ backgroundColor: character.color, originY: 0 }}
              animate={character.isWaving ? { rotate: [0, -110, -40, -110, 0] } : { rotate: -10 }}
              transition={{ duration: 1.5, repeat: character.isWaving ? Infinity : 0 }}
            />
            <motion.div 
              className="absolute -left-3 top-2 w-4 h-10 border-4 border-gray-800 rounded-full"
              style={{ backgroundColor: character.color, originY: 0 }}
              animate={{ rotate: 10 }}
            />
          </motion.div>

          {/* 腿/裤子 */}
          <div className="flex justify-center gap-1 -mt-1">
            <motion.div 
              className="w-5 bg-gray-700 border-4 border-gray-800 rounded-b-md"
              animate={character.isWalking ? { 
                rotate: [0, 40, 0, -40, 0],
                height: [28, 24, 28],
                originY: 0 
              } : character.isSitting ? { height: 12, y: -4 } : { rotate: 0, height: character.isGrounded ? 28 : 20 }}
              transition={character.isWalking ? { duration: 0.6, repeat: Infinity } : {}}
            />
            <motion.div 
              className="w-5 bg-gray-700 border-4 border-gray-800 rounded-b-md"
              animate={character.isWalking ? { 
                rotate: [0, -40, 0, 40, 0],
                height: [28, 24, 28],
                originY: 0 
              } : character.isSitting ? { height: 12, y: -4 } : { rotate: 0, height: character.isGrounded ? 28 : 20 }}
              transition={character.isWalking ? { duration: 0.6, repeat: Infinity } : {}}
            />
          </div>
        </div>

        {/* 名字标签 */}
        <div 
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-gray-900/80 text-white px-3 py-1 rounded-full text-sm font-black z-20 border-2 border-white/20 shadow-lg"
        >
          {character.name}
        </div>
      </div>
    </motion.div>
  );
};

export { Character, CharacterComponent };