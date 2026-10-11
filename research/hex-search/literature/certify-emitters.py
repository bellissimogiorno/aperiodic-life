"""Certify unbounded emissions, rotation and wall repair from published seeds."""
from replay import *

def translated(s,d):return {(x+d[0],y+d[1]):v for (x,y),v in s.items()}
def coords(s):return [[x,y,v] for (x,y),v in sorted(s.items())]
def proj(p,h):return p[0]*h[0]+p[1]*h[1]
AXES=[(1,0),(0,1),(1,1),(-1,0),(0,-1),(-1,-1)]
def separator(a,b,da=(0,0),db=(0,0)):
    # All future copies a+n*da and b+m*db, independent n,m>=0.
    for h in AXES:
        gap=min(proj(p,h) for p in a)-max(proj(p,h) for p in b)
        if gap>=3 and proj(da,h)>=0 and proj(db,h)<=0:
            return {'axis':h,'gap':gap,'firstIncrement':proj(da,h),'secondIncrement':proj(db,h)}
    raise AssertionError('No separating cube projection')

results=source_entries()
selected=[]
names=['b246s246c4-p30-gun','b25s34-puffer','b2s1c3-p999-osc','b23s4-p13-ship','b2s1c3-p158-ship','b2s34-wall-repair','b2s34-p2044-billiard']
for name in names:
    c=next(c for c in results if c['id']==name)
    s=parse(c['rle']);centre=[(min(p[i] for p in s)+max(p[i] for p in s))//2 for i in (0,1)]
    centred=translated(s,[-n for n in centre])
    item={k:v for k,v in c.items() if k!='verification'}
    item.update(generations=c.get('generations',2),coordinateStates=coords(centred),gollyToAxial='q=x; r=y-x',centringTranslation=[-n for n in centre])
    v=c['verification'];item['verification']={k:val for k,val in v.items() if k not in ['initialCoordinateStates','recurrentCoordinateStates','pops']}
    B,S=[set(map(int,t)) for t in re.fullmatch(r'B(\d*)/S(\d*)',c['rule']).groups()];C=item['generations']
    if name=='b246s246c4-p30-gun':
        P=30;state=centred;corephases=[]
        for _ in range(P):corephases.append(state);state=step(state,B,S,C)
        assert all(state.get(p)==v for p,v in centred.items())
        rem={p:v for p,v in state.items() if p not in centred}
        # Partition using the original source coordinates.
        original=translated(rem,centre)
        groups=[{p:v for p,v in original.items() if p[0]>0}, {p:v for p,v in original.items() if p[0]<0 and p[1]<0}, {p:v for p,v in original.items() if p[1]>0}]
        groups=[translated(g,[-n for n in centre]) for g in groups]
        assert sorted(len(g) for g in groups)==[7,7,7]
        assert {p:v for g in groups for p,v in g.items()}==rem
        trajectories=[];deltas=[]
        for g in groups:
            states=[];ss=g
            for _ in range(P):states.append(ss);ss=step(ss,B,S,C)
            k,a=norm(g);k1,a1=norm(ss);assert k==k1
            delta=(a1[0]-a[0],a1[1]-a[1]);deltas.append(delta);trajectories.append(states)
            assert all(n%10==0 for n in delta)
            assert states[3]==translated(g,tuple(n//10 for n in delta))
        certificates=[]
        for t in range(P):
            phase={'phase':t,'againstCore':[],'sameStream':[],'betweenStreams':[]}
            for j in range(3):
                g=trajectories[j][t];d=deltas[j]
                phase['againstCore'].append(separator(g,corephases[t],d))
                phase['sameStream'].append(separator(translated(g,d),g,d))
                for k in range(j):phase['betweenStreams'].append({'streams':[j,k],**separator(g,trajectories[k][t],d,deltas[k])})
            certificates.append(phase)
        item['emissionProof']={'emissionPeriod':30,'coreTranslation':[0,0],'emittedGroups':[{'coordinateStates':coords(g),'period':3,'translationPer3':[n//10 for n in d],'translationPer30':d} for g,d in zip(groups,deltas)],'projectionCertificates':certificates,'conclusion':'Indefinite unbounded three-way gun: exact recurrence plus permanently disjoint radius-one dependency neighbourhoods.'}
    if name=='b25s34-puffer':
        P=20;delta=(0,10);state=centred
        for _ in range(P):state=step(state,B,S,C)
        moved=translated(centred,delta);assert all(state.get(p)==v for p,v in moved.items())
        debris={p:v for p,v in state.items() if p not in moved};assert len(debris)==4
        dd=step(step(debris,B,S,C),B,S,C);assert dd==debris
        a=moved;b=debris;certificates=[]
        for t in range(P):
            certificates.append({'phase':t,'againstCore':separator(a,b,delta,(0,-10)), 'betweenDeposits':separator(b,translated(b,(0,-10)),(0,0),(0,-10))})
            a=step(a,B,S,C);b=step(b,B,S,C)
        item['emissionProof']={'emissionPeriod':20,'coreTranslation':delta,'debrisCoordinateStates':coords(debris),'debrisPeriod':2,'projectionCertificates':certificates,'conclusion':'Indefinite unbounded p20 c/2 puffer: exact translated seed plus one p2 deposit, with permanently disjoint radius-one dependency neighbourhoods.'}
    if name=='b2s34-wall-repair':
        # In source coordinates the missing cell is x=21,y=11 => q=21,r=-10.
        missing=(21-centre[0],-10-centre[1]);assert missing not in centred
        pristine=dict(centred);pristine[missing]=1
        damaged=dict(centred);target=dict(pristine);first=None;haloCleared=None
        for t in range(50):
            if damaged.get(missing)==target.get(missing)==1 and first is None:first=t
            if damaged==target:haloCleared=t;break
            damaged=step(damaged,B,S,C);target=step(target,B,S,C)
        assert haloCleared==44
        item['repairProof']={'missingCoordinateState':[*missing,1],'pristineCoordinateStates':coords(pristine),'exactMatchGeneration':44,'expectedCoordinateStatesAt44':coords(target),'subsequentPeriod':5,'note':'Damaged and undamaged initial walls evolve independently and are exactly equal at generation44, including all exterior cells.'}
    if name=='b2s1c3-p999-osc':
        evolved=centred
        for _ in range(333):evolved=step(evolved,B,S,C)
        rotated={}
        for (q,r),vv in centred.items():
            q,r=r,-q-r
            rotated[q,r]=vv
        kr,ar=norm(rotated);ke,ae=norm(evolved);assert kr==ke
        offset=(ae[0]-ar[0],ae[1]-ar[1])
        item['rotationProof']={'generations':333,'rotation60Steps':4,'axialAffineMap':'[q,r] -> [r,-q-r] + offset','offset':offset,'fullPeriod':999}
    selected.append(item)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--output", type=Path, help="Write JSON to this file instead of standard output")
args = parser.parse_args()
output = json.dumps(selected, indent=2) + "\n"
if args.output:
    args.output.write_text(output)
else:
    print(output, end="")
print("Certified", len(selected), "published configurations; indefinite emitter certificates passed.", file=sys.stderr)
