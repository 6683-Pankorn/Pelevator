import React from 'react';
import { ArrowUp, ArrowDown, Wifi, WifiOff, Cpu } from 'lucide-react';

export interface Elevator {
  id: string;
  name: string;
  isOnline: boolean;
  isAuto: boolean;
  currentFloor: number;
  targetFloors: number[];
  doorTimer: number;
  direction: 'up' | 'down' | 'idle';
  doorState: 'open' | 'closed' | 'opening' | 'closing';
  energyKwh: number;
  floorTrips: Record<string, number>;
}

interface ElevatorShaftProps {
  elevator: Elevator;
  floors: string[];
  onFloorCall: (elevatorId: string, floorIndex: number) => void;
}

export const ElevatorShaft: React.FC<ElevatorShaftProps> = ({ elevator, floors, onFloorCall }) => {
  const cabinBottom = (elevator.currentFloor / (floors.length - 1)) * 92.5;

  return (
    <div className="shaft-card glass-panel">
      {/* Header status panel */}
      <div className="shaft-header">
        <div className="shaft-title-row">
          <span className="shaft-name">
            <Cpu className="shaft-icon-sky" />
            {elevator.name}
          </span>
          <span className={`shaft-status-badge ${elevator.isOnline ? 'online' : 'offline'}`}>
            {elevator.isOnline ? <Wifi className="badge-icon" /> : <WifiOff className="badge-icon" />}
            {elevator.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Micro Displays for Mode and Door */}
        <div className="shaft-indicators-grid">
          <div className="indicator-box">
            <span className="indicator-label">MODE:</span>
            <span className={`indicator-value ${elevator.isAuto ? 'mode-auto' : 'mode-remote'}`}>
              {elevator.isAuto ? 'AUTO' : 'REMOTE'}
            </span>
          </div>
          <div className="indicator-box">
            <span className="indicator-label">DOOR:</span>
            <span className={`indicator-value door-state ${elevator.doorState === 'open' ? 'door-open' : 'door-closed'}`}>
              {elevator.doorState}
            </span>
          </div>
        </div>
      </div>

      {/* Mini Floor Matrix button grid */}
      <div className="shaft-register">
        <div className="register-title">
          Floor Register
        </div>
        <div className="register-grid">
          {floors.map((floor, idx) => {
            const isActive = Math.round(elevator.currentFloor) === idx;
            const isTarget = elevator.targetFloors.includes(idx);
            return (
              <button
                key={floor}
                disabled={!elevator.isOnline}
                onClick={() => onFloorCall(elevator.id, idx)}
                className={`floor-grid-btn ${isActive ? 'active' : ''} ${isTarget ? 'target' : ''}`}
                title={`Send to Floor ${floor}`}
              >
                {floor}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Shaft Graphic */}
      <div className="elevator-shaft-container">
        {/* Cable */}
        <div 
          className="elevator-cable"
          style={{ 
            left: '50%',
            transform: 'translateX(-50%)',
            height: `${100 - cabinBottom}%`
          }}
        />

        {/* Floor lines & markers */}
        {floors.map((floor, idx) => {
          const topPercent = (1 - idx / (floors.length - 1)) * 92.5 + 3.5;
          return (
            <React.Fragment key={floor}>
              <div 
                className="elevator-shaft-line"
                style={{ top: `${topPercent}%` }}
              />
              <span 
                className="floor-marker"
                style={{ top: `${topPercent}%` }}
              >
                {floor}
              </span>
            </React.Fragment>
          );
        })}

        {/* Elevator Cabin */}
        <div 
          className={`elevator-cabin ${
            elevator.direction !== 'idle' ? 'moving' : ''
          } ${!elevator.isOnline ? 'offline' : ''} ${
            elevator.doorState === 'open' || elevator.doorState === 'opening' ? 'doors-open' : ''
          }`}
          style={{ 
            bottom: `${cabinBottom}%`,
            transition: elevator.direction === 'idle' ? 'bottom 0.4s ease-out' : 'bottom 0.1s linear'
          }}
        >
          {/* Left and Right sliding doors */}
          <div className="elevator-door-left" />
          <div className="elevator-door-right" />

          {/* Core Display Indicator inside Cabin */}
          <div className="elevator-cabin-display">
            {elevator.direction === 'up' && <ArrowUp className="cabin-arrow arrow-up-anim" />}
            {elevator.direction === 'down' && <ArrowDown className="cabin-arrow arrow-down-anim" />}
            <span>{floors[Math.round(elevator.currentFloor)]}</span>
          </div>
        </div>
      </div>

      {/* Real-time stats card */}
      <div className="shaft-power-row">
        <span className="power-label">Power:</span>
        <span className="shaft-power-value">{elevator.energyKwh.toFixed(3)} kWh</span>
      </div>
    </div>
  );
};
