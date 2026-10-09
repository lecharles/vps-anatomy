from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

def mount_spa(app: FastAPI, static_dir: str = "static"):
    """Mount the React SPA. API routes take priority; everything else serves index.html."""
    if not os.path.isdir(static_dir):
        return
    
    # Serve static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
    
    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # Try to serve the exact file
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html (SPA routing)
        return FileResponse(os.path.join(static_dir, "index.html"))
