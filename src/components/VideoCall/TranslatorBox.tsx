'use client';

import React, { useState, useRef, useEffect } from 'react';

export const TranslatorBox: React.FC = () => {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const boxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !boxRef.current || !containerRef.current) {return;}

      const containerRect = containerRef.current.getBoundingClientRect();
      const boxRect = boxRef.current.getBoundingClientRect();

      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;

      // Constrain to container bounds
      const maxX = containerRect.width - boxRect.width;
      const maxY = containerRect.height - boxRect.height;

      newX = Math.min(Math.max(0, newX), maxX);
      newY = Math.min(Math.max(0, newY), maxY);

      setPosition({ x: newX, y: newY });
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow dragging from the header or the box itself (not the textarea)
    const target = e.target as HTMLElement;
    if (target.classList.contains('translator-textarea')) {
      return;
    }

    if (!boxRef.current) {return;}

    const boxRect = boxRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - boxRect.left,
      y: e.clientY - boxRect.top,
    });
    setIsDragging(true);
    e.preventDefault();
  };

  const handleTranslate = async () => {
    if (!text.trim()) {return;}

    // This would integrate with Google Translate API
    // For now, just placeholder functionality
    console.log('Translating:', text);

    // TODO: Implement Google Translate API integration
    // const translation = await translateText(text, targetLanguage);
    // setText(translation);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  return (
    <div
      ref={boxRef}
      className="left-floating-box"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transition: isDragging ? 'none' : 'all 0.2s ease',
      }}
      tabIndex={0}
      onMouseDown={handleMouseDown}
    >
      <div className="translator-header">
        Translator
      </div>
      <textarea
        className="translator-textarea"
        placeholder="Type here to translate..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when typing
      />

      {text.trim() && (
        <div className="translator-actions">
          <button
            onClick={handleTranslate}
            className="translate-btn"
            title="Translate (Ctrl+Enter)"
          >
            Translate
          </button>
          <button
            onClick={() => setText('')}
            className="clear-btn"
            title="Clear text"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};