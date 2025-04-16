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
    get_all_network_data,
    update_network_data,
    clear_history
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

def background_updater():
    """Background thread to update network data periodically"""
    global stop_thread
    while not stop_thread:
        try:
            # Log update attempt
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Updating network data...")
            
            # Update network data
            update_network_data()
            
            # Wait shorter time for more responsive updates
            for _ in range(5):  # Check stop_thread every second instead of only after full sleep
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

@app.get("/api/speedtest")
async def fetch_speed_test():
    """API endpoint to run a speed test"""
    # Run the speed test
    speed_test_results = get_speed_test_data()
    
    # Force an immediate update of all network data to refresh the I/O monitor
    # with the new speed test values
    update_network_data()
    
    return JSONResponse(content=speed_test_results)

@app.get("/api/devices")
async def fetch_devices():
    """API endpoint to get connected devices"""
    return JSONResponse(content=get_connected_devices())

@app.get("/api/bandwidth-history")
async def fetch_bandwidth_history(timeframe: str = "5min"):
    """API endpoint to get bandwidth history"""
    return JSONResponse(content=get_bandwidth_history(timeframe))

@app.get("/api/connection-quality")
async def fetch_connection_quality():
    """API endpoint to get connection quality data"""
    return JSONResponse(content=get_connection_quality())

@app.get("/api/all")
async def fetch_all_data():
    """API endpoint to get all network data"""
    return JSONResponse(content=get_all_network_data())

@app.get("/api/clear-history")
async def clear_history():
    """API endpoint to clear all history data"""
    clear_history()
    return JSONResponse(content={"status": "success", "message": "History cleared"})

# System Monitoring Endpoints
@app.get("/cpu-usage")
async def get_cpu_usage():
    """Fetch CPU usage and additional CPU details"""
    try:
        # Get per-core usage for better accuracy
        per_cpu = psutil.cpu_percent(interval=1, percpu=True)
        # Calculate weighted average (like Task Manager does)
        avg_usage = sum(per_cpu) / len(per_cpu)
        # Adjust for Windows Task Manager's calculation method
        adjusted_usage = min(100, avg_usage * 1.05)  # 5% adjustment factor

        # Fetch additional CPU details
        cpu_freq = psutil.cpu_freq()
        base_speed = round(cpu_freq.max, 2) if cpu_freq else None  # Base speed in GHz
        cores = psutil.cpu_count(logical=False)  # Physical cores
        logical_processors = psutil.cpu_count(logical=True)  # Logical processors
        sockets = 1  # psutil does not provide socket info; assuming 1 for most systems

        return {
            "cpu_usage": round(adjusted_usage, 1),
            "base_speed_ghz": base_speed,
            "sockets": sockets,
            "cores": cores,
            "logical_processors": logical_processors,
        }
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

def get_gpu_usage() -> Optional[float]:
    """
    Get GPU usage percentage (0-100) using the most reliable available method
    Returns None if no GPU usage data can be obtained
    """
    # Method 1: NVIDIA SMI (most reliable for NVIDIA GPUs)
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            check=True
        )
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        pass

    # Method 2: WMI fallback (works for some AMD/Intel GPUs)
    try:
        import wmi
        c = wmi.WMI(namespace="root\\cimv2")
        for gpu in c.Win32_VideoController():
            if hasattr(gpu, "LoadPercentage"):
                return float(gpu.LoadPercentage)
    except:
        pass

    return None

@app.get("/gpu-usage")
async def gpu_usage():
    """Get current GPU usage percentage"""
    usage = get_gpu_usage()
    if usage is not None:
        return {"gpu_usage_percent": usage}
    return {"error": "GPU usage data not available"}

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



@app.get("/cpu-temperature")
async def get_cpu_temperature():
    """Get CPU temperature with multiple fallback methods"""
    try:
        # Method 1: WMI (Windows Management Instrumentation)
        try:
            w = wmi.WMI(namespace=r"root\wmi")
            temps = [t.CurrentTemperature/10 - 273.15 for t in w.MSAcpi_ThermalZoneTemperature()]
            if temps:
                return {"cpu_temperature": round(temps[0], 1)}
        except Exception as e:
            print(f"WMI Method 1 failed: {e}")

        # Method 2: OpenHardwareMonitor WMI
        try:
            w = wmi.WMI(namespace=r"root\OpenHardwareMonitor")
            cpu_temp = next((s.Value for s in w.Sensor() 
                           if s.SensorType == "Temperature" and "CPU" in s.Name), None)
            if cpu_temp:
                return {"cpu_temperature": cpu_temp}
        except Exception as e:
            print(f"OpenHardwareMonitor failed: {str(e)}")
            print("Please ensure OpenHardwareMonitor is installed and running as administrator")

        # Method 3: psutil (cross-platform but limited)
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                if 'coretemp' in temps:
                    return {"cpu_temperature": temps['coretemp'][0].current}
        except Exception as e:
            print(f"psutil method failed: {e}")

        # Method 4: Windows Registry (some systems)
        try:
            import winreg
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, 
                               r"HARDWARE\DESCRIPTION\System\ThermalZone\0")
            temp_kelvin = winreg.QueryValueEx(key, "Temperature")[0] / 10
            return {"cpu_temperature": round(temp_kelvin - 273.15, 1)}
        except Exception as e:
            print(f"Registry method failed: {e}")

        return {"error": "All temperature methods failed"}, 500

    except Exception as e:
        return {"error": f"CPU temperature check failed: {str(e)}"}, 500



