import sys
import os
import asyncio

# Setup sys.path explicitly to point to the `backend` folder as root package
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
mcp_root = os.path.dirname(__file__)

for path in [backend_root, mcp_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

from server import mcp

if __name__ == "__main__":
    # Explicitly use asyncio.run to bypass AnyIO CancelScope and async_run NameErrors
    try:
        asyncio.run(mcp.run_stdio_async())
    except KeyboardInterrupt:
        pass