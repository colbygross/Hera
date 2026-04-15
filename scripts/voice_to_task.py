#!/usr/bin/env python3
import subprocess
import os
import json
import sqlite3
import requests
import re
import sys
from datetime import datetime
from datetime import timedelta

WHISPER_DIR = "/home/archer/whisper.cpp"
WHISPER_MAIN = os.path.join(WHISPER_DIR, "build/bin/whisper-cli")
WHISPER_MODEL = os.path.join(WHISPER_DIR, "models/ggml-base.en.bin")
DB_PATH = "/home/archer/.config/HERA/hera.db"
WAV_FILE = "/tmp/voice_input.wav"
OLLAMA_API_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5-coder:3b"

def record_audio():
    print("🎤 Recording... Press Ctrl+C to stop.", flush=True)
    try:
        # Record at 16kHz, 16-bit, mono channel
        subprocess.run(["arecord", "-f", "S16_LE", "-c", "1", "-r", "16000", WAV_FILE], 
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except KeyboardInterrupt:
        print("\n🛑 Recording stopped.")
    except Exception as e:
        print(f"\n❌ Error recording audio: {e}")

def transcribe_audio():
    print("📝 Transcribing audio...", flush=True)
    if not os.path.exists(WHISPER_MAIN):
        print(f"❌ Error: whisper.cpp executable not found at {WHISPER_MAIN}")
        sys.exit(1)
    if not os.path.exists(WHISPER_MODEL):
        print(f"❌ Error: Model file not found at {WHISPER_MODEL}")
        sys.exit(1)
        
    try:
        result = subprocess.run([
            WHISPER_MAIN, 
            "-m", WHISPER_MODEL, 
            "-f", WAV_FILE, 
            "-nt" # no timestamps
        ], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running whisper: {e.stderr}")
        return None

def generate_task_json(transcript):
    print("🧠 Processing transcript with Ollama...", flush=True)
    now = datetime.now()
    current_time_str = now.strftime("%Y-%m-%d %H:%M:%S")
    
    prompt = f"""
You are an assistant that extracts task management data from voice transcripts.
Current Local Time: {current_time_str}

Extract the tasks and output STRICTLY VALID JSON in the following format, with no other text, markdown wrapper, or explanation:
{{
  "tasks": [
    {{
      "title": "Short title of the task",
      "description": "Detailed description of the task",
      "priority": "Low", "Medium", or "High", or "Urgent",
      "due_date": "ISO 8601 date string or null (resolve relative dates like 'tomorrow' using the current local time provided)",
      "subtasks": ["subtask title 1", "subtask title 2"],
      "tags": ["tag1", "tag2"]
    }}
  ]
}}

Transcript:
"{transcript}"
"""
    try:
        response = requests.post(OLLAMA_API_URL, json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        })
        response.raise_for_status()
        return response.json()['response']
    except requests.exceptions.RequestException as e:
        print(f"❌ Error communicating with Ollama: {e}")
        return None

def sanitize_and_insert(json_text):
    if not json_text:
        return
        
    try:
        # Strip potential markdown formatting
        json_text = re.sub(r'```json\s*', '', json_text, flags=re.IGNORECASE)
        json_text = re.sub(r'```\s*', '', json_text)
        json_text = json_text.strip()
        
        data = json.loads(json_text)
        
        if 'tasks' not in data or not isinstance(data['tasks'], list):
            print("❌ No 'tasks' array found in the LLM response.")
            return
            
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Determine the column ID for 'TODO'
        cursor.execute("SELECT id FROM columns WHERE title = 'TODO'")
        col_row = cursor.fetchone()
        todo_col_id = col_row[0] if col_row else 1
            
        for task in data['tasks']:
            title = task.get('title')
            if not title:
                continue
            description = task.get('description', '')
            priority = task.get('priority', 'Medium')
            due_date = task.get('due_date') # can be null
            subtasks = task.get('subtasks', [])
            tags = task.get('tags', [])
            
            # Insert Task
            cursor.execute('''
                INSERT INTO tasks (column_id, title, description, priority, due_date)
                VALUES (?, ?, ?, ?, ?)
            ''', (todo_col_id, title, description, priority, due_date))
            task_id = cursor.lastrowid
            print(f"✅ Added Task: '{title}' [Priority: {priority}]")
            
            # Insert Subtasks
            if isinstance(subtasks, list):
                for st_title in subtasks:
                    cursor.execute('INSERT INTO subtasks (task_id, title) VALUES (?, ?)', (task_id, st_title))
                    print(f"   ∟ Subtask: {st_title}")
            
            # Link Tags
            if isinstance(tags, list):
                for tag_name in tags:
                    if not tag_name: continue
                    cursor.execute('SELECT id FROM tags WHERE name = ?', (tag_name,))
                    tag_row = cursor.fetchone()
                    if tag_row:
                        tag_id = tag_row[0]
                    else:
                        cursor.execute('INSERT INTO tags (name, color) VALUES (?, ?)', (tag_name, '#818181'))
                        tag_id = cursor.lastrowid
                        print(f"   🏷️ Created Tag: {tag_name}")
                    
                    cursor.execute('INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)', (task_id, tag_id))
                    print(f"   🔗 Linked Tag: {tag_name}")
            
        conn.commit()
        conn.close()
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parsing JSON from language model: {e}")
        print(f"Raw output was:\n{json_text}")
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")

def main():
    print("=== HERA Voice to Task ===")
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at {DB_PATH}")
        sys.exit(1)
        
    record_audio()
    
    if not os.path.exists(WAV_FILE):
        print("❌ Recording failed, no WAV file produced.")
        sys.exit(1)
        
    transcript = transcribe_audio()
    if not transcript:
        print("❌ No transcript generated.")
        return
        
    print(f"\n📝 Transcript: \"{transcript}\"\n")
    
    task_json = generate_task_json(transcript)
    if not task_json:
        return
        
    sanitize_and_insert(task_json)
    
if __name__ == "__main__":
    main()
