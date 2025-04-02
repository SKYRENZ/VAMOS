import wmi
from fastapi.responses import JSONResponse

def get_disks():
    """Fetch all disk partitions and their usage using WMI."""
    try:
        disks = []
        c = wmi.WMI()
        for disk in c.Win32_LogicalDisk():
            if disk.DriveType == 3:  # DriveType 3 indicates a local disk
                disks.append({
                    "device": disk.DeviceID,
                    "mountpoint": disk.DeviceID,
                    "total": int(disk.Size) if disk.Size else 0,
                    "used": int(disk.Size) - int(disk.FreeSpace) if disk.Size and disk.FreeSpace else 0,
                    "free": int(disk.FreeSpace) if disk.FreeSpace else 0,
                    "percent": round((1 - int(disk.FreeSpace) / int(disk.Size)) * 100, 2) if disk.Size and disk.FreeSpace else 0
                })
        return disks
    except Exception as e:
        return {"error": f"Failed to fetch disk info: {str(e)}"}

def get_disk_data():
    """API response for disk data."""
    disks = get_disks()
    return JSONResponse(content={"disks": disks})