# conversation.py
conversation_history = []
MAX_HISTORY = 10   # keep last 10 exchanges only

def add_message(role, content):
    conversation_history.append({"role": role, "content": content})
    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)

def get_history():
    return conversation_history
