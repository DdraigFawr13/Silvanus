# cut.py: crop each block from centre 2 (map1/raw_heart2.png), remove its background with PixelLab (1 generation each)
import json,base64,subprocess,time,io,sys
from PIL import Image
BOXES={ # name: (x0,y0,x1,y1) in raw_heart2.png, description
 'hall':((288,24,398,154),'the whole wide stone town hall: a central clock tower and gable with two long side wings with slate roofs and lit windows, steps in front'),
 'cottage_a':((216,108,272,196),'the whole cottage: slate roof, stone chimney, the stone walls below the roof with lit windows and a wooden door, down to the ground'),
 'cottage_b':((242,202,302,290),'stone cottage with slate roof and lantern'),
 'cottage_c':((254,310,324,402),'the whole cottage: slate roof, stone chimney, the stone walls below the roof with lit windows and a wooden door, down to the ground, and the red and cream banner on its right'),
 'cottage_d':((378,286,450,346),'two-storey stone house with slate roof'),
 'cottage_f':((420,108,474,196),'the whole cottage: slate roof, stone chimney, the stone walls below the roof with lit windows and a wooden door, down to the ground'),
 'well':((314,164,376,206),'stone well with wooden frame on cobbles'),
 'stall':((290,144,334,188),'market stall with striped awning'),
 'lamp':((276,150,294,192),'iron lamp post with glowing lamp'),
 'tree_oak':((178,74,234,150),'round leafy tree'),
 'tree_oak2':((178,194,234,270),'round leafy tree'),
 'bush':((98,138,134,178),'round green bush'),
}
src=Image.open('../../map1/raw_heart2.png').convert('RGB')
def rpc(tool,args):
    body=json.dumps({"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":tool,"arguments":args}})
    r=subprocess.run(['curl','-sS','https://api.pixellab.ai/mcp','-H','Content-Type: application/json','-H','Accept: application/json, text/event-stream','-H','Authorization: Bearer dummy','--data-binary','@-'],input=body.encode(),capture_output=True).stdout.decode()
    return json.loads([l for l in r.splitlines() if l.startswith('data: ')][0][6:])['result']
import re
names=sys.argv[1:] or list(BOXES)
jobs={}
for n in names:
    box,desc=BOXES[n]; c=src.crop(box); c.save(f'crop_{n}.png')
    b=io.BytesIO(); c.save(b,'PNG')
    r=rpc('remove_background',{"image":"data:image/png;base64,"+base64.b64encode(b.getvalue()).decode(),"background_removal_task":"remove_complex_background","description":desc})
    t=r['content'][0]['text']; m=re.search(r'([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})',t)
    if r.get('isError') or not m: print(n,'ERROR',t[:300]); continue
    jobs[n]=m.group(1)
    while True:
        time.sleep(6); cc=rpc('get_image',{"job_id":jobs[n]})['content']; im=[x for x in cc if x['type']=='image']
        if im: open(f'{n}.png','wb').write(base64.b64decode(im[0]['data'])); print(n,'ok',jobs[n]); break
json.dump(jobs,open('jobs.json','a'))
