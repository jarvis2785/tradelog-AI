"use client";

export default function MonthSelector({ months, selectedIndex, onChange }) {
  return (
    <div className="w-full sm:w-auto">
      <select
        value={selectedIndex}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-field h-11 w-full sm:w-64"
      >
        {months.map((m, i) => (
          <option key={m.label} value={i}>
            {i === 0 ? "This Month — " : ""}
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
