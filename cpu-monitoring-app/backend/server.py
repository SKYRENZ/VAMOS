from fastapi import FastAPI
from fastapi.responses import JSONResponse
import psutil

app = FastAPI()

@app.get("/stats")
async def get_stats():
    stats = {
        "cpu": psutil.cpu_percent(interval=1),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage('/').percent
    }
    return JSONResponse(content=stats)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)
