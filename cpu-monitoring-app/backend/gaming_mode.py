from fastapi import APIRouter
from pydantic import BaseModel
import psutil
import os
import subprocess

router = APIRouter()

# Store state in memory
gaming_mode_state = {"enabled": False}


class GamingModeResponse(BaseModel):
    status: str
    message: str
    optimizations: dict


def set_high_performance_mode():
    try:
        # Check if Ultimate Performance is available
        subprocess.run(["powercfg", "/setactive", "04c7538d-bb72-4f7e-b2a9-9fff3de47edb"], check=True)
        return "Power plan set to Ultimate Performance."
    except subprocess.CalledProcessError:
        # Fallback to High Performance if Ultimate Performance is unavailable
        subprocess.run(["powercfg", "/setactive", "8c5e7f1a-c0c2-4d80-a522-2bb2e200700f"], check=True)
        return "Power plan set to High Performance."


def disable_background_processes():
    # Kill processes that are not critical and consume resources
    non_critical_processes = ["chrome.exe", "firefox.exe", "discord.exe"]  # Add processes you want to kill
    killed = []
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if proc.info['name'].lower() in non_critical_processes:
                proc.terminate()
                killed.append(proc.info['name'])
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return killed


def set_process_priority():
    try:
        # Get current process
        pid = os.getpid()
        process = psutil.Process(pid)
        process.nice(psutil.HIGH_PRIORITY_CLASS)
        return "High priority set."
    except Exception as e:
        return f"Failed to set priority: {str(e)}"


@router.get("/gaming-mode/status")
def get_gaming_mode_status():
    return {"gaming_mode": gaming_mode_state["enabled"]}


@router.post("/gaming-mode/enable", response_model=GamingModeResponse)
def enable_gaming_mode():
    gaming_mode_state["enabled"] = True

    # Set system optimizations
    power_plan_status = set_high_performance_mode()
    priority_status = set_process_priority()
    killed_processes = disable_background_processes()

    return {
        "status": "success",
        "message": "Gaming mode enabled",
        "optimizations": {
            "cpu_performance": True,
            "process_priority": priority_status,
            "background_processes": killed_processes,
            "power_plan": power_plan_status
        }
    }


@router.post("/gaming-mode/disable", response_model=GamingModeResponse)
def disable_gaming_mode():
    gaming_mode_state["enabled"] = False

    # Reset to normal settings
    try:
        pid = os.getpid()
        process = psutil.Process(pid)
        process.nice(psutil.NORMAL_PRIORITY_CLASS)
        priority_status = "Priority reset to normal."
    except Exception as e:
        priority_status = f"Failed to reset priority: {str(e)}"

    # Set the power plan back to Balanced
    subprocess.run(["powercfg", "/setactive", "381b4222-f694-41f0-9685-ff5bb260df2e"], check=True)

    return {
        "status": "success",
        "message": "Gaming mode disabled",
        "optimizations": {
            "cpu_performance": False,
            "process_priority": priority_status,
            "background_processes": "No processes killed",
            "power_plan": "Power plan reset to Balanced"
        }
    }
