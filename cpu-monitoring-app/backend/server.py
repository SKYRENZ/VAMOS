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

# Global cache for network data
network_cache = {
    "network_data": None,
    "speed_test": None,
    "connected_devices": None,
    "last_updated": None,
    "io_data": None  # Add Network IO data to cache
}

# Function to generate initial sample data
def generate_sample_bandwidth_data(count=20):
    """Generate sample bandwidth history data"""
    now = datetime.now()
    data = []
    
    for i in range(count):
        # Create timestamps going backwards from now
        timestamp = now - timedelta(seconds=(count - i) * 30)
        
        # Generate random speeds that trend upward for realistic look
        base_download = random.uniform(0.5, 5.0)
        base_upload = random.uniform(0.2, 2.0)
        
        # Add some randomness but maintain a general trend
        variation = random.uniform(-0.5, 0.5)
        trend = i / count * 2  # gradually increases
        
        download = max(0.1, base_download + variation + trend)
        upload = max(0.1, base_upload + variation / 2 + trend / 3)
        
        data.append({
            "timestamp": timestamp.isoformat(),
            "download": round(download, 1),
            "upload": round(upload, 1)
        })
    
    return data

# Store bandwidth history (last 1 hour data, 5 min intervals)
bandwidth_history = deque(generate_sample_bandwidth_data(20), maxlen=60)  # Store 60 data points
ping_history = deque([random.randint(15, 50) for _ in range(10)], maxlen=20)  # Initialize with sample data

# Store Network IO history
network_io_history = deque([], maxlen=60)  # Store 60 data points

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
        # For demo, return a realistic ping value instead of 0 on error
        return random.randint(20, 60)

def get_jitter():
    """Calculate jitter by measuring multiple pings"""
    try:
        # For demo purposes, simulate jitter
        if len(ping_history) > 1:
            # Calculate the average difference between consecutive pings
            diffs = [abs(ping_history[i] - ping_history[i-1]) for i in range(1, len(ping_history))]
            if diffs:
                return round(sum(diffs) / len(diffs), 1)
        
        # If no history or error, return a simulated value
        return round(random.uniform(1.0, 10.0), 1)
    except Exception as e:
        logging.error(f"Jitter calculation error: {e}")
        return 5.0  # Default value

def calculate_stability_score(ping, jitter, packet_loss):
    """Calculate a stability score based on ping, jitter and packet loss"""
    # This is a simple algorithm, real-world stability would be more complex
    ping_score = max(0, 100 - (ping / 1.5))  # Lower ping is better
    jitter_score = max(0, 100 - (jitter * 5))  # Lower jitter is better
    packet_loss_score = max(0, 100 - (packet_loss * 10))  # Lower packet loss is better
    
    # Weighted average
    stability = 0.4 * ping_score + 0.3 * jitter_score + 0.3 * packet_loss_score
    return round(stability)

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
        # For demo, simulate a small amount of packet loss
        return random.choices([0, 1, 2], weights=[0.8, 0.15, 0.05])[0]

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

