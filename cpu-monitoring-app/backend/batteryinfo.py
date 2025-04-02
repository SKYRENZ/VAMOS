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
