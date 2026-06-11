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
}

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
  promoCodeInput: string;
  promoDiscount: number | null;
  orderComment: string;
  price: number;
}) => {
  const {
    model,
    selectedServices,
    orderDate,
    orderTime,
    orderDuration,
    orderLocation,
    promoCodeInput,
    promoDiscount,
    orderComment,
    price,
  } = params;
  const refCode = localStorage.getItem('refCode') || 'NONE';
  const sourceUrl = window.location.href;
  const payload = encodeOrderPayload({
    v: 2,
    modelCode: model.code,
    modelId: model.id,
    workerId: model.worker_id || null,
    refCode,
    modelName: model.name,
    age: model.age,
    city: model.city,
    height: model.height,
    weight: model.weight,
    services: selectedServices,
    date: orderDate,
    time: orderTime,
    duration: orderDuration,
    location: orderLocation,
    price: `$${price}`,
    promoCode: promoDiscount ? promoCodeInput.trim().toUpperCase() : '',
    promoDiscount: promoDiscount || 0,
    comment: orderComment.trim(),
    sourceUrl,
    photo: model.photos?.[0] || '',
  });

  const manualText = [
    `ESCORT_ORDER:${payload}`,
    '',
    `Модель: ${model.name} (${model.code})`,
    `Город: ${model.city}`,
    `Дата: ${orderDate}`,
    `Время: ${orderTime}`,
    `Формат: ${orderLocation}`,
    `Длительность: ${orderDuration}`,
    `Услуги: ${selectedServices.join(', ')}`,
    `Стоимость: $${price}`,
    promoDiscount ? `Промокод: ${promoCodeInput.trim().toUpperCase()} (${promoDiscount}%)` : '',
    orderComment.trim() ? `Комментарий: ${orderComment.trim()}` : '',
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
          <button className="carousel-btn prev" onClick={prev} aria-label="Предыдущее фото">&#10094;</button>
          <button className="carousel-btn next" onClick={next} aria-label="Следующее фото">&#10095;</button>
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
  const [orderComment, setOrderComment] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState<number | null>(null);
  const [promoMsg, setPromoMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'done' | 'error'>('idle');

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

  const handleOrderClick = () => {
    setShowOrderModal(true);
  };

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
    
    if (promoDiscount) {
      base = base - (base * promoDiscount / 100);
    }
    return base;
  };

  const handleCheckPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setIsCheckingPromo(true);
    setPromoMsg(null);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('discount')
        .eq('code', promoCodeInput.trim().toUpperCase())
        .single();
        
      if (error || !data) {
        setPromoMsg({ type: 'error', text: 'Промокод не найден или истёк' });
        setPromoDiscount(null);
      } else {
        setPromoMsg({ type: 'success', text: `Применена скидка ${data.discount}%` });
        setPromoDiscount(data.discount);
      }
    } catch {
      setPromoMsg({ type: 'error', text: 'Ошибка проверки' });
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleConfirmOrder = () => {
    if (!model || !orderDate || !orderTime || selectedServices.length === 0) return;
    setCopyState('idle');
    setShowTelegramPrep(true);
  };

  const handleCopyOrderText = async () => {
    if (!model) return;
    try {
      const handoff = buildTelegramHandoff({
        model,
        selectedServices,
        orderDate,
        orderTime,
        orderDuration,
        orderLocation,
        promoCodeInput,
        promoDiscount,
        orderComment,
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
      selectedServices,
      orderDate,
      orderTime,
      orderDuration,
      orderLocation,
      promoCodeInput,
      promoDiscount,
      orderComment,
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
        <button onClick={() => navigate('/')}>← На главную</button>
      </div>
    );
  }

  return (
    <div className="model-page">
      {/* Back Button */}
      <button 
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
      <PhotoCarousel
        photos={model.photos || []}
        name={model.name}
        age={model.age}
        city={model.city}
      />

      {/* Details */}
      <div className="model-details">
        {/* Stats chips */}
        <div className="stats-row">
          <div className="stat-chip">{model.height} см</div>
          <div className="stat-chip">{model.weight} кг</div>
          <div className="stat-chip">{model.age} лет</div>
          <div className="stat-chip">{model.code}</div>
        </div>

        {/* Description */}
        {model.description && (
          <p className="model-description">{model.description}</p>
        )}

        {/* Services */}
        <ServicesList services={model.services} />

        <div className="trust-panel">
          <div>
            <span>Response</span>
            <strong>24/7</strong>
          </div>
          <div>
            <span>Booking</span>
            <strong>Telegram</strong>
          </div>
          <div>
            <span>Profile</span>
            <strong>Verified</strong>
          </div>
        </div>
      </div>

      {/* Fixed CTA button */}
      <button
        id="order-button"
        className="order-btn"
        onClick={handleOrderClick}
      >
        Заказать
      </button>

      {/* Order Bottom Sheet */}
      {showOrderModal && (
        <div className="bottom-sheet-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            
            <div className="bottom-sheet-body">
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', marginTop: '0' }}>Оформление заказа</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Выберите удобное время и формат для <b style={{ color: '#fff' }}>{model.name}</b>
              </p>
              
              <div className="form-group-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Дата:</label>
                  <input 
                    type="date" 
                    value={orderDate} 
                    onChange={(e) => setOrderDate(e.target.value)} 
                    className="modal-input"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Время:</label>
                  <input 
                    type="time" 
                    value={orderTime} 
                    onChange={(e) => setOrderTime(e.target.value)} 
                    className="modal-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Длительность:</label>
                <div className="chips-container">
                  {['1 час', '2 часа', 'Ночь'].map(dur => (
                    <button 
                      key={dur}
                      className={`chip-btn ${orderDuration === dur ? 'active' : ''}`}
                      onClick={() => setOrderDuration(dur)}
                    >{dur}</button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Место (Формат):</label>
                <div className="chips-container">
                  {['Апартаменты', 'Выезд'].map(loc => (
                    <button 
                      key={loc}
                      className={`chip-btn ${orderLocation === loc ? 'active' : ''}`}
                      onClick={() => setOrderLocation(loc)}
                    >{loc}</button>
                  ))}
                </div>
              </div>

              {model.services && model.services.length > 0 && (
                <div className="form-group">
                  <label>Услуги (можно несколько):</label>
                  <div className="chips-container">
                    {model.services.map(s => (
                      <button 
                        key={s}
                        className={`chip-btn ${selectedServices.includes(s) ? 'active' : ''}`}
                        onClick={() => toggleService(s)}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Комментарий менеджеру:</label>
                <textarea
                  value={orderComment}
                  onChange={(e) => setOrderComment(e.target.value.slice(0, 300))}
                  className="modal-input modal-textarea"
                  placeholder="Например: нужна встреча в центре, напишите заранее..."
                />
              </div>

              <div className="promo-section-minimal">
                <div className="promo-header">
                  <h3>У вас есть промокод?</h3>
                  <p>Введите его ниже, чтобы получить скидку на заказ</p>
                </div>
                
                <div className="promo-input-group">
                  <input 
                    type="text" 
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Например, SALE20"
                    className="promo-input-minimal"
                    disabled={promoDiscount !== null}
                  />
                  {promoDiscount === null ? (
                    <button 
                      className="promo-apply-btn" 
                      onClick={handleCheckPromo}
                      disabled={!promoCodeInput.trim() || isCheckingPromo}
                    >
                      {isCheckingPromo ? 'Проверка...' : 'Применить промокод'}
                    </button>
                  ) : (
                    <button 
                      className="promo-applied-btn" 
                      disabled
                    >
                      Скидка успешно применена
                    </button>
                  )}
                </div>
                
                {promoMsg && (
                  <div className={`promo-status-msg ${promoMsg.type}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {promoMsg.type === 'success' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    )}
                    <span>{promoMsg.text}</span>
                  </div>
                )}
              </div>

              <div className="price-display" style={{ paddingBottom: '8px' }}>
                <span>Итоговая стоимость:</span>
                <strong>${getCalculatedPrice().toLocaleString('en-US')}</strong>
              </div>

              <div className="order-summary">
                <div><span>Модель</span><b>{model.name}, {model.age}</b></div>
                <div><span>Код</span><b>{model.code}</b></div>
                <div><span>Формат</span><b>{orderLocation}, {orderDuration}</b></div>
                <div><span>Услуги</span><b>{selectedServices.length ? selectedServices.join(', ') : 'Выберите услугу'}</b></div>
              </div>
            </div>

            <div className="bottom-sheet-footer">
              <button className="cancel-btn" onClick={() => setShowOrderModal(false)}>Назад</button>
              <button
                className="confirm-btn"
                onClick={handleConfirmOrder}
                disabled={!orderDate || !orderTime || selectedServices.length === 0}
              >
                Подтвердить в Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {showTelegramPrep && model && (
        <div className="bottom-sheet-overlay" onClick={() => setShowTelegramPrep(false)}>
          <div className="bottom-sheet-content" onClick={(e) => e.stopPropagation()}>
            <div className="bottom-sheet-handle"></div>
            <div className="bottom-sheet-body">
              <h2 style={{ fontSize: '1.35rem', marginBottom: '8px', marginTop: '0' }}>Переход в Telegram</h2>
              <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Скопируйте готовый текст. Если Telegram не отправит `/start` автоматически, просто вставьте этот текст в чат бота.
              </p>
              <textarea
                readOnly
                className="modal-input modal-textarea handoff-textarea"
                value={buildTelegramHandoff({
                  model,
                  selectedServices,
                  orderDate,
                  orderTime,
                  orderDuration,
                  orderLocation,
                  promoCodeInput,
                  promoDiscount,
                  orderComment,
                  price: getCalculatedPrice(),
                }).manualText}
              />
              {copyState === 'done' && <div className="handoff-status success">Текст скопирован</div>}
              {copyState === 'error' && <div className="handoff-status error">Не удалось скопировать автоматически</div>}
            </div>
            <div className="bottom-sheet-footer">
              <button className="cancel-btn" onClick={() => setShowTelegramPrep(false)}>Назад</button>
              <button className="promo-apply-btn" onClick={handleCopyOrderText}>Скопировать текст</button>
              <button className="confirm-btn" onClick={handleOpenTelegram}>Открыть Telegram</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelPage;
