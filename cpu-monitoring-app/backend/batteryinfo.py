import psutil
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from datetime import datetime

app = FastAPI()

# Function to get system uptime with limited decimal seconds
def get_system_uptime():
    uptime_seconds = psutil.boot_time()
    uptime = datetime.fromtimestamp(uptime_seconds)
    uptime_duration = datetime.now() - uptime
    
    # Get the total days, hours, minutes, and seconds
    days = uptime_duration.days
    hours, remainder = divmod(int(uptime_duration.seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    
    # Limit seconds to two decimal places
    seconds = round(seconds + uptime_duration.microseconds / 1e6, 2)
    
    return f"{days} day, {hours}:{minutes:02}:{seconds:.2f}"

# Function to get battery charging status
def get_charging_status():
    try:
        battery = psutil.sensors_battery()
        if battery is None and psutil.sensors_power() is not None:
            # If no battery is detected but power is plugged in, return "Plugged in"
            return "Plugged in"
        return battery.power_plugged if battery else "No battery detected"
    except Exception as e:
        return f"Error: {str(e)}"

# Function to get system power usage (CPU power usage for this example)
def get_system_power_usage():
    try:
        # Placeholder for CPU power usage calculation (will return percentage)
        power_usage = psutil.cpu_percent(interval=1)  # CPU power usage percentage
        return power_usage
    except Exception as e:
        return f"Error: {str(e)}"

# Function to get battery discharge rate
def get_battery_discharge_rate():
    try:
        battery = psutil.sensors_battery()
        return battery.secsleft if battery else "No battery detected"
    except Exception as e:
        return f"Error: {str(e)}"

# Function to get power consumption data (CPU and GPU)
def get_power_consumption():
    try:
        power_data = {
            "timestamp": datetime.now().timestamp(),  # Current time in timestamp
            "cpu_power": psutil.cpu_percent(interval=1),  # CPU power usage (percentage)
            "gpu_power": None,  # Placeholder, as GPU power data can vary
            "status": "success"
        }
        
        # Add logic for getting GPU power if available (may need additional libraries for GPU)
        # For now, it's a placeholder
        # Example for GPU data: power_data["gpu_power"] = get_gpu_power()  # If a method to get GPU power is available
        
        return power_data
    except Exception as e:
        return {"error": f"An error occurred while fetching power consumption data: {str(e)}"}

# Function to get battery information including system uptime and other details
def get_battery_info():
    try:
        battery = psutil.sensors_battery()
        if battery is None:
            return {"error": "No battery detected"}

        system_uptime = get_system_uptime()

        return {
            "battery_level": battery.percent,
            "is_charging": battery.power_plugged,
            "charging_status": get_charging_status(),
            "time_left": battery.secsleft if battery.secsleft != psutil.POWER_TIME_UNLIMITED else -1,
            "system_power_usage": get_system_power_usage(),
            "battery_discharge_rate": get_battery_discharge_rate(),
            "system_uptime": system_uptime
        }
    except Exception as e:
        return {"error": f"An error occurred while fetching battery info: {str(e)}"}

@app.get("/battery")
def battery_status():
    return JSONResponse(content=get_battery_info())

@app.get("/power_consumption")
def power_consumption_status():
    return JSONResponse(content=get_power_consumption())
