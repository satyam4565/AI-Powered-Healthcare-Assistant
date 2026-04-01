from mcp.server.fastmcp import FastMCP   # keep this (library)
from tools.check_availability import check_availability
from tools.book_appointment import book_appointment
from tools.get_patient_stats import get_patient_stats
from tools.get_doctor_schedule import get_doctor_schedule
from tools.get_summary import get_summary_report 
from resources.doctor_data import get_doctor_directory
from prompts.prompts import get_scheduling_prompt, get_reporting_prompt

# Initialize FastMCP Server
mcp = FastMCP("DoctorAssistant")

# Register Tools
mcp.add_tool(check_availability)
mcp.add_tool(book_appointment)
mcp.add_tool(get_patient_stats)
mcp.add_tool(get_doctor_schedule)
mcp.add_tool(get_summary_report)

# Register Resources
@mcp.resource("doctors://directory")
async def doctor_directory_resource() -> str:
    return await get_doctor_directory()

# Register Prompts
@mcp.prompt("scheduling_prompt")
def scheduling_prompt_mcp() -> str:
    return get_scheduling_prompt()

@mcp.prompt("reporting_prompt")
def reporting_prompt_mcp() -> str:
    return get_reporting_prompt()