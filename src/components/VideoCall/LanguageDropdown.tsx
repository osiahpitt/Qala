'use client';

import React, { useState, useEffect, useRef } from 'react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'fr', name: 'French' },
];

export const LanguageDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent, action?: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action?.();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = languages.findIndex(lang => lang.code === selectedLanguage.code);
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % languages.length
        : (currentIndex - 1 + languages.length) % languages.length;
      setSelectedLanguage(languages[nextIndex]);
    }
  };

  const selectLanguage = (language: typeof languages[0]) => {
    setSelectedLanguage(language);
    setIsOpen(false);
  };

  return (
    <div className="dropdown language-dropdown" tabIndex={0} ref={dropdownRef}>
      <button
        className="dropdown-btn"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
      >
        Language: {selectedLanguage.name} ▾
      </button>

      <ul
        className="dropdown-menu"
        role="listbox"
        hidden={!isOpen}
        aria-labelledby="languageBtn"
      >
        {languages.map((language) => (
          <li
            key={language.code}
            role="option"
            tabIndex={0}
            data-lang={language.code}
            aria-selected={language.code === selectedLanguage.code}
            onClick={() => selectLanguage(language)}
            onKeyDown={(e) => handleKeyDown(e, () => selectLanguage(language))}
          >
            {language.name}
          </li>
        ))}
      </ul>
    </div>
  );
};