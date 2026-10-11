#!/usr/bin/env python3
"""Independent unbounded axial reference and cycle-component reduction."""
import json,sys,collections,hashlib
D=((1,0),(1,-1),(0,-1),(-1,0),(-1,1),(0,1))
D2={(a+c,b+d) for a,b in D+((0,0),) for c,d in D+((0,0),)}-{(0,0)}
def step(s,B,S,C):
 counts=collections.Counter((q+dq,r+dr) for (q,r),v in s.items() if v==1 for dq,dr in D)
 ans={}
 for k in s.keys()|counts.keys():
  old=s.get(k,0);n=counts[k]
  v=(1 if n in B else 0) if old==0 else (1 if n in S else 2) if old==1 else (old+1 if old+1<C else 0)
  if v:ans[k]=v
 return ans

def canonical(s):
 q=min(k[0] for k in s);r=min(k[1] for k in s)
 return tuple(sorted((a-q,b-r,v) for (a,b),v in s.items()))
def orbitkey(states):
 # Every D6 image and every phase: exact full-state equivalence.
 possibilities=[]
 for s in states:
  for refl in (False,True):
   ss={(r,q) if refl else (q,r):v for (q,r),v in s.items()}
   for rot in range(6):
    possibilities.append(canonical(ss));ss={(-r,q+r):v for (q,r),v in ss.items()}
 return hashlib.sha256(repr(min(possibilities)).encode()).hexdigest()
def analyse(x):
 B=set(map(int,x['rule'].split('/')[0][1:]));S=set(map(int,x['rule'].split('/')[1][1:]));C=x['C'];p=x['period'];s={(q,r):v for q,r,v in x['phase']};initial=s.copy();states=[];pop=[];live=[];births=collections.Counter();survive=collections.Counter()
 for t in range(p):
  states.append(s);pop.append(len(s));live.append(sum(v==1 for v in s.values()))
  counts=collections.Counter((q+dq,r+dr) for (q,r),v in s.items() if v==1 for dq,dr in D)
  for k,n in counts.items():
   if k not in s and n in B:births[n]+=1
  for k,v in s.items():
   if v==1 and counts[k] in S:survive[counts[k]]+=1
  s=step(s,B,S,C)
 dq,dr=x['translation'];assert s=={(q+dq,r+dr):v for (q,r),v in initial.items()},x
 minimal=next((t for t in range(1,p) if canonical(states[t])==canonical(initial)),p)
 assert minimal==p,(x,minimal)
 footprint=set().union(*(s.keys() for s in states));components=[]
 while footprint:
  todo=[footprint.pop()];comp=set(todo)
  while todo:
   q,r=todo.pop()
   for dq,dr in D2:
    k=(q+dq,r+dr)
    if k in footprint:footprint.remove(k);comp.add(k);todo.append(k)
  components.append(comp)
 x['activeRange']=[min(pop),max(pop)];x['liveRange']=[min(live),max(live)];x['phasePopulations']=pop;x['phaseLivePopulations']=live;x['birthClausesUsed']=dict(births);x['survivalClausesUsed']=dict(survive);x['independentFootprintComponents']=len(components);x['orbitHash']=orbitkey(states)
 # Return centred smallest-population phase for easy catalogue consumption.
 pick=min(range(p),key=lambda i:(len(states[i]),len(str(canonical(states[i])))))
 chosen=canonical(states[pick]);qs=[a for a,b,v in chosen];rs=[b for a,b,v in chosen];dq=(min(qs)+max(qs))//2;dr=(min(rs)+max(rs))//2
 x['coordinateStates']=[[a-dq,b-dr,v] for a,b,v in chosen];x['chosenPhaseAdvance']=pick
 return x
if __name__=='__main__':
 allx=[json.loads(line) for f in sys.argv[1:-1] for line in open(f)]
 choices=[x for x in allx if (any(x['translation']) and x['period']>=10 and x['population']<=100) or (not any(x['translation']) and x['period']>=30 and x['population']<=160)]
 choices.sort(key=lambda x:(-x['period'],x['population']))
 seen=set();answers=[]
 for i,x in enumerate(choices):
  y=analyse(x);key=(y['C'],y['orbitHash'])
  if key not in seen:answers.append(y);seen.add(key)
  if i%50==0:print(i,len(choices),len(answers),file=sys.stderr,flush=True)
 json.dump(answers,open(sys.argv[-1],'w'),indent=2)
 print('verified',len(choices),'unique',len(answers),file=sys.stderr)
