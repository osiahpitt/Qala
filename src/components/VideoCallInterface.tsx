'use client';

import React, { useState, useEffect, useRef } from 'react';

export const VideoCallInterface: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const floatingBoxRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Make floating box draggable - EXACT replica from original code
  useEffect(() => {
    const floatingBox = floatingBoxRef.current;
    const container = containerRef.current;
    if (!floatingBox || !container) {return;}

    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    function isDraggableTarget(target: Element) {
      if ((target as HTMLElement).classList.contains('translator-header')) {return true;}
      if (target === floatingBox) {return true;}
      if (target.parentElement === floatingBox && !(target as HTMLElement).classList.contains('translator-textarea')) {return true;}
      return false;
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!isDraggableTarget(e.target as Element)) {return;}
      isDragging = true;
      const rect = floatingBox.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      floatingBox.style.transition = 'none';
      e.preventDefault();
    };

    const handleMouseUp = () => {
      isDragging = false;
      floatingBox.style.transition = '';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) {return;}
      const containerRect = container.getBoundingClientRect();
      let left = e.clientX - containerRect.left - dragOffsetX;
      let top = e.clientY - containerRect.top - dragOffsetY;

      const maxLeft = container.clientWidth - floatingBox.offsetWidth;
      const maxTop = container.clientHeight - floatingBox.offsetHeight;
      left = Math.min(Math.max(0, left), maxLeft);
      top = Math.min(Math.max(0, top), maxTop);

      floatingBox.style.left = left + 'px';
      floatingBox.style.top = top + 'px';
    };

    floatingBox.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      floatingBox.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Language dropdown logic - EXACT replica from original
  useEffect(() => {
    const dropdown = document.querySelector('.language-dropdown');
    const btn = dropdown?.querySelector('.dropdown-btn') as HTMLButtonElement;
    const menu = dropdown?.querySelector('.dropdown-menu') as HTMLUListElement;
    const options = Array.from(menu?.querySelectorAll('li') || []);

    if (!btn || !menu) {return;}

    const handleBtnClick = () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      if (expanded) {
        menu.hidden = true;
      } else {
        menu.hidden = false;
        (options[0] as HTMLElement)?.focus();
      }
    };

    const handleOptionClick = (option: Element) => {
      options.forEach(o => o.setAttribute('aria-selected', 'false'));
      option.setAttribute('aria-selected', 'true');
      btn.textContent = `Language: ${option.textContent} ▾`;
      btn.setAttribute('aria-expanded', 'false');
      menu.hidden = true;
      btn.focus();
    };

    const handleOptionKeyDown = (e: KeyboardEvent, option: Element) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOptionClick(option);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = option.nextElementSibling || options[0];
        (next as HTMLElement)?.focus();
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = option.previousElementSibling || options[options.length - 1];
        (prev as HTMLElement)?.focus();
      }
      if (e.key === 'Escape') {
        btn.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
        btn.focus();
      }
    };

    const handleDocumentClick = (e: MouseEvent) => {
      if (!dropdown?.contains(e.target as Node)) {
        btn.setAttribute('aria-expanded', 'false');
        menu.hidden = true;
      }
    };

    btn.addEventListener('click', handleBtnClick);
    options.forEach(option => {
      option.addEventListener('click', () => handleOptionClick(option));
      option.addEventListener('keydown', (e) => handleOptionKeyDown(e, option));
    });
    document.addEventListener('click', handleDocumentClick);

    return () => {
      btn.removeEventListener('click', handleBtnClick);
      options.forEach(option => {
        option.removeEventListener('click', () => handleOptionClick(option));
        option.removeEventListener('keydown', (e) => handleOptionKeyDown(e, option));
      });
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  const handleChatToggle = () => {
    setIsChatOpen(!isChatOpen);
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      // Handle chat message submission
      setChatMessage('');
    }
  };

  return (
    <>
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;600;700&display=swap");

        * {
          box-sizing: border-box;
        }

        .video-call-body {
          margin: 0;
          padding: 0;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          background: url('/Bf3EhsQdUry_xFMpMxrbp.jpg') center center/cover no-repeat fixed;
          color: #eee;
          font-family: "Roboto", sans-serif;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 1rem;
          user-select: none;
          min-height: 100vh;
          min-width: 100vw;
        }

        .top-right-controls {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 1000;
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .dropdown {
          position: relative;
          user-select: none;
          outline: none;
          cursor: pointer;
        }

        .dropdown-btn {
          background-color: #f9b700;
          border: none;
          padding: 0.4rem 0.75rem;
          border-radius: 8px;
          font-weight: 600;
          color: black;
          box-shadow: 0 0 10px #f9b700cc;
          transition: background-color 0.25s ease;
          cursor: pointer;
        }

        .dropdown-btn:hover,
        .dropdown-btn:focus {
          background-color: #c7a100;
          color: white;
          outline: none;
        }

        .dropdown-menu {
          position: absolute;
          top: 110%;
          right: 0;
          background-color: #121212;
          border-radius: 8px;
          box-shadow: 0 0 15px #f9b700cc;
          list-style: none;
          padding: 0.25rem 0;
          margin: 0;
          min-width: 130px;
          z-index: 50;
        }

        .dropdown-menu[hidden] {
          display: none;
        }

        .dropdown-menu li {
          padding: 0.4rem 1rem;
          color: #eee;
          font-weight: 400;
          cursor: pointer;
          transition: background-color 0.2s;
          user-select: none;
        }

        .dropdown-menu li:hover,
        .dropdown-menu li:focus {
          background-color: #f9b700;
          color: black;
          outline: none;
        }

        .dropdown-menu li[aria-selected="true"] {
          font-weight: 700;
          background-color: #f9b700cc;
          color: black;
        }

        .profile-btn {
          background-color: transparent;
          border: 2px solid #f9b700;
          border-radius: 8px;
          color: #f9b700;
          font-weight: 600;
          padding: 0.4rem 1rem;
          cursor: pointer;
          transition: background-color 0.25s, color 0.25s;
        }

        .profile-btn:hover,
        .profile-btn:focus {
          background-color: #f9b700;
          color: black;
          outline: none;
        }

        /* Fullscreen stretch */
        @media (fullscreen), (fullscreen-active), (:-webkit-full-screen) {
          body, html, .app-container {
            height: 100vh;
            width: 100vw;
            max-width: 100vw;
            max-height: 100vh;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }
          .video-chat-container {
            height: 100vh;
          }
          .video-panels {
            height: 100vh;
            gap: 1.5vw;
          }
          .video-panel {
            min-height: 100vh;
            max-height: 100vh;
            flex: 1 1 0;
            max-width: none;
          }
          .chat-toggle-container {
            bottom: 1.5vw;
            right: 1.5vw;
          }
          .text-chat-panel {
            width: 20vw;
            max-height: 80vh;
          }
        }

        .app-container {
          max-width: 1200px;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .header-box {
          background-color: #121212;
          padding: 1rem 2rem;
          border-radius: 12px;
          box-shadow: 0 0 15px #f9b700aa;
          text-align: center;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .header-box h1 {
          font-weight: 300;
          font-size: 2rem;
          color: #f9b700;
          text-transform: uppercase;
          letter-spacing: 2px;
          text-shadow: 0 0 8px #f9b700cc;
          margin: 0;
        }

        .criteria-selection {
          position: relative;
          background-color: #1a1a1a;
          padding: 1.4rem 1.25rem 1rem 1.25rem;
          border-radius: 10px;
          box-shadow: 0 0 10px #f9b700b3;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .criteria-tab {
          position: absolute;
          top: -1.2rem;
          left: 1rem;
          background-color: #121212;
          color: #f9b700;
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          padding: 0.25rem 0.75rem;
          border-radius: 12px 12px 0 0;
          box-shadow: 0 0 12px #f9b700cc;
          user-select: none;
          cursor: default;
          white-space: nowrap;
          z-index: 20;
        }

        .criteria-selection form {
          width: 100%;
          max-width: 900px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 1rem 2rem;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          color: #eee;
        }

        .form-row label {
          margin-bottom: 0.4rem;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .form-row select {
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          border: none;
          font-size: 1rem;
          font-weight: 300;
          background-color: #222;
          color: #eee;
          box-shadow: inset 0 0 5px #f9b7008a;
          transition: box-shadow 0.3s ease;
        }

        .form-row select:focus {
          outline: none;
          box-shadow: 0 0 8px #f9b700ee;
        }

        .video-chat-container {
          background-color: #121212;
          border-radius: 12px;
          box-shadow: 0 0 15px #f9b7008a;
          padding: 1rem;
          position: relative;
          min-height: 75vh;
          height: 75vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .video-panels {
          display: flex;
          justify-content: center;
          gap: 2rem;
          width: 100%;
          height: 100%;
          flex-direction: row !important;
        }

        .video-panel {
          flex: 1 1 48%;
          min-width: 350px;
          max-width: 680px;
          min-height: 600px;
          max-height: 75vh;
          display: flex;
          flex-direction: column;
          background-color: #181818;
          border-radius: 14px;
          box-shadow: 0 0 8px #f9b700aa;
          position: relative;
          overflow: hidden;
        }

        .video-panel video {
          width: 100%;
          height: 100%;
          min-height: 320px;
          max-height: 70vh;
          object-fit: cover;
          border-radius: 14px 14px 0 0;
          background-color: black;
        }

        .left-floating-box {
          position: absolute;
          top: 10px;
          left: 10px;
          width: 280px;
          height: 330px;
          background-color: #181818;
          color: black;
          font-weight: 600;
          font-size: 1rem;
          border-radius: 12px;
          box-shadow: 0 0 15px #f9b700cc;
          cursor: move;
          user-select: auto;
          display: flex;
          flex-direction: column;
          z-index: 15;
          padding: 6px 8px;
        }

        .translator-header {
          font-weight: 700;
          font-size: 1.2rem;
          text-transform: none;
          color: #f9b700;
          border-bottom: 2px solid #f9b700;
          padding-bottom: 0.3rem;
          margin-bottom: 0.5rem;
          user-select: text;
          cursor: default;
        }

        .translator-textarea {
          flex: 1;
          resize: none;
          border: none;
          outline: none;
          background-color: #f0f0f0;
          font-family: "Roboto", sans-serif;
          font-weight: 300;
          font-size: 1rem;
          color: black;
          overflow-y: auto;
          padding: 0.3rem;
          user-select: text;
          border-radius: 6px;
        }

        .chat-toggle-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
        }

        #chat-toggle-btn {
          background: #f9b700;
          border: none;
          color: black;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          font-weight: 700;
          font-size: 1.1rem;
          box-shadow: 0 0 12px #f9b700cc;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        #chat-toggle-btn:hover {
          background-color: #c7a100;
          color: white;
        }

        .text-chat-panel {
          background-color: #1a1a1a;
          border-radius: 12px;
          width: 300px;
          max-height: 400px;
          box-shadow: 0 0 20px #f9b700bb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: "Roboto", sans-serif;
          color: #eee;
        }

        .hidden {
          display: none !important;
        }

        .chat-header {
          background-color: #f9b700;
          padding: 0.65rem 1rem;
          color: black;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h2 {
          font-weight: 400;
          font-size: 1.25rem;
        }

        #close-chat-btn {
          background: transparent;
          border: none;
          color: black;
          font-size: 1.75rem;
          line-height: 1;
          cursor: pointer;
          font-weight: 700;
        }

        .chat-messages {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          background: #121212;
          font-size: 0.9rem;
          user-select: text;
        }

        .chat-input-form {
          display: flex;
          border-top: 1px solid #f9b70066;
          background-color: #1e1e1e;
        }

        .chat-input-form input {
          flex-grow: 1;
          padding: 0.5rem 0.75rem;
          border: none;
          background-color: #121212;
          color: #eee;
          font-size: 1rem;
          border-radius: 0 0 0 12px;
          outline: none;
        }

        .chat-input-form button {
          background-color: #f9b700;
          border: none;
          color: black;
          padding: 0 1rem;
          border-radius: 0 0 12px 0;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.3s ease;
        }

        .chat-input-form button:hover {
          background-color: #c7a100;
          color: white;
        }
      `}</style>

      <div className="video-call-body">
        {/* Top-right controls - EXACT structure from original */}
        <div className="top-right-controls">
          <div className="dropdown language-dropdown" tabIndex={0}>
            <button
              className="dropdown-btn"
              aria-haspopup="listbox"
              aria-expanded="false"
              id="languageBtn"
            >
              Language: English ▾
            </button>
            <ul className="dropdown-menu" role="listbox" aria-labelledby="languageBtn" hidden>
              <li role="option" tabIndex={0} data-lang="en" aria-selected="true">English</li>
              <li role="option" tabIndex={0} data-lang="es">Spanish</li>
              <li role="option" tabIndex={0} data-lang="zh">Chinese</li>
              <li role="option" tabIndex={0} data-lang="ru">Russian</li>
              <li role="option" tabIndex={0} data-lang="fr">French</li>
            </ul>
          </div>
          <button className="profile-btn" type="button">Profile</button>
        </div>

        {/* Main app container */}
        <div className="app-container">
          {/* Header */}
          <header className="header-box">
            <h1>QALA Language Exchange</h1>
          </header>

          {/* Criteria selection - EXACT structure from original */}
          <section className="criteria-selection">
            <div className="criteria-tab">Preferred Language Partner</div>
            <form>
              <div className="form-row">
                <label htmlFor="native-language">Native Language</label>
                <select id="native-language" name="native-language" required defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>Chinese</option>
                  <option>Russian</option>
                  <option>French</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="target-language">Target Language</label>
                <select id="target-language" name="target-language" required defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>English</option>
                  <option>Spanish</option>
                  <option>Chinese</option>
                  <option>Russian</option>
                  <option>French</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="age">Age</label>
                <select id="age" name="age" defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>18-24</option>
                  <option>25-34</option>
                  <option>35-44</option>
                  <option>45-54</option>
                  <option>55+</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>Any</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="proficiency">Proficiency Level</label>
                <select id="proficiency" name="proficiency" defaultValue="">
                  <option value="" disabled>Select</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Native</option>
                </select>
              </div>
            </form>
          </section>

          {/* Video chat container */}
          <main className="video-chat-container">
            <div className="video-panels" data-layout="side-by-side">
              {/* User video panel - EXACT structure from original */}
              <div className="video-panel user-video" style={{position: 'relative'}} ref={containerRef}>
                <video autoPlay muted playsInline />
                <div className="left-floating-box" id="floating-box" tabIndex={0} ref={floatingBoxRef}>
                  <div className="translator-header">Translator</div>
                  <textarea className="translator-textarea" placeholder="Type here..." />
                </div>
              </div>
              {/* Partner video panel - EXACT structure from original */}
              <div className="video-panel partner-video">
                <video autoPlay playsInline />
              </div>
            </div>
          </main>
        </div>

        {/* Chat toggle - EXACT structure from original */}
        <div className="chat-toggle-container">
          <button id="chat-toggle-btn" onClick={handleChatToggle}>Chat</button>
          <aside className={`text-chat-panel ${isChatOpen ? '' : 'hidden'}`}>
            <header className="chat-header">
              <h2>Text Chat</h2>
              <button id="close-chat-btn" aria-label="Close chat" onClick={handleChatClose}>×</button>
            </header>
            <div className="chat-messages" aria-live="polite" />
            <form className="chat-input-form" onSubmit={handleChatSubmit}>
              <input type="text" placeholder="Type a message..." value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
              <button type="submit">Send</button>
            </form>
          </aside>
        </div>
      </div>
    </>
  );
};