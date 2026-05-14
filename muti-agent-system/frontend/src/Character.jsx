import React, { useState } from 'react';
import { motion } from 'framer-motion';

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

const clothingColorOptions = [
  '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2', 
  '#073B4C', '#EF476F', '#FF9F1C', '#8AC926', '#1982C4',
  '#6A4C93', '#FF595E', '#8AC926', '#1982C4', '#6A4C93',
  '#FFCA3A', '#52B69A', '#34A0A4', '#168AAD', '#1A759F'
];

class Character {
  constructor(name, color, x, y, clothingColorIndex = 0) {
    this.name = name;
    this.color = color;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.speed = 2.5 * 1.5;
    this.jumpForce = -12 * 1.5;
    this.gravity = 0.4;
    this.groundLevel = y;
    this.isGrounded = true;
    this.isSpeaking = false;
    this.message = '';
    this.width = 80 * 1.5;
    this.height = 160 * 1.5;
    
    this.facing = 'right';
    this.isWalking = false;
    this.isJumping = false;
    this.isWaving = false;
    this.waveTimer = 0;
    this.bubbleY = -140;
    
    const nameHash = hashString(name);
    this.zIndexOffset = (nameHash % 100) / 10;
    
    this.style = {
      hairType: nameHash % 3,
      clothingColor: clothingColorOptions[clothingColorIndex % clothingColorOptions.length],
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
    this.waveTimer = 0;
    this.isSpeaking = false;
    this.message = '';
    this.facing = 'right';
    if (this.speakTimeout) clearTimeout(this.speakTimeout);
  }

  move(direction) {
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
    if (this.isGrounded) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.isJumping = true;
    }
  }

  wave() {
    this.isWaving = true;
    this.waveTimer = 2000;
  }

  update(otherCharacters = []) {

    if (this.isWaving && this.waveTimer > 0) {
      this.waveTimer -= 16;
      if (this.waveTimer <= 0) {
        this.isWaving = false;
        this.waveTimer = 0;
      }
    }

    if (!this.isGrounded) {
      this.vy += this.gravity;
    }

    if (this.y >= this.groundLevel) {
      this.y = this.groundLevel;
      this.vy = 0;
      this.isGrounded = true;
      this.isJumping = false;
    }

    let nextX = this.x + this.vx;
    let nextY = this.y + this.vy;

    const currentWorldWidth = this.worldWidth || 5000;
    nextX = Math.max(0, Math.min(currentWorldWidth - this.width, nextX));

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
    let cleanText = text.replace(/\([^)]*\)/g, '').replace(/^[^：:]*[：:]\s*/, '').trim();
    
    if (!cleanText) cleanText = text;

    if (cleanText.length > 60) {
      cleanText = cleanText.substring(0, 57) + '...';
    }

    this.isSpeaking = true;
    this.message = cleanText;
    this.vx = 0;
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

const CharacterComponent = ({ character, onClick }) => {
  const scaleY = character.vy < 0 ? 1.2 : (character.vy > 0 ? 0.9 : 1);
  const scale = 1.5;
  
  const renderHair = () => {
    switch(character.style.hairType) {
      case 1:
        return <div style={{ position: 'absolute', top: -8*scale, left: -4*scale, right: -4*scale, height: 24*scale, backgroundColor: '#1f2937', borderRadius: '0.5rem 0.5rem 0 0', zIndex: 0 }} />;
      case 2:
        return <div style={{ position: 'absolute', top: -16*scale, left: -8*scale, right: -8*scale, height: 32*scale, backgroundColor: '#1f2937', borderRadius: '9999px', zIndex: 0 }} />;
      default:
        return <div style={{ position: 'absolute', top: -8*scale, left: 0, right: 0, height: 12*scale, backgroundColor: '#1f2937', borderRadius: '0.125rem 0.125rem 0 0', zIndex: 0 }} />;
    }
  };

  const getRightArmRotate = () => {
    if (character.isWaving && character.waveTimer > 0) {
      const timeLeft = character.waveTimer;
      const wavePhase = (2000 - timeLeft) / 1000 * Math.PI * 2;
      return Math.sin(wavePhase) * 35 - 40;
    }
    return -10;
  };

  return (
    <motion.div
      className="absolute cursor-pointer flex flex-col items-center"
      animate={{ 
        x: character.x, 
        y: character.y - 140 * scale,
        scaleY: scaleY
      }}
      transition={{ 
        x: { type: 'tween', duration: 0.01 },
        y: { type: 'tween', duration: 0.01 },
        scaleY: { type: 'spring', damping: 10, stiffness: 200 }
      }}
      style={{ 
        zIndex: Math.floor(character.y + (character.zIndexOffset || 0)),
        width: `${80 * scale}px`, 
        height: `${140 * scale}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
      onClick={onClick}
    >
      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {character.isSpeaking && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            style={{ 
            position: 'absolute',
            zIndex: 50,
            pointerEvents: 'none',
            bottom: 200*scale,
            left: `calc(50% - 90px)`
          }}
          >
            <div style={{
              position: 'relative',
              backgroundColor: 'white',
              color: '#1f2937',
              padding: 12*scale,
              borderRadius: 16*scale,
              border: `${4*scale}px solid #1f2937`,
              boxShadow: `${4*scale}px ${4*scale}px 0px 0px rgba(0,0,0,1)`,
              minWidth: 120*scale,
              maxWidth: 240*scale
            }}>
              <p style={{ 
                fontSize: 14*scale, 
                fontWeight: 900, 
                lineHeight: 1.25, 
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                textAlign: 'center'
              }}>
                {character.message}
              </p>
              <div 
                style={{
                  position: 'absolute',
                  bottom: -16*scale,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: `${10*scale}px solid transparent`,
                  borderRight: `${10*scale}px solid transparent`,
                  borderTop: `${10*scale}px solid #1f2937`
                }}
              ></div>
            </div>
          </motion.div>
        )}
        <div 
          style={{ 
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'transform 0.3s',
            transform: character.facing === 'left' ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transformStyle: 'preserve-3d'
          }}
        >
          <div style={{ position: 'relative', width: 56*scale, height: 56*scale, zIndex: 10 }}>
            {renderHair()}
            <div 
              style={{
                width: '100%',
                height: '100%',
                border: `${4*scale}px solid #1f2937`,
                backgroundColor: '#ffdbac',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                borderRadius: '12% 12% 15% 15%'
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-around',
                padding: `0 ${8*scale}px`,
                transform: 'translateY(-50%)'
              }}>
                <div style={{ width: 10*scale, height: 10*scale, backgroundColor: '#1f2937', borderRadius: '9999px' }} />
                <div style={{ width: 10*scale, height: 10*scale, backgroundColor: '#1f2937', borderRadius: '9999px' }} />
              </div>
              <div style={{ position: 'absolute', top: 32*scale, left: 4*scale, width: 8*scale, height: 4*scale, backgroundColor: 'rgba(252, 165, 165, 0.5)', borderRadius: '9999px' }} />
              <div style={{ position: 'absolute', top: 32*scale, right: 4*scale, width: 8*scale, height: 4*scale, backgroundColor: 'rgba(252, 165, 165, 0.5)', borderRadius: '9999px' }} />
            </div>
          </div>
          
