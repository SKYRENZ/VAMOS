import psutil
from fastapi.responses import JSONResponse

def get_processes_data():
    """Fetch process information."""
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
    return {"processes": processes}