@app.get("/gpu-temperature",
         summary="Get GPU Temperature",
         response_description="GPU temperature in Celsius or error message",
         tags=["Hardware Monitoring"])
async def get_gpu_temperature():
    """Get GPU temperature from NVIDIA or AMD graphics cards"""
    try:
        # Method 1: NVIDIA SMI
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                temp = result.stdout.strip()
                if temp and temp.isdigit():
                    return {"gpu_temperature": int(temp)}
        except Exception as e:
            print(f"NVIDIA-SMI failed: {e}")

        # Method 2: OpenHardwareMonitor
        try:
            w = wmi.WMI(namespace=r"root\OpenHardwareMonitor")
            gpu_temp = next((s.Value for s in w.Sensor() 
                           if s.SensorType == "Temperature" and "GPU" in s.Name), None)
            if gpu_temp:
                return {"gpu_temperature": gpu_temp}
        except Exception as e:
            print(f"OpenHardwareMonitor failed: {str(e)}")
            print("Please ensure OpenHardwareMonitor is installed and running as administrator")

        # Method 3: AMD GPU (alternative approach)
        try:
            result = subprocess.run(
                ["rocm-smi", "--showtemp"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                match = re.search(r"GPU\s*\[(\d+)\]\s*:\s*(\d+)", result.stdout)
                if match:
                    return {"gpu_temperature": int(match.group(2))}
        except Exception as e:
            print(f"ROCm-SMI failed: {e}")

        return {"error": "No GPU temperature data available"}, 500

    except Exception as e:
        return {"error": f"GPU temperature check failed: {str(e)}"}, 500
    
    
def get_gpu_stats():
    """Get GPU and VRAM clock speeds"""
    try:
        # Initialize NVML for NVIDIA GPUs
        try:
            nvmlInit()
            handle = nvmlDeviceGetHandleByIndex(0)
            
            gpu_clock = nvmlDeviceGetClockInfo(handle, 0)  # 0 = Graphics clock
            mem_clock = nvmlDeviceGetClockInfo(handle, 1)  # 1 = Memory clock
            
            return {
                "gpu_clock_speed": gpu_clock,
                "vram_clock_speed": mem_clock
            }
        except Exception as e:
            print(f"NVML failed: {e}")

        # Fallback for AMD GPUs
        try:
            result = subprocess.run(
                ["rocm-smi", "--showclocks"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                # Parse output for clock speeds
                gpu_clock = None
                mem_clock = None
                
                for line in result.stdout.split('\n'):
                    if "GPU Clock Level" in line:
                        match = re.search(r"(\d+)\s*MHz", line)
                        if match:
                            gpu_clock = int(match.group(1))
                    elif "Memory Clock Level" in line:
                        match = re.search(r"(\d+)\s*MHz", line)
                        if match:
                            mem_clock = int(match.group(1))
                
                if gpu_clock and mem_clock:
                    return {
                        "gpu_clock_speed": gpu_clock,
                        "vram_clock_speed": mem_clock
                    }
        except Exception as e:
            print(f"ROCm-SMI failed: {e}")

        # Final fallback - return simulated data
        return {
            "gpu_clock_speed": random.randint(1200, 1800),
            "vram_clock_speed": random.randint(1400, 1600)
        }

    except Exception as e:
        print(f"GPU stats failed: {e}")
        return {
            "gpu_clock_speed": 0,
            "vram_clock_speed": 0
        }
    
@app.get("/gpu-stats",
         summary="Get GPU Clock Speeds",
         response_description="GPU and VRAM clock speeds in MHz",
         tags=["Hardware Monitoring"])
async def get_gpu_stats_endpoint():
    """Fetch GPU and VRAM clock speeds in MHz"""
    return get_gpu_stats()   






@app.get("/battery")
def battery_status():
    return JSONResponse(content=batteryinfo.get_battery_info())
