import psutil
import time
import platform
import socket
import speedtest
import subprocess
import re
import uuid
import logging
from datetime import datetime, timedelta
import urllib.request
import random
from collections import deque
import math
import socket

# Global cache for network data
network_cache = {
    "network_data": None,
    "speed_test": None,
    "connected_devices": None,
    "last_updated": None,
    "io_data": None,
    "first_speed_test_completed": False,  # Add flag to track first speed test
    "total_bytes_sent": 0,        # Track total bytes sent since app started
    "total_bytes_received": 0     # Track total bytes received since app started
}

# Store bandwidth history (last 1 hour data, 5 min intervals)
bandwidth_history = deque([], maxlen=60)  # Start empty, will be filled with real measurements
ping_history = deque([], maxlen=20)  # Start empty, will be filled with real measurements

# Store Network IO history
network_io_history = deque([], maxlen=60)  # Store 60 data points

# Store data transfer history (for showing total data transferred over time)
data_transfer_history = deque([], maxlen=288)  # Store up to 24 hours (at 5 min intervals)

# Store the last net_io counters to measure full interval
last_net_io_counters = None

def get_mac_address():
    """Get the MAC address of the main interface"""
    try:
        if platform.system() == "Windows":
            # Get output from ipconfig /all
            output = subprocess.check_output("ipconfig /all", shell=True).decode('utf-8', errors='ignore')
            
            # Split output into adapter sections
            sections = re.split(r'\r?\n\r?\n', output)
            for section in sections:
                # Skip disconnected adapters
                if "Media disconnected" in section:
                    continue
                
                # Look for active Ethernet or Wireless adapter with IPv4 address
                if ("Ethernet adapter" in section or "Wireless" in section) and "IPv4 Address" in section:
                    # Look for Physical Address in this section
                    match = re.search(r'Physical Address[.\s]*:\s*([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})', section, re.IGNORECASE)
                    if match:
                        return match.group(1)
            
            # If no MAC found in active adapters, try any adapter
            for section in sections:
                if "Physical Address" in section:
                    match = re.search(r'Physical Address[.\s]*:\s*([0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2})', section, re.IGNORECASE)
                    if match:
                        return match.group(1)
            
            # Fallback to uuid method
            mac = ':'.join(re.findall('..', '%012x' % uuid.getnode()))
            return mac
        else:
            # For non-Windows, use the uuid method
            mac = ':'.join(re.findall('..', '%012x' % uuid.getnode()))
            return mac
    except Exception as e:
        logging.error(f"MAC address retrieval error: {e}")
        return "Not detected"

def get_connection_type():
    try:
        # Get network interface addresses
        interfaces = psutil.net_if_addrs()
        active_interfaces = []
        
        # Collect all interfaces that are "up" and have an IPv4 address
        for name, addrs in interfaces.items():
            for addr in addrs:
                if addr.family == psutil.AF_INET:  # We are looking for IPv4 addresses
                    # Check if the interface is up
                    if psutil.net_if_stats().get(name, None) and psutil.net_if_stats()[name].isup:
                        active_interfaces.append(name)
                        print(f"Active Interface: {name} with IP: {addr.address}")
        
        # Debug output to see all active interfaces
        print("Active Interfaces:", active_interfaces)

        # Check active interfaces for Wi-Fi or Ethernet
        for interface in active_interfaces:
            lname = interface.lower()
            if "wi-fi" in lname or "wifi" in lname:
                return "Wi-Fi"
            elif "ethernet" in lname:
                return "Ethernet"
            elif "hamachi" in lname:
                return "VPN"

        return "WIFI"  # If no active interface was found
    except Exception as e:
        print("Error:", e)
        return "Wifi"

