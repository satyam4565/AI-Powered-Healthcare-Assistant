import os
import sys
import json
import asyncio
import re
from groq import Groq
from contextlib import AsyncExitStack
from mcp.client.session import ClientSession
from mcp.client.stdio import StdioServerParameters
from mcp.client.stdio import stdio_client
from agent.context_manager import context_manager
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load Groq key
groq_api_key = os.getenv("GROQ_API_KEY", "dummy")
print("GROQ KEY:", groq_api_key)

MODELS = [
    "llama-3.3-70b-versatile",   # primary (high quality)
    "llama-3.1-8b-instant"       # fallback (fast + cheap)
]

_REQUIRED_TOOL_FIELDS = {
    # "book_appointment": ("doctor_name", "date", "time", "patient_name", "email"),
    "book_appointment": ("doctor_name", "date", "time"),
    # "check_availability": ("doctor_name", "date", "time", "patient_name", "email"),
}


def _extract_context_from_history(history):
    extracted = {}
    text_parts = []
    for item in history:
        if isinstance(item, dict) and item.get("role") == "user":
            content = item.get("content")
            if isinstance(content, str):
                text_parts.append(content)

    merged = "\n".join(text_parts[-6:])

    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', merged, re.IGNORECASE)
    if email_match:
        extracted["email"] = email_match.group(0)

    name_match = re.search(r"(?:my name is|i am)\s+([A-Za-z][A-Za-z\s]{1,60})", merged, re.IGNORECASE)
    if name_match:
        extracted["patient_name"] = name_match.group(1).strip()

    doctor_match = re.search(r"(?:dr\.?\s+[A-Za-z\s]+)", merged, re.IGNORECASE)
    if doctor_match:
        extracted["doctor_name"] = doctor_match.group(0).strip()

    date_match = re.search(r"\b(20\d{2}-\d{2}-\d{2})\b", merged)
    if date_match:
        extracted["date"] = date_match.group(1)

    time_match = re.search(r"\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm))\b", merged)
    if time_match:
        extracted["time"] = time_match.group(1).upper().replace(" ", " ")

    return extracted


def _enforce_tool_args(tool_name, args, history, user_id, role):
    if not isinstance(args, dict):
        args = {}

    # We ONLY inject user_id and role. Do not inject doctor_id/patient_id here!
    args["user_id"] = user_id
    args["role"] = role

    required = _REQUIRED_TOOL_FIELDS.get(tool_name)
    if not required:
        return True, args, ""

    extracted = _extract_context_from_history(history)
    for field in required:
        if field not in args or args[field] in (None, ""):
            if field in extracted and extracted[field]:
                args[field] = extracted[field]

    missing = [field for field in required if field not in args or args[field] in (None, "")]
    if missing:
        human_labels = ", ".join(missing)
        return False, args, f"Please provide {human_labels} to proceed with booking."

    return True, args, ""


def call_groq_sync(messages, tools):
    client = Groq(api_key=groq_api_key)
    last_error = None

    for model in MODELS:
        print(f"🚀 Trying model: {model}")
        try:
            completion_kwargs = {
                "model": model,
                "messages": messages,
                "temperature": 0.3,
                "max_tokens": 500,
            }
            if tools:
                completion_kwargs["tools"] = tools
                completion_kwargs["tool_choice"] = "auto"

            response = client.chat.completions.create(**completion_kwargs)
            print(f"✅ Success with model: {model}")
            return response
        except Exception as e:
            last_error = e
            print(f"❌ Model failed: {model}")
            err_str = str(e)
            if "rate_limit" in err_str:
                continue
            break

    raise last_error if last_error else RuntimeError("Groq call failed")


def convert_mcp_schema_to_openai(mcp_tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": mcp_tool.name,
            "description": getattr(mcp_tool, "description", ""),
            "parameters": mcp_tool.inputSchema
        }
    }


_AUTH_ENFORCED_TOOLS = {"get_doctor_schedule", "get_patient_stats", "book_appointment"}


