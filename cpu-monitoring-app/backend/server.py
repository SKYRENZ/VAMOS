from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi import FastAPI, HTTPException
from typing import Optional, List, Dict
import psutil
import time
import platform
import socket
import speedtest
import subprocess
import re
import uuid
import threading
import logging
from datetime import datetime, timedelta
import urllib.request
from fastapi.middleware.cors import CORSMiddleware
from pynvml import nvmlInit, nvmlDeviceGetHandleByIndex, nvmlDeviceGetTemperature, nvmlDeviceGetClockInfo
import random
import wmi
import subprocess
from gaming_mode import router as gaming_mode_router
from typing import Optional
from collections import deque
from disk_info import get_disk_data
from memory_info import get_memory_data
from system_info import get_system_info_response
import batteryinfo
from network_info import (
    get_network_data,
    get_speed_test_data,
    get_connected_devices,
    get_bandwidth_history,
    get_connection_quality,
    get_data_transfer_history,
    get_all_network_data,
    update_network_data,
    clear_history,
    get_network_io as get_network_io_data,
    format_bytes,
    DateTimeEncoder,
    safe_json_dump
)
from pydantic import BaseModel
import json
from hardware_info import (
    get_cpu_usage,
    get_cpu_temperature,
    get_gpu_usage,
    get_gpu_temperature,
    get_gpu_stats,
)

app = FastAPI()
print(app.routes)
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start background network data update thread
update_thread = None
stop_thread = False

# Add a global variable to track speed test status
speed_test_status = {
    "running": False,
    "progress": 0,
    "phase": "",
    "start_time": None
}

# Add a flag to track the status of currently running speed test
is_speed_test_running = False

class PlanRequest(BaseModel):
    plan: str  # SCHEME_MIN or SCHEME_MAX

def background_updater():
    """Background thread to update network data periodically"""
    global stop_thread
    while not stop_thread:
        try:
            # Log update attempt
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Updating network data...")
            
            # Update network data
            update_network_data()
            
            # Wait 30 seconds before next update
            for _ in range(30):  # Check stop_thread every second
                if stop_thread:
                    break
                time.sleep(1)
        except Exception as e:
            logging.error(f"Error in background updater: {e}")
            time.sleep(5)  # Wait a bit before retrying after error

