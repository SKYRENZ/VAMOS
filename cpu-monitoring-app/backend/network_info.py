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

# Global cache for network data
network_cache = {
    "network_data": None,
    "speed_test": None,
    "connected_devices": None,
    "last_updated": None,
    "io_data": None,
    "first_speed_test_completed": False  # Add flag to track first speed test
}

# Store bandwidth history (last 1 hour data, 5 min intervals)
bandwidth_history = deque([], maxlen=60)  # Start empty, will be filled with real measurements

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
        # Take multiple ping measurements
        pings = []
        for _ in range(4):  # Take 4 measurements
            ping = get_ping()
            if ping > 0:  # Only include valid pings
                pings.append(ping)
            time.sleep(0.5)  # Short delay between pings
            
        if len(pings) > 1:
            # Calculate the average difference between consecutive pings
            diffs = [abs(pings[i] - pings[i-1]) for i in range(1, len(pings))]
            if diffs:
                return round(sum(diffs) / len(diffs), 1)
        
        return 0
    except Exception as e:
        logging.error(f"Jitter calculation error: {e}")
        return 0

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
    """Measure packet loss more accurately using multiple servers and more packets"""
    try:
        # Test servers to check (mix of reliable servers)
        test_servers = [
            "8.8.8.8",      # Google DNS
            "1.1.1.1",      # Cloudflare DNS
            "208.67.222.222"  # OpenDNS
        ]
        
        total_sent = 0
        total_lost = 0
        
        for server in test_servers:
            try:
                # Send more packets (20 per server) for better accuracy
                param = "-n" if platform.system().lower() == "windows" else "-c"
                command = ["ping", param, "20", server, "-w", "1000"]  # 1 second timeout
                output = subprocess.check_output(command, stderr=subprocess.DEVNULL).decode()
                
                if platform.system().lower() == "windows":
                    # Windows format: "Packets: Sent = X, Received = Y, Lost = Z (W% loss)"
                    sent_match = re.search(r"Sent = (\d+)", output)
                    received_match = re.search(r"Received = (\d+)", output)
                    if sent_match and received_match:
                        sent = int(sent_match.group(1))
                        received = int(received_match.group(1))
                        total_sent += sent
                        total_lost += (sent - received)
                else:
                    # Linux/Mac format: "X packets transmitted, Y received, Z% packet loss"
                    match = re.search(r"(\d+) packets transmitted, (\d+) received", output)
                    if match:
                        sent = int(match.group(1))
                        received = int(match.group(2))
                        total_sent += sent
                        total_lost += (sent - received)
            
            except subprocess.CalledProcessError:
                # If this server fails completely, count all packets as lost
                total_sent += 20
                total_lost += 20
                continue
        
        if total_sent > 0:
            # Calculate loss percentage with 2 decimal precision
            loss_percentage = (total_lost / total_sent) * 100
            return round(loss_percentage, 2)
        
        return 0.00
        
    except Exception as e:
        logging.error(f"Packet loss calculation error: {e}")
        return 0.00

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
        # Initialize speedtest with shorter timeout
        st = speedtest.Speedtest(secure=True)
        st.timeout = 15  # Reduced timeout to 15 seconds
        
        # Get list of servers and find closest ones
        print("Getting server list...")
        servers = st.get_servers()
        print("Finding best server...")
        best_server = st.get_best_server()
        
        # Configuration for faster testing
        THREADS = 4  # Keep threads for accuracy
        SAMPLES = 1  # Single sample for speed
        DELAY = 0.1  # Minimal delay
        
        # Measure download with consistent settings
        print("Testing download speed...")
        download = st.download(threads=THREADS,
                             callback=lambda current, total, start=None, end=None: None) / 1_000_000  # Convert to Mbps
        
        # Minimal wait before upload test
        time.sleep(DELAY)
        
        # Measure upload with identical settings
        print("Testing upload speed...")
        upload = st.upload(threads=THREADS,
                         pre_allocate=False,
                         callback=lambda current, total, start=None, end=None: None) / 1_000_000  # Convert to Mbps
        
        # Get ping
        ping = st.results.ping
        
        # Validate results
        if download < 0 or upload < 0 or ping < 0:
            raise ValueError("Invalid negative speed values")
            
        # Apply correction factors to account for overhead and protocol inefficiencies
        DOWNLOAD_OVERHEAD = 0.85  # 15% reduction for network overhead
        UPLOAD_OVERHEAD = 0.80  # 20% reduction for upload overhead (reduced from 55%)
        download = download * DOWNLOAD_OVERHEAD
        upload = upload * UPLOAD_OVERHEAD
            
        # Additional sanity checks with limits
        SPEED_LIMIT = 500  # Same limit for both upload and download
        MIN_SPEED = 1  # Minimum realistic speed in Mbps
        if upload > SPEED_LIMIT or download > SPEED_LIMIT:
            raise ValueError("Unrealistic speed values detected")
        if upload < MIN_SPEED or download < MIN_SPEED:
            raise ValueError("Speed too low to be reliable")
            
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
        # Get initial network I/O counters
        net_io = psutil.net_io_counters()
        time.sleep(1)  # Wait 1 second to measure
        net_io_after = psutil.net_io_counters()
        
        # Calculate bytes transferred and packet counts
        bytes_sent = net_io_after.bytes_sent - net_io.bytes_sent
        bytes_recv = net_io_after.bytes_recv - net_io.bytes_recv
        packets_sent = net_io_after.packets_sent - net_io.packets_sent
        packets_recv = net_io_after.packets_recv - net_io.packets_recv
        
        # Check if we have speed test data available
        upload_speed = 0
        download_speed = 0
        
        if network_cache["speed_test"] is not None and "error" not in network_cache["speed_test"]:
            # Use speed test data for the speeds instead of 1-second measurement
            upload_speed = network_cache["speed_test"]["upload"]
            download_speed = network_cache["speed_test"]["download"]
        else:
            # Fall back to real-time measurements if speed test data isn't available
            upload_speed = bytes_sent * 8 / 1_000_000  # Convert to Mbps
            download_speed = bytes_recv * 8 / 1_000_000  # Convert to Mbps
        
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
        # Get network interfaces for bandwidth measurement
        net_io = psutil.net_io_counters(pernic=True)  # Get per-interface counters
        
        # Calculate current speeds
        time.sleep(1)  # Wait 1 second to measure
        net_io_after = psutil.net_io_counters(pernic=True)
        
        # Sum up all interface speeds
        total_bytes_sent = 0
        total_bytes_recv = 0
        
        for interface, counters in net_io_after.items():
            if interface in net_io:  # Make sure we have before/after data
                bytes_sent = counters.bytes_sent - net_io[interface].bytes_sent
                bytes_recv = counters.bytes_recv - net_io[interface].bytes_recv
                
                if bytes_sent >= 0:  # Avoid negative values from counter wraparound
                    total_bytes_sent += bytes_sent
                if bytes_recv >= 0:
                    total_bytes_recv += bytes_recv
        
        # Convert to Mbps
        download_speed = total_bytes_recv * 8 / 1_000_000  # Mbps
        upload_speed = total_bytes_sent * 8 / 1_000_000  # Mbps
        
        # Get hostname and IP
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Try to get public IP
        try:
            public_ip = urllib.request.urlopen('https://api.ipify.org').read().decode('utf8')
        except:
            public_ip = local_ip
        
        # Get ping
        current_ping = get_ping()
        
        # Get packet loss
        packet_loss = get_packet_loss()
        
        # Calculate jitter
        jitter = get_jitter()
        
        # Calculate stability score
        stability = calculate_stability_score(current_ping, jitter, packet_loss)
            
        network_cache["network_data"] = {
            "connectionType": get_connection_type(),
            "signalStrength": get_signal_strength(),
            "downloadSpeed": round(download_speed, 2),  # Increased precision
            "uploadSpeed": round(upload_speed, 2),
            "ping": current_ping,
            "jitter": jitter,
            "packetLoss": packet_loss,
            "stability": stability,
            "ipAddress": public_ip,
            "dnsServer": get_dns_server(),
            "macAddress": get_mac_address()
        }
        
        # Always add to bandwidth history, even for small values
        bandwidth_history.append({
            "timestamp": datetime.now().isoformat(),
            "download": round(download_speed, 2),
            "upload": round(upload_speed, 2),
            "isSpeedTest": False
        })
        
        # Update Network IO data
        network_cache["io_data"] = get_network_io()
        
        network_cache["connected_devices"] = scan_network()
        network_cache["last_updated"] = datetime.now().isoformat()
        
        print(f"Network data updated - Download: {download_speed:.2f} Mbps, Upload: {upload_speed:.2f} Mbps")
    except Exception as e:
        logging.error(f"Update error: {e}")
        # Log the full traceback for debugging
        import traceback
        logging.error(traceback.format_exc())

