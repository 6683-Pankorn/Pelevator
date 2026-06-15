import { useEffect, useState, useRef } from 'react';
import { ElevatorShaft } from './components/ElevatorShaft';
import type { Elevator } from './components/ElevatorShaft';
import { SimulationControls } from './components/SimulationControls';
import { StatsDashboard } from './components/StatsDashboard';
import { Building2 } from 'lucide-react';

const FLOORS = ['1', '1A', '2', '2A', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const ELEVATOR_IDS = ['fl1', 'pl1', 'bl1', 'pl2', 'pl3'];
const ELEVATOR_NAMES = {
  fl1: 'FL1',
  pl1: 'PL1',
  bl1: 'BL1',
  pl2: 'PL2',
  pl3: 'PL3',
};

const DEFAULT_ELEVATORS: Elevator[] = ELEVATOR_IDS.map((id) => ({
  id,
  name: ELEVATOR_NAMES[id as keyof typeof ELEVATOR_NAMES],
  isOnline: true,
  isAuto: true,
  currentFloor: Math.floor(Math.random() * FLOORS.length),
  targetFloors: [],
  doorTimer: 0,
  direction: 'idle',
  doorState: 'closed',
  energyKwh: 0,
  floorTrips: FLOORS.reduce((acc, f) => ({ ...acc, [f]: 0 }), {}),
}));

export default function App() {
  const [elevators, setElevators] = useState<Elevator[]>(() => {
    const saved = localStorage.getItem('pelevator_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === ELEVATOR_IDS.length) {
          // ensure targetFloors and doorTimer exist for backwards compatibility
          return parsed.map(e => ({
            ...e,
            targetFloors: e.targetFloors || (e.targetFloor !== undefined && e.targetFloor !== null ? [e.targetFloor] : []),
            doorTimer: e.doorTimer || 0
          }));
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      }
    }
    return DEFAULT_ELEVATORS;
  });

  const [isSimulating, setIsSimulating] = useState(true);
  const simulationTimerRef = useRef<number | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState(ELEVATOR_IDS[0]);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem('pelevator_data', JSON.stringify(elevators));
  }, [elevators]);

  // Main simulation tick loop (runs every 180ms)
  useEffect(() => {
    if (!isSimulating) {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
      return;
    }

    simulationTimerRef.current = window.setInterval(() => {
      setElevators((prevElevators) =>
        prevElevators.map((ev) => {
          if (!ev.isOnline) {
            return { ...ev, direction: 'idle', targetFloors: [] };
          }

          let nextCurrentFloor = ev.currentFloor;
          let nextDirection = ev.direction;
          let nextDoorState = ev.doorState;
          let nextTargetFloors = [...ev.targetFloors];
          let nextDoorTimer = ev.doorTimer;
          let nextEnergyKwh = ev.energyKwh;
          const nextFloorTrips = { ...ev.floorTrips };

          // 1. Handle Door Opening / Closing timings
          if (nextDoorState === 'opening') {
            nextDoorTimer++;
            if (nextDoorTimer > 10) { // 1.8 seconds opening
              nextDoorState = 'open';
              nextDoorTimer = 0;
            }
            nextEnergyKwh += 0.005;
          } else if (nextDoorState === 'open') {
            nextDoorTimer++;
            if (nextDoorTimer > 15) { // 2.7 seconds open
              nextDoorState = 'closing';
              nextDoorTimer = 0;
            }
            nextEnergyKwh += 0.005;
          } else if (nextDoorState === 'closing') {
            nextDoorTimer++;
            if (nextDoorTimer > 10) { // 1.8 seconds closing
              nextDoorState = 'closed';
              nextDoorTimer = 0;
            }
            nextEnergyKwh += 0.005;
          }

          // 2. Handle Elevator Algorithm Logic
          if (nextDoorState === 'closed') {
            if (nextDirection === 'idle' && nextTargetFloors.length > 0) {
              // Determine direction based on closest target
              const firstTarget = nextTargetFloors[0];
              if (firstTarget > Math.round(nextCurrentFloor)) {
                nextDirection = 'up';
              } else if (firstTarget < Math.round(nextCurrentFloor)) {
                nextDirection = 'down';
              } else {
                // target is current floor
                nextDirection = 'idle';
                nextDoorState = 'opening';
                nextDoorTimer = 0;
                nextTargetFloors = nextTargetFloors.filter(f => f !== Math.round(nextCurrentFloor));
                
                const arrivedFloorName = FLOORS[Math.round(nextCurrentFloor)];
                nextFloorTrips[arrivedFloorName] = (nextFloorTrips[arrivedFloorName] || 0) + 1;
                nextEnergyKwh += 0.05;
              }
            }

            if (nextDirection !== 'idle') {
              const step = 0.15;
              const movingUp = nextDirection === 'up';
              
              nextCurrentFloor += movingUp ? step : -step;
              nextEnergyKwh += 0.02;

              const roundedCurrent = Math.round(nextCurrentFloor);
              // Check if we arrived at a target floor
              if (Math.abs(nextCurrentFloor - roundedCurrent) <= step && nextTargetFloors.includes(roundedCurrent)) {
                // Stop at this floor
                nextCurrentFloor = roundedCurrent;
                nextDoorState = 'opening';
                nextDoorTimer = 0;
                // Remove this floor from targets
                nextTargetFloors = nextTargetFloors.filter(f => f !== roundedCurrent);

                const arrivedFloorName = FLOORS[roundedCurrent];
                nextFloorTrips[arrivedFloorName] = (nextFloorTrips[arrivedFloorName] || 0) + 1;
                nextEnergyKwh += 0.05; // braking power

                // Determine next direction if we still have targets
                if (nextTargetFloors.length > 0) {
                  // If moving up, check if there are higher targets
                  if (movingUp) {
                    const hasHigher = nextTargetFloors.some(f => f > roundedCurrent);
                    if (!hasHigher) nextDirection = 'down';
                  } else {
                    const hasLower = nextTargetFloors.some(f => f < roundedCurrent);
                    if (!hasLower) nextDirection = 'up';
                  }
                } else {
                  nextDirection = 'idle';
                }
              } else if (nextTargetFloors.length === 0) {
                // No more targets but still moving? (shouldn't happen but just in case)
                nextDirection = 'idle';
              } else {
                // If we passed all targets in the current direction, switch direction
                if (movingUp && !nextTargetFloors.some(f => f > Math.round(nextCurrentFloor))) {
                   nextDirection = 'down';
                } else if (!movingUp && !nextTargetFloors.some(f => f < Math.round(nextCurrentFloor))) {
                   nextDirection = 'up';
                }
              }
            }
          }

          // 3. Autonomous Passenger Spawning
          if (ev.isAuto && nextDoorState === 'closed') {
            if (Math.random() < 0.04 && nextTargetFloors.length < 5) {
              const randFloor = Math.floor(Math.random() * FLOORS.length);
              if (randFloor !== Math.round(nextCurrentFloor) && !nextTargetFloors.includes(randFloor)) {
                nextTargetFloors.push(randFloor);
                nextEnergyKwh += 0.05;
              }
            }
          }

          return {
            ...ev,
            currentFloor: nextCurrentFloor,
            direction: nextDirection,
            doorState: nextDoorState,
            targetFloors: nextTargetFloors,
            doorTimer: nextDoorTimer,
            energyKwh: nextEnergyKwh,
            floorTrips: nextFloorTrips,
          };
        })
      );
    }, 180);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isSimulating]);

  const handleFloorCall = (elevatorId: string, floorIndex: number) => {
    setElevators((prev) =>
      prev.map((ev) => {
        if (ev.id !== elevatorId || !ev.isOnline) return ev;
        
        const newTargets = [...ev.targetFloors];
        if (!newTargets.includes(floorIndex)) {
          newTargets.push(floorIndex);
        }

        return {
          ...ev,
          targetFloors: newTargets,
        };
      })
    );
  };

  const handleUpdateElevatorProperty = (elevatorId: string, property: keyof Elevator, value: any) => {
    setElevators((prev) =>
      prev.map((ev) => {
        if (ev.id !== elevatorId) return ev;
        return { ...ev, [property]: value };
      })
    );
  };

  const handleResetSimulation = () => {
    localStorage.removeItem('pelevator_data');
    setElevators(DEFAULT_ELEVATORS);
  };

  return (
    <div className="dashboard-container">
        <header className="dashboard-header">
        <div className="header-brand">
          <div className="header-logo">
            <Building2 />
          </div>
          <div className="header-text">
            <h1>SCHNEIDER <span>LIFT & ELEVATOR</span></h1>
            <p>PSU Smart Logistics & Vertical Transportation Dashboard</p>
          </div>
        </div>

        <div className="system-health">
          <div className="system-badge">
            <span className="status-dot" />
            System Live
          </div>
        </div>
      </header>

        <div className="mobile-tabs">
          {ELEVATOR_IDS.map(id => (
            <button 
              key={id} 
              className={`mobile-tab-btn ${activeMobileTab === id ? 'active' : ''}`}
              onClick={() => setActiveMobileTab(id)}
            >
              {ELEVATOR_NAMES[id as keyof typeof ELEVATOR_NAMES]}
            </button>
          ))}
        </div>

        <main className="elevator-grid">
          {elevators.map((ev) => (
            <div key={ev.id} className={`elevator-wrapper ${activeMobileTab === ev.id ? 'mobile-active' : 'mobile-hidden'}`}>
              <ElevatorShaft
                elevator={ev}
                floors={FLOORS}
                onFloorCall={handleFloorCall}
              />
            </div>
          ))}
        </main>

        <StatsDashboard elevators={elevators} floors={FLOORS} />

        <footer className="dashboard-footer">
          Schneider Intelligent EMS © {new Date().getFullYear()} • Powered by Impeccable Design Pack
        </footer>

      <SimulationControls
        elevators={elevators}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        onResetSimulation={handleResetSimulation}
        onUpdateElevatorProperty={handleUpdateElevatorProperty}
      />
    </div>
  );
}
