// React Components for Builder.io Integration
// These can be registered as custom components in Builder.io

import React from 'react';
import { Builder } from '@builder.io/react';

/**
 * Generator Card Component - Editable in Builder.io
 */
export const GeneratorCard = (props) => {
  const { 
    label = 'EBOSS-125-001',
    kw = 100,
    photoUrl,
    project = 'Phase 1',
    backgroundColor = '#f8f9fa',
    borderColor = '#dee2e6',
    showPhoto = true,
    capacityColor = '#27ae60'
  } = props;

  return (
    <div 
      className="asset-card-builder"
      style={{
        backgroundColor,
        border: `2px solid ${borderColor}`,
        borderRadius: '8px',
        padding: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'Roboto, sans-serif'
      }}
    >
      {showPhoto && photoUrl && (
        <img 
          src={photoUrl} 
          alt={label}
          style={{
            width: '60px',
            height: '60px',
            objectFit: 'cover',
            borderRadius: '8px'
          }}
        />
      )}
      
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontWeight: 600, 
          fontSize: '16px',
          color: '#2c3e50',
          marginBottom: '4px'
        }}>
          {label}
        </div>
        
        <div style={{ 
          fontSize: '14px',
          color: '#6c757d',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span 
            className="capacity-dot"
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: capacityColor,
              display: 'inline-block'
            }}
          />
          {kw} kW
        </div>
        
        {project && (
          <div style={{ 
            fontSize: '12px',
            color: '#adb5bd',
            marginTop: '4px'
          }}>
            Project: {project}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="icon-btn"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <span className="material-icons" style={{ fontSize: '20px', color: '#6c757d' }}>
            edit
          </span>
        </button>
        <button 
          className="icon-btn"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          <span className="material-icons" style={{ fontSize: '20px', color: '#dc3545' }}>
            delete
          </span>
        </button>
      </div>
    </div>
  );
};

// Register with Builder.io
Builder.registerComponent(GeneratorCard, {
  name: 'Generator Card',
  inputs: [
    { name: 'label', type: 'string', defaultValue: 'EBOSS-125-001' },
    { name: 'kw', type: 'number', defaultValue: 100 },
    { name: 'photoUrl', type: 'file' },
    { name: 'project', type: 'string', defaultValue: 'Phase 1' },
    { name: 'backgroundColor', type: 'color', defaultValue: '#f8f9fa' },
    { name: 'borderColor', type: 'color', defaultValue: '#dee2e6' },
    { name: 'showPhoto', type: 'boolean', defaultValue: true },
    { name: 'capacityColor', type: 'color', defaultValue: '#27ae60' }
  ]
});

/**
 * Side Panel Header Component
 */
