# OpenAI Tool Schemas

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "CREATE_COMPANY",
            "description": "Create a new company in the CRM.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name of the company"},
                    "industry": {"type": "string", "description": "Industry sector (e.g. Tech, Retail)"},
                    "size": {"type": "string", "description": "Size of company (Small, Medium, Large)"},
                    "website": {"type": "string", "description": "Website URL"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "UPDATE_COMPANY",
            "description": "Update an existing company's details.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name of the company to update"},
                    "industry": {"type": "string"},
                    "size": {"type": "string"},
                    "website": {"type": "string"},
                    "notes": {"type": "string", "description": "Notes to append or update"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "GET_COMPANY_DETAILS",
            "description": "Get full details about a company.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name of the company to search for"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "CREATE_CONTACT",
            "description": "Create a new contact person.",
            "parameters": {
                "type": "object",
                "properties": {
                    "first_name": {"type": "string"},
                    "last_name": {"type": "string"},
                    "company_name": {"type": "string", "description": "Company to link this contact to"},
                    "email": {"type": "string"},
                    "position": {"type": "string"}
                },
                "required": ["first_name", "last_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "UPDATE_CONTACT",
            "description": "Update an existing contact.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Name of the contact to update (First or Last or Full)"},
                    "email": {"type": "string"},
                    "position": {"type": "string"},
                    "phone": {"type": "string"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "CREATE_CONTRACT",
            "description": "Create a new contract for a company.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Title of the contract"},
                    "company_name": {"type": "string", "description": "Company this contract belongs to"},
                    "amount": {"type": "number", "description": "Monetary value of the contract"},
                    "status": {"type": "string", "enum": ["draft", "signed", "active", "terminated"], "default": "draft"}
                },
                "required": ["title", "company_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "UPDATE_CONTRACT",
            "description": "Update the status of a contract.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Title of the contract to find"},
                    "status": {"type": "string", "enum": ["draft", "signed", "active", "terminated"]}
                },
                "required": ["title", "status"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "CREATE_TASK",
            "description": "Create a new task.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Title of the task"},
                    "description": {"type": "string"},
                    "due_date": {"type": "string", "description": "Due date in YYYY-MM-DD format"},
                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "default": "medium"},
                    "assigned_to_username": {"type": "string", "description": "Username of the assignee"}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "UPDATE_TASK",
            "description": "Update an existing task (title, description, status, etc).",
            "parameters": {
                "type": "object",
                "properties": {
                    "original_title": {"type": "string", "description": "The current title of the task to find"},
                    "new_title": {"type": "string", "description": "New title (optional)"},
                    "description": {"type": "string", "description": "New description (optional)"},
                    "status": {"type": "string", "enum": ["todo", "in_progress", "done"], "description": "New status (optional)"},
                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "description": "New priority (optional)"},
                    "due_date": {"type": "string", "description": "New due date YYYY-MM-DD (optional)"}
                },
                "required": ["original_title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "EXTRACT_TASKS",
            "description": "Extract multiple tasks from a natural language text or notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "text": {"type": "string", "description": "The text content to analyze for tasks"},
                    "company_name": {"type": "string", "description": "Associated company context if any"},
                    "dry_run": {"type": "boolean", "description": "If true, only list tasks without creating them. Default false."}
                },
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "LIST_TASKS",
            "description": "List existing tasks based on filters.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {"type": "string", "enum": ["todo", "in_progress", "done"]},
                    "priority": {"type": "string", "enum": ["low", "medium", "high"]},
                    "due_date_range": {"type": "string", "enum": ["today", "this_week", "this_month", "last_month", "overdue"]}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "CREATE_MEETING",
            "description": "Schedule a new meeting.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Subject of the meeting"},
                    "company_name": {"type": "string", "description": "Company involved"},
                    "date": {"type": "string", "description": "Date and time (YYYY-MM-DD HH:MM)"},
                    "type": {"type": "string", "enum": ["call", "in_person", "video"], "default": "call"}
                },
                "required": ["title", "company_name", "date"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "LIST_MEETINGS",
            "description": "List upcoming or past meetings.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_name": {"type": "string"},
                    "date_range": {"type": "string", "enum": ["upcoming", "past", "today", "this_week"]}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "ADD_NOTE",
            "description": "Add a text note to an entity (Company, Contact, Contract, Meeting).",
            "parameters": {
                "type": "object",
                "properties": {
                    "entity_type": {"type": "string", "enum": ["company", "contact", "contract", "meeting"]},
                    "entity_id": {"type": "string", "description": "UUID or ID of the entity"},
                    "note_content": {"type": "string", "description": "The content of the note"}
                },
                "required": ["entity_type", "entity_id", "note_content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "ANALYZE_DATA",
            "description": "Analyze CRM data (counts, sums, stats).",
            "parameters": {
                "type": "object",
                "properties": {
                    "entity_type": {"type": "string", "enum": ["company", "contact", "contract", "meeting", "task"]},
                    "metric": {"type": "string", "enum": ["count", "sum_amount", "top_clients_revenue", "top_clients_activity"]},
                    "time_period": {"type": "string", "enum": ["this_month", "last_month", "this_year", "all_time"]}
                },
                "required": ["entity_type", "metric"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "DRAFT_CONTENT",
            "description": "Draft content like emails or summaries.",
            "parameters": {
                "type": "object",
                "properties": {
                    "entity_type": {"type": "string"},
                    "entity_id": {"type": "string"},
                    "instruction": {"type": "string", "description": "What to draft (e.g. 'Draft introduction email')"}
                },
                "required": ["instruction"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "SEND_EMAIL",
            "description": "Send a real email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to_email": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to_email", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "SEARCH_KNOWLEDGE_BASE",
            "description": "Search the internal knowledge base (documents, contracts, meetings, tasks) to answer specific questions, find facts, or retrieve details buried in notes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query (e.g. 'Montant contrat X', 'Détails réunion Y')"}
                },
                "required": ["query"]
            }
        }
    }
]
