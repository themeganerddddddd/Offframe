from pathlib import Path
import base64,re,json
root=Path(__file__).parent
html=(root/'index.html').read_text()
css=(root/'styles.css').read_text()+'\n'+(root/'offframe-v10.css').read_text()
js=(root/'app.js').read_text()
feature=(root/'offframe-v10.js').read_text()
images={}
for p in (root/'assets').glob('*.jpg'):
 images[p.name]='data:image/jpeg;base64,'+base64.b64encode(p.read_bytes()).decode('ascii')
for name,b64 in images.items():
 css=css.replace('assets/'+name,b64)
js=js.replace("const asset=x=>'assets/'+x;",'const IMAGE_DATA='+json.dumps(images,separators=(',',':'))+';\nconst asset=x=>IMAGE_DATA[x] || \'\';')
html=html.replace('<link rel="stylesheet" href="styles.css">','<style>\n'+css+'\n</style>')
html=html.replace('<link rel="stylesheet" href="offframe-v10.css">','')
html=html.replace('<script src="app.js"></script>','<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>')
html=html.replace('<script src="offframe-v10.js"></script>','<script>\n'+feature.replace('</script>','<\\/script>')+'\n</script>')
# remove google font network requests in standalone preview (system fonts otherwise)
html=re.sub(r'<link rel="preconnect"[^>]*>\s*','',html)
html=re.sub(r'<link href="https://fonts.googleapis.com[^>]+>\s*','',html)
(root.parent/'offframe-interactive-v10.html').write_text(html)
print('standalone bytes',len(html),'assets',len(images))
