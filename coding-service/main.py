import sys
import uvicorn
import asyncio
import subprocess
import os
import time
import logging
import signal
from typing import Dict
from pathlib import Path

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Route
from starlette.middleware.cors import CORSMiddleware

################################################################################
# Logging Setup
################################################################################

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

################################################################################
# Global Constants & Variables
################################################################################

# We'll auto-assign ports starting from 9000
NEXT_PORT = 9000

# Time in seconds without a heartbeat before we kill a session
HEARTBEAT_TIMEOUT = 10 * 60  # 10 minutes

# Dictionary to store:
# {
#     service_id: {
#         "port": <int>,
#         "process": <subprocess.Popen>,
#         "last_heartbeat": <float (epoch time)>
#     }
# }
ID_TO_SERVICE: Dict[str, dict] = {}

################################################################################
# Starlette Application
################################################################################

app = Starlette()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def setup_streamlit_config():
    # Define the config content
    config_content = """[theme]
base="dark"
backgroundColor="#252A36"
secondaryBackgroundColor="#374151"
textColor="#ECEFF1"
primaryColor="#0080FF"
[server]
headless = true
"""

    # Get the path to the .streamlit directory in the user's home directory
    home_dir = str(Path.home())
    streamlit_dir = os.path.join(home_dir, ".streamlit")

    # Create the directory if it doesn't exist
    if not os.path.exists(streamlit_dir):
        os.makedirs(streamlit_dir)

    # Path to the config.toml file
    config_path = os.path.join(streamlit_dir, "config.toml")

    # Write the content to the file, overwriting any existing content
    with open(config_path, "w") as f:
        f.write(config_content)

    print(f"Streamlit config has been written to {config_path}")