async def process_chat(session_id: str, message: str, user: dict) -> str:
    user_id = int(user["user_id"])
    role = user["role"]
    
    await context_manager.add_message(session_id, user_id, role, {"role": "user", "content": message})
    current_history = await context_manager.get_session_history(session_id)

    server_script = os.path.join(os.path.dirname(__file__), "../mcp_server/run_server.py")

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[server_script],
        env=os.environ.copy()
    )

    async with AsyncExitStack() as exit_stack:
        try:
            stdio_transport = await exit_stack.enter_async_context(stdio_client(server_params))
            read, write = stdio_transport
            mcp_session = await exit_stack.enter_async_context(ClientSession(read, write))
            await mcp_session.initialize()
            print("✅ MCP Client connected")
        except Exception as e:
            # Fallback if MCP fails
            print(f"❌ MCP connection failed: {e}")
            mcp_session = None

        # ---------------- SYSTEM PROMPT & PERSONALIZATION ----------------
        if not mcp_session:
            system_msg_content = "You are a helpful assistant. (MCP offline)"
        else:
            prompt_name = "scheduling_prompt" if role == "patient" else "reporting_prompt"
            try:
                mcp_prompt = await mcp_session.get_prompt(prompt_name)
                system_msg_content = mcp_prompt.messages[0].content.text
            except Exception:
                if role == "patient":
                    system_msg_content = "You are a helpful medical assistant helping patients."
                else:
                    system_msg_content = "You are an assistant helping doctors."

            system_msg_content += """
IMPORTANT RULES:
- You MUST call tools using VALID JSON ONLY
- NEVER return XML like <function=...>
- If calling tool, return ONLY JSON: {"name": "...", "arguments": {...}}
- DO NOT include explanation text with tool calls
"""
            current_date = datetime.now().strftime("%A, %Y-%m-%d")
            system_msg_content += f"""

AUTHENTICATED USER CONTEXT:
- user_id: {user_id}
- role: {role}

CURRENT SYSTEM DATE: {current_date}

IMPORTANT:
- You MUST use the CURRENT SYSTEM DATE to accurately calculate dates for "today", "tomorrow", or specific days of the week.
- You MUST use this user_id for ALL tool calls
- DO NOT guess user identity
- DO NOT fabricate user data
"""
            system_msg_content += """

CRITICAL BOOKING FLOW RULES:
1. NEVER call `book_appointment` right away.
2. FIRST, use `check_availability` or `get_doctor_directory` to see who is free and when.
3. Present the available slots to the user and ASK them which time they prefer.
4. ONLY call `book_appointment` AFTER the user has explicitly confirmed the specific time they want.
5. IF THE LAST MESSAGE IS A TOOL RESPONSE, YOU MUST SUMMARIZE IT IN PLAIN TEXT. DO NOT OUTPUT JSON AGAIN.
"""

        messages = [{"role": "system", "content": system_msg_content}] + current_history

        # ---------------- TOOLS ----------------
        openai_tools = []
        if mcp_session:
            try:
                mcp_tools_list = await mcp_session.list_tools()
                openai_tools = [convert_mcp_schema_to_openai(t) for t in mcp_tools_list.tools]
            except Exception as e:
                print(f"❌ Read tools failed: {e}")

        # ---------------- LOOP ----------------
        loop_count = 0
        max_loops = 3
        
        while loop_count < max_loops:
            loop_count += 1
            print(f"🚀 Calling Groq model... (Attempt {loop_count})")
            try:
                response = await asyncio.to_thread(call_groq_sync, messages, openai_tools)
            except Exception as e:
                print("❌ Groq Error:", str(e))
                return "⚠️ Server is busy. Please try again in a moment."

            msg = response.choices[0].message
            await context_manager.add_message(session_id, user_id, role, msg.model_dump(exclude_none=True) if hasattr(msg, "model_dump") else msg)
            messages.append(msg.model_dump(exclude_none=True) if hasattr(msg, "model_dump") else msg)

            if isinstance(msg.content, str) and "<function=" in msg.content:
                return "⚠️ Tool call format error. Please try again."

            if getattr(msg, "tool_calls", None) and mcp_session:
                for tool_call in msg.tool_calls:
                    tool_name = tool_call.function.name
                    args = json.loads(tool_call.function.arguments)

                    print(f"🛠 Tool called: {tool_name} → {args}")
                    try:
                        ok, args, prompt_for_user = _enforce_tool_args(
                            tool_name, args, messages, user_id, role
                        )
                        if not ok:
                            return prompt_for_user
                        result = await mcp_session.call_tool(tool_name, arguments=args)
                        tool_output = "\n".join(
                            [getattr(c, "text", "") for c in getattr(result, "content", [])]
                        ) if getattr(result, "content", None) else "Success"

                        if getattr(result, "isError", False):
                            tool_output = f"Tool Error: {tool_output}"
                    except Exception as e:
                        tool_output = f"❌ Tool execution error: {str(e)}"

                    tool_msg = {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": str(tool_output)
                    }
                    await context_manager.add_message(session_id, user_id, role,tool_msg)
                    messages.append(tool_msg)
                continue

            content = msg.content or ""
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match and mcp_session:
                try:
                    parsed = json.loads(json_match.group())
                    if "name" in parsed:
                        tool_name = parsed["name"]
                        args = parsed.get("arguments") or parsed.get("parameters", {})
                        print(f"🧠 Parsed tool: {tool_name} → {args}")
                        ok, args, prompt_for_user = _enforce_tool_args(
                            tool_name, args, messages, user_id, role
                        )
                        if not ok:
                            return prompt_for_user
                        result = await mcp_session.call_tool(tool_name, arguments=args)
                        tool_output = "\n".join(
                            [getattr(c, "text", "") for c in getattr(result, "content", [])]
                        ) if getattr(result, "content", None) else "Success"
                        tool_msg = {
                            "role": "tool",
                            "tool_call_id": f"parsed_{tool_name}",
                            "content": str(tool_output)
                        }
                        await context_manager.add_message(session_id, user_id, role, tool_msg)
                        messages.append(tool_msg)
                        continue
                except Exception as e:
                    print("❌ JSON parse failed:", e)

            if any(x in content for x in ["<function=", "tool_calls", "{"]):
                print("⚠️ JSON leak blocked")
                # If we have a recent tool output, just show that instead of failing!
                for past_msg in reversed(messages):
                    if past_msg.get("role") == "tool":
                        return past_msg.get("content")
                return "I had trouble processing your request. Please try again."

            print("✅ Final Response generated.")
            return content or "I couldn't process that request."
            
        # --- THIS IS OUTSIDE THE WHILE LOOP ---
        # If we break out of the max_loops, look for a successful tool execution and return it!
        for past_msg in reversed(messages):
            if past_msg.get("role") == "tool" and "Error" not in past_msg.get("content", ""):
                return past_msg.get("content")
                
        return "I've processed your request but the server is a bit busy right now. Check your dashboard to confirm!"