def get_signal_strength():
    """Get WiFi signal strength or Ethernet connection quality"""
    try:
        connection_type = get_connection_type()
        
        if connection_type == "Wi-Fi":
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
            
            # If we couldn't determine, return 0 instead of random value
            return 0
                
        elif connection_type == "Ethernet":
            # For Ethernet, check if interface is actually up and return 100 if it is
            # (Ethernet connections are generally stable when connected)
            interfaces = psutil.net_if_stats()
            
            for interface, stats in interfaces.items():
                if stats.isup and ("eth" in interface.lower() or "en" in interface.lower()):
                    return 100  # Return 100% for active Ethernet connections
            
            # No active Ethernet interface found
            return 0
                
        # If type unknown, return 0
        return 0
        
    except Exception as e:
        logging.error(f"Error getting signal strength: {e}")
        return 0  # Return 0 on error

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
        # Return 0 instead of random values when ping fails
        return 0

def get_jitter():
    """Calculate jitter by measuring multiple pings"""
    try:
        # Calculate jitter from real ping history
        if len(ping_history) > 1:
            # Calculate the average difference between consecutive pings
            diffs = [abs(ping_history[i] - ping_history[i-1]) for i in range(1, len(ping_history))]
            if diffs:
                return round(sum(diffs) / len(diffs), 1)
        
        # If no history, return 0 instead of simulated value
        return 0
    except Exception as e:
        logging.error(f"Jitter calculation error: {e}")
        return 0  # Return 0 instead of default 5.0

def calculate_stability_score(ping, jitter, packet_loss):
    """Calculate a stability score based on ping, jitter and packet loss with more accurate metrics"""
    # Define thresholds based on real-world network performance
    PING_THRESHOLDS = {
        'excellent': 20,    # < 20ms is excellent
        'good': 50,         # < 50ms is good
        'fair': 100,        # < 100ms is fair
        'poor': 200         # < 200ms is poor
    }
    
    JITTER_THRESHOLDS = {
        'excellent': 5,     # < 5ms is excellent
        'good': 10,         # < 10ms is good
        'fair': 20,         # < 20ms is fair
        'poor': 50          # < 50ms is poor
    }
    
    PACKET_LOSS_THRESHOLDS = {
        'excellent': 0.1,   # < 0.1% is excellent
        'good': 0.5,        # < 0.5% is good
        'fair': 1.0,        # < 1.0% is fair
        'poor': 2.0         # < 2.0% is poor
    }
    
    def calculate_component_score(value, thresholds, weight):
        """Calculate score for a component using sigmoid function for smooth transitions"""
        # Sigmoid function parameters
        k = 0.1  # Steepness of the curve
        x0 = thresholds['good']  # Midpoint of the curve
        
        # Normalize value to a 0-1 range
        normalized_value = value / thresholds['poor']
        
        # Apply sigmoid function
        sigmoid = 1 / (1 + math.exp(-k * (x0 - value)))
        
        # Scale to 0-100 range
        return 100.0 * sigmoid * weight
    
    # Calculate individual scores with different weights
    ping_score = calculate_component_score(ping, PING_THRESHOLDS, 0.40)
    jitter_score = calculate_component_score(jitter, JITTER_THRESHOLDS, 0.35)
    packet_loss_score = calculate_component_score(packet_loss, PACKET_LOSS_THRESHOLDS, 0.25)
    
    # Calculate final stability score
    stability = ping_score + jitter_score + packet_loss_score
    
    # Ensure score is within 0-100 range and round to 1 decimal place
    stability = round(max(0.0, min(100.0, stability)), 1)
    
    return stability

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
        # Return 0 instead of random values
        return 0

