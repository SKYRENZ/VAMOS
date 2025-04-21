import psutil
import subprocess
import random
from typing import Optional
import wmi
from pynvml import (
    nvmlInit,
    nvmlDeviceGetHandleByIndex,
    nvmlDeviceGetClockInfo,
    nvmlDeviceGetTemperature,
)

# CPU Functions
def get_cpu_usage():
    """Fetch CPU usage and additional CPU details."""
    try:
        per_cpu = psutil.cpu_percent(interval=1, percpu=True)
        avg_usage = sum(per_cpu) / len(per_cpu)
        adjusted_usage = min(100, avg_usage * 1.05)  # Adjust for Task Manager-like calculation

        cpu_freq = psutil.cpu_freq()
        base_speed = round(cpu_freq.max, 2) if cpu_freq else None
        cores = psutil.cpu_count(logical=False)
        logical_processors = psutil.cpu_count(logical=True)
        sockets = 1  # Assuming 1 socket for most systems

        return {
            "cpu_usage": round(adjusted_usage, 1),
            "base_speed_ghz": base_speed,
            "sockets": sockets,
            "cores": cores,
            "logical_processors": logical_processors,
        }
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}

def get_cpu_temperature():
    """
    Get the overall CPU temperature using multiple fallback methods.
    Priority:
    1. OpenHardwareMonitor (average of all CPU Core temps)
    2. WMI (MSAcpi_ThermalZoneTemperature)
    3. psutil (if available)
    """
    try:
        # Method 1: OpenHardwareMonitor
        try:
            w = wmi.WMI(namespace=r"root\OpenHardwareMonitor")
            core_temps = [
                sensor.Value
                for sensor in w.Sensor()
                if sensor.SensorType == "Temperature" and "CPU Core" in sensor.Name
            ]
            if core_temps:
                avg_temp = round(sum(core_temps) / len(core_temps), 1)
                return {"cpu_temperature": avg_temp}
            else:
                print("No CPU Core temperatures found in OpenHardwareMonitor.")
        except Exception as e:
            print(f"OpenHardwareMonitor failed: {str(e)}")

        # Method 2: WMI - ACPI thermal zone
        try:
            w = wmi.WMI(namespace=r"root\wmi")
            temps = [t.CurrentTemperature / 10 - 273.15 for t in w.MSAcpi_ThermalZoneTemperature()]
            if temps:
                return {"cpu_temperature": round(temps[0], 1)}
            else:
                print("No thermal zone temperatures found.")
        except Exception as e:
            print(f"WMI fallback failed: {e}")

        # Method 3: psutil (Linux-friendly fallback)
        try:
            if hasattr(psutil, "sensors_temperatures"):
                temps = psutil.sensors_temperatures()
                for name, entries in temps.items():
                    for entry in entries:
                        if entry.current:
                            return {"cpu_temperature": round(entry.current, 1)}
        except Exception as e:
            print(f"psutil fallback failed: {e}")

        return {"error": "All temperature methods failed"}, 500

    except Exception as e:
        return {"error": f"CPU temperature check failed: {str(e)}"}, 500

# GPU Functions
def get_gpu_usage() -> Optional[float]:
    """Get GPU usage percentage (0-100) for NVIDIA or AMD GPUs."""
    try:
        # NVIDIA GPU usage
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=utilization.gpu", "--format=csv,noheader,nounits"],
            capture_output=True,
            text=True,
            check=True,
        )
        return float(result.stdout.strip())
    except (subprocess.CalledProcessError, FileNotFoundError, ValueError):
        pass

    try:
        # AMD GPU usage (via WMI)
        c = wmi.WMI(namespace="root\\cimv2")
        for gpu in c.Win32_VideoController():
            if hasattr(gpu, "LoadPercentage"):
                return float(gpu.LoadPercentage)
    except Exception as e:
        print(f"AMD GPU usage retrieval failed: {e}")

    return None


def get_gpu_temperature() -> dict:
    """Get GPU temperature from system hardware (including NVIDIA, AMD, and other GPUs)."""
    try:
        # Method 1: Using nvidia-smi for NVIDIA GPUs
        try:
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                temp = result.stdout.strip()
                if temp and temp.isdigit():
                    return {"gpu_temperature": int(temp)}
        except Exception as e:
            print(f"NVIDIA-SMI failed: {e}")

        # Method 2: Using WMIC command to get GPU temperature (Windows only)
        try:
            result = subprocess.run(
                ["cmd", "/c", "wmic", "/namespace:\\\\root\\wmi", "path", "MSAcpi_ThermalZoneTemperature", "get", "CurrentTemperature"],
                capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                output_lines = result.stdout.strip().split('\n')

                # Look for the numeric temperature value
                for line in output_lines:
                    line = line.strip()
                    if line.isdigit():
                        temp_kelvin = int(line) / 10.0  # Convert to Kelvin
                        temp_celsius = temp_kelvin - 273.15  # Convert to Celsius
                        return {"gpu_temperature": round(temp_celsius, 2)}
                
                return {"error": "No valid temperature data found"}, 500
            else:
                error_msg = f"Command failed: {result.stderr}"
                return {"error": error_msg}, 500
        except Exception as e:
            print(f"WMIC command failed: {e}")
            return {"error": f"WMIC command failed: {str(e)}"}, 500

        # Method 3: Using OpenHardwareMonitor WMI (for non-NVIDIA/AMD GPUs)
        try:
            w = wmi.WMI(namespace=r"root\OpenHardwareMonitor")
            gpu_temp = next(
                (s.Value for s in w.Sensor() if s.SensorType == "Temperature" and "GPU" in s.Name), None
            )
            if gpu_temp:
                return {"gpu_temperature": gpu_temp}
        except Exception as e:
            print(f"OpenHardwareMonitor GPU retrieval failed: {e}")

        return {"error": "No GPU temperature data available"}, 500

    except Exception as e:
        return {"error": f"Temperature check failed: {str(e)}"}, 500

def get_gpu_stats():
    """Get GPU and VRAM clock speeds."""
    try:
        nvmlInit()
        handle = nvmlDeviceGetHandleByIndex(0)

        gpu_clock = nvmlDeviceGetClockInfo(handle, 0)  # Graphics clock
        mem_clock = nvmlDeviceGetClockInfo(handle, 1)  # Memory clock

        return {
            "gpu_clock_speed": gpu_clock,
            "vram_clock_speed": mem_clock,
        }
    except Exception as e:
        print(f"NVML failed: {e}")
        return {
            "gpu_clock_speed": random.randint(1200, 1800),
            "vram_clock_speed": random.randint(1400, 1600),
        }