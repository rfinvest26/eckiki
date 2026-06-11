import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Model {
  id: string;
  worker_id?: number;
  name: string;
  age: number;
  city: string;
  height: number;
  weight: number;
  description: string;
  services: string[];
  photos: string[];
  code: string;
  rating?: number;
  orders_count?: number;
  funds_amount?: number;
  public_comments?: string[];
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

const getDisplayCity = (model: Model) => {
  if (model.city && model.city !== 'auto') return model.city;
  const country = localStorage.getItem('escortCountry') || 'ru';
  return (COUNTRY_CITIES[country] || COUNTRY_CITIES.ru)[0];
};

const encodeOrderPayload = (payload: Record<string, unknown>) => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const normalizePhotos = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value];
  }
  return [];
};

const buildTelegramHandoff = (params: {
  model: Model;
  selectedServices: string[];
  orderDate: string;
  orderTime: string;
  orderDuration: string;
  orderLocation: string;
  price: number;
}) => {
  const {
    model,
    selectedServices,
    orderDate,
    orderTime,
    orderDuration,
    orderLocation,
    price,
  } = params;
  const refCode = localStorage.getItem('refCode') || 'NONE';
  const sourceUrl = window.location.href;
  const displayCity = getDisplayCity(model);
  const payload = encodeOrderPayload({
    v: 2,
    modelCode: model.code,
    modelId: model.id,
    workerId: model.worker_id || null,
    refCode,
    modelName: model.name,
    age: model.age,
    city: displayCity,
    height: model.height,
    weight: model.weight,
    services: selectedServices,
    date: orderDate,
    time: orderTime,
    duration: orderDuration,
    location: orderLocation,
    price: `$${price}`,
    sourceUrl,
    photo: model.photos?.[0] || '',
  });

  const manualText = [
    `ESCORT_ORDER:${payload}`,
    '',
    `Модель: ${model.name} (${model.code})`,
    `Город: ${displayCity}`,
    `Дата: ${orderDate}`,
    `Время: ${orderTime}`,
    `Формат: ${orderLocation}`,
    `Длительность: ${orderDuration}`,
    `Услуги: ${selectedServices.join(', ')}`,
    `Стоимость: $${price}`,
  ].filter(Boolean).join('\n');

  return {
    payload,
    manualText,
  };
};