def get_dns_server():
    """Get the DNS server"""
    try:
        if platform.system() == "Windows":
            # Get output from ipconfig /all
            output = subprocess.check_output("ipconfig /all", shell=True).decode('utf-8', errors='ignore')
            
            # First, try to find IPv4 DNS server
            ipv4_dns = None
            
            # Split output into adapter sections
            sections = re.split(r'\r?\n\r?\n', output)
            for section in sections:
                # Skip disconnected adapters
                if "Media disconnected" in section:
                    continue
                    
                # Look for active adapters
                if ("Ethernet adapter" in section or "Wireless" in section) and "Connection-specific DNS" in section:
                    # Look for DNS in this section
                    dns_match = re.search(r'DNS Servers[\s.]*:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', section)
                    if dns_match:
                        ipv4_dns = dns_match.group(1)
                        # Return first IPv4 DNS server found
                        return ipv4_dns
                    
                    # If there are additional DNS entries on separate lines
                    lines = section.split('\n')
                    for i, line in enumerate(lines):
                        if "DNS Servers" in line:
                            # Check next few lines for additional DNS servers
                            for j in range(1, 4):  # Check up to 3 lines ahead
                                if i+j < len(lines):
                                    ip_match = re.search(r'\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', lines[i+j])
                                    if ip_match:
                                        return ip_match.group(1)
            
            # If no IPv4 DNS found, try IPv6
            for section in sections:
                if "Media disconnected" in section:
                    continue
                    
                if ("Ethernet adapter" in section or "Wireless" in section) and "Connection-specific DNS" in section:
                    # Look for IPv6 DNS
                    ipv6_match = re.search(r'DNS Servers[\s.]*:\s*([0-9a-fA-F:]+)', section)
                    if ipv6_match:
                        return ipv6_match.group(1)
                        
                    # If IPv6 is on separate line
                    lines = section.split('\n')
                    for i, line in enumerate(lines):
                        if "DNS Servers" in line:
                            # Check next few lines
                            for j in range(1, 4):
                                if i+j < len(lines):
                                    ipv6_match = re.search(r'\s+([0-9a-fA-F:]+)', lines[i+j])
                                    if ipv6_match:
                                        return ipv6_match.group(1)
                                        
            # If we still haven't found any DNS server, try a broader approach
            all_ips = re.findall(r'(?:DNS Servers[\s.]*:[\s.]*)([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', output)
            if all_ips:
                return all_ips[0]
                
            # Look for any valid IP in lines after "DNS Servers"
            lines = output.split('\n')
            for i, line in enumerate(lines):
                if "DNS Servers" in line:
                    # Check next few lines
                    for j in range(1, 5):  # Look at up to 4 lines after
                        if i+j < len(lines):
                            ip = re.search(r'\s+([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)', lines[i+j])
                            if ip:
                                return ip.group(1)
        
        elif platform.system() == "Linux":
            with open("/etc/resolv.conf") as f:
                for line in f:
                    if "nameserver" in line:
                        return line.split()[1]
        
        # Common fallback - use router IP
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            # Assume router is at X.X.X.1
            router_ip = '.'.join(ip.split('.')[:-1] + ['1'])
            return router_ip
        except:
            pass
            
        return "Not detected"
    except Exception as e:
        logging.error(f"DNS server retrieval error: {e}")
        return "Not detected"

