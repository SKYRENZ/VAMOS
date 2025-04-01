from fastapi import FastAPI
from fastapi.responses import JSONResponse
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
from datetime import datetime
import urllib.request
from fastapi.middleware.cors import CORSMiddleware
import random

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global cache for network data
network_cache = {
    "network_data": None,
    "speed_test": None,
    "connected_devices": None,
    "last_updated": None
}

# Background update thread
update_thread = None
stop_thread = False

def get_mac_address():
    """Get the MAC address of the main interface"""
    try:
        mac = ':'.join(re.findall('..', '%012x' % uuid.getnode()))
        return mac
    except:
        return "00:00:00:00:00:00"

def get_connection_type():
    """Determine the connection type (WiFi or Ethernet)"""
    try:
        interfaces = psutil.net_if_stats()
        for interface, stats in interfaces.items():
            if stats.isup:
                if "wi" in interface.lower() or "wl" in interface.lower():
                    return "Wi-Fi"
                elif "eth" in interface.lower() or "en" in interface.lower():
                    return "Ethernet"
        return "Unknown"
    except:
        return "Unknown"

def get_signal_strength():
    """Get WiFi signal strength (only works on some platforms)"""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output("netsh wlan show interfaces", shell=True).decode()
            match = re.search(r"Signal\s+:\s+(\d+)%", output)
            if match:
                return int(match.group(1))
        elif platform.system() == "Linux":
            output = subprocess.check_output("iwconfig 2>/dev/null | grep -i quality", shell=True).decode()
            match = re.search(r"Quality=(\d+)/(\d+)", output)
            if match:
                return int(int(match.group(1)) / int(match.group(2)) * 100)
        return 80  # Default if we can't determine
    except:
        return 80  # Default value

def get_ping():
    """Measure ping to Google's DNS"""
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        command = ["ping", param, "1", "8.8.8.8"]
        output = subprocess.check_output(command).decode()
        
        if platform.system().lower() == "windows":
            match = re.search(r"Average = (\d+)ms", output)
        else:
            match = re.search(r"time=(\d+\.\d+) ms", output)
            
        if match:
            return int(float(match.group(1)))
        return 0
    except:
        return 0

def get_packet_loss():
    """Measure packet loss to Google's DNS"""
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        command = ["ping", param, "10", "8.8.8.8"]
        output = subprocess.check_output(command).decode()
        
        if platform.system().lower() == "windows":
            match = re.search(r"Lost = (\d+) \((\d+)%", output)
            if match:
                return int(match.group(2))
        else:
            match = re.search(r"(\d+)% packet loss", output)
            if match:
                return int(match.group(1))
        return 0
    except:
        return 0

def get_dns_server():
    """Get the DNS server"""
    try:
        if platform.system() == "Windows":
            output = subprocess.check_output("ipconfig /all", shell=True).decode()
            match = re.search(r"DNS Servers[^\n]+:\s*([^\s]+)", output)
            if match:
                return match.group(1)
        elif platform.system() == "Linux":
            with open("/etc/resolv.conf") as f:
                for line in f:
                    if "nameserver" in line:
                        return line.split()[1]
        return "8.8.8.8"  # Default if we can't determine
    except:
        return "8.8.8.8"  # Default value

def run_speed_test():
    """Run a speed test"""
    try:
        # For faster demo purposes, return simulated data instead of running actual test
        # Comment this out to use real speedtest
        return {
            "download": round(random.uniform(50.0, 120.0), 1),
            "upload": round(random.uniform(15.0, 40.0), 1),
            "ping": round(random.uniform(15, 50), 0)
        }
        
        # Original speed test code - uncomment to use real test
        # st = speedtest.Speedtest()
        # st.get_best_server()
        # download = st.download() / 1_000_000  # Convert to Mbps
        # upload = st.upload() / 1_000_000  # Convert to Mbps
        # ping = st.results.ping
        
        # return {
        #     "download": round(download, 1),
        #     "upload": round(upload, 1),
        #     "ping": round(ping, 0)
        # }
    except Exception as e:
        logging.error(f"Speed test error: {e}")
        return {
            "download": 0,
            "upload": 0,
            "ping": 0
        }

