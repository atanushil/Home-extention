import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ChromePicker } from "react-color";

const calculateContrast = (hex) => {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  // Return 'black' or 'white' based on luminance
  return luminance > 128 ? '#000000' : '#FFFFFF';
};

const Weather = React.memo(() => {
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [bgColor, setBgColor] = useState("#4A90E2"); // Default background color
  const [showPicker, setShowPicker] = useState(false); // To toggle the color picker visibility
  const [textColor, setTextColor] = useState("#FFFFFF"); // Default text color is white
  const pickerRef = useRef(null); // Ref to store color picker element

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      const weatherUrl = `https://weather-by-api-ninjas.p.rapidapi.com/v1/weather?lat=${lat}&lon=${lon}`;
      const weatherOptions = {
        method: "GET",
        headers: {
          "x-rapidapi-key": "399e3ef61cmshfb9b26c31bd8b00p105d3ajsn639dc3a8023c", // Replace with your RapidAPI key
          "x-rapidapi-host": "weather-by-api-ninjas.p.rapidapi.com",
        },
      };

      try {
        const response = await axios.get(weatherUrl, weatherOptions);
        setWeatherData(response.data);
        localStorage.setItem('weatherData', JSON.stringify(response.data));
      } catch (error) {
        setError("Failed to fetch weather data");
      }
    };

    const fetchLocationName = async (lat, lon) => {
      const locationUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

      try {
        const response = await axios.get(locationUrl);
        setLocation(response.data.address);
        localStorage.setItem('location', JSON.stringify(response.data.address));
      } catch (error) {
        setError("Failed to fetch location name");
      }
    };

    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const cachedWeather = localStorage.getItem('weatherData');
            const cachedLocation = localStorage.getItem('location');

            if (cachedWeather && cachedLocation) {
              setWeatherData(JSON.parse(cachedWeather));
              setLocation(JSON.parse(cachedLocation));
            } else {
              fetchWeather(latitude, longitude);
              fetchLocationName(latitude, longitude);
            }
          },
          () => setError("Failed to get location")
        );
      } else {
        setError("Geolocation is not supported by this browser.");
      }
    };

    getLocation();
  }, []);

  useEffect(() => {
    // Function to handle clicks outside the color picker
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Update text color based on background color
    setTextColor(calculateContrast(bgColor));
  }, [bgColor]);

  const getWeatherIcon = (temp) => {
    const currentHour = new Date().getHours();
    const isDayTime = currentHour >= 6 && currentHour < 18; 

    if (temp < 0) {
      return "❄️"; 
    } else if (temp < 20) {
      return isDayTime ? "🌤️" : "🌑"; 
    } else if (temp < 30) {
      return isDayTime ? "🌞" : "🌗"; 
    } else {
      return isDayTime ? "🔥" : "🌝"; 
    }
  };

  return (
    <div
      className="relative p-6 rounded-lg max-w-md shadow-lg hidden lg:block xl:block 2xl:block"
      style={{ backgroundColor: bgColor }}
    >
      {error && <div className="text-red-400 text-center mb-4">{error}</div>}
      {weatherData && location ? (
        <div className="text-center" style={{ color: textColor }}>
          <h3 className="text-2xl font-bold mb-2">
            Weather in {location.city || location.town || location.village}
          </h3>
          <div className="flex justify-center items-center mb-4">
            <div className="text-6xl">
              {getWeatherIcon(weatherData.temp)}
            </div>
            <div className="ml-4">
              <p className="text-4xl font-semibold">{weatherData.temp}°C</p>
              <p className="text-lg">Temperature</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-lg">Humidity: {weatherData.humidity}%</p>
            <p className="text-lg">Wind Speed: {weatherData.wind_speed} m/s</p>
          </div>
        </div>
      ) : (
        !error && <div className="text-center text-white">Loading weather data...</div>
      )}
      <div className="absolute top-0 right-0 mt-2 mr-2">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="h-4 w-6 bg-gray-300 rounded-md border"
          style={{ backgroundColor: bgColor }}
        >
          {/* Button to toggle the color picker */}
        </button>
        {showPicker && (
          <div
            className="absolute top-8 right-0"
            ref={pickerRef} 
          >
            <ChromePicker
              color={bgColor}
              onChangeComplete={(color) => setBgColor(color.hex)}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default Weather;