@app.on_event("startup")
async def startup_event():
    """Start background threads when the server starts"""
    global update_thread, stop_thread
    stop_thread = False
    update_thread = threading.Thread(target=background_updater)
    update_thread.daemon = True
    update_thread.start()
    
    # Force an immediate data update on startup
    try:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Performing initial data collection...")
        update_network_data()
    except Exception as e:
        logging.error(f"Error in startup data collection: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background threads when the server shuts down"""
    global stop_thread
    stop_thread = True
    if update_thread:
        update_thread.join(timeout=1.0)

@app.get("/system-info")
async def get_system_info():
    """API endpoint to fetch system information."""
    return get_system_info_response()

@app.get("/api/memory")
async def fetch_memory():
    """API endpoint to fetch memory information."""
    return get_memory_data()

@app.get("/api/disks")
async def fetch_disks():
    """API endpoint to fetch disk information."""
    return get_disk_data()

# Network Monitoring Endpoints
@app.get("/api/network")
async def fetch_network_data():
    """API endpoint to get network data"""
    return JSONResponse(content=get_network_data())

@app.get("/api/speedtest/status")
async def speed_test_status_endpoint():
    """Get the current status of a speed test"""
    global speed_test_status
    
    # If a test has been running for more than 2 minutes, assume it failed
    if speed_test_status["running"] and speed_test_status["start_time"]:
        if (datetime.now() - speed_test_status["start_time"]).total_seconds() > 120:
            speed_test_status = {
                "running": False,
                "progress": 0,
                "phase": "",
                "start_time": None
            }
    
    # Make a copy and convert datetime to string to make it JSON serializable
    status_copy = speed_test_status.copy()
    if status_copy.get("start_time"):
        status_copy["start_time"] = status_copy["start_time"].isoformat()
        
    return DateTimeJSONResponse(content=status_copy)

@app.get("/api/speedtest")
async def fetch_speed_test():
    """API endpoint to run a speed test"""
    global speed_test_status, is_speed_test_running
    
    # If a test is already running, return status
    if is_speed_test_running:
        # Convert datetime to string to make it JSON serializable
        status_copy = speed_test_status.copy()
        if status_copy.get("start_time"):
            status_copy["start_time"] = status_copy["start_time"].isoformat()
        return DateTimeJSONResponse(content={"message": "Speed test already in progress", "status": status_copy})
    
    # Set the status to running
    speed_test_status = {
        "running": True,
        "progress": 0,
        "phase": "Starting speed test...",
        "start_time": datetime.now()
    }
    is_speed_test_running = True
    
    # Run the speed test in a background thread
    def run_speed_test_thread():
        global speed_test_status, is_speed_test_running
        try:
            # Run the speed test - network data update is already handled in get_speed_test_data
            speed_test_status["phase"] = "Running speed test..."
            speed_test_status["progress"] = 50
            speed_test_results = get_speed_test_data()
            
            # Force an immediate network data update to reflect new state
            speed_test_status["phase"] = "Updating network data..."
            speed_test_status["progress"] = 90
            update_network_data()
            
            # Schedule an additional quick update after 5 seconds
            def delayed_update():
                time.sleep(5)
                try:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Running post-test quick update")
                    update_network_data()
                except Exception as e:
                    print(f"Error in delayed update: {e}")
            
            # Start a thread for the delayed update
            update_thread = threading.Thread(target=delayed_update)
            update_thread.daemon = True
            update_thread.start()
            
            # Mark test as completed
            speed_test_status = {
                "running": False,
                "progress": 100,
                "phase": "Test completed",
                "start_time": None
            }
            is_speed_test_running = False
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Speed test completed successfully")
        except Exception as e:
            speed_test_status = {
                "running": False,
                "progress": 0,
                "phase": "",
                "start_time": None
            }
            is_speed_test_running = False
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Speed test failed: {e}")
    
    # Start the background thread
    test_thread = threading.Thread(target=run_speed_test_thread)
    test_thread.daemon = True
    test_thread.start()
    
    # Return immediately with the status (convert datetime to string)
    status_copy = speed_test_status.copy()
    if status_copy.get("start_time"):
        status_copy["start_time"] = status_copy["start_time"].isoformat()
    return DateTimeJSONResponse(content={"message": "Speed test started", "status": status_copy})

@app.get("/api/devices")
async def fetch_devices():
    """API endpoint to get connected devices"""
    return JSONResponse(content=get_connected_devices())

@app.get("/api/bandwidth-history")
async def fetch_bandwidth_history(timeframe: str = "5min"):
    """API endpoint to get bandwidth history"""
    return JSONResponse(content=get_bandwidth_history(timeframe))

@app.get("/api/data-transfer-history")
async def fetch_data_transfer_history(timeframe: str = "5min"):
    """API endpoint to get data transfer history"""
    return JSONResponse(content=get_data_transfer_history(timeframe))

@app.get("/api/connection-quality")
async def fetch_connection_quality():
    """API endpoint to get connection quality data"""
    return JSONResponse(content=get_connection_quality())

@app.get("/api/all")
async def fetch_all_data():
    """API endpoint to get all network data"""
    return DateTimeJSONResponse(content=get_all_network_data())

@app.get("/api/clear-history")
async def clear_history():
    """API endpoint to clear all history data"""
    clear_history()
    return JSONResponse(content={"status": "success", "message": "History cleared"})

@app.get("/api/network-io")
async def get_network_io():
    """Get Network I/O data"""
    io_data = get_network_io_data()
    
    # Calculate total bytes directly from bandwidth history for consistency
    total_bytes_received = sum(item["download"] for item in get_bandwidth_history("1day"))
    total_bytes_sent = sum(item["upload"] for item in get_bandwidth_history("1day"))
    
    # Replace the single-interval values with cumulative totals
    io_data["bytesSent"] = total_bytes_sent
    io_data["bytesReceived"] = total_bytes_received
    io_data["bytesSentFormatted"] = format_bytes(total_bytes_sent)
    io_data["bytesReceivedFormatted"] = format_bytes(total_bytes_received)
    
    return io_data

# System Monitoring Endpoints
@app.get("/cpu-usage")
async def cpu_usage():
    """Fetch CPU usage and additional CPU details."""
    return get_cpu_usage()

@app.get("/cpu-temperature")
async def cpu_temperature():
    """Get CPU temperature."""
    return get_cpu_temperature()

@app.get("/gpu-usage")
async def gpu_usage():
    """Get current GPU usage percentage."""
    usage = get_gpu_usage()
    if usage is not None:
        return {"gpu_usage_percent": usage}
    return {"error": "GPU usage data not available"}

@app.get("/gpu-temperature")
async def gpu_temperature():
    """Get GPU temperature."""
    return get_gpu_temperature()

@app.get("/gpu-stats")
async def gpu_stats():
    """Fetch GPU and VRAM clock speeds, and GPU core count."""
    return get_gpu_stats()

@app.get("/disk-usage")
async def get_disk_usage():
    disk = psutil.disk_usage('/')
    return JSONResponse(content={
        "total_disk_space": disk.total,
        "used_disk_space": disk.used,
        "free_disk_space": disk.free,
        "disk_usage_percent": disk.percent
    })

@app.get("/processes")
async def get_processes():
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
        try:
            processes.append({
                "pid": proc.info['pid'],
                "name": proc.info['name'],
                "cpu_percent": proc.info['cpu_percent'],
                "memory_usage": proc.info['memory_info'].rss  # Resident Set Size (RAM)
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    return JSONResponse(content={"processes": processes})

@app.get("/battery")
def battery_status():
    return JSONResponse(content=batteryinfo.get_battery_info())

# Map of power plans with human-readable names (case-sensitive)
power_plans = {
    "High Performance": "SCHEME_MIN",
    "Power Saver": "SCHEME_MAX",
    "Balanced": "381b4222-f694-41f0-9685-ff5bb260df2e",
    "8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c": "SCHEME_MIN",  # high
    "a1841308-3541-4fab-bc81-f71556f20b4a": "SCHEME_MAX",  # power saver
    "381b4222-f694-41f0-9685-ff5bb260df2e": "381b4222-f694-41f0-9685-ff5bb260df2e",  # balanced
}

@app.post("/set_power_plan")
def set_power_plan(req: PlanRequest):
    # Get the selected plan value from the request (it should be in human-readable form)
    selected_plan = power_plans.get(req.plan, req.plan)  # Fallback to GUID if not found in the dictionary

    try:
        subprocess.run(["powercfg", "/setactive", selected_plan], check=True)
        return {"message": f"Switched to {req.plan}"}
    except subprocess.CalledProcessError as e:
        return {"error": str(e)}

@app.get("/power_consumption")
def power_consumption_status():
    return JSONResponse(content=batteryinfo.get_power_consumption())

@app.on_event("shutdown")
async def shutdown_event():
    print("Shutting down cleanly...")

@app.get("/api/speedtest/result")
async def get_speed_test_result():
    """Get the result of the most recent speed test"""
    from network_info import network_cache
    
    if network_cache.get("speed_test") is None:
        return DateTimeJSONResponse(content={"error": "No speed test has been run yet"})
    
    return DateTimeJSONResponse(content=network_cache["speed_test"])

app.include_router(gaming_mode_router)

# Custom JSONResponse that uses DateTimeEncoder for handling datetime objects
class DateTimeJSONResponse(JSONResponse):
    def render(self, content):
        return json.dumps(content, cls=DateTimeEncoder).encode("utf-8")
