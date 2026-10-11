"""Independent unbounded replay of the published hexagonal catalogue seeds."""
import argparse, re, json, collections, time, sys
from pathlib import Path
SOURCE_FILE=Path(__file__).resolve().parents[2]/'fixtures/hexagonal-sources.json'
DIRS=((1,0),(-1,0),(0,1),(0,-1),(1,-1),(-1,1))
def parse(rle):
    x=y=0;s={}
    for count,c in re.findall(r'(\d*)([bo.$!A-Z])',rle):
        n=int(count or 1)
        if c=='!':break
        if c=='$':y+=n;x=0;continue
        if c not in 'b.':
            state=1 if c=='o' else ord(c)-64
            for i in range(n):s[(x+i,y-x-i)]=state
        x+=n
    return s
def step(s,B,S,C):
    counts=collections.Counter(p for (x,y),v in s.items() if v==1 for dx,dy in DIRS for p in [(x+dx,y+dy)])
    out={}
    for p in set(s)|counts.keys():
        v=s.get(p,0);n=counts[p]
        v=(1 if n in B else 0) if v==0 else (1 if n in S else (2 if C>2 else 0)) if v==1 else (v+1)%C
        if v:out[p]=v
    return out
def norm(s):
    if not s:return (), (0,0)
    x=min(p[0] for p in s);y=min(p[1] for p in s)
    return tuple(sorted((q-x,r-y,v) for (q,r),v in s.items())),(x,y)
def check(c,horizon=4000,cap=30000):
    B,S=[set(map(int,t)) for t in re.fullmatch(r'B(\d*)/S(\d*)',c['rule']).groups()];C=c.get('generations',2)
    s=parse(c['rle']);seen={};pops=[];initial=s.copy();start=time.monotonic()
    for t in range(horizon+1):
        k,anchor=norm(s);pops.append([len(s),sum(v==1 for v in s.values())])
        if k in seen:
            t0,a0=seen[k];result={'onset':t0,'period':t-t0,'translation':[anchor[i]-a0[i] for i in [0,1]],'pops':pops[t0:t+1], 'totalMaxPopulation':max(p[0] for p in pops),'testedGenerations':t};break
        if not s:result={'extinct':t};break
        if len(s)>cap:result={'capReached':t,'population':len(s)};break
        seen[k]=(t,anchor)
        if t<horizon:s=step(s,B,S,C)
    else:result={'noRecurrenceThrough':horizon,'population':len(s),'livePopulation':sum(v==1 for v in s.values()),'totalMaxPopulation':max(p[0] for p in pops)}
    if 'onset' in result:
        osc=initial
        for _ in range(result['onset']):osc=step(osc,B,S,C)
        result['recurrentCoordinateStates']=[[*p,v] for p,v in sorted(osc.items())]
    result['initialCoordinateStates']=[[*p,v] for p,v in sorted(initial.items())]
    print(c['id'],{k:v for k,v in result.items() if k not in ['pops','initialCoordinateStates','recurrentCoordinateStates']},file=sys.stderr,flush=True)
    return dict(c,verification=result)
def source_entries():
    return [entry for entry in json.loads(SOURCE_FILE.read_text())["entries"] if "rle" in entry]

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, help="Write JSON to this file instead of standard output")
    args = parser.parse_args()
    results = [check(entry, entry.get("horizon", 4000)) for entry in source_entries()]
    output = json.dumps(results, indent=2) + "\n"
    if args.output:
        args.output.write_text(output)
    else:
        print(output, end="")
