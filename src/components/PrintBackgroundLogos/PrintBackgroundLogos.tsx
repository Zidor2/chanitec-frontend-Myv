import React from 'react';
import logo512 from '../../assets/logo512.png';
import CHANitec from '../../assets/CHANitec.png';
import './PrintBackgroundLogos.scss';

const PrintBackgroundLogos: React.FC = () => (
  <>
    <img src={logo512} alt="" className="print-background-logo" aria-hidden="true" />
    <img src={CHANitec} alt="" className="print-background-logo-second" aria-hidden="true" />
  </>
);

export default PrintBackgroundLogos;
