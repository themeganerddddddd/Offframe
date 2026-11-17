from pathlib import Path
import base64, json, re
root=Path(__file__).parent
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')+'\n'+(root/'offframe-v10.css').read_text(encoding='utf-8')+'\n'+(root/'offframe-v11.css').read_text(encoding='utf-8')
app=(root/'app.js').read_text(encoding='utf-8')
feature=(root/'offframe-v10.js').read_text(encoding='utf-8')
extra=(root/'offframe-v11.js').read_text(encoding='utf-8')
images={p.name:'data:image/jpeg;base64,'+base64.b64encode(p.read_bytes()).decode('ascii') for p in (root/'assets').glob('*.jpg')}
for name,b64 in images.items():css=css.replace('assets/'+name,b64)
app=app.replace("const asset=x=>'assets/'+x;",'const IMAGE_DATA='+json.dumps(images,separators=(',',':'))+';\nconst asset=x=>IMAGE_DATA[x] || \'\';')
html=html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n'+css+'\n</style>')
html=html.replace('<link rel="stylesheet" href="offframe-v10.css">','')
html=html.replace('<link rel="stylesheet" href="offframe-v11.css">','')
html=html.replace('<script src="app.js"></script>','<script>\n'+app.replace('</script>','<\\/script>')+'\n</script>')
html=html.replace('<script src="offframe-v10.js"></script>','<script>\n'+feature.replace('</script>','<\\/script>')+'\n</script>')
html=html.replace('<script src="offframe-v11.js"></script>','<script>\n'+extra.replace('</script>','<\\/script>')+'\n</script>')
html=re.sub(r'<link rel="preconnect"[^>]*>\s*','',html)
html=re.sub(r'<link href="https://fonts.googleapis.com[^>]+>\s*','',html)
out=root.parent/'offframe-interactive-v11.html'
out.write_text(html,encoding='utf-8')
print(f'Created {out} with {len(images)} embedded assets; bytes={out.stat().st_size}')