          <div 
              style={{ 
                width: 48*scale,
                height: 50*scale,
                border: `${4*scale}px solid #1f2937`,
                marginTop: -4*scale,
                position: 'relative',
                zIndex: 0,
                backgroundColor: character.style.clothingColor,
                borderRadius: `${4*scale}px ${4*scale}px ${8*scale}px ${8*scale}px`
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 16*scale,
                height: 8*scale,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0 0 9999px 9999px'
              }} />
              
              <motion.div 
                style={{
                  position: 'absolute',
                  right: -12*scale,
                  top: 8*scale,
                  width: 16*scale,
                  height: 40*scale,
                  border: `${4*scale}px solid #1f2937`,
                  borderRadius: '9999px',
                  backgroundColor: character.style.clothingColor,
                  transformOrigin: 'top center'
                }}
                animate={{ 
                  rotate: getRightArmRotate()
                }}
                transition={{ 
                  duration: character.isWaving ? 1.5 : 0.3, 
                  repeat: character.isWaving ? Infinity : 0
                }}
              />
              <motion.div 
                style={{
                  position: 'absolute',
                  left: -12*scale,
                  top: 8*scale,
                  width: 16*scale,
                  height: 40*scale,
                  border: `${4*scale}px solid #1f2937`,
                  borderRadius: '9999px',
                  backgroundColor: character.style.clothingColor,
                  transformOrigin: 'top center'
                }}
                animate={{ 
                  rotate: 10
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 4*scale, marginTop: -4*scale }}>
              <motion.div 
                style={{
                  width: 20*scale,
                  height: 28*scale,
                  backgroundColor: '#374151',
                  border: `${4*scale}px solid #1f2937`,
                  borderRadius: `0 0 ${6*scale}px ${6*scale}px`
                }}
                animate={{ 
                  rotate: character.isWalking ? [0, 40, 0, -40, 0] : 0,
                  height: character.isWalking ? [28*scale, 24*scale, 28*scale] : 28*scale,
                  originY: 0 
                }}
                transition={{ duration: character.isWalking ? 0.6 : 0.3, repeat: character.isWalking ? Infinity : 0 }}
              />
              <motion.div 
                style={{
                  width: 20*scale,
                  height: 28*scale,
                  backgroundColor: '#374151',
                  border: `${4*scale}px solid #1f2937`,
                  borderRadius: `0 0 ${6*scale}px ${6*scale}px`
                }}
                animate={{ 
                  rotate: character.isWalking ? [0, -40, 0, 40, 0] : 0,
                  height: character.isWalking ? [28*scale, 24*scale, 28*scale] : 28*scale,
                  originY: 0 
                }}
                transition={{ duration: character.isWalking ? 0.6 : 0.3, repeat: character.isWalking ? Infinity : 0 }}
              />
            </div>
            
            <motion.div 
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '9999px',
                backgroundColor: 'black',
                filter: 'blur(2px)'
              }}
              animate={{
                width: 48*scale,
                height: 3*scale,
                opacity: 0.2
              }}
            />
        </div>

        <div 
          style={{
            position: 'absolute',
            top: -48*scale,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            backgroundColor: 'rgba(17, 24, 39, 0.8)',
            color: 'white',
            padding: `${4*scale}px ${12*scale}px`,
            borderRadius: '9999px',
            fontSize: 14*scale,
            fontWeight: 900,
            zIndex: 20,
            border: `${2*scale}px solid rgba(255,255,255,0.2)`,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {character.name}
        </div>
      </div>
    </motion.div>
  );
};

export { Character, CharacterComponent };
