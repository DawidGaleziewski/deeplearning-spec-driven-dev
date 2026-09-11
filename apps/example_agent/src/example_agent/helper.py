import os

from dotenv import find_dotenv, load_dotenv


def load_env():
    load_dotenv(find_dotenv())


def get_openai_api_key():
    load_env()
    return os.getenv("OPENAI_API_KEY")
