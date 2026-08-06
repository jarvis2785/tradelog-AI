"use client";

import { toDDMMYYYY } from "@/lib/utils";

export default function WeekSelector({ weeks, selectedIndex, onChange }) {
  return (
    <div className="w-full sm:w-auto">
      <select
        value={selectedIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-field h-11 w-full sm:w-64"
      >
        {weeks.map((w, i) => (
          <option key={w.start} value={i}>
            {i === 0 ? "This Week — " : ""}
            {toDDMMYYYY(w.start)} - {toDDMMYYYY(w.end)}
          </option>
        ))}
      </select>
    </div>
  );
}
