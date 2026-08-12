import requests
import base64
import json
import os
import sys
import zipfile
import io

# Create a GitHub repo and push the mood-sites folder
# Uses GitHub CLI auth token or personal access token

def get_gh_token():
    """Try to get GitHub token from gh CLI or environment."""
    # Check gh auth token
    try:
        import subprocess
        result = subprocess.run(['gh', 'auth', 'token'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except:
        pass
    
    # Check environment
    for var in ['GH_TOKEN', 'GITHUB_TOKEN', 'GH_PAT']:
        token = os.environ.get(var)
        if token and len(token) > 20:
            return token
    
    return None

def create_repo(token, owner, name, private=False):
    """Create a GitHub repository."""
    url = f"https://api.github.com/user/repos"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    data = {
        "name": name,
        "private": private,
        "auto_init": False,
        "description": "Mood-based playlist website with glassmorphism design - Delux Saloon, Auto, Baarish, Roof, Truck"
    }
    resp = requests.post(url, headers=headers, json=data)
    if resp.status_code in [201, 422]:
        return resp.json()
    raise Exception(f"Failed to create repo: {resp.status_code} {resp.text}")

def create_file(token, owner, repo, path, content, message, branch="main"):
    """Create or update a file in the repo."""
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # Get existing file if any
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            existing = resp.json()
            sha = existing.get('sha')
        else:
            sha = None
    except:
        sha = None
    
    data = {
        "message": message,
        "content": base64.b64encode(content.encode()).decode(),
        "branch": branch
    }
    if sha:
        data["sha"] = sha
    
    resp = requests.put(url, headers=headers, json=data)
    if resp.status_code in [200, 201]:
        return resp.json()
    raise Exception(f"Failed to create file {path}: {resp.status_code} {resp.text}")

def main():
    token = get_gh_token()
    if not token:
        print("No GitHub token found. Please set GH_TOKEN or GITHUB_TOKEN environment variable.")
        print("Or run: gh auth login")
        sys.exit(1)
    
    owner = "Satin-Fi"
    repo_name = "mood-playlists"
    base_path = r"C:\Users\Piyush\Downloads\Thundocs2\mood-sites"
    
    print(f"Creating repository {owner}/{repo_name}...")
    try:
        repo = create_repo(token, owner, repo_name)
        print(f"✓ Repository created (or already exists): {repo.get('html_url', 'N/A')}")
    except Exception as e:
        print(f"Repository creation failed: {e}")
        # Try to continue anyway - might already exist
        print("Attempting to continue with existing repository...")
    
    # Get owner from token
    user_resp = requests.get("https://api.github.com/user", headers={
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    })
    if user_resp.status_code == 200:
        owner = user_resp.json().get("login", owner)
        print(f"Authenticated as: {owner}")
    
    # Files to upload
    files_to_upload = [
        ("index.html", "feat: mood selection dashboard with glassmorphism cards"),
        ("delux-saloon.html", "feat: Delux Saloon mood page with vintage barbershop wallpaper"),
        ("auto.html", "feat: Auto rickshaw mood page with street transport wallpaper"),
        ("baarish.html", "feat: Baarish mood page with monsoon rain wallpaper and animated raindrops"),
        ("roof.html", "feat: Roof mood page with night sky wallpaper and twinkling stars"),
        ("truck.html", "feat: Truck mood page with highway golden hour wallpaper"),
        ("DESIGN.md", "docs: design token spec for mood playlists suite"),
        ("README.md", "docs: project documentation and usage guide"),
    ]
    
    # Upload HTML files and docs
    for filename, message in files_to_upload:
        filepath = os.path.join(base_path, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            try:
                result = create_file(token, owner, repo_name, filename, content, message)
                print(f"✓ {filename}")
            except Exception as e:
                print(f"✗ {filename}: {e}")
    
    # Upload images directory
    images_dir = os.path.join(base_path, "images")
    if os.path.exists(images_dir):
        image_files = [f for f in os.listdir(images_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
        for img_file in image_files:
            filepath = os.path.join(images_dir, img_file)
            if os.path.exists(filepath):
                with open(filepath, 'rb') as f:
                    content = f.read().decode('latin-1')  # Binary to string for base64
                try:
                    result = create_file(token, owner, repo_name, f"images/{img_file}", content, f"feat: wallpaper image for {img_file.replace('.jpg', '').replace('.jpeg', '').replace('.png', '').title()} mood")
                    print(f"✓ images/{img_file}")
                except Exception as e:
                    print(f"✗ images/{img_file}: {e}")
    
    print(f"\n✅ Push complete!")
    print(f"View repository: https://github.com/{owner}/{repo_name}")
    print(f"\nTo deploy on Vercel:")
    print(f"  1. Go to https://vercel.com/new")
    print(f"  2. Import from GitHub: {owner}/{repo_name}")
    print(f"  3. Deploy as static site (no framework needed)")

if __name__ == "__main__":
    main()
