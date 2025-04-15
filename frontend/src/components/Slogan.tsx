import React from 'react';
import './Slogan.css';

interface SloganProps {
  text1: string;
  text2: string;
}

const Slogan: React.FC<SloganProps> = ({ text1, text2 }) => {
  return (
    <div className="slogan-container">
      <h1 className="slogan-text">{text1}</h1>
      <p className="slogan-subtext">{text2}</p>
    </div>
  );
};

export default Slogan;
