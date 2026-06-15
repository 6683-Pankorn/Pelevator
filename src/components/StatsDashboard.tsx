import React from 'react';
import { BarChart3, Zap, Award } from 'lucide-react';
import type { Elevator } from './ElevatorShaft';

interface StatsDashboardProps {
  elevators: Elevator[];
  floors: string[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ elevators, floors }) => {
  // Aggregate data
  const totalEnergy = elevators.reduce((sum, e) => sum + e.energyKwh, 0);

  // Compute floor visit frequencies across all elevators
  const aggregatedFloorTrips: Record<string, number> = {};
  floors.forEach((floor) => {
    aggregatedFloorTrips[floor] = 0;
  });

  elevators.forEach((elevator) => {
    Object.entries(elevator.floorTrips).forEach(([floor, count]) => {
      aggregatedFloorTrips[floor] = (aggregatedFloorTrips[floor] || 0) + count;
    });
  });

  const maxTrips = Math.max(...Object.values(aggregatedFloorTrips), 1);

  // Find most frequented floor
  let mostFrequentedFloor = floors[0];
  let highestCount = 0;
  Object.entries(aggregatedFloorTrips).forEach(([floor, count]) => {
    if (count > highestCount) {
      highestCount = count;
      mostFrequentedFloor = floor;
    }
  });

  return (
    <div className="stats-grid">
      {/* Power stats panel */}
      <div className="stats-card power-card glass-panel">
        <div className="stats-header-row">
          <div className="stats-title-block">
            <h2 className="stats-headline">
              <Zap className="stats-icon text-amber" />
              Power Utilization
            </h2>
            <p className="stats-sub">Total accumulated power consumption (kWh).</p>
          </div>
          <span className="stats-highlight-value text-amber">
            {totalEnergy.toFixed(3)} <span className="stats-unit">kWh</span>
          </span>
        </div>

        {/* Individual Elevator Progress bars */}
        <div className="individual-list">
          {elevators.map((e) => {
            const pct = totalEnergy > 0 ? (e.energyKwh / totalEnergy) * 100 : 0;
            return (
              <div key={e.id} className="progress-row">
                <div className="progress-label-row">
                  <span className="progress-name">{e.name}</span>
                  <span className="progress-val">{e.energyKwh.toFixed(3)} kWh ({Math.round(pct)}%)</span>
                </div>
                <div className="progress-bar-outer">
                  <div
                    className="progress-bar-fill fill-amber"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Most Frequented Floors bar chart */}
      <div className="stats-card popular-card glass-panel">
        <div className="stats-header-row header-split">
          <div className="stats-title-block">
            <h2 className="stats-headline">
              <BarChart3 className="stats-icon text-sky" />
              Popular Destinations
            </h2>
            <p className="stats-sub">Total elevator registrations and trip arrivals per floor.</p>
          </div>

          <div className="stats-badge-block">
            <div className="stats-badge">
              <Award className="badge-icon text-sky" />
              <span className="badge-text">
                Top Floor: <span className="badge-highlight">{mostFrequentedFloor}</span> ({highestCount} trips)
              </span>
            </div>
          </div>
        </div>

        {/* Custom Visual Histogram of Frequented Floors */}
        <div className="histogram-container">
          {floors.map((floor) => {
            const count = aggregatedFloorTrips[floor] || 0;
            const pct = maxTrips > 0 ? (count / maxTrips) * 100 : 0;
            return (
              <div key={floor} className="histogram-row">
                <span className="histogram-label">
                  {floor}
                </span>
                <div className="histogram-bar-outer">
                  <div
                    className="histogram-bar-fill fill-gradient"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="histogram-count">
                  {count} {count === 1 ? 'trip' : 'trips'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
