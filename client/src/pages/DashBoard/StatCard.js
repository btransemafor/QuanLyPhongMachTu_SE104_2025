import React, { useMemo } from "react";
import {
  ClockIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

export default function StatCard({ label, value, icon, bg, bgDefault }) {
  let IconComponent;

  switch (icon) {
    case "clock":
      IconComponent = ClockIcon;
      break;
    case "calendar":
      IconComponent = CalendarIcon;
      break;
    case "dollar":
      IconComponent = CurrencyDollarIcon;
      break;
    case "check":
      IconComponent = CheckIcon;
      break;
    default:
      IconComponent = null;
  }

  // ⭐ 5 màu gradient đẹp — Tailwind
  const gradientClasses = [
    "from-blue-500 to-blue-600",
    "from-green-500 to-green-600",
    "from-yellow-500 to-yellow-600",
    "from-red-500 to-red-600",
    "from-purple-500 to-purple-600",
  ];

  // ⭐ random 1 lần / card (không random liên tục)
/*   const bg = useMemo(() => {
    const idx = Math.floor(Math.random() * gradientClasses.length);
    return gradientClasses[idx];
  }, []); */

  return (
    <div className={`bg-gradient-to-br ${bg} rounded-2xl shadow-lg p-6 text-white`} style={{background: bgDefault}}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-white/80 text-sm">{label}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>

        {IconComponent && (
          <IconComponent className="h-10 w-10 opacity-80 text-white" />
        )}
      </div>
    </div>
  );
}
