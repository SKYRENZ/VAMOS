import platform
import psutil
import time
import wmi  # For Windows-specific hardware information
from fastapi.responses import JSONResponse  # Import JSONResponse

def get_system_info_data():
    """Fetch accurate system information."""
    uptime_seconds = time.time() - psutil.boot_time()
    uptime_string = time.strftime("%H:%M:%S", time.gmtime(uptime_seconds))

    # Fetch CPU information
    cpu = platform.processor() or "Unknown CPU"

    # Fetch GPU information using WMI
    try:
        w = wmi.WMI(namespace="root\\CIMV2")
        gpu_info = w.Win32_VideoController()[0]
        gpu = gpu_info.Name
    except Exception:
        gpu = "Unknown GPU"

    # Fetch DirectX version (mocked for now)
    directx_version = "12"  # Replace with actual detection logic if needed

    # Fetch system model and manufacturer using WMI
    try:
        system_info = w.Win32_ComputerSystem()[0]
        system_model = system_info.Model
        system_manufacturer = system_info.Manufacturer
    except Exception:
        system_model = "Unknown Model"
        system_manufacturer = "Unknown Manufacturer"

    # Fetch computer name
    computer_name = platform.node()

    return {
        "os": platform.system(),
        "os_version": platform.version(),
        "hostname": platform.node(),
        "architecture": platform.architecture()[0],
        "uptime": uptime_string,
        "cpu": cpu,
        "gpu": gpu,
        "directxVersion": directx_version,
        "systemModel": system_model,
        "systemManufacturer": system_manufacturer,
        "computerName": computer_name
    }

def get_system_info_response():
    """API response for system information."""
    system_info = get_system_info_data()
    return JSONResponse(content=system_info)  # Use JSONResponse to return the data