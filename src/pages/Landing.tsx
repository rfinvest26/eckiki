import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface CatalogModel {
  id: string;
  name: string;
  age: number;
  city?: string;
  photos: string[];
  code: string;
  rating?: number;
  orders_count?: number;
  services?: string[];
}

const COUNTRY_CITIES: Record<string, string[]> = {
  ru: ['Москва', 'Санкт-Петербург', 'Казань', 'Сочи'],
  ua: ['Киев', 'Львов', 'Одесса', 'Харьков'],
  by: ['Минск', 'Гомель', 'Брест'],
  kz: ['Алматы', 'Астана', 'Шымкент'],
  uz: ['Ташкент', 'Самарканд', 'Бухара'],
  kg: ['Бишкек', 'Ош'],
  tj: ['Душанбе', 'Худжанд'],
  am: ['Ереван', 'Гюмри'],
  az: ['Баку', 'Гянджа'],
  md: ['Кишинёв', 'Бельцы'],
  ge: ['Тбилиси', 'Батуми'],
};

const cityForModel = (model: CatalogModel, country: string, index: number) => {
  if (model.city && model.city !== 'auto') return model.city;
  const cities = COUNTRY_CITIES[country] || COUNTRY_CITIES.ru;
  return cities[index % cities.length];
};

const Landing: React.FC = () => {
  const [code, setCode] = useState('');
  const [shake, setShake] = useState(false);
  const [catalog, setCatalog] = useState<CatalogModel[]>([]);
  const [country, setCountry] = useState('ru');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const normalizedCode = code.trim().toUpperCase();

  useEffect(() => {
    const ref = searchParams.get('ref');
    const countryParam = searchParams.get('country');
    const modelCode = searchParams.get('model');
    if (countryParam) {
      localStorage.setItem('escortCountry', countryParam);
      setCountry(countryParam);
    }
    if (ref) localStorage.setItem('refCode', ref);
    if (modelCode) navigate(`/model/${modelCode.trim().toUpperCase()}`);
  }, [navigate, searchParams]);

  useEffect(() => {
    const loadCatalog = async () => {
      const ref = searchParams.get('ref') || localStorage.getItem('refCode') || '';
      let nextCountry = searchParams.get('country') || localStorage.getItem('escortCountry') || 'ru';
      if (ref && !searchParams.get('country')) {
        const { data: worker } = await supabase
          .from('workers')
          .select('country')
          .eq('ref_code', ref)
          .maybeSingle();
        if (worker?.country) nextCountry = worker.country;
      }
      setCountry(nextCountry);
      localStorage.setItem('escortCountry', nextCountry);

      const { data } = await supabase
        .from('models')
        .select('id,name,age,city,photos,code,rating,orders_count,services')
        .eq('active', true)
        .eq('catalog_visible', true)
        .order('created_at', { ascending: false })
        .limit(24);
      setCatalog((data || []) as CatalogModel[]);
    };
    loadCatalog();
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = normalizedCode;
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
        <div className="landing-grid">
          <div className="landing-copy">
            <div className="age-badge">18+ PRIVATE ACCESS</div>
            <div className="hero-eyebrow">Private booking directory</div>
            <div className="brand-logo">
              <span className="brand-one">One</span>
              <span className="brand-night">Night</span>
            </div>
            <h1 className="hero-title">Войти по коду и сразу открыть нужную анкету</h1>
            <p className="brand-tagline">
              Никаких лишних шагов. Только быстрый вход, понятная карточка и лёгкий заказ.
            </p>

            <div className="hero-microproof">
              <div>
                <strong>1 действие</strong>
                <span>ввод кода и переход</span>
              </div>
              <div>
                <strong>Чисто</strong>
                <span>без лишних полей</span>
              </div>
              <div>
                <strong>Mobile first</strong>
                <span>удобно на любом экране</span>
              </div>
            </div>
          </div>

          <div className={`search-section ${shake ? 'is-shaking' : ''}`}>
            <div className="search-kicker">Код доступа</div>
            <h2 className="search-title">Поиск анкеты</h2>
            <p className="search-subtitle">
              Введите код модели, чтобы открыть приватную карточку. Формат прост: без регистрации и без лишних шагов.
            </p>

            <div className="code-preview" aria-live="polite">
              <span>Код</span>
              <strong>{normalizedCode || 'ON-XXXX'}</strong>
            </div>

            <form onSubmit={handleSubmit} className="search-form">
              <input
                id="model-code-input"
                type="text"
                placeholder="ON-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                inputMode="text"
                aria-label="Введите код модели"
                className="search-input"
              />
              <button id="find-model-btn" type="submit" className="search-btn">
                Открыть профиль
              </button>
            </form>

            <div className="search-hint">
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Безопасный вход
              </span>
              <span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                Моментальный переход
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2 className="section-title">Каталог</h2>
        <div className="catalog-grid">
          {catalog.map((model, index) => (
            <button
              type="button"
              key={model.id}
              className="catalog-card"
              onClick={() => navigate(`/model/${model.code}`)}
            >
              <img src={model.photos?.[0] || ''} alt={model.name} />
              <span className="catalog-fade" />
              <span className="catalog-meta">
                <b>{model.name}, {model.age}</b>
                <small>{cityForModel(model, country, index)} · {model.rating || 4.9} · {model.orders_count || 24} заказов</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} One Night. All rights reserved.</p>
        <p className="footer-disclaimer">Только для лиц старше 18 лет.</p>
      </footer>
    </div>
  );
};

export default Landing;
