from PIL import Image, ImageDraw, ImageFilter
import random, math, os
R=random.Random(23)
out='/mnt/data/offframe-web-v2/assets'
source=Image.open('/mnt/data/a_polished_dark_mode_mobile_app_ui_mockup_two_iph.png').convert('RGB')
crops={
 'portrait-original.jpg':(50,247,551,786),
 'portrait-study.jpg':(630,940,867,1138),
 'flowers.jpg':(883,941,1131,1137),
 'portrait-banner.jpg':(623,28,1128,352),
}
for name, rect in crops.items():
 im=source.crop(rect);im.save(os.path.join(out,name),quality=89,optimize=True)

def texture(img,base,seed=1):
 r=random.Random(seed);w,h=img.size; d=ImageDraw.Draw(img,'RGBA')
 for _ in range(2400):
  x=r.randrange(w);y=r.randrange(h); rad=r.randrange(1,13);a=r.randrange(4,20)
  d.line((x,y,x+r.randint(-18,18),y+r.randint(-9,9)), fill=(255,252,231,a),width=rad)
 return img

def painting(name,palette,kind,seed):
 r=random.Random(seed); W,H=800,1000
 im=Image.new('RGB',(W,H),palette[0]);d=ImageDraw.Draw(im,'RGBA')
 # old paper textured wash
 for i in range(80):
  yy=r.randrange(H); col=palette[r.randrange(1,len(palette))]
  d.rectangle((0,yy,W,yy+r.randrange(5,65)),fill=hexrgba(col,r.randrange(7,34)))
 if kind=='vase':
  d.ellipse((80,180,720,820),fill=hexrgba(palette[2],95))
  d.polygon([(180,1000),(320,630),(495,630),(640,1000)],fill=palette[1])
  d.arc((235,600,575,780),0,180,fill=palette[-1],width=24)
  for j in range(13):
   x=400+r.randrange(-95,95);y=460+r.randrange(-240,70)
   d.line((405,720,x,y),fill=palette[-1],width=r.randrange(4,9))
   d.ellipse((x-42,y-42,x+42,y+42),fill=palette[r.randrange(1,len(palette))]);
 elif kind=='abstract':
  for _ in range(53):
   x=r.randrange(-100,800);y=r.randrange(-100,1000);q=r.randrange(70,350);c=palette[r.randrange(1,len(palette))]
   d.ellipse((x,y,x+q,y+q*r.uniform(.4,1.2)),fill=hexrgba(c,r.randrange(75,220)))
  for _ in range(80):
   x=r.randrange(W);y=r.randrange(H);d.line((x,y,x+r.randrange(-120,120),y+r.randrange(-130,130)),fill=hexrgba('#e9d4ab',r.randrange(25,140)),width=r.randrange(2,16))
 elif kind=='landscape':
  d.ellipse((450,160,730,440),fill=palette[3])
  for j in range(7):
   y=480+j*72
   d.polygon([(0,y+r.randrange(-20,30)),(230,y+r.randrange(-140,40)),(520,y+r.randrange(-20,80)),(800,y+r.randrange(-80,40)),(800,H),(0,H)],fill=palette[(j+1)%(len(palette))])
  for _ in range(100):
   x=r.randrange(W);y=r.randrange(520,H)
   d.line((x,y,x+r.randrange(-22,22),y-r.randrange(1,48)),fill=hexrgba('#f9dfbe',r.randrange(10,90)),width=r.randrange(1,4))
 elif kind=='still':
  d.rectangle((0,750,W,H),fill=palette[-1]);d.ellipse((70,690,710,860),fill=hexrgba('#f2cfa1',190))
  for x,y,rad,c in [(250,520,160,palette[2]),(510,580,122,palette[3]),(380,400,100,palette[1])]:
   d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=c);d.arc((x-rad+12,y-rad+12,x+rad-12,y+rad-12),200,355,fill=hexrgba('#ffedd8',110),width=15)
 elif kind=='poster':
  for j in range(9):
   x=r.randrange(-50,700);y=r.randrange(-50,800);ww=r.randrange(70,450)
   d.polygon([(x,y),(x+ww,y-15),(x+ww+40,y+ww),(x+30,y+ww)],fill=palette[1+j%(len(palette)-1)])
  d.ellipse((155,180,640,680),outline='#eee3df',width=27)
 texture(im,palette[0],seed)
 im=im.filter(ImageFilter.GaussianBlur(.25));im.save(os.path.join(out,name),quality=84,optimize=True)

def hexrgba(s,a):
 s=s.lstrip('#'); return tuple(int(s[i:i+2],16) for i in (0,2,4))+(a,)
painting('soft-blue.jpg',['#b7c9c0','#233e4b','#709fa7','#c5b88d','#dfb08d'],'vase',5)
painting('sunroom.jpg',['#e4bb98','#f3d7ac','#db876d','#af4c4e','#4e6263'],'abstract',6)
painting('still-life.jpg',['#dfddd2','#435a52','#ea9c75','#d5bd6f','#253e40'],'still',7)
painting('landscape.jpg',['#7c91a8','#dae5dd','#415e71','#ebbea5','#233649'],'landscape',8)
painting('poster.jpg',['#e6d7c9','#353c55','#de725a','#87a8a1','#b59fbe'],'poster',9)
painting('violet.jpg',['#817b9b','#d9bfd3','#bda68f','#35476b','#e8acaa'],'abstract',10)
print('generated',len(os.listdir(out)),'images')