def get_network_data():
    """Get all network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    return network_cache["network_data"]

def get_speed_test_data():
    """Run a speed test and return results"""
    # Always run a fresh speed test
    fresh_results = run_speed_test()
    
    # Only update cache if the test was successful
    if fresh_results and "error" not in fresh_results:
        network_cache["speed_test"] = fresh_results
        network_cache["first_speed_test_completed"] = True
        
        # Add speed test results to bandwidth history
        bandwidth_history.append({
            "timestamp": datetime.now().isoformat(),
            "download": fresh_results["download"],
            "upload": fresh_results["upload"],
            "isSpeedTest": True  # Mark this as a speed test result
        })
    
    return fresh_results

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
    
    return {
        "ping": network_data.get("ping", 0),
        "jitter": network_data.get("jitter", 0),
        "packetLoss": network_data.get("packetLoss", 0),
        "stability": network_data.get("stability", 0)
    }

def clear_history():
    """Clear all history data"""
    global bandwidth_history
    bandwidth_history.clear()
    print("History data cleared")

def get_all_network_data():
    """Get all consolidated network data"""
    if network_cache["network_data"] is None:
        update_network_data()
    
    # Get the last 5 minutes of bandwidth history
    now = datetime.now()
    cutoff = now - timedelta(minutes=5)
    recent_bandwidth = [item for item in bandwidth_history if datetime.fromisoformat(item["timestamp"]) >= cutoff]
    
    return {
        "networkData": network_cache["network_data"],
        "connectedDevices": network_cache["connected_devices"],
        "bandwidthHistory": recent_bandwidth,
        "ioData": network_cache["io_data"],
        "lastUpdated": network_cache["last_updated"]
    }

# Initialize update function
update_network_data() 