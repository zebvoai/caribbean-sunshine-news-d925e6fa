import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cloud, CloudRain, CloudSnow, Sun, CloudSun, CloudLightning, CloudFog } from "lucide-react";

// Roseau, Dominica coordinates
const LAT = 15.301;
const LON = -61.387;

interface WeatherData {
  temp: number;
  code: number;
}

const fetchWeather = async (): Promise<WeatherData> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weather_code&timezone=America%2FDominica`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  return {
    temp: Math.round(data.current?.temperature_2m ?? 0),
    code: data.current?.weather_code ?? 0,
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
        <span className="flex items-center gap-1.5" title={`${weatherInfo.label} in Roseau`}>
          <span className="opacity-40">•</span>
          <weatherInfo.Icon className="h-3.5 w-3.5" />
          <span className="tabular-nums">{weather.temp}°C</span>
        </span>
      )}
    </span>
  );
};

export default DominicaInfoStrip;