def scan_network():
    """Scan for devices on the network"""
    try:
        # Get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        
        # Get network prefix
        ip_parts = local_ip.split('.')
        network_prefix = '.'.join(ip_parts[:-1]) + '.'
        
        # Scan common IPs
        devices = []
        for i in range(1, 10):  # Limit to 10 IPs for performance
            ip = network_prefix + str(i)
            if ip == local_ip:
                devices.append({
                    "id": "this-device",
                    "name": "This Device",
                    "status": "Active",
                    "ipAddress": ip,
                    "macAddress": get_mac_address()
                })
                continue
                
            # Try to ping the IP
            param = "-n" if platform.system().lower() == "windows" else "-c"
            command = ["ping", param, "1", "-W", "1", ip]
            try:
                subprocess.check_output(command, stderr=subprocess.STDOUT)
                # If we get here, the ping was successful
                hostname = "Unknown Device"
                try:
                    hostname = socket.gethostbyaddr(ip)[0]
                except:
                    pass
                
                devices.append({
                    "id": f"device-{i}",
                    "name": hostname,
                    "status": "Active",
                    "ipAddress": ip,
                    "macAddress": "Unknown"  # Getting MAC requires ARP which needs root
                })
            except:
                pass
        
        # Always add router
        router_ip = network_prefix + "1"
        if not any(d["ipAddress"] == router_ip for d in devices):
            devices.append({
                "id": "router",
                "name": "Router",
                "status": "Active",
                "ipAddress": router_ip,
                "macAddress": "Unknown"
            })
            
        return devices
    except Exception as e:
        logging.error(f"Network scan error: {e}")
        return [{
            "id": "this-device",
            "name": "This Device",
            "status": "Active",
            "ipAddress": "127.0.0.1",
            "macAddress": get_mac_address()
        }]

def update_network_data():
    """Update all network data"""
    try:
        # Get network interfaces
        net_io = psutil.net_io_counters()
        
        # Calculate current speeds
        time.sleep(1)  # Wait 1 second to measure
        net_io_after = psutil.net_io_counters()
        download_speed = (net_io_after.bytes_recv - net_io.bytes_recv) * 8 / 1_000_000  # Mbps
        upload_speed = (net_io_after.bytes_sent - net_io.bytes_sent) * 8 / 1_000_000  # Mbps
        
        # Get hostname and IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Try to get public IP
        try:
            public_ip = urllib.request.urlopen('https://api.ipify.org').read().decode('utf8')
        except:
            public_ip = local_ip
            
        network_cache["network_data"] = {
            "connectionType": get_connection_type(),
            "signalStrength": get_signal_strength(),
            "downloadSpeed": round(download_speed, 1),
            "uploadSpeed": round(upload_speed, 1),
            "ping": get_ping(),
            "packetLoss": get_packet_loss(),
            "ipAddress": public_ip,
            "dnsServer": get_dns_server(),
            "macAddress": get_mac_address()
        }
        
        network_cache["connected_devices"] = scan_network()
        network_cache["last_updated"] = datetime.now().isoformat()
        
        print("Network data updated")
    except Exception as e:
        logging.error(f"Update error: {e}")

def background_updater():
    """Background thread to update network data periodically"""
    global stop_thread
    while not stop_thread:
        update_network_data()
        time.sleep(30)  # Update every 30 seconds

# Network Monitoring Endpoints
@app.get("/api/network")
async def get_network_data():
    """API endpoint to get network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    return JSONResponse(content=network_cache["network_data"])

@app.get("/api/speedtest")
async def get_speed_test():
    """API endpoint to run a speed test"""
    network_cache["speed_test"] = run_speed_test()
    return JSONResponse(content=network_cache["speed_test"])

@app.get("/api/devices")
async def get_devices():
    """API endpoint to get connected devices"""
    if network_cache["connected_devices"] is None:
        network_cache["connected_devices"] = scan_network()
    return JSONResponse(content=network_cache["connected_devices"])

@app.get("/api/all")
async def get_all_data():
    """API endpoint to get all network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    return JSONResponse(content={
        "networkData": network_cache["network_data"],
        "connectedDevices": network_cache["connected_devices"],
        "lastUpdated": network_cache["last_updated"]
    })

# System Monitoring Endpoints
@app.get("/cpu-usage")
async def get_cpu_usage():
    cpu_percent = psutil.cpu_percent(interval=1)
    return JSONResponse(content={"cpu_usage": cpu_percent})

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

@app.get("/cpu-temperature")
async def get_cpu_temperature():
    try:
        # Get CPU temperature (may not be available on all systems)
        temp = psutil.sensors_temperatures().get("coretemp", [{}])[0].get("current", 50)
        return JSONResponse(content={"temperature": temp})
    except Exception as e:
        print("Error fetching CPU temperature:", e)
        return JSONResponse(content={"error": "Failed to fetch temperature"}, status_code=500)

if __name__ == "__main__":
    # Start background updater thread
    update_thread = threading.Thread(target=background_updater)
    update_thread.daemon = True
    update_thread.start()
    
    try:
        print("Server running on http://localhost:5000")
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=5000)
    finally:
        stop_thread = True
        if update_thread:
            update_thread.join(timeout=1)


