import psutil
from fastapi.responses import JSONResponse

def get_memory():
    """Fetch memory usage details using psutil."""
    try:
        memory = psutil.virtual_memory()
        memory_data = {
            "total": memory.total,  # Total memory in bytes
            "used": memory.used,    # Used memory in bytes
            "available": memory.available,  # Available memory in bytes
            "cached": memory.cached if hasattr(memory, "cached") else 0  # Cached memory in bytes (if available)
        }
        return memory_data
    except Exception as e:
        return {"error": f"Failed to fetch memory info: {str(e)}"}

def get_memory_data():
    """API response for memory data."""
    memory = get_memory()
    return JSONResponse(content=memory)