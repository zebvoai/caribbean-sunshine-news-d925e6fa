import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, CloudLightning, CloudFog } from "lucide-react";

// Roseau, Dominica coordinates
const LAT = 15.301;
const LON = -61.387;

interface DailyForecast {
  date: string; // ISO date
  tempMax: number;
  tempMin: number;
  code: number;
}

interface WeatherData {
  temp: number;
  code: number;
  daily: DailyForecast[];
}

const fetchWeather = async (): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=America%2FDominica&forecast_days=3`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const daily: DailyForecast[] = (data.daily?.time || []).map((d: string, i: number) => ({
    date: d,
    tempMax: Math.round(data.daily.temperature_2m_max[i]),
    tempMin: Math.round(data.daily.temperature_2m_min[i]),
    code: data.daily.weather_code[i],
  }));
  return {
    temp: Math.round(data.current?.temperature_2m ?? 0),
    code: data.current?.weather_code ?? 0,
    daily,
  };
};

// WMO weather code → icon + label
const getWeatherInfo = (code: number) => {
  if (code === 0) return { Icon: Sun, label: "Clear" };
  if (code <= 2) return { Icon: CloudSun, label: "Partly cloudy" };
  if (code === 3) return { Icon: Cloud, label: "Cloudy" };
  if (code >= 45 && code <= 48) return { Icon: CloudFog, label: "Foggy" };
  if (code >= 51 && code <= 67) return { Icon: CloudRain, label: "Rain" };
  if (code >= 71 && code <= 77) return { Icon: CloudSnow, label: "Snow" };
  if (code >= 80 && code <= 82) return { Icon: CloudRain, label: "Showers" };
  if (code >= 95) return { Icon: CloudLightning, label: "Thunderstorm" };
  return { Icon: Cloud, label: "—" };
};

const formatDayLabel = (iso: string, idx: number) => {
  if (idx === 0) return "Today";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", timeZone: "America/Dominica" });
};

const DominicaInfoStrip = () => {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Dominica",
    })
  );

  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "America/Dominica",
        })
      );
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const { data: weather } = useQuery({
    queryKey: ["dominica-weather"],
    queryFn: fetchWeather,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });

  const weatherInfo = weather ? getWeatherInfo(weather.code) : null;

  return (
    <span className="flex items-center gap-3 text-primary-foreground/90">
      <span className="flex items-center gap-1.5" title="Dominica time (AST)">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
        <span className="tabular-nums">{time}</span>
        <span className="opacity-60 normal-case tracking-normal">AST</span>
      </span>
      {weather && weatherInfo && (
        <span className="relative group flex items-center gap-1.5 cursor-default">
          <span className="opacity-40">•</span>
          <weatherInfo.Icon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{weather.temp}°C</span>

          {/* 3-day forecast dropdown */}
          <div
            className="absolute right-0 top-full mt-2 z-50 w-56 rounded-xl border border-border bg-popover text-popover-foreground shadow-xl opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 normal-case tracking-normal"
            role="tooltip"
          >
            <div className="px-3 py-2 border-b border-border/60">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                Roseau, Dominica
              </p>
              <p className="text-xs font-body text-foreground/80 mt-0.5">{weatherInfo.label}</p>
            </div>
            <ul className="py-1.5">
              {weather.daily.slice(0, 3).map((d, i) => {
                const info = getWeatherInfo(d.code);
                return (
                  <li
                    key={d.date}
                    className="flex items-center justify-between px-3 py-1.5 text-xs font-body text-foreground"
                  >
                    <span className="font-semibold w-12">{formatDayLabel(d.date, i)}</span>
                    <span className="flex items-center gap-1.5 text-muted-foreground flex-1 ml-2">
                      <info.Icon className="h-3.5 w-3.5" />
                      <span className="truncate text-[11px]">{info.label}</span>
                    </span>
                    <span className="tabular-nums text-foreground/90">
                      <span className="font-semibold">{d.tempMax}°</span>
                      <span className="opacity-50 ml-1">{d.tempMin}°</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </span>
      )}
    </span>
  );
};

export default DominicaInfoStrip;
