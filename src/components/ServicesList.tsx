import React from 'react';

interface ServicesListProps {
  services: string[];
}

const ServicesList: React.FC<ServicesListProps> = ({ services }) => {
  if (!services || services.length === 0) {
    return null;
  }

  return (
    <div className="services-container">
      <h3 className="services-title">Предоставляемые услуги</h3>
      <div className="services-list">
        {services.map((service, index) => (
          <span key={index} className="service-tag">
            {service}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ServicesList;
