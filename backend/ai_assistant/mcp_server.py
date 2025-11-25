import sys
import json
import logging
from dataclasses import dataclass, asdict
from typing import Any, Dict, List, Optional
from .tools.crm import CRMTools
from .tools.tasks import TaskTools
from .tools.meetings import MeetingTools
from crm.models import Company, Contract, Meeting
from tasks.models import Task

# Configure logging to stderr so it doesn't interfere with stdout JSON-RPC
logging.basicConfig(stream=sys.stderr, level=logging.INFO)
logger = logging.getLogger("mcp_server")

class MCPServer:
    def __init__(self):
        self.tools = {
            "create_company": {
                "description": "Create a new company",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "industry": {"type": "string"},
                        "size": {"type": "string"},
                        "website": {"type": "string"}
                    },
                    "required": ["name"]
                },
                "handler": CRMTools.create_company
            },
            "create_contact": {
                "description": "Create a new contact",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "first_name": {"type": "string"},
                        "last_name": {"type": "string"},
                        "company_name": {"type": "string"},
                        "email": {"type": "string"},
                        "position": {"type": "string"}
                    },
                    "required": ["first_name", "last_name", "company_name"]
                },
                "handler": CRMTools.create_contact
            },
            "create_task": {
                "description": "Create a new task",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "description": {"type": "string"},
                        "due_date": {"type": "string", "description": "YYYY-MM-DD"},
                        "priority": {"type": "string", "enum": ["low", "medium", "high"]}
                    },
                    "required": ["title"]
                },
                "handler": TaskTools.create_task
            },
            "create_meeting": {
                "description": "Schedule a meeting",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "company_name": {"type": "string"},
                        "date": {"type": "string", "description": "YYYY-MM-DD HH:MM:SS"},
                        "type": {"type": "string", "enum": ["video", "phone", "in_person"]}
                    },
                    "required": ["title", "company_name", "date"]
                },
                "handler": MeetingTools.create_meeting
            }
        }

    def run(self):
        """
        Main loop to read from stdin and write to stdout.
        """
        logger.info("MCP Server running...")
        while True:
            try:
                line = sys.stdin.readline()
                if not line:
                    break
                
                request = json.loads(line)
                self.handle_request(request)
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error processing request: {e}")

    def handle_request(self, request: Dict[str, Any]):
        method = request.get("method")
        msg_id = request.get("id")
        params = request.get("params", {})

        response = None

        if method == "initialize":
            response = {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {},
                    "resources": {}
                },
                "serverInfo": {
                    "name": "cms-mcp-server",
                    "version": "1.0.0"
                }
            }
        elif method == "notifications/initialized":
            # No response needed for notifications
            return
        elif method == "tools/list":
            response = {
                "tools": [
                    {
                        "name": name,
                        "description": tool["description"],
                        "inputSchema": tool["inputSchema"]
                    }
                    for name, tool in self.tools.items()
                ]
            }
        elif method == "tools/call":
            tool_name = params.get("name")
            args = params.get("arguments", {})
            
            if tool_name in self.tools:
                try:
                    # Execute tool
                    result = self.tools[tool_name]["handler"](**args)
                    
                    # Format result
                    content_text = str(result)
                    if isinstance(result, dict):
                        content_text = result.get("message", str(result))

                    response = {
                        "content": [
                            {
                                "type": "text",
                                "text": content_text
                            }
                        ]
                    }
                except Exception as e:
                    response = {
                        "content": [
                            {
                                "type": "text",
                                "text": f"Error: {str(e)}"
                            }
                        ],
                        "isError": True
                    }
            else:
                # Error: Tool not found
                # But MCP expects a result object usually
                response = {
                    "content": [{"type": "text", "text": f"Tool {tool_name} not found"}],
                    "isError": True
                }

        elif method == "resources/list":
            # List some basic resources
            resources = []
            # Add companies
            for company in Company.objects.all()[:10]:
                resources.append({
                    "uri": f"crm://companies/{company.id}",
                    "name": f"Company: {company.name}",
                    "mimeType": "application/json"
                })
            # Add tasks
            for task in Task.objects.all()[:10]:
                resources.append({
                    "uri": f"tasks://{task.id}",
                    "name": f"Task: {task.title}",
                    "mimeType": "application/json"
                })
                
            response = {
                "resources": resources
            }

        elif method == "resources/read":
            uri = params.get("uri", "")
            content = ""
            
            if uri.startswith("crm://companies/"):
                company_id = uri.split("/")[-1]
                try:
                    company = Company.objects.get(id=company_id)
                    data = {
                        "name": company.name,
                        "industry": company.industry,
                        "website": company.website,
                        "notes": company.notes,
                        "contracts": list(company.contracts.values('title', 'status')),
                        "meetings": list(company.meetings.values('title', 'date'))
                    }
                    content = json.dumps(data, indent=2)
                except Company.DoesNotExist:
                    content = "Company not found"
            
            elif uri.startswith("tasks://"):
                task_id = uri.split("//")[1]
                try:
                    task = Task.objects.get(id=task_id)
                    data = {
                        "title": task.title,
                        "description": task.description,
                        "status": task.status,
                        "due_date": str(task.due_date)
                    }
                    content = json.dumps(data, indent=2)
                except Task.DoesNotExist:
                    content = "Task not found"

            response = {
                "contents": [
                    {
                        "uri": uri,
                        "mimeType": "application/json",
                        "text": content
                    }
                ]
            }
        
        # Send JSON-RPC Response
        if msg_id is not None:
            json_rpc_response = {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": response
            }
            sys.stdout.write(json.dumps(json_rpc_response) + "\n")
            sys.stdout.flush()
