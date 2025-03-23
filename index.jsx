// Initialize with default values
let lat = 0;
let lon = 0;

// Function to get current position
const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lat = position.coords.latitude;
        lon = position.coords.longitude;
        // Trigger an update when location is obtained
        window.uebersicht.run(command);
      },
      (error) => {
        console.error("Error getting location:", error.message);
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
};

// Get location when the widget loads
getLocation();

export const command = `
  curl -s "https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=355227495210c83dcc4f7cb00e980869"
`;

export const refreshFrequency = 60 * 1000;

// Track drag state
let isDragging = false;
let initialX, initialY;
let offsetX = 0, offsetY = 0;
let isDragMode = false;
let dragModeTimer = null;

// Initial position - these can be stored in localStorage to remember position
let positionX = 255;
let positionY = 829;

// Try to load saved position if available
try {
  const savedX = localStorage.getItem('weatherWidgetX');
  const savedY = localStorage.getItem('weatherWidgetY');
  if (savedX !== null && savedY !== null) {
    positionX = parseInt(savedX);
    positionY = parseInt(savedY);
  }
} catch (e) {
  console.error("Could not load saved position:", e);
}

export const render = ({ output }) => {
  let temp = "0"; // Default temperature
  let weatherInfo = "weather"; // Default weather information
  let weatherDescription = "weather"; // Default weather description

  try {
    if (output) {
      const weather = JSON.parse(output);
      temp = (weather.main.temp - 273.15).toFixed(1);
      weatherInfo = weather.weather[0].main;
      weatherDescription = weather.weather[0].description;
    }
  } catch (error) {}

  const getBackgroundAndIcon = (weatherType, weatherDescription) => {
    switch (weatherType) {
      case "Clouds":
        if (weatherDescription === "broken clouds") {
          return {
            background:
              "linear-gradient(to bottom right,rgba(42, 42, 42, 0.56),rgba(129, 134, 143, 0.56))",
            icon: "Weather.widget/icons/broken_cloud.svg",
          };
        }
        return {
          background:
            "linear-gradient(to bottom right,rgba(86, 86, 86, 0.56),rgba(129, 134, 143, 0.56))",
          icon: "Weather.widget/icons/cloudly_sun.svg",
        };
      case "Clear":
        if (new Date().getHours() > 18) {
          return {
            background:
              "linear-gradient(to bottom right,rgba(0, 0, 0, 0.56),rgba(0, 0, 0, 0.56))",
            icon: "Weather.widget/icons/moon.svg",
          };
        }
        return {
          background:
            "linear-gradient(to bottom right,rgba(255, 223, 0, 0.56),rgba(255, 165, 0, 0.56))",
          icon: "Weather.widget/icons/sun.svg",
        };
      case "Rain":
        return {
          background:
            "linear-gradient(to bottom right,rgba(0, 0, 255, 0.56),rgba(0, 191, 255, 0.56))",
          icon: "Weather.widget/icons/rainy.svg",
        };
      case "Snow":
        return {
          background:
            "linear-gradient(to bottom right,rgba(198, 198, 198, 0.56),rgba(192, 192, 192, 0.56))",
          icon: "Weather.widget/icons/snow.svg",
        };
      case "Mist":
      case "Fog":
        return {
          background:
            "linear-gradient(to bottom right,rgba(169, 169, 169, 0.56),rgba(192, 192, 192, 0.56))",
          icon: "Weather.widget/icons/mist.svg",
        };
      case "Thunderstorm":
        return {
          background:
            "linear-gradient(to bottom right,rgba(105, 105, 105, 0.56),rgba(169, 169, 169, 0.56))",
          icon: "Weather.widget/icons/thunder_cloud.svg",
        };
      case "Drizzle":
        return {
          background:
            "linear-gradient(to bottom right,rgba(173, 216, 230, 0.56),rgba(0, 191, 255, 0.56))",
          icon: "Weather.widget/icons/rainy.svg",
        };
      default:
        return {
          background: "linear-gradient(to bottom right, #1e3c7290, #2a529890)",
          icon: "Weather.widget/icons/sun.svg",
        };
    }
  };

  const { background, icon } = getBackgroundAndIcon(
    weatherInfo,
    weatherDescription
  );

  // Toggle drag mode on double click
  const toggleDragMode = () => {
    isDragMode = !isDragMode;
    
    const widget = document.getElementById('weatherContainer');
    if (widget) {
      if (isDragMode) {
        // Visual indication that widget is in drag mode
        widget.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.7)';
        widget.style.cursor = 'move';
        
        // Set timer to exit drag mode after 5 seconds of inactivity
        resetDragModeTimer();
      } else {
        // Remove visual indication
        widget.style.boxShadow = 'none';
        widget.style.cursor = 'default';
        
        // Clear timer if exists
        if (dragModeTimer) {
          clearTimeout(dragModeTimer);
          dragModeTimer = null;
        }
      }
    }
  };
  
  // Reset the timer for drag mode
  const resetDragModeTimer = () => {
    if (dragModeTimer) {
      clearTimeout(dragModeTimer);
    }
    
    dragModeTimer = setTimeout(() => {
      if (isDragMode) {
        toggleDragMode();
      }
    }, 5000); // 5 seconds
  };
  
  // Event handlers for dragging
  const handleMouseDown = (e) => {
    if (!isDragMode) return;
    
    isDragging = true;
    initialX = e.clientX;
    initialY = e.clientY;
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    
    // Add event listeners for drag and drop
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Reset timer when starting to drag
    resetDragModeTimer();
  };
  
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    // Calculate new position
    const dx = e.clientX - initialX;
    const dy = e.clientY - initialY;
    
    positionX += dx;
    positionY += dy;
    
    // Update widget position
    const widget = document.getElementById('weatherContainer');
    if (widget) {
      widget.style.left = `${positionX}px`;
      widget.style.top = `${positionY}px`;
    }
    
    // Reset initial position for next movement
    initialX = e.clientX;
    initialY = e.clientY;
    
    // Reset timer when dragging
    resetDragModeTimer();
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    isDragging = false;
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Reset user-select
    document.body.style.userSelect = '';
    
    // Save position to localStorage
    try {
      localStorage.setItem('weatherWidgetX', positionX.toString());
      localStorage.setItem('weatherWidgetY', positionY.toString());
    } catch (e) {
      console.error("Could not save position:", e);
    }
    
    // Reset timer when done dragging
    resetDragModeTimer();
  };

  return (
    <div
      style={{
        position: "absolute",
        top: `${positionY}px`,
        left: `${positionX}px`,
        background: background,
        WebkitBackdropFilter: "blur(15px)",
        borderRadius: "20px",
        width: "150px",
        height: 70,
        color: "#fff",
        fontFamily: "'Arial', sans-serif",
        textAlign: "center",
        display: "flex",
        cursor: "move", // Change cursor to indicate draggable
      }}
      id="weatherContainer"
      onMouseDown={handleMouseDown}
      onDoubleClick={toggleDragMode}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "50%",
          height: "100%",
        }}
      >
        <img
          src={icon}
          style={{
            height: 65,
            width: 65,
          }}
          id="weatherInfoImage"
        />
        <img
          src={icon}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: 73,
            width: 73,
            WebkitFilter: "blur(15px)",
          }}
          id="weatherInfoImage"
        />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          width: "50%",
          height: "100%",
        }}
      >
        <p
          style={{
            fontSize: "25px",
            fontWeight: "500",
            fontFamily: "Avenir Next",
            lineHeight: "-1",
            letterSpacing: -1,
            margin: "0",
            marginBottom: "-5px",
          }}
        >
          {temp}°
        </p>
        <p
          style={{
            fontSize: "15px",
            textTransform: "capitalize",
            opacity: "0.5",
            margin: "0",
          }}
        >
          {weatherInfo}
        </p>
      </div>
    </div>
  );
};