export const SidePanelHeader = (props) => {
  const {
    title = 'Generator Assets',
    subtitle = 'Click on the map to add assets',
    backgroundColor = '#2c3e50',
    textColor = '#ffffff',
    showLogo = true
  } = props;

  return (
    <div 
      className="panel-header-builder"
      style={{
        backgroundColor,
        color: textColor,
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {showLogo && (
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span className="material-icons" style={{ fontSize: '24px' }}>
              bolt
            </span>
          </div>
        )}
        
        <div>
          <h2 style={{ 
            margin: 0, 
            fontSize: '20px',
            fontWeight: 600
          }}>
            {title}
          </h2>
          <p style={{ 
            margin: '4px 0 0 0',
            fontSize: '13px',
            opacity: 0.8
          }}>
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

Builder.registerComponent(SidePanelHeader, {
  name: 'Side Panel Header',
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Generator Assets' },
    { name: 'subtitle', type: 'string', defaultValue: 'Click on the map to add assets' },
    { name: 'backgroundColor', type: 'color', defaultValue: '#2c3e50' },
    { name: 'textColor', type: 'color', defaultValue: '#ffffff' },
    { name: 'showLogo', type: 'boolean', defaultValue: true }
  ]
});

/**
 * Stats Badge Component
 */
export const StatsBadge = (props) => {
  const {
    value = '2,400',
    label = 'Total kW',
    icon = 'bolt',
    backgroundColor = '#e8f5e9',
    textColor = '#2e7d32',
    borderRadius = '8px'
  } = props;

  return (
    <div 
      className="stats-badge-builder"
      style={{
        backgroundColor,
        color: textColor,
        padding: '12px 16px',
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: '140px'
      }}
    >
      <span className="material-icons" style={{ fontSize: '28px', opacity: 0.8 }}>
        {icon}
      </span>
      <div>
        <div style={{ 
          fontSize: '24px', 
          fontWeight: 700,
          lineHeight: 1
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '12px',
          opacity: 0.8,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
};

Builder.registerComponent(StatsBadge, {
  name: 'Stats Badge',
  inputs: [
    { name: 'value', type: 'string', defaultValue: '2,400' },
    { name: 'label', type: 'string', defaultValue: 'Total kW' },
    { name: 'icon', type: 'string', defaultValue: 'bolt' },
    { name: 'backgroundColor', type: 'color', defaultValue: '#e8f5e9' },
    { name: 'textColor', type: 'color', defaultValue: '#2e7d32' },
    { name: 'borderRadius', type: 'string', defaultValue: '8px' }
  ]
});

/**
 * Action Button Component
 */
export const ActionButton = (props) => {
  const {
    text = 'Cost Analysis',
    icon = 'savings',
    variant = 'primary',
    fullWidth = false,
    onClick
  } = props;

  const variants = {
    primary: {
      backgroundColor: '#0a85d1',
      color: '#ffffff',
      border: 'none'
    },
    secondary: {
      backgroundColor: '#f8f9fa',
      color: '#2c3e50',
      border: '1px solid #dee2e6'
    },
    danger: {
      backgroundColor: '#dc3545',
      color: '#ffffff',
      border: 'none'
    }
  };

  const style = variants[variant] || variants.primary;

  return (
    <button
      className={`action-btn-builder action-btn-${variant}`}
      style={{
        ...style,
        padding: '10px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
    >
      <span className="material-icons" style={{ fontSize: '18px' }}>
        {icon}
      </span>
      {text}
    </button>
  );
};

Builder.registerComponent(ActionButton, {
  name: 'Action Button',
  inputs: [
    { name: 'text', type: 'string', defaultValue: 'Cost Analysis' },
    { name: 'icon', type: 'string', defaultValue: 'savings' },
    { 
      name: 'variant', 
      type: 'string',
      enum: ['primary', 'secondary', 'danger'],
      defaultValue: 'primary'
    },
    { name: 'fullWidth', type: 'boolean', defaultValue: false }
  ]
});

/**
 * Dialog Component
 */
export const Dialog = (props) => {
  const {
    title = 'Add Generator',
    showClose = true,
    width = '400px',
    children
  } = props;

  return (
    <div 
      className="dialog-builder"
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width,
        maxWidth: '90vw',
        overflow: 'hidden'
      }}
    >
      <div 
        className="dialog-header-builder"
        style={{
          padding: '20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          {title}
        </h3>
        {showClose && (
          <button 
            className="icon-btn"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <span className="material-icons">close</span>
          </button>
        )}
      </div>
      
      <div className="dialog-body-builder" style={{ padding: '20px' }}>
        {children}
      </div>
    </div>
  );
};

Builder.registerComponent(Dialog, {
  name: 'Dialog',
  inputs: [
    { name: 'title', type: 'string', defaultValue: 'Add Generator' },
    { name: 'showClose', type: 'boolean', defaultValue: true },
    { name: 'width', type: 'string', defaultValue: '400px' }
  ]
});

export default {
  GeneratorCard,
  SidePanelHeader,
  StatsBadge,
  ActionButton,
  Dialog
};
