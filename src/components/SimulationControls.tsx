import React from 'react';
import { Play, Pause, RefreshCw, Power, Radio, DoorOpen, SlidersHorizontal, ChevronRight } from 'lucide-react';
import type { Elevator } from './ElevatorShaft';

interface SimulationControlsProps {
  elevators: Elevator[];
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  onUpdateElevatorProperty: (elevatorId: string, property: keyof Elevator, value: any) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  elevators,
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  onUpdateElevatorProperty,
}) => {
  const [selectedElevatorId, setSelectedElevatorId] = React.useState<string>(elevators[0]?.id || '');
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const selectedElevator = elevators.find((e) => e.id === selectedElevatorId);

  return (
    <div className={`controls-floating-panel glass-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle tab on the left edge */}
      <button
        className="controls-toggle-tab"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
        title={isCollapsed ? 'Expand Control Panel' : 'Collapse Control Panel'}
      >
        <SlidersHorizontal className="tab-icon" />
        <ChevronRight className={`tab-chevron ${isCollapsed ? '' : 'rotated'}`} />
      </button>

      {/* Panel content */}
      <div className="controls-floating-body">
        {/* Header */}
        <div className="controls-panel-header static-header">
          <span className="controls-panel-title">
            <SlidersHorizontal className="controls-panel-icon" />
            Control Panel
          </span>
        </div>

        {/* Simulation Master Buttons */}
        <div className="controls-section">
          <p className="controls-section-label">SIMULATION</p>
          <div className="controls-btn-group">
            <button
              onClick={onToggleSimulation}
              className={`btn-control btn-traffic w-full ${isSimulating ? 'simulating' : 'paused'}`}
            >
              {isSimulating ? <Pause className="btn-icon" /> : <Play className="btn-icon" />}
              {isSimulating ? 'Pause Auto Traffic' : 'Start Auto Traffic'}
            </button>
            <button onClick={onResetSimulation} className="btn-control btn-reset w-full">
              <RefreshCw className="btn-icon" />
              Reset All Data
            </button>
          </div>
        </div>

        <div className="controls-divider" />

        {/* Elevator Selector */}
        <div className="controls-section">
          <p className="controls-section-label">SELECT ELEVATOR</p>
          <div className="elevator-tab-grid">
            {elevators.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedElevatorId(ev.id)}
                className={`btn-control tab-btn ${selectedElevatorId === ev.id ? 'active' : ''} ${!ev.isOnline ? 'offline-tab' : ''}`}
              >
                <span className={`tab-dot ${ev.isOnline ? 'online' : 'offline'}`} />
                {ev.name}
              </button>
            ))}
          </div>
        </div>

        {/* Per-elevator Overrides */}
        {selectedElevator && (
          <>
            <div className="controls-divider" />
            <div className="controls-section">
              <p className="controls-section-label">OVERRIDE: {selectedElevator.name}</p>

              {/* Connection State */}
              <div className="override-row">
                <div className="override-row-left">
                  <Power className={`override-icon ${selectedElevator.isOnline ? 'icon-green' : 'icon-rose'}`} />
                  <div>
                    <span className="override-row-title">Connection</span>
                    <span className={`override-row-sub ${selectedElevator.isOnline ? 'text-green' : 'text-rose'}`}>
                      {selectedElevator.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateElevatorProperty(selectedElevator.id, 'isOnline', !selectedElevator.isOnline)}
                  className={`btn-control btn-xs ${selectedElevator.isOnline ? 'btn-online' : 'btn-offline'}`}
                >
                  {selectedElevator.isOnline ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* Operation Mode */}
              <div className="override-row">
                <div className="override-row-left">
                  <Radio className={`override-icon ${selectedElevator.isAuto ? 'icon-amber' : 'icon-sky'}`} />
                  <div>
                    <span className="override-row-title">Mode</span>
                    <span className={`override-row-sub ${selectedElevator.isAuto ? 'text-amber' : 'text-sky'}`}>
                      {selectedElevator.isAuto ? 'Auto' : 'Remote'}
                    </span>
                  </div>
                </div>
                <button
                  disabled={!selectedElevator.isOnline}
                  onClick={() => onUpdateElevatorProperty(selectedElevator.id, 'isAuto', !selectedElevator.isAuto)}
                  className={`btn-control btn-xs ${selectedElevator.isAuto ? 'btn-auto' : 'btn-remote'}`}
                >
                  {selectedElevator.isAuto ? 'Set Remote' : 'Set Auto'}
                </button>
              </div>

              {/* Door Control */}
              <div className="override-row">
                <div className="override-row-left">
                  <DoorOpen className="override-icon icon-sky" />
                  <div>
                    <span className="override-row-title">Cabin Door</span>
                    <span className="override-row-sub text-muted">{selectedElevator.doorState}</span>
                  </div>
                </div>
                <button
                  disabled={!selectedElevator.isOnline || selectedElevator.direction !== 'idle'}
                  onClick={() => {
                    const next = selectedElevator.doorState === 'open' ? 'closing' : 'opening';
                    onUpdateElevatorProperty(selectedElevator.id, 'doorState', next);
                  }}
                  className="btn-control btn-xs btn-door"
                >
                  {selectedElevator.doorState === 'open' || selectedElevator.doorState === 'opening'
                    ? 'Close Door'
                    : 'Open Door'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
