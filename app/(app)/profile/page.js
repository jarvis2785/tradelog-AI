"use client";

import { User } from "lucide-react";
import RulesManager from "@/components/profile/RulesManager";
import ThemeToggle from "@/components/ThemeToggle";

const TRADER_INFO = [
  { label: "Name", value: "Umesh" },
  { label: "Broker", value: "Groww" },
  { label: "Market", value: "Equity Intraday" },
  { label: "Entry Window", value: "9:15 AM – 10:00 AM" },
  { label: "Exit Before", value: "3:15 PM" },
  { label: "Risk Per Trade", value: "₹250" },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="text-h1 text-text-primary">Profile</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
            <User size={20} className="text-accent" />
          </div>
          <h3 className="text-h3 text-text-primary">Trader Info</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {TRADER_INFO.map((item) => (
            <div key={item.label} className="border border-border rounded-control px-3 py-2.5">
              <p className="text-small text-text-muted mb-0.5">{item.label}</p>
              <p className="font-mono text-body text-text-primary">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <RulesManager />

      <div className="card md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-h3 text-text-primary">Appearance</h3>
            <p className="text-small text-text-secondary mt-0.5">
              Switch between light and dark mode.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