def install_aider_for_dreamlab():
    """
    Clones the aider-for-dreamlab repository in the current working directory
    or pulls the latest changes if it already exists, then installs it in
    development mode.

    This function will add aider to your Python path.
    """
    repo_dir = os.path.join(os.getcwd(), "aider-for-dreamlab")

    try:
        # Check if the repository already exists
        if os.path.exists(repo_dir) and os.path.isdir(repo_dir):
            print("Repository already exists. Pulling latest changes...")
            # Change to the repository directory and pull the latest changes
            subprocess.run(["git", "pull"], cwd=repo_dir, check=True)
        else:
            # Git clone the repository if it doesn't exist
            print("Cloning aider-for-dreamlab repository...")
            subprocess.run(
                ["git", "clone", "https://github.com/WorldQL/aider-for-dreamlab/"],
                check=True,
            )

        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--upgrade",
                "--upgrade-strategy",
                "only-if-needed",
                "aider-chat[browser]",
            ],
            check=True,
        )

        # Install the package in development mode
        print("Installing aider-for-dreamlab in development mode...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-e", "."],
            cwd=repo_dir,
            check=True,
        )

        print("Successfully installed aider-for-dreamlab!")
        print("Note: 'aider' has been added to your Python path.")

    except subprocess.CalledProcessError as e:
        print(f"Error during installation: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

    return True


setup_streamlit_config()
install_aider_for_dreamlab()


################################################################################
# Background Task to Kill Stale Services
################################################################################
@app.on_event("startup")
async def startup_event():
    """When the application starts, spin up a background task."""
    logger.info("Starting background cleanup task.")
    asyncio.create_task(cleanup_stale_services())


@app.on_event("shutdown")
async def shutdown_event():
    """
    When the server is shutting down (e.g., Ctrl+C), kill all running services
    to prevent them from hanging around in the background.
    """
    logger.info("Server shutdown event triggered. Killing all running services...")
    for service_id, service_info in list(ID_TO_SERVICE.items()):
        kill_process_group(service_info["process"], service_id)
    logger.info("All services killed. Goodbye.")


async def cleanup_stale_services():
    """
    Periodically checks for services that have not received a heartbeat
    within the heartbeat timeout. If found, kills the process and removes
    it from the ID_TO_SERVICE dictionary.
    """
    while True:
        # Log how many services we are managing right now
        logger.debug("Running cleanup - total services: %d", len(ID_TO_SERVICE))

        now = time.time()

        for service_id, service_info in list(ID_TO_SERVICE.items()):
            last_heartbeat = service_info["last_heartbeat"]
            process = service_info["process"]
            elapsed = now - last_heartbeat
            if elapsed > HEARTBEAT_TIMEOUT:
                logger.debug(
                    "Service '%s' is stale (no heartbeat for %d seconds). "
                    "Attempting to kill process (pid=%d)...",
                    service_id,
                    elapsed,
                    process.pid,
                )
                kill_process_group(process, service_id)

                if service_id in ID_TO_SERVICE:
                    del ID_TO_SERVICE[service_id]
                logger.info(
                    "Service '%s' killed and removed from registry.", service_id
                )

        # Wait some time before checking again
        await asyncio.sleep(30)  # Adjust as needed


def kill_process_group(proc: subprocess.Popen, service_id: str) -> None:
    """
    Attempt to kill the entire process group for the given Popen object.
    1) Send SIGTERM
    2) Wait briefly
    3) If still alive, send SIGKILL
    """
    if proc.poll() is not None:
        logger.debug("Service '%s' (pid=%d) is already dead.", service_id, proc.pid)
        return

    try:
        pgid = os.getpgid(proc.pid)
    except Exception as exc:
        logger.warning(
            "Service '%s': Failed to get PGID for pid=%d. Process may have ended: %s",
            service_id,
            proc.pid,
            exc,
        )
        return

    logger.debug(
        "Sending SIGTERM to service '%s' process group pgid=%d", service_id, pgid
    )
    try:
        os.killpg(pgid, signal.SIGTERM)
    except Exception as exc:
        logger.warning(
            "Service '%s': Failed to send SIGTERM to pgid=%d: %s", service_id, pgid, exc
        )

    # Wait a moment to let SIGTERM take effect
    time.sleep(1.0)

    # Check if it's still alive
    if proc.poll() is None:
        logger.debug(
            "Service '%s' still alive, sending SIGKILL to pgid=%d", service_id, pgid
        )
        try:
            os.killpg(pgid, signal.SIGKILL)
        except Exception as exc:
            logger.warning(
                "Service '%s': Failed to send SIGKILL to pgid=%d: %s",
                service_id,
                pgid,
                exc,
            )
    else:
        logger.debug("Service '%s' exited after SIGTERM.", service_id)


################################################################################
# Endpoint: Spawn a new service
################################################################################
PATH_PREFIX = os.environ["CODER_WORLDS_PATH"]


async def spawn_service(request: Request) -> JSONResponse:
    """
    POST /spawn
    JSON body: { "cwd": "<string>", "id": "<string>" }

    Spawns a process (e.g., 'aider') in the given `cwd` with the given ID,
    assigning the next available port (9000, 9001, etc.).
    """
    global NEXT_PORT

    data = await request.json()
    if "cwd" not in data or "id" not in data:
        logger.debug("Spawn request missing required fields: %s", data)
        return JSONResponse(
            {"error": "Missing required fields: cwd and id"},
            status_code=400,
        )

    cwd = PATH_PREFIX + data["cwd"]
    print(cwd)
    service_id = data["id"]

    # Check if this service_id is already in use
    if service_id in ID_TO_SERVICE:
        logger.debug("Service with ID '%s' already exists.", service_id)
        return JSONResponse(
            {"error": f"Service with ID '{service_id}' already exists."},
            status_code=409,
        )

    assigned_port = NEXT_PORT
    NEXT_PORT += 1

    AI_PROVIDER_API_KEY = os.environ["AI_PROVIDER_API_KEY"]

    # Example command -- replace "aider" with your actual command if needed
    cmd = [
        "aider",
        "--model",
        "openai/bedrock-sonnet-3.7",
        "--browser",
        # "--edit-format",
        # "diff"
    ]

    logger.info(
        "Spawning service '%s' at '%s' on port '%d' with cmd: %s",
        service_id,
        cwd,
        assigned_port,
        cmd,
    )

    env = os.environ.copy()
    env["BASE_URL_PATH"] = service_id
    env["CODER_PORT"] = str(assigned_port)

    env["OPENAI_API_BASE"] = "https://ai-proxy.dreamlab.gg"
    # TODO: Load dynamically for a given user. This is a key managed by the ai proxy and is not a real openai key.
    env["OPENAI_API_KEY"] = AI_PROVIDER_API_KEY
    # TODO: For now use anthropic key directly because aws is having trouble with sonnet 3.7

    env["AIDER_READ"] = os.environ["DOCS_PATH"]

    try:
        # Start the process in headless mode (no stdout/stderr).
        # Use a new session so we can reliably kill the whole process group.
        proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            # stdout=subprocess.DEVNULL,
            # stderr=subprocess.DEVNULL,
            env=env,
            start_new_session=True,  # This is the key to making kill_process_group() work
        )
    except Exception as e:
        logger.exception("Failed to start process for service '%s'.", service_id)
        return JSONResponse(
            {"error": f"Failed to start process: {str(e)}"},
            status_code=500,
        )

    # Store relevant info under this ID
    ID_TO_SERVICE[service_id] = {
        "port": assigned_port,
        "process": proc,
        "last_heartbeat": time.time(),
    }

    logger.debug("Service '%s' successfully spawned (pid=%d).", service_id, proc.pid)

    return JSONResponse(
        {
            "id": service_id,
            "port": assigned_port,
            "message": "Service spawned successfully",
        }
    )