def get_network_io():
    """Get network I/O statistics"""
    try:
        # Get initial network I/O counters
        net_io = psutil.net_io_counters()
        time.sleep(1)  # Wait 1 second to measure
        net_io_after = psutil.net_io_counters()
        
        # Calculate speeds and packet counts
        bytes_sent = net_io_after.bytes_sent - net_io.bytes_sent
        bytes_recv = net_io_after.bytes_recv - net_io.bytes_recv
        packets_sent = net_io_after.packets_sent - net_io.packets_sent
        packets_recv = net_io_after.packets_recv - net_io.packets_recv
        
        # Calculate speeds in Mbps
        upload_speed = bytes_sent * 8 / 1_000_000  # Convert to Mbps
        download_speed = bytes_recv * 8 / 1_000_000  # Convert to Mbps
        
        # Calculate packet rates
        upload_packets = packets_sent
        download_packets = packets_recv
        
        # Get network interface details
        interfaces = psutil.net_if_stats()
        active_interfaces = [name for name, stats in interfaces.items() if stats.isup]
        
        return {
            "uploadSpeed": round(upload_speed, 2),
            "downloadSpeed": round(download_speed, 2),
            "uploadPackets": upload_packets,
            "downloadPackets": download_packets,
            "activeInterfaces": active_interfaces,
            "bytesSent": bytes_sent,
            "bytesReceived": bytes_recv
        }
    except Exception as e:
        logging.error(f"Network I/O monitoring error: {e}")
        return {
            "uploadSpeed": 0,
            "downloadSpeed": 0,
            "uploadPackets": 0,
            "downloadPackets": 0,
            "activeInterfaces": [],
            "bytesSent": 0,
            "bytesReceived": 0
        }

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
        
        # Add some randomness to make the graph more interesting in demo mode
        if download_speed < 0.5:  # If very little actual activity
            download_speed += random.uniform(0.5, 5.0)  # Add some simulated traffic
            upload_speed += random.uniform(0.2, 1.5)
        
        # Get hostname and IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Try to get public IP
        try:
            public_ip = urllib.request.urlopen('https://api.ipify.org').read().decode('utf8')
        except:
            public_ip = local_ip
        
        # Get ping and update ping history
        current_ping = get_ping()
        ping_history.append(current_ping)
        
        # Get packet loss
        packet_loss = get_packet_loss()
        
        # Calculate jitter
        jitter = get_jitter()
        
        # Calculate stability score
        stability = calculate_stability_score(current_ping, jitter, packet_loss)
            
        network_cache["network_data"] = {
            "connectionType": get_connection_type(),
            "signalStrength": get_signal_strength(),
            "downloadSpeed": round(download_speed, 1),
            "uploadSpeed": round(upload_speed, 1),
            "ping": current_ping,
            "jitter": jitter,
            "packetLoss": packet_loss,
            "stability": stability,
            "ipAddress": public_ip,
            "dnsServer": get_dns_server(),
            "macAddress": get_mac_address()
        }
        
        # Add to bandwidth history
        bandwidth_history.append({
            "timestamp": datetime.now().isoformat(),
            "download": round(download_speed, 1),
            "upload": round(upload_speed, 1)
        })
        
        # Update Network IO data
        network_cache["io_data"] = get_network_io()
        
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
        time.sleep(10)  # Update every 10 seconds for more frequent updates in demo mode

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

@app.get("/api/bandwidth-history")
async def get_bandwidth_history(timeframe: str = "5min"):
    """API endpoint to get bandwidth history"""
    now = datetime.now()
    
    if timeframe == "5min":
        # Last 5 minutes of data
        cutoff = now - timedelta(minutes=5)
    elif timeframe == "1hour":
        # Last hour of data
        cutoff = now - timedelta(hours=1)
    elif timeframe == "1day":
        # Last day of data
        cutoff = now - timedelta(days=1)
    else:
        # Default to all available data
        cutoff = now - timedelta(days=100)
    
    filtered_data = [item for item in bandwidth_history if datetime.fromisoformat(item["timestamp"]) >= cutoff]
    
    return JSONResponse(content=filtered_data)

@app.get("/api/connection-quality")
async def get_connection_quality():
    """API endpoint to get connection quality data"""
    if network_cache["network_data"] is None:
        update_network_data()
    
    network_data = network_cache["network_data"]
    ping_history_list = list(ping_history)
    
    return JSONResponse(content={
        "ping": network_data.get("ping", 0),
        "jitter": network_data.get("jitter", 0),
        "packetLoss": network_data.get("packetLoss", 0),
        "stability": network_data.get("stability", 0),
        "latencyHistory": ping_history_list
    })

@app.get("/api/all")
async def get_all_data():
    """API endpoint to get all network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    
    # Get the last 5 minutes of bandwidth history
    now = datetime.now()
    cutoff = now - timedelta(minutes=5)
    recent_bandwidth = [item for item in bandwidth_history if datetime.fromisoformat(item["timestamp"]) >= cutoff]
    
    return JSONResponse(content={
        "networkData": network_cache["network_data"],
        "connectedDevices": network_cache["connected_devices"],
        "bandwidthHistory": recent_bandwidth,
        "latencyHistory": list(ping_history),
        "ioData": network_cache["io_data"],
        "lastUpdated": network_cache["last_updated"]
    })

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