// ─── Photo carousel ────────────────────────────────────────────────
const PhotoCarousel: React.FC<{
  photos: string[];
  name: string;
  age: number;
  city: string;
}> = ({ photos, name, age, city }) => {
  const [idx, setIdx] = useState(0);
  const safePhotos = normalizePhotos(photos);

  useEffect(() => {
    if (idx > safePhotos.length - 1) {
      setIdx(0);
    }
  }, [idx, safePhotos.length]);

  if (safePhotos.length === 0) {
    return (
      <div className="no-photo-placeholder">
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Нет фото
        </span>
      </div>
    );
  }

  const prev = () => setIdx((i) => (i === 0 ? safePhotos.length - 1 : i - 1));
  const next = () => setIdx((i) => (i === safePhotos.length - 1 ? 0 : i + 1));

  return (
    <div className="carousel-shell">
    <div className="carousel-wrapper">
      <img
        src={safePhotos[idx]}
        alt={`${name} фото ${idx + 1}`}
        className="carousel-image"
        draggable={false}
      />

      {/* Overlay: name + city */}
      <div className="carousel-overlay">
        <h1>{name}, {age}</h1>
        <p className="city-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {city}
        </p>
      </div>

      {/* Nav arrows */}
      {safePhotos.length > 1 && (
        <>
          <button type="button" className="carousel-btn prev" onClick={prev} aria-label="Предыдущее фото">&#10094;</button>
          <button type="button" className="carousel-btn next" onClick={next} aria-label="Следующее фото">&#10095;</button>
          <div className="carousel-indicators">
            {safePhotos.map((_, i) => (
              <div
                key={i}
                className={`indicator ${i === idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
        {safePhotos.length > 1 && (
          <div className="photo-strip">
            {safePhotos.map((photo, i) => (
              <button
                key={`${photo}-${i}`}
                type="button"
                className={`photo-thumb ${i === idx ? 'active' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`Фото ${i + 1}`}
              >
                <img src={photo} alt={`${name} миниатюра ${i + 1}`} />
              </button>
            ))}
          </div>
        )}
    <div className="photo-strip-meta">
      <span>Фото модели</span>
      <strong>{safePhotos.length}</strong>
    </div>
    </div>
  );
};

// ─── Services list ─────────────────────────────────────────────────
const ServicesList: React.FC<{ services: string[] }> = ({ services }) => {
  if (!services || services.length === 0) return null;
  return (
    <div className="services-section">
      <div className="services-title">Услуги</div>
      <div className="services-list">
        {services.map((s) => (
          <span key={s} className="service-tag">{s}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Main page ─────────────────────────────────────────────────────
const ModelPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showTelegramPrep, setShowTelegramPrep] = useState(false);
  const [orderDate, setOrderDate] = useState('');
  const [orderTime, setOrderTime] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [orderDuration, setOrderDuration] = useState('1 час');
  const [orderLocation, setOrderLocation] = useState('Апартаменты');
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');
  const isAnySheetOpen = showOrderModal || showTelegramPrep;
  const displayCity = model ? getDisplayCity(model) : '';

  useEffect(() => {
    if (!code) return;
    const fetchModel = async () => {
      try {
        const { data, error: dbErr } = await supabase
          .from('models')
          .select('*')
          .eq('code', code.toUpperCase())
          .single();
        if (dbErr) throw dbErr;
        setModel(data as Model);
        if (data.services && data.services.length > 0) {
          setSelectedServices([data.services[0]]);
        }
      } catch {
        setError('Анкета не найдена или была удалена.');
      } finally {
        setLoading(false);
      }
    };
    fetchModel();
  }, [code]);

  useEffect(() => {
    if (!isAnySheetOpen) return;

    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('order-sheet-open');

    return () => {
      document.body.classList.remove('order-sheet-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, [isAnySheetOpen]);

  const handleOrderClick = () => {
    setShowOrderModal(true);
  };

  const serviceChoices = model?.services?.filter(Boolean).slice(0, 6) || [];
  const orderServices = selectedServices.length > 0
    ? selectedServices
    : serviceChoices.length === 0
      ? ['Базовый заказ']
      : [];
  const canConfirmOrder = Boolean(model && orderDate && orderTime && orderServices.length > 0);

  const toggleService = (s: string) => {
    setSelectedServices(prev => 
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  // Price calculation
  const getCalculatedPrice = () => {
    let base = 0;
    if (orderDuration === '1 час') base = 200;
    else if (orderDuration === '2 часа') base = 350;
    else if (orderDuration === 'Ночь') base = 700;
    
    if (orderLocation === 'Выезд') base += 50;
    return base;
  };

  const handleConfirmOrder = () => {
    if (!canConfirmOrder) return;
    setCopyState('idle');
    setShowTelegramPrep(true);
  };

  const handleCopyOrderText = async () => {
    if (!model) return;
    try {
      const handoff = buildTelegramHandoff({
        model,
        selectedServices: orderServices,
        orderDate,
        orderTime,
        orderDuration,
        orderLocation,
        price: getCalculatedPrice(),
      });
      await navigator.clipboard.writeText(handoff.manualText);
      setCopyState('done');
    } catch {
      setCopyState('error');
    }
  };

  const handleOpenTelegram = () => {
    if (!model) return;
    const botUsername = process.env.REACT_APP_ESCORT_BOT_USERNAME || 'onenightoriginal_bot';
    const handoff = buildTelegramHandoff({
      model,
      selectedServices: orderServices,
      orderDate,
      orderTime,
      orderDuration,
      orderLocation,
      price: getCalculatedPrice(),
    });
    window.location.href = `https://t.me/${botUsername}?start=order2_${handoff.payload}`;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Загрузка анкеты...</span>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="error-screen">
        <p>{error || 'Анкета не найдена'}</p>
        <button type="button" onClick={() => navigate('/')}>← На главную</button>
      </div>
    );
  }

  return (
    <div className="model-page">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate('/')}
        className="model-back-btn"
        aria-label="Назад"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
      </button>

      {/* Edge-to-edge photo carousel 70vh */}
      <div className="model-layout">
        <PhotoCarousel
          photos={model.photos || []}
          name={model.name}
          age={model.age}
          city={displayCity}
        />

        <div className="model-details">
          <div className="model-header-card">
            <div className="model-header-copy">
              <div className="model-kicker">Private profile</div>
              <h2>{model.name}, {model.age}</h2>
              <p>Короткая карточка без лишних шагов: всё главное видно сразу, заказ оформляется в несколько касаний.</p>
            </div>
            <div className="model-code-badge">{model.code}</div>
          </div>

          <div className="stats-row">
            <div className="stat-chip">{model.height} см</div>
            <div className="stat-chip">{model.weight} кг</div>
            <div className="stat-chip">{displayCity}</div>
            <div className="stat-chip">★ {model.rating || 4.9}</div>
            <div className="stat-chip">{model.orders_count || 24} заказов</div>
            <div className="stat-chip">{model.funds_amount || 0} средств</div>
          </div>

          {model.description && (
            <p className="model-description">{model.description}</p>
          )}

          <ServicesList services={model.services} />

          {model.public_comments && model.public_comments.length > 0 && (
            <div className="model-comments">
              <div className="services-title">Комментарии</div>
              {model.public_comments.slice(0, 3).map((comment, index) => (
                <p key={`${comment}-${index}`}>{comment}</p>
              ))}
            </div>
          )}

          <div className="trust-panel">
            <div>
              <span>Ответ</span>
              <strong>24/7</strong>
            </div>
            <div>
              <span>Форма</span>
              <strong>2 шага</strong>
            </div>
            <div>
              <span>Фокус</span>
              <strong>Mobile first</strong>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        id="order-button"
        className="order-btn"
        onClick={handleOrderClick}
      >
        Заказать встречу
      </button>

      {/* Order Bottom Sheet */}
      {showOrderModal && (
        <div className="bottom-sheet-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="bottom-sheet-content order-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            
            <div className="bottom-sheet-body">
              <div className="sheet-intro">
                <div className="sheet-kicker">Step 1</div>
                <h2>Быстрый заказ</h2>
                <p>Выберите только нужное: время, формат и услугу. Остальное уже собрано.</p>
              </div>

              <div className="order-mini-summary">
                <div>
                  <span>Модель</span>
                  <strong>{model.name}</strong>
                </div>
                <div>
                  <span>Стоимость</span>
                  <strong>${getCalculatedPrice().toLocaleString('en-US')}</strong>
                </div>
              </div>
              
              <div className="form-group-row">
                <div className="form-group">
                  <label>Дата</label>
                  <input 
                    type="date" 
                    value={orderDate} 
                    onChange={(e) => setOrderDate(e.target.value)} 
                    className="modal-input"
                  />
                </div>
                <div className="form-group">
                  <label>Время</label>
                  <input 
                    type="time" 
                    value={orderTime} 
                    onChange={(e) => setOrderTime(e.target.value)} 
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Длительность</label>
                <div className="chips-container">
                  {['1 час', '2 часа', 'Ночь'].map(dur => (
                    <button 
                      type="button"
                      key={dur}
                      className={`chip-btn ${orderDuration === dur ? 'active' : ''}`}
                      onClick={() => setOrderDuration(dur)}
                    >{dur}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Место</label>
                <div className="chips-container">
                  {['Апартаменты', 'Выезд'].map(loc => (
                    <button 
                      type="button"
                      key={loc}
                      className={`chip-btn ${orderLocation === loc ? 'active' : ''}`}
                      onClick={() => setOrderLocation(loc)}
                    >{loc}</button>
                  ))}
                </div>
              </div>

              {model.services && model.services.length > 0 && (
                <div className="form-group">
                  <div className="field-head">
                    <label>Услуги</label>
                    <span>{selectedServices.length ? `${selectedServices.length} выбрано` : '1 или несколько'}</span>
                  </div>
                  <div className="chips-container service-scroll">
                    {serviceChoices.map((s) => (
                      <button 
                        type="button"
                        key={s}
                        className={`chip-btn ${selectedServices.includes(s) ? 'active' : ''}`}
                        onClick={() => toggleService(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="sheet-note">Можно выбрать несколько услуг, но для быстрого заказа достаточно одной.</p>
                </div>
              )}

              {serviceChoices.length === 0 && (
                <div className="form-group">
                  <label>Услуги</label>
                  <div className="order-service-empty">Базовый заказ без лишнего выбора</div>
                </div>
              )}

              <div className="order-summary">
                <div><span>Модель</span><b>{model.name}</b></div>
                <div><span>Время</span><b>{orderDate || 'Дата'} · {orderTime || 'Время'}</b></div>
                <div><span>Город</span><b>{displayCity}</b></div>
                <div><span>Формат</span><b>{orderLocation}</b></div>
                <div><span>Услуги</span><b>{orderServices.length ? orderServices.join(', ') : 'Выберите услугу'}</b></div>
                <div><span>Стоимость</span><b>${getCalculatedPrice().toLocaleString('en-US')}</b></div>
              </div>
            </div>

            <div className="bottom-sheet-footer">
              <button type="button" className="cancel-btn" onClick={() => setShowOrderModal(false)}>Назад</button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleConfirmOrder}
                disabled={!canConfirmOrder}
              >
                Подтвердить в Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {showTelegramPrep && model && (
        <div className="bottom-sheet-overlay" onClick={() => setShowTelegramPrep(false)}>
          <div className="bottom-sheet-content telegram-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <div className="bottom-sheet-body">
              <div className="sheet-intro">
                <div className="sheet-kicker">Step 2</div>
                <h2>Переход в Telegram</h2>
                <p>Откройте Telegram или скопируйте короткий текст заказа вручную.</p>
              </div>
              <textarea
                readOnly
                className="modal-input modal-textarea handoff-textarea"
                value={buildTelegramHandoff({
                  model,
                  selectedServices: orderServices,
                  orderDate,
                  orderTime,
                  orderDuration,
                  orderLocation,
                  price: getCalculatedPrice(),
                }).manualText}
              />
              {copyState === 'done' && <div className="handoff-status success">Текст скопирован</div>}
              {copyState === 'error' && <div className="handoff-status error">Не удалось скопировать автоматически</div>}
            </div>
            <div className="bottom-sheet-footer">
              <button type="button" className="cancel-btn" onClick={() => setShowTelegramPrep(false)}>Назад</button>
              <button type="button" className="promo-apply-btn" onClick={handleCopyOrderText}>Скопировать текст</button>
              <button type="button" className="confirm-btn" onClick={handleOpenTelegram}>Открыть Telegram</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPage;
