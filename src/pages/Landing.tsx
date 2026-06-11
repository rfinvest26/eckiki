import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Landing: React.FC = () => {
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) localStorage.setItem('refCode', ref);
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    navigate(`/model/${trimmed}`);
  };

  return (
    <div className="landing-page">
      <div className="ambient-orb orb-one" />
      <div className="ambient-orb orb-two" />
      <div className="landing-hero">
        <div className="age-badge">18+ PRIVATE ACCESS</div>
        <div className="brand-logo">
          <span className="brand-one">One</span><span className="brand-night">Night</span>
        </div>
        <p className="brand-tagline">Curated private introductions</p>

        <div className="search-section" style={{ animation: shake ? 'shake 0.4s ease' : undefined }}>
          <h1 className="search-title">Поиск анкеты</h1>
          <p className="search-subtitle">
            Введите код модели, чтобы открыть приватную карточку с фото, услугами, параметрами и быстрым бронированием.
          </p>
          
          <form onSubmit={handleSubmit} className="search-form">
            <input
              id="model-code-input"
              type="text"
              placeholder="ON-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="search-input"
            />
            <button id="find-model-btn" type="submit" className="search-btn">
              Открыть приватный профиль
            </button>
          </form>
          
          <div className="search-hint">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Безопасный поиск
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
              Мгновенная бронь
            </span>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Сервис без лишних шагов</h2>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-kicker">01</span>
            <h3>Проверенные анкеты</h3>
            <p>Карточки с фото, параметрами и доступными услугами без ручного поиска.</p>
          </div>
          <div className="feature-card">
            <span className="feature-kicker">02</span>
            <h3>Приватный переход</h3>
            <p>Заявка уходит напрямую менеджеру в Telegram с полным контекстом заказа.</p>
          </div>
          <div className="feature-card">
            <span className="feature-kicker">03</span>
            <h3>Быстрое подтверждение</h3>
            <p>Вы выбираете время, формат и услуги; менеджер видит всё сразу.</p>
          </div>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} One Night. All rights reserved.</p>
        <p className="footer-disclaimer">Только для лиц старше 18 лет.</p>
      </footer>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-8px); }
          40%       { transform: translateX(8px); }
          60%       { transform: translateX(-6px); }
          80%       { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
