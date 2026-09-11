"""Shared OpenAI client configuration.

Used both by the router (agent.py) and by the tool implementations that
call the model internally (tool_functions.py).
"""

from openai import OpenAI

from .helper import get_openai_api_key

client = OpenAI(api_key=get_openai_api_key())

MODEL = "gpt-4o-mini"
