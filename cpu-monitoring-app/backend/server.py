from fastapi import FastAPI
from fastapi.responses import JSONResponse
import psutil
import time
import platform

app = FastAPI()

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
        # Get CPU temperature (may not be available on all systems)
        temp = psutil.sensors_temperatures().get("coretemp", [{}])[0].get("current", 50)
        return JSONResponse(content={"temperature": temp})
    except Exception as e:
        print("Error fetching CPU temperature:", e)
        return JSONResponse(content={"error": "Failed to fetch temperature"}, status_code=500)


