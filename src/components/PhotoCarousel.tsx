import React, { useState } from 'react';

interface PhotoCarouselProps {
  photos: string[];
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div className="carousel-container" style={{ background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Нет фото</p>
      </div>
    );
  }

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  return (
    <div className="carousel-container">
      <img 
        src={photos[currentIndex]} 
        alt={`Photo ${currentIndex + 1}`} 
        className="carousel-image"
      />
      
      {photos.length > 1 && (
        <>
          <button className="carousel-btn prev" onClick={prevPhoto}>&#10094;</button>
          <button className="carousel-btn next" onClick={nextPhoto}>&#10095;</button>
          
          <div className="carousel-indicators">
            {photos.map((_, idx) => (
              <div 
                key={idx} 
                className={`indicator ${idx === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoCarousel;