def run_speed_test():
    """Run a speed test with improved accuracy and fair testing conditions"""
    try:
        # Initialize speedtest with longer timeout and specific configuration
        st = speedtest.Speedtest(secure=True)
        st.timeout = 30
        
        # Get list of servers and find closest ones
        print("Getting server list...")
        servers = st.get_servers()
        print("Finding best server...")
        best_server = st.get_best_server()
        
        # Configuration for fair testing
        THREADS = 4  # Increased threads for more accurate testing
        SAMPLES = 3  # Number of samples to take
        DELAY = 1    # Delay between tests in seconds
        
        # Measure download with consistent settings
        print("Testing download speed...")
        download_samples = []
        for _ in range(SAMPLES):
            sample = st.download(threads=THREADS,
                               callback=lambda _: None) / 1_000_000  # Convert to Mbps
            download_samples.append(sample)
            time.sleep(DELAY)  # Consistent delay between samples
            
        # Use median of download samples
        download_samples.sort()
        download = download_samples[1] if len(download_samples) == 3 else download_samples[0]
        
        # Wait same amount of time before upload test
        time.sleep(DELAY)
        
        # Measure upload with identical settings
        print("Testing upload speed...")
        upload_samples = []
        for _ in range(SAMPLES):
            sample = st.upload(threads=THREADS,
                             pre_allocate=False,
                             callback=lambda _: None) / 1_000_000  # Convert to Mbps
            upload_samples.append(sample)
            time.sleep(DELAY)  # Consistent delay between samples
            
        # Use median of upload samples
        upload_samples.sort()
        upload = upload_samples[1] if len(upload_samples) == 3 else upload_samples[0]
        
        # Get ping with same number of samples
        ping_samples = []
        for _ in range(SAMPLES):
            ping_samples.append(st.results.ping)
            time.sleep(DELAY/2)  # Shorter delay for ping tests
        ping = sum(ping_samples) / len(ping_samples)
        
        # Validate results
        if download < 0 or upload < 0 or ping < 0:
            raise ValueError("Invalid negative speed values")
            
        # Apply different correction factors to account for overhead
        DOWNLOAD_OVERHEAD_FACTOR = 0.85  # 15% reduction for download overhead
        UPLOAD_OVERHEAD_FACTOR = 0.55    # 55% reduction for upload overhead
        download = download * DOWNLOAD_OVERHEAD_FACTOR
        upload = upload * UPLOAD_OVERHEAD_FACTOR
            
        # Additional sanity checks with same limits
        SPEED_LIMIT = 500  # Same limit for both upload and download
        if upload > SPEED_LIMIT or download > SPEED_LIMIT:
            raise ValueError("Unrealistic speed values detected")
            
        # Remove artificial upload ratio - use real upload speed measurement
        # upload_ratio = 0.35 + (random.random() * 0.10)  # Random value between 0.35 and 0.45
        # upload = download * upload_ratio
        
        # Format server information more accurately
        city = best_server.get('city', '')
        country = best_server.get('country', '')
        cc = best_server.get('cc', '')
        name = best_server.get('name', '')
        sponsor = best_server.get('sponsor', '')
        
        # Clean up the data
        if not city or city.lower() == 'unknown':
            # Try to extract city from name or sponsor
            if ',' in name:
                city = name.split(',')[0].strip()
            elif ',' in sponsor:
                city = sponsor.split(',')[0].strip()
        
        server_info = {
            "name": name if not cc else f"{name} ({cc})",
            "location": f"{city}, {country}".strip(' ,'),
            "sponsor": sponsor,
            "latency": float(best_server.get("latency", 0)),
            "distance": f"{best_server.get('d', 0):.1f} km"
        }
        
        # Log the results for debugging
        logging.info(f"Speed test results - Download: {download:.1f} Mbps, Upload: {upload:.1f} Mbps, Ping: {ping:.0f} ms")
        
        return {
            "download": round(download, 1),
            "upload": round(upload, 1),
            "ping": round(ping, 0),
            "server": server_info
        }
    except Exception as e:
        logging.error(f"Speed test error: {e}")
        return {
            "error": f"Speed test failed: {str(e)}",
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
        global last_net_io_counters
        
        # Get current network counters
        current_net_io = psutil.net_io_counters()
        
        # If we have previous counters, calculate the difference over the full interval
        if last_net_io_counters is not None:
            # Calculate bytes transferred since the last check
            bytes_sent = current_net_io.bytes_sent - last_net_io_counters.bytes_sent
            bytes_recv = current_net_io.bytes_recv - last_net_io_counters.bytes_recv
            packets_sent = current_net_io.packets_sent - last_net_io_counters.packets_sent
            packets_recv = current_net_io.packets_recv - last_net_io_counters.packets_recv
        else:
            # First run, measure over a small interval
            initial_net_io = current_net_io
            time.sleep(1)  # Wait 1 second for initial measurement
            after_net_io = psutil.net_io_counters()
            bytes_sent = after_net_io.bytes_sent - initial_net_io.bytes_sent
            bytes_recv = after_net_io.bytes_recv - initial_net_io.bytes_recv
            packets_sent = after_net_io.packets_sent - initial_net_io.packets_sent
            packets_recv = after_net_io.packets_recv - initial_net_io.packets_recv
        
        # Check if we have speed test data available
        upload_speed = 0
        download_speed = 0
        
        if network_cache["speed_test"] is not None and "error" not in network_cache["speed_test"]:
            # Use speed test data for the speeds instead of real-time measurement
            upload_speed = network_cache["speed_test"]["upload"]
            download_speed = network_cache["speed_test"]["download"]
        else:
            # Calculate speeds based on bytes transferred during the interval (approx 30 seconds)
            # If last_net_io_counters is None, we're using a 1-second interval
            interval_seconds = 30 if last_net_io_counters is not None else 1
            upload_speed = bytes_sent * 8 / (1_000_000 * interval_seconds)  # Convert to Mbps
            download_speed = bytes_recv * 8 / (1_000_000 * interval_seconds)  # Convert to Mbps
        
        # Get network interface details
        interfaces = psutil.net_if_stats()
        active_interfaces = [name for name, stats in interfaces.items() if stats.isup]
        
        return {
            "uploadSpeed": round(upload_speed, 2),
            "downloadSpeed": round(download_speed, 2),
            "uploadPackets": packets_sent,
            "downloadPackets": packets_recv,
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
        global last_net_io_counters
        
        # Get current network counters
        current_net_io = psutil.net_io_counters()
        
        # If we have previous counters, calculate the difference
        if last_net_io_counters is not None:
            # Calculate bytes transferred since the last check (full interval)
            bytes_sent = current_net_io.bytes_sent - last_net_io_counters.bytes_sent
            bytes_received = current_net_io.bytes_recv - last_net_io_counters.bytes_recv
        else:
            # First run, just use a small sample
            initial_net_io = current_net_io
            time.sleep(1)  # Wait 1 second for initial measurement
            after_net_io = psutil.net_io_counters()
            bytes_sent = after_net_io.bytes_sent - initial_net_io.bytes_sent
            bytes_received = after_net_io.bytes_recv - initial_net_io.bytes_recv
        
        # Save current counters for next interval
        last_net_io_counters = current_net_io
        
        # Update cumulative totals
        network_cache["total_bytes_sent"] += bytes_sent
        network_cache["total_bytes_received"] += bytes_received
        
        # Check if we have speed test data available
        download_speed = 0
        upload_speed = 0
        
        if network_cache["speed_test"] is not None and "error" not in network_cache["speed_test"]:
            # Use speed test data instead of real-time measurements
            download_speed = network_cache["speed_test"]["download"]
            upload_speed = network_cache["speed_test"]["upload"]
        else:
            # Fall back to real-time measurements if no speed test data
            download_speed = bytes_received * 8 / 1_000_000  # Mbps
            upload_speed = bytes_sent * 8 / 1_000_000  # Mbps
        
        # Get hostname and IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Try to get public IP
        try:
            public_ip = urllib.request.urlopen('https://api.ipify.org').read().decode('utf8')
        except:
            public_ip = local_ip
        
        # Get ping and update ping history only if first speed test completed
        current_ping = get_ping()
        if network_cache["first_speed_test_completed"]:
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
        
        # Add to bandwidth history only if first speed test completed
        if network_cache["first_speed_test_completed"]:
            # Now tracking actual bytes transferred in this interval (not speeds)
            bandwidth_history.append({
                "timestamp": datetime.now().isoformat(),
                "download": bytes_received,  # Actual bytes downloaded in this interval
                "upload": bytes_sent,        # Actual bytes uploaded in this interval
                "downloadFormatted": format_bytes(bytes_received),
                "uploadFormatted": format_bytes(bytes_sent)
            })
            
            # Add to data transfer history every 5 minutes
            current_time = datetime.now()
            if not data_transfer_history or (current_time - datetime.fromisoformat(data_transfer_history[-1]["timestamp"])).total_seconds() >= 300:
                data_transfer_history.append({
                    "timestamp": current_time.isoformat(),
                    "totalBytesSent": network_cache["total_bytes_sent"],
                    "totalBytesReceived": network_cache["total_bytes_received"]
                })
        
        # Update Network IO data
        network_cache["io_data"] = get_network_io()
        
        network_cache["connected_devices"] = scan_network()
        network_cache["last_updated"] = datetime.now().isoformat()
        
        print("Network data updated")
    except Exception as e:
        logging.error(f"Update error: {e}")

def get_network_data():
    """Get all network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    return network_cache["network_data"]

def get_speed_test_data():
    """Run a speed test and return results"""
    network_cache["speed_test"] = run_speed_test()
    # Set flag when speed test completes successfully
    if network_cache["speed_test"] and "error" not in network_cache["speed_test"]:
        network_cache["first_speed_test_completed"] = True
    return network_cache["speed_test"]

def get_connected_devices():
    """Get connected devices on the network"""
    if network_cache["connected_devices"] is None:
        network_cache["connected_devices"] = scan_network()
    return network_cache["connected_devices"]

def get_bandwidth_history(timeframe="5min"):
    """Get bandwidth history for specified timeframe"""
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
    
    return filtered_data

def get_connection_quality():
    """Get connection quality data"""
    if network_cache["network_data"] is None:
        update_network_data()
    
    network_data = network_cache["network_data"]
    ping_history_list = list(ping_history)
    
    return {
        "ping": network_data.get("ping", 0),
        "jitter": network_data.get("jitter", 0),
        "packetLoss": network_data.get("packetLoss", 0),
        "stability": network_data.get("stability", 0),
        "latencyHistory": ping_history_list
    }

def clear_history():
    """Clear all history data"""
    global bandwidth_history, ping_history
    bandwidth_history.clear()
    ping_history.clear()
    print("History data cleared")

def get_data_transfer_history(timeframe="5min"):
    """Get data transfer history for specified timeframe"""
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
    
    filtered_data = [item for item in data_transfer_history if datetime.fromisoformat(item["timestamp"]) >= cutoff]
    
    # Format data sizes to be more readable
    for item in filtered_data:
        item["totalBytesSentFormatted"] = format_bytes(item["totalBytesSent"])
        item["totalBytesReceivedFormatted"] = format_bytes(item["totalBytesReceived"])
    
    return filtered_data

def format_bytes(size_bytes):
    """Format bytes to human-readable format"""
    if size_bytes == 0:
        return "0 B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_name[i]}"

def get_all_network_data():
    """Get all consolidated network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    
    # Get the last 5 minutes of bandwidth history
    now = datetime.now()
    cutoff = now - timedelta(minutes=5)
    recent_bandwidth = [item for item in bandwidth_history if datetime.fromisoformat(item["timestamp"]) >= cutoff]
    
    # Get data transfer history for last 5 minutes
    recent_data_transfer = get_data_transfer_history("5min")
    
    # Calculate total bytes directly from bandwidth history for accuracy
    total_bytes_received = sum(item["download"] for item in bandwidth_history)
    total_bytes_sent = sum(item["upload"] for item in bandwidth_history)
    
    # Format the calculated totals
    total_received_formatted = format_bytes(total_bytes_received)
    total_sent_formatted = format_bytes(total_bytes_sent)
    
    return {
        "networkData": network_cache["network_data"],
        "connectedDevices": network_cache["connected_devices"],
        "bandwidthHistory": recent_bandwidth,
        "latencyHistory": list(ping_history),
        "ioData": network_cache["io_data"],
        "lastUpdated": network_cache["last_updated"],
        "dataTransferHistory": recent_data_transfer,
        "totalDataTransfer": {
            "sent": total_bytes_sent,
            "received": total_bytes_received,
            "sentFormatted": total_sent_formatted,
            "receivedFormatted": total_received_formatted
        }
    }

# Initialize update function
update_network_data() 