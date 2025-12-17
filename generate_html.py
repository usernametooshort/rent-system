import markdown
import os

# Input and output paths
input_file = '/var/services/homes/usernametooshort/.gemini/antigravity/brain/e3616178-80aa-4210-924c-8c9e43ad1af6/system_introduction.md'
output_file = '/var/services/homes/usernametooshort/.gemini/antigravity/brain/e3616178-80aa-4210-924c-8c9e43ad1af6/system_introduction.html'

# CSS for print-friendly format
css = """
<style>
    body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 800px;
        margin: 0 auto;
        padding: 40px 20px;
    }
    h1, h2, h3 { color: #1a1a1a; }
    h1 { border-bottom: 2px solid #eaeaea; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #eaeaea; padding-bottom: 8px; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f8f9fa; font-weight: 600; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    code { background-color: #f1f3f5; padding: 2px 5px; border-radius: 4px; font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace; font-size: 0.9em; }
    pre { background-color: #f1f3f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
    pre code { background-color: transparent; padding: 0; }
    blockquote { border-left: 4px solid #4dabf7; margin: 0; padding-left: 20px; color: #555; background-color: #e7f5ff; padding: 10px 20px; border-radius: 4px; }
    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    @media print {
        body { max-width: 100%; padding: 0; }
        pre, blockquote { page-break-inside: avoid; }
    }
</style>
"""

# Read markdown content
with open(input_file, 'r', encoding='utf-8') as f:
    text = f.read()

# Convert to HTML (including tables extension if supported, usually 'markdown.extensions.tables')
try:
    html_content = markdown.markdown(text, extensions=['tables', 'fenced_code'])
except ImportError:
    # Fallback if extensions not found
    html_content = markdown.markdown(text)

# HTML Template
html_document = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统介绍 (v1.0)</title>
    {css}
</head>
<body>
    {html_content}
</body>
</html>
"""

# Write HTML file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(html_document)

print(f"Successfully generated {output_file}")
