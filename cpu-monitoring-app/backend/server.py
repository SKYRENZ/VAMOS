from fastapi import FastAPI
from fastapi.responses import JSONResponse
import psutil
import time
import platform
import wmi
import subprocess
import json
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React app URL
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)
# CPU Usage Monitoring
@app.get("/cpu-usage")
async def get_cpu_usage():
    cpu_percent = psutil.cpu_percent(interval=1)
    return JSONResponse(content={"cpu_usage": cpu_percent})

# Memory Usage Monitoring
@app.get("/memory-usage")
async def get_memory_usage():
    memory = psutil.virtual_memory()
    return JSONResponse(content={
        "total_memory": memory.total,
        "available_memory": memory.available,
        "used_memory": memory.used,
        "memory_usage_percent": memory.percent
    })

@app.get("/disk-usage")
async def get_disk_usage():
    disk = psutil.disk_usage('/')
    return JSONResponse(content={
        "total_disk_space": disk.total,
        "used_disk_space": disk.used,
        "free_disk_space": disk.free,
        "disk_usage_percent": disk.percent
    })

@app.get("/network-activity")
async def get_network_activity():
    # Get initial network stats
    net1 = psutil.net_io_counters()

    # Wait for one second to calculate speed
    time.sleep(1)

    # Get network stats after one second
    net2 = psutil.net_io_counters()

    # Calculate download and upload speeds (in bytes per second)
    download_speed = (net2.bytes_recv - net1.bytes_recv)
    upload_speed = (net2.bytes_sent - net1.bytes_sent)

    return JSONResponse(content={
        "download_speed_bps": download_speed,
        "upload_speed_bps": upload_speed
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

@app.get("/system-info")
async def get_system_info():
    uptime_seconds = time.time() - psutil.boot_time()
    uptime_string = time.strftime("%H:%M:%S", time.gmtime(uptime_seconds))

    return JSONResponse(content={
        "os": platform.system(),
        "os_version": platform.version(),
        "hostname": platform.node(),
        "architecture": platform.architecture()[0],
        "uptime": uptime_string
    })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)

@app.get("/cpu-temperature")
async def get_cpu_temperature():
    try:
        # Initialize WMI
        w = wmi.WMI(namespace="root\\wmi")
        
        # Try the most common WMI temperature class
        temperatures = [t.CurrentTemperature/10 - 273.15 for t in w.MSAcpi_ThermalZoneTemperature()]
        if temperatures:
            return JSONResponse(content={"cpu_temperature": round(temperatures[0], 2)})
        
        # Fallback to alternative WMI classes
        w_cimv2 = wmi.WMI(namespace="root\\cimv2")
        
        # Try Win32_TemperatureProbe
        probes = w_cimv2.Win32_TemperatureProbe()
        if probes:
            return JSONResponse(content={"cpu_temperature": probes[0].CurrentReading})
        
        # Try Win32_PerfFormattedData_Counters_ThermalZoneInformation
        thermal_zones = w_cimv2.Win32_PerfFormattedData_Counters_ThermalZoneInformation()
        if thermal_zones:
            temp_kelvin = thermal_zones[0].HighPrecisionTemperature / 10
            return JSONResponse(content={"cpu_temperature": temp_kelvin - 273.15})
        
        return JSONResponse(content={"error": "No temperature data available via WMI"}, status_code=500)
    
    except Exception as e:
        return JSONResponse(content={"error": f"WMI query failed: {str(e)}"}, status_code=500)



@app.get("/gpu-temperature")
async def get_gpu_temperature():
    print("Fetching GPU temperature...")  # Debugging
    try:
        result = subprocess.run(["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"], capture_output=True, text=True)
        gpu_temperature = result.stdout.strip()

        if gpu_temperature:
            return JSONResponse(content={"gpu_temperature": gpu_temperature})
        else:
            return JSONResponse(content={"error": "Failed to fetch GPU temperature"}, status_code=500)

    except Exception as e:
        print("Error fetching GPU temperature:", e)
        return JSONResponse(content={"error": "Failed to fetch GPU temperature"}, status_code=500)

# 🚀 Move this block to the **very bottom**
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)

