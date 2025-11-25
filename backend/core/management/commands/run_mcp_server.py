from django.core.management.base import BaseCommand
from ai_assistant.mcp_server import MCPServer

class Command(BaseCommand):
    help = 'Runs the Model Context Protocol (MCP) Server'

    def handle(self, *args, **options):
        server = MCPServer()
        server.run()
