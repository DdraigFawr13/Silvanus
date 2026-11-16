# localcut.py NAME: cut a building out of its crop without generating pixels.
# Flood-fills from the crop's border through background-coloured pixels (greens, mist, dirt);
# the building's dark outline stops the fill. Everything not reached is the building.
import sys
from collections import deque
from PIL import Image
n=sys.argv[1]
im=Image.open(f'crop_{n}.png').convert('RGB'); W,H=im.size; px=im.load()
def bg(p):
    r,g,b=p; l=(r+g+b)/3
    if l<34: return False                       # outline
    if g>=r and g>=b-4: return True             # grass, leaves, moss on ground
    if abs(r-g)<14 and abs(g-b)<14 and b>=r and l>70: return True   # pale mist
    if r>g>b and r-b>25 and l>55 and r<170: return True             # dirt path
    return False
seen=[[False]*H for _ in range(W)]; q=deque()
for x in range(W):
    for y in (0,H-1): q.append((x,y))
for y in range(H):
    for x in (0,W-1): q.append((x,y))
while q:
    x,y=q.popleft()
    if not(0<=x<W and 0<=y<H) or seen[x][y] or not bg(px[x,y]): continue
    seen[x][y]=True
    q.extend(((x+1,y),(x-1,y),(x,y+1),(x,y-1)))
out=im.convert('RGBA'); o=out.load()
for x in range(W):
    for y in range(H):
        if seen[x][y]: o[x,y]=(0,0,0,0)
out.save(f'{n}.png'); print(n,'kept',sum(1 for x in range(W) for y in range(H) if not seen[x][y]),'of',W*H)
# keep only the largest connected piece (drops scraps of neighbouring trees, mist, fences)
from collections import deque as _dq
a=Image.open(f'{n}.png').convert('RGBA'); A=a.load(); W,H=a.size
lab={}; best=None
for sx in range(W):
    for sy in range(H):
        if A[sx,sy][3]==0 or (sx,sy) in lab: continue
        comp=[]; q=_dq([(sx,sy)]); lab[(sx,sy)]=1
        while q:
            x,y=q.popleft(); comp.append((x,y))
            for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
                if 0<=nx<W and 0<=ny<H and A[nx,ny][3] and (nx,ny) not in lab: lab[(nx,ny)]=1; q.append((nx,ny))
        if best is None or len(comp)>len(best): best=comp
keep=set(best)
for x in range(W):
    for y in range(H):
        if (x,y) not in keep: A[x,y]=(0,0,0,0)
a.save(f'{n}.png'); print(n,'largest piece',len(best))
