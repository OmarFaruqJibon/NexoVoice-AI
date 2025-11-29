# conversation.py
conversation_history = []
MAX_HISTORY = 50 

def add_message(role, content):
    conversation_history.append({"role": role, "content": content})
    if len(conversation_history) > MAX_HISTORY:
        conversation_history.pop(0)

def get_history():
    return conversation_history
