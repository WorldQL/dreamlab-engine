python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
export AI_PROVIDER_API_KEY="foobar"
# adjust these to your path
CODER_WORLDS_PATH="/home/jackson/dreamlab/dreamlab-engine/multiplayer/worlds/" DOCS_PATH=~/dreamlab/dreamlab-docs/combined-ingredients.md python main.py