################################################################################
# Endpoint: Heartbeat
################################################################################
async def heartbeat(request: Request) -> JSONResponse:
    """
    POST /heartbeat
    JSON body: { "id": "<string>" }

    Updates the service's heartbeat timestamp so it isn't killed.
    """
    data = await request.json()
    service_id = data.get("id")
    if not service_id:
        logger.debug("Heartbeat request missing 'id': %s", data)
        return JSONResponse({"error": "Missing 'id' in request body"}, status_code=400)

    service_info = ID_TO_SERVICE.get(service_id)
    if not service_info:
        logger.debug("Heartbeat request for unknown service '%s'", service_id)
        return JSONResponse(
            {"error": f"Service '{service_id}' not found"}, status_code=404
        )

    # Update last heartbeat
    old_timestamp = service_info["last_heartbeat"]
    service_info["last_heartbeat"] = time.time()

    logger.debug(
        "Heartbeat received for service '%s'. Old: %d, New: %d",
        service_id,
        old_timestamp,
        service_info["last_heartbeat"],
    )

    return JSONResponse({"message": "Heartbeat received"})


################################################################################
# Endpoint: Check if service exists
################################################################################
async def service_exists(request: Request) -> JSONResponse:
    """
    GET /service/{service_id:path}

    Returns whether the service with the given ID is running. If so, also
    returns the port it's listening on.
    Response:
      {
        "exists": <bool>,
        "id": <str>,
        "port": <int or null if not found>
      }
    """
    # Using {service_id:path} so IDs with slashes are captured
    service_id = request.path_params["service_id"]
    service_info = ID_TO_SERVICE.get(service_id)

    if service_info:
        return JSONResponse(
            {"exists": True, "id": service_id, "port": service_info["port"]}
        )
    else:
        return JSONResponse({"exists": False, "id": service_id, "port": None})


################################################################################
# Routes
################################################################################

routes = [
    Route("/spawn", endpoint=spawn_service, methods=["POST"]),
    Route("/heartbeat", endpoint=heartbeat, methods=["POST"]),
    Route("/service/{service_id:path}", endpoint=service_exists, methods=["GET"]),
]

app.router.routes.extend(routes)


################################################################################
# Main
################################################################################
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5025, log_level="debug")
