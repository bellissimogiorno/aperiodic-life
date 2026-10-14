#!/usr/bin/env python3
"""Build the complete preset catalogue from editable Markdown and exact JSON data.
No project-specific paths, network access or external executables are required.
"""
import json, math, hashlib, re, argparse, tempfile, subprocess
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader, PdfWriter


W,H=A4; M=46; CW=W-2*M
INK=HexColor('#173042'); MUTED=HexColor('#536571'); TEAL=HexColor('#087E83'); PALE=HexColor('#EAF3F3'); LINE=HexColor('#D8E1E5'); AMBER=HexColor('#805914')
PALETTE=['#F4F6F7','#146A83','#D0932B','#9B4F73','#43876C','#7C63A5','#D45A42','#56738C','#A78C51','#744838']
STYLES={
 'body':ParagraphStyle('body',fontName='Body',fontSize=10.3,leading=14.8,textColor=INK,spaceAfter=8),
 'small':ParagraphStyle('small',fontName='Body',fontSize=8.8,leading=12.3,textColor=MUTED,spaceAfter=6),
 'tiny':ParagraphStyle('tiny',fontName='Body',fontSize=7.7,leading=10.5,textColor=MUTED,spaceAfter=5),
 'title':ParagraphStyle('title',fontName='TitleBold',fontSize=23,leading=28,textColor=INK,spaceAfter=12),
 'entrytitle':ParagraphStyle('entrytitle',fontName='TitleBold',fontSize=19,leading=23,textColor=INK,spaceAfter=8),
 'sub':ParagraphStyle('sub',fontName='BodyBold',fontSize=10.3,leading=14,textColor=TEAL,spaceAfter=5),
 'mono':ParagraphStyle('mono',fontName='Mono',fontSize=8.4,leading=12.1,textColor=INK,spaceAfter=6),
}


def clean(s):
    return str(s).replace('—','-').replace('–','-').replace('−','-').replace('‑','-').replace('\u00a0',' ')

def esc(s): return escape(clean(s))

def para(c,text,x,y,width=CW,style='body',raw=False):
    p=Paragraph(text if raw else esc(text),STYLES[style]); _,h=p.wrap(width,1000)
    p.drawOn(c,x,y-h)
    return y-h-STYLES[style].spaceAfter

def section(c,label,y): return para(c,label,M,y,style='sub')

def block(c,label,text,y,style='body'):
    y=section(c,label,y)
    return para(c,cited(text),M,y,style=style,raw=True)

def line(c,y):
    c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(M,y,W-M,y)

def table(c,rows,y,widths,small=False,header=True,raw=False):
    style='tiny' if small else 'small'
    data=[[Paragraph(v if raw else esc(v),STYLES[style]) for v in row] for row in rows]
    t=Table(data,colWidths=widths,hAlign='LEFT')
    commands=[('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,0),.6,TEAL)]
    if header: commands += [('BACKGROUND',(0,0),(-1,0),PALE)]
    for r in range(1,len(rows)):
        if r%2==0: commands.append(('BACKGROUND',(0,r),(-1,r),HexColor('#F6F8F9')))
    t.setStyle(TableStyle(commands));tw,th=t.wrap(CW,900);t.drawOn(c,M,y-th)
    return y-th-12

def draw_phase(phase,x,y,w,h,caption=True,viewbounds=None):
    c.setFillColor(HexColor('#FCFDFD'));c.setStrokeColor(LINE);c.setLineWidth(.5);c.roundRect(x,y,w,h,3,fill=1,stroke=1)
    captionH=31 if caption else 10
    verts=[v for poly in phase['polygons'] for v in poly['vertices']]
    if not verts: return
    x0=min(v[0] for v in verts);x1=max(v[0] for v in verts);y0=min(v[1] for v in verts);y1=max(v[1] for v in verts)
    if viewbounds:x0,y0,x1,y1=viewbounds
    scale=min((w-18)/max(x1-x0,.01),(h-captionH-25)/max(y1-y0,.01))
    ox=x+w/2-scale*(x0+x1)/2; oy=y+captionH+12+(h-captionH-24)/2-scale*(y0+y1)/2
    for poly in sorted(phase['polygons'],key=lambda p:p['state']!=0):
        state=poly['state'];p=c.beginPath();v=poly['vertices'];p.moveTo(ox+scale*v[0][0],oy+scale*v[0][1])
        for vx,vy in v[1:]:p.lineTo(ox+scale*vx,oy+scale*vy)
        p.close();c.setFillColor(HexColor(PALETTE[state%len(PALETTE)]));c.setStrokeColor(HexColor('#A9BBC2') if state==0 else HexColor('#40515B'));c.setLineWidth(.25 if state==0 else .4)
        c.drawPath(p,fill=1,stroke=1)
    if caption:
        c.setFont('BodyBold',8.8);c.setFillColor(INK);c.drawCentredString(x+w/2,y+18,f"t = {phase['t']}")
        c.setFont('Body',7.7);c.setFillColor(MUTED);c.drawCentredString(x+w/2,y+7,f"N = {phase['active']}; L = {phase['live']}")

def legend(states,x,y):
    c.setFont('Body',8);c.setFillColor(MUTED);c.drawString(x,y,'State:')
    for k in range(states):
        xx=x+33+31*k;c.setFillColor(HexColor(PALETTE[k%len(PALETTE)]));c.setStrokeColor(LINE);c.rect(xx,y-2,8,8,stroke=1,fill=1);c.setFillColor(INK);c.drawString(xx+12,y,str(k))

def triptych(e,y,height=162):
    phases=GEOM['entries'][e['id']]['phases'];gap=9;pw=(CW-2*gap)/3
    bounds=None
    if fixed_view(e):
        v=[v for ph in phases for po in ph['polygons'] for v in po['vertices']]
        bounds=(min(x[0] for x in v),min(x[1] for x in v),max(x[0] for x in v),max(x[1] for x in v))
    for i,p in enumerate(phases):draw_phase(p,M+i*(pw+gap),y-height,pw,height,viewbounds=bounds)
    y-=height+14;legend(e['generations'],M,y)
    return y-12

def rule_neighbours(r):
    if r['tiling']=='hex':return 'Six edge-sharing hexagons; the cell itself is excluded.'
    if r['tiling']=='square':return 'Eight surrounding squares: four edge-sharing and four diagonal; exclude the cell itself.'
    if r['neighborhood']=='edge':return 'Tiles sharing a positive-length boundary segment; point-only contacts do not count.'
    return 'All edge or boundary-point contacts, including corner contacts and T-junctions; exclude the cell itself.'

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[1]
def read_json(path):return json.loads(path.read_text(encoding='utf-8'))
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def read_prose(path):
    sections={};key=None;heading=None;buffer=[]
    def flush():
        if key is not None and heading is not None:
            sections[key].append((heading,' '.join(' '.join(buffer).split())))
        buffer.clear()
    for line in path.read_text(encoding='utf-8').splitlines():
        if line.startswith('## '):
            flush();key=line[3:].strip();heading=None
            if key in sections:raise ValueError('Duplicate prose section: '+key)
            sections[key]=[]
        elif line.startswith('### '):flush();heading=line[4:].strip()
        elif key is not None and heading is not None:buffer.append(line)
    flush();return sections
SOURCE=read_json(HERE/'catalogue-source.json')
GEOM=read_json(HERE/'geometry/diagrams.json')
PROSE=read_prose(HERE/'catalogue.md')
ENTRIES=SOURCE['entries'];RULES=SOURCE['ruleRegister'];UI=SOURCE['rulePresets']
BY_ID={e['id']:e for e in ENTRIES};BY_RULE={r['id']:r for r in RULES}
VERSION=SOURCE['version'];DATE=SOURCE['date']
REFS=SOURCE['references'];PAGE_LOG=[]
def fixed_view(e):return e['fixedView']
def validate():
    assert len(ENTRIES)==89 and len(BY_ID)==89, '89 unique preset IDs required'
    assert len(RULES)==56 and len(BY_RULE)==56, '56 complete rule-sets required'
    assert len(UI)==12, '12 named rule templates required'
    assert set(BY_ID)==set(GEOM['entries']), 'Geometry coverage differs'
    assert VERSION==(ROOT/'VERSION').read_text().strip(), 'Catalogue/release version differs'
    assert GEOM['packageVersion']==VERSION, 'Geometry release version differs'
    for file in ['core.js','discoveries.js']:
        assert digest(ROOT/file)==SOURCE['sourceHashes'][file]==GEOM['sourceSHA256'][file], 'Stale engine/preset source: '+file
    for key in ['cover','scope','rules','evidence','neighbours','status','reproduce','integrity']:
        assert PROSE.get(key), 'Missing prose: '+key
    assert {k[8:] for k in PROSE if k.startswith('pattern:')}==set(BY_ID)
    for i,e in enumerate(ENTRIES):
        assert e.get('attributionLabel'), 'Missing explicit attribution: '+e['id']
        for group in e.get('citationGroups',[]):
            assert group['label'] and set(group['references']) <= {r['number'] for r in REFS}
        assert e['cataloguePage']==15+i
        r=BY_RULE[e['ruleId']]
        assert r['tuple']==[e['tiling'],e['neighborhood'],e['rule'],e['generations']]
        assert e['id'] in r['entryIds']
        phases=GEOM['entries'][e['id']]['phases']
        assert len(phases)==3
        for ph in phases:
            assert sum(p['state']!=0 for p in ph['polygons'])==ph['active']
            assert sum(p['state']==1 for p in ph['polygons'])==ph['live']
        assert [h for h,_ in PROSE['pattern:'+e['id']]]==['Verified behaviour','Interpretation and limits','Pattern provenance and credit']
    for i,r in enumerate(RULES):assert r['page']==106+i//3

def link(target,label):return f'<link href="#{target}" color="#087E83">{esc(label)}</link>'
def rule_link(r):return link('rule-'+r['id'],f"{r['id']} (p. {r['page']})")
def pattern_link(e):return link(e['id'],f"{e['catalogueCode']} (p. {e['cataloguePage']})")
def source_links(ns):return ', '.join(link('reference-'+str(n),f'[{n}]') for n in sorted(set(ns)))
def cited(text):
    """Link numbered citations and unique rule/pattern identifiers in prose."""
    value=esc(text)
    def reference(m):
        numbers=[int(x.strip()) for x in m.group(1).split(',')]
        # State vectors contain 0; B[10]/S[9,10] is rule notation, not a citation.
        return source_links(numbers) if set(numbers) <= {r['number'] for r in REFS} else m.group(0)
    value=re.sub(r'(?<![\w])\[(\d+(?:\s*,\s*\d+)*)\]',reference,value)
    codes={e['catalogueCode']:e for e in ENTRIES}
    def labelled(m):
        code=m.group(0)
        if code in BY_RULE:return link('rule-'+code,code)
        if code in codes:return link(codes[code]['id'],code)
        return code
    # These references cannot occur inside the bibliography anchor names.
    value=re.sub(r'\b(?:R\d{2}|[HPXSC]\d{2})(?![\d])',labelled,value)
    return value
def citation_groups(groups,y,style='tiny'):
    for group in groups:
        y=para(c,cited(group['label'])+': '+source_links(group['references'])+'.',M,y,style=style,raw=True)
    return y
def newpage(label,title=None,bookmark=None):
    global page
    if page:c.showPage()
    page+=1
    c.setFillColor(MUTED);c.setFont('Body',8)
    c.drawString(M,H-28,f'APERIODIC LIFE {VERSION}  /  COMPLETE PRESET CATALOGUE')
    c.drawRightString(W-M,H-28,clean(label).upper())
    line(c,H-36);line(c,35)
    c.setFont('Body',7.7);c.drawString(M,22,'Catalogue revision '+str(SOURCE.get('documentationRevision',1))+' | '+DATE+' | Rules, evidence and attribution')
    c.drawRightString(W-M,22,str(page))
    if bookmark:
        entry=BY_ID.get(bookmark)
        outline=(entry['catalogueCode']+' '+entry['title']) if entry else (title or label)
        c.bookmarkPage(bookmark);c.addOutlineEntry(clean(outline),bookmark,0,False)
    y=H-58
    if title:y=para(c,title,M,y,style='title')
    return y
def finish(y,label):
    PAGE_LOG.append({'page':page,'label':label,'bottom':round(y,2)})
    if y<49:raise RuntimeError(f'Overflow page {page} {label}: {y:.1f}')
def prose(key,y,style='body'):
    for title,text in PROSE[key]:
        y=section(c,title,y)
        y=para(c,cited(text),M,y,style=style,raw=True)
    return y
def origin(e):
    return e['attributionLabel']
def draw_neighbourhoods(y):
    diagrams=SOURCE['neighbourhoodDiagrams']['diagrams']
    pw=(CW-18)/3;panelh=164
    for j,d in enumerate(diagrams):
        x=M+j*(pw+9);bottom=y-panelh
        c.setFillColor(HexColor('#FCFDFD'));c.setStrokeColor(LINE);c.roundRect(x,bottom,pw,panelh,3,fill=1,stroke=1)
        verts=[v for tile in d['tiles'] for v in tile['vertices']]
        x0=min(v[0] for v in verts);x1=max(v[0] for v in verts);y0=min(v[1] for v in verts);y1=max(v[1] for v in verts)
        scale=min((pw-16)/(x1-x0),(panelh-42)/(y1-y0));ox=x+pw/2-scale*(x0+x1)/2;oy=bottom+30+(panelh-38)/2-scale*(y0+y1)/2
        palette={'central':'#173042','edge':'#51ABC0','corner':'#EFB34B'}
        for tile in d['tiles']:
            path=c.beginPath();vertices=tile['vertices'];path.moveTo(ox+scale*vertices[0][0],oy+scale*vertices[0][1])
            for vx,vy in vertices[1:]:path.lineTo(ox+scale*vx,oy+scale*vy)
            path.close();c.setFillColor(HexColor(palette[tile['relation']]));c.setStrokeColor(white);c.setLineWidth(.6);c.drawPath(path,fill=1,stroke=1)
        c.setFillColor(INK);c.setFont('BodyBold',8.5);c.drawCentredString(x+pw/2,bottom+16,{'hex':'Hexagonal','penrose':'Penrose','hat':'Hat'}[d['tiling']])
        c.setFont('Body',7.7);c.drawCentredString(x+pw/2,bottom+5,f"{d['edgeDegree']} edge; {d['touchDegree']} touch neighbours")
    return y-panelh-14

def render_front():
    y=newpage('Scope and abstract',bookmark='cover')
    y=para(c,'Aperiodic Life<br/>Complete preset catalogue',M,y-14,style='title',raw=True)
    y=para(c,'89 configurations | 56 complete rules | 12 rule templates',M,y,style='sub')
    y=para(c,f'Version {VERSION} | Catalogue revision '+str(SOURCE.get('documentationRevision',1))+f' | {DATE}',M,y,style='body')
    heroes=['hat-wake-traveller','penrose-conway-p12','hex-b2345s24-c4-p48-traveller']
    for i,id in enumerate(heroes):draw_phase(GEOM['entries'][id]['phases'][1],M+i*(CW+10)/3,y-154,(CW-20)/3,154)
    y-=175;y=prose('cover',y)
    y=para(c,link('rules','Start with the rule guide (p. 3)')+' | '+link('directory-hat','Browse the pattern directories (pp. 10-14)')+' | '+link('rule-index-0','Rule index (p. 104)'),M,y,style='small',raw=True)
    finish(y,'cover')
    y=newpage('Reading guide','1. Scope and attribution','scope')
    y=table(c,[[cited(cell) for cell in row] for row in [['Origin / status','Count','Meaning'],['Original package configurations','55','No exact precedent identified in literature reviewed to 14 October 2026'],['Possible earlier match','1','P09: Owens-Stepney fireworks [5,6]; identity unresolved'],['Package constructions','4','C01-C04: explicitly named mechanism and construction'],['Published examples','25','Author, named pattern and numbered source on each page'],['Adaptations','4','Named parent pattern/rule and precise change on each page']]],y,[160,45,CW-205],raw=True)
    y=prose('scope',y,style='small');finish(y,'scope')
    y=newpage('Start here','2. Reading the rules','rules')
    y=prose('rules',y)
    e=BY_ID['hex-b234s245-c5-p10-knightship-launcher']
    y=para(c,pattern_link(e)+' demonstrates R40:S5. '+rule_link(BY_RULE['R40'])+' supplies the complete definition and prior-use status. '+link('neighbours','Neighbourhood diagrams (p. 6)')+'.',M,y,style='small',raw=True)
    finish(y,'rules')
    y=newpage('Ordered updates','3. Reading a priority table','tables')
    y=para(c,'These three tables use Hat edge-or-point contacts and C = 4. n_i counts neighbours in state i, including empty state 0. All conditions must hold; the first matching row wins, otherwise the next state is 0. “Any” permits every own state. Higher states do not age automatically.',M,y)
    for rid,name in [('R15','TABLE:HAT-WAKE'),('R10','TABLE:HAT-A'),('R11','TABLE:HAT-B')]:
        r=BY_RULE[rid];y=section(c,rid+' / '+name+' - '+r['statusLabel'],y)
        rows=[['Row','Own state','All required conditions','Next']]
        for i,row in enumerate(SOURCE['ruleTables'][name]['rows']):rows.append([f'{rid}.{i+1}','any' if row['own'] is None else str(row['own']),' and '.join(f'n_{s} >= {k}' for s,k in row['conditions']) or 'none',str(row['next'])])
        y=table(c,rows,y,[54,66,CW-170,50],small=True)
    y=para(c,cited('HAT-A omits redundant duplicate/default-zero rows from James Edmond’s Hat A table [2,3] without changing its transition. A dead-to-dead row may still block a later birth. HAT-B retains its state-2 row even when that state is unreachable from a particular seed. Missing external neighbours are absent, not additional state-0 cells. The six used tables are R10-R15.'),M,y,style='small',raw=True)
    finish(y,'tables')
    y=newpage('Verification standards','4. What the evidence establishes','evidence');y=prose('evidence',y);finish(y,'evidence')
    y=newpage('Neighbourhood diagrams','5. Exactly which cells count?','neighbours')
    y=block(c,*PROSE['neighbours'][0],y);y=draw_neighbourhoods(y)
    y=para(c,'Dark = examined cell; blue = edge neighbour; amber = point-contact-only neighbour. These colours show adjacency, not automaton states. The displayed Hat/Penrose counts are local examples, not universal degrees.',M,y,style='small')
    for title,text in PROSE['neighbours'][1:]:y=block(c,title,text,y)
    finish(y,'neighbours')
    y=newpage('Names and prior use','6. Rule names and provenance','status');y=prose('status',y);finish(y,'status')
    for part in range(2):
        y=newpage('Rule-selector templates','7. Named rule presets'+(' (continued)' if part else ''),'ui-'+str(part))
        y=para(c,'U labels identify the 12 named options in the rule selector. Choosing one changes the transition and C while retaining the chosen tiling and neighbour relation. Each becomes a complete rule only after that graph is specified. “Custom” is an editing state, not another named rule.',M,y,style='small')
        for u in UI[part*6:(part+1)*6]:
            uid=u.get('id',u.get('code',''))
            y=section(c,uid+'  '+u['name'],y)
            y=para(c,u.get('specification',u.get('rule',''))+' | C = '+str(u.get('generations',u.get('states',''))),M,y,style='small')
            note=u.get('description',u.get('semantics',''))
            if note:y=para(c,note,M,y,style='small')
            status=u.get('statusNote',u.get('status',''))
            if u.get('creditAndScope'):status+=': '+u['creditAndScope']
            if isinstance(status,dict):status=json.dumps(status)
            y=para(c,cited('Origin and earlier use: '+status),M,y,style='small',raw=True)
            refs=[s['reference'] for s in u.get('sources',[]) if 'reference' in s]
            if refs:
                nav=cited(u['citationLabel']) if u.get('citationLabel') else 'Source of the named update: '+source_links(refs)
                related=u.get('relatedRuleIds',[])
                if related:
                    label='Full Hat/touch table: ' if u['rule'].startswith('TABLE:') else 'Complete graph example: '
                    nav+=' | '+label+', '.join(rule_link(BY_RULE[rid]) for rid in related)
                y=para(c,nav,M,y,style='tiny',raw=True)
        if part==1:y=para(c,cited('The Core API additionally exposes TABLE:SPECTRE, James Edmond’s Spectre table [2,3], and TABLE:PENROSE-GOUCHER, Adam P. Goucher’s Penrose table [4]. Their full rows are in catalogue-data.json, field ruleTables. They have no named UI preset or additional curated seed in this release. The app’s Einstein backend is Hat, not Spectre.'),M,y,style='small',raw=True)
        finish(y,'ui-'+str(part))
    groups=[('hat',0,22),('penrose',0,21),('hex',0,18),('hex',18,36),('square',0,10)]
    for i,(tiling,first,last) in enumerate(groups):
        name={'hat':'Einstein-hat','penrose':'Penrose','hex':'Hexagonal','square':'Square'}[tiling]
        mark='directory-'+tiling+('-2' if first else '')
        y=newpage('Linked directory','8. '+name+' configurations'+(' (continued)' if first else ''),mark)
        group=[e for e in ENTRIES if e['tiling']==tiling][first:last]
        rows=[['Code / page','Configuration','Rule / origin']]
        for e in group:
            status={'package-found':'original*','published':'published','adapted':'adaptation','package-constructed':'constructed'}[e['provenance']['status']]
            if e['id']=='penrose-conway-p12':status='unresolved'
            rows.append([pattern_link(e),esc(e['title']),esc(e['ruleId']+'; '+status)])
        y=table(c,rows,y,[67,CW-170,103],small=True,raw=True)
        y=para(c,'* Original to this package: no exact literature precedent identified in the sources reviewed to 14 October 2026. The linked entry identifies what was created here and names any published parent or mechanism. “Unresolved” denotes P09’s possible Owens-Stepney antecedent [5,6].',M,y,style='small')
        finish(y,mark)

def expanded_clauses(e,text,seen):
    if e['rule'].startswith('TABLE:'):return text
    neighbour='edge-sharing live neighbours' if e['neighborhood']=='edge' else 'edge-or-point-contact live neighbours'
    words=['zero','one','two','three','four','five','six','seven','eight','nine']
    def sub(m):
        token=m.group(0);qualified=e['ruleId']+':'+token
        if token in seen:return qualified
        seen.add(token);action='birth' if token[0]=='B' else 'survival'
        return qualified+f' ({action} with exactly {words[int(token[1])]} {neighbour})'
    return re.sub(r'(?<![A-Za-z0-9:/])(?:B|S)[0-9](?![0-9/])',sub,text)

def render_entries():
    for e in ENTRIES:
        g=GEOM['entries'][e['id']];r=BY_RULE[e['ruleId']];seen=set()
        assert page+1==e['cataloguePage']
        y=newpage(e['tiling']+' / '+e['catalogueCode'],bookmark=e['id'])
        y=para(c,e['catalogueCode']+'  '+e['title'],M,y,style='entrytitle')
        y=para(c,e['id'],M,y,style='mono')
        y=para(c,cited(origin(e)),M,y,style='small',raw=True)
        neighbourhood='shared-edge' if e['neighborhood']=='edge' else 'edge-or-point contact (touch)'
        y=para(c,f"{e['rule']} | C = {e['generations']} | {neighbourhood}",M,y,style='sub')
        y=para(c,'Complete rule and prior use: '+rule_link(r)+'. '+link('rules','Notation (p. 3)')+'.',M,y,style='small',raw=True)
        patch=('Radius' if e['tiling']=='hex' else 'Side length' if e['tiling']=='square' else 'Depth')+f" {e['depth']}"
        if e['tiling']=='penrose':patch+='; '+e.get('penroseSeed','sun')+' seed'
        y=para(c,patch+f"; {g['patchTileCount']:,} cells; dead border rings = {e.get('borderRings',0)}.",M,y,style='tiny')
        y=triptych(e,y,150)
        view='same fixed view/scale' if e['fixedView'] else 'independently centred/scaled panels'
        y=para(c,'Complete nonzero states; '+view+'. N = nonzero; L = state 1.',M,y,style='tiny')
        texts=dict(PROSE['pattern:'+e['id']])
        y=block(c,'Verified behaviour',expanded_clauses(e,texts['Verified behaviour'],seen),y,style='small')
        if e['measurementText']!='.':y=para(c,e['measurementText'],M,y,style='tiny')
        seed=e.get('coordinateStates') or e.get('cellStates')
        if seed:
            kind='(q,r,state)' if e.get('coordinateStates') and e['tiling']=='hex' else '(x,y,state)' if e.get('coordinateStates') else '(tile ID,state)'
            y=section(c,'Exact initial configuration '+kind,y)
            if len(seed)<=48:
                y=para(c,'  '.join('('+','.join(map(str,x))+')' for x in seed),M,y,style='mono')
            else:
                sh=hashlib.sha256(json.dumps(seed,separators=(',',':')).encode()).hexdigest()
                y=para(c,f"{len(seed)} assigned cells; the complete list is in catalogue-data.json, entry {e['id']}, field "+('coordinateStates' if e.get('coordinateStates') else 'cellStates')+'. All unlisted cells start at 0. Canonical compact-JSON seed SHA-256:',M,y,style='tiny')
                y=para(c,sh[:32]+' '+sh[32:],M,y,style='mono')
        else:
            y=block(c,'Exact initialisation recipe',f"simulation.randomize({e['density']}, '{e['randomSeed']}'); initial nonzero cells are state 1. Complete realised tile states are in catalogue-data.json under this entry’s reproduction.initialCellStates.",y,style='small')
        y=block(c,'Interpretation and limits',expanded_clauses(e,texts['Interpretation and limits'],seen),y,style='small')
        c.bookmarkPage('provenance-'+e['id'],fit='XYZ',left=0,top=y+10,zoom=0)
        y=section(c,'Pattern provenance and credit ('+e['catalogueCode']+')',y)
        y=para(c,cited(expanded_clauses(e,texts['Pattern provenance and credit'],seen)),M,y,style='small',raw=True)
        y=citation_groups(e.get('citationGroups',[]),y)
        paths=e.get('audit',{}).get('evidence') or e['provenance'].get('evidence',[])
        paths=sorted(paths,key=lambda p:'credited-independent-verification.json' not in p)
        if paths:y=para(c,'Evidence in release: '+paths[0]+'. Complete source and evidence lists are in catalogue-data.json.',M,y,style='tiny')
        finish(y,e['id'])

def used_by(r,linked=True):
    es=[e for e in ENTRIES if e['id'] in r['entryIds']]
    return ', '.join(pattern_link(e) if linked else e['catalogueCode'] for e in es)
def neighbour_counts(xs):
    if xs==[1]:return 'one live neighbour'
    ns=list(map(str,xs))
    return (', '.join(ns[:-1])+' or '+ns[-1] if len(ns)>1 else ns[0])+' live neighbours'
def render_rule_register():
    for part in range(2):
        y=newpage('Complete rule index','9. Rule-set index'+(' (continued)' if part else ''),'rule-index-'+str(part))
        assert page==104+part
        y=para(c,'Each linked R label specifies a complete automaton: graph, update and C. Status belongs to that full specification. U rule-selector templates are listed on pages 8-9.',M,y,style='small')
        rows=[['Rule / page','Complete specification','Pattern codes']]
        for r in RULES[part*28:(part+1)*28]:
            spec=f"{r['tiling'].capitalize()}; {r['neighborhood']}; {r['rule'].replace('TABLE:','')}; C={r['generations']}"
            rows.append([rule_link(r),esc(spec),esc(used_by(r,False))])
        y=table(c,rows,y,[68,258,CW-326],small=True,raw=True);finish(y,'rule-index-'+str(part))
    for group in range(math.ceil(len(RULES)/3)):
        subset=RULES[group*3:group*3+3]
        y=newpage('Rule definitions and provenance',f"10. Rule register: {subset[0]['id']}-{subset[-1]['id']}",'rule-register-'+str(group))
        y=para(c,'B/S counts are exact counts of state-1 neighbours. A known rule and a newly found seed are separate claims. Notation: p. 3; status definitions: p. 7.',M,y,style='small')
        for r in subset:
            assert page==r['page']
            c.bookmarkPage('rule-'+r['id'],fit='XYZ',left=0,top=y+16,zoom=0)
            c.addOutlineEntry(r['id']+' '+r['tiling']+' '+r['rule'],'rule-'+r['id'],1,False)
            y=section(c,f"{r['id']} {r['tiling'].capitalize()} | {r['rule']} | C = {r['generations']}",y)
            y=para(c,'Neighbours: '+rule_neighbours(r),M,y,style='small')
            if r['rule'].startswith('TABLE:'):
                clauses=[]
                for i,row in enumerate(SOURCE['ruleTables'][r['rule']]['rows']):
                    own='any' if row['own'] is None else str(row['own'])
                    cond=' and '.join(f'n_{s}>={k}' for s,k in row['conditions']) or 'always'
                    clauses.append(f"{r['id']}.{i+1}: own={own}, {cond} -> {row['next']}")
                y=para(c,'<br/>'.join(esc(t) for t in clauses),M,y,style='mono',raw=True)
                y=para(c,'First matching row wins; otherwise 0. n_i counts state i, including 0. No automatic refractory ageing.',M,y,style='small')
            else:
                bs=r['birthCounts'];ss=r['survivalCounts']
                bc=', '.join(r['id']+':B'+str(n) for n in bs);sc=', '.join(r['id']+':S'+str(n) for n in ss)
                y=para(c,f'Birth: 0 becomes 1 at exactly {neighbour_counts(bs)} ({bc}); otherwise stays 0.',M,y,style='small')
                survival=f'1 stays 1 at exactly {neighbour_counts(ss)} ({sc}).' if ss else 'State 1 always dies.'
                death=' Death gives state 0 immediately.' if r['generations']==2 else ' On death, 1 becomes 2; then '+' -> '.join(map(str,list(range(2,r['generations']))+[0]))+' regardless of neighbours.'
                y=para(c,'Survival: '+survival+death,M,y,style='small')
            y=para(c,'<b>Origin and earlier use: '+cited(r['statusLabel'])+'.</b> '+cited(r['statusNote']),M,y,style='small',raw=True)
            y=citation_groups(r.get('citationGroups',[]),y)
            y=para(c,'Used by: '+used_by(r)+'.',M,y,style='small',raw=True)
            y-=3;line(c,y);y-=10
        finish(y,'rule-register-'+str(group))

def render_end():
    y=newpage('Reproduction','11. Reproduce and rebuild','reproduce');assert page==125
    y=prose('reproduce',y)
    y=para(c,'Exact seed example (from the repository root):',M,y,style='small')
    snippet="const C = require('./core.js');\nconst e = require('./discoveries.js')\n  .find(x => x.id === 'hat-wake-traveller');\nconst p = C.buildPatch(e.tiling, e.depth);\nconst s = new C.Automaton(p, p.touchGraph, e);\nfor (const [i,v] of e.cellStates) s.state[i] = v;\ns.refreshDerivedState();\nfor (let t=0;t<60;t++) s.step();"
    y=para(c,esc(snippet).replace('\n','<br/>').replace('  ','&#160;&#160;'),M,y,style='mono',raw=True)
    finish(y,'reproduce')
    y=newpage('Checks and integrity','12. Data, checks and integrity','integrity');assert page==126
    y=prose('integrity',y)
    for name in ['core.js','discoveries.js']:
        h=SOURCE['sourceHashes'][name];y=section(c,name+' SHA-256',y);y=para(c,h[:32]+' '+h[32:],M,y,style='mono')
    finish(y,'integrity')
    for part in range(math.ceil(len(REFS)/4)):
        y=newpage('References','13. References'+(' (continued)' if part else ''),'references-'+str(part))
        if part==0:y=para(c,'Primary papers, author-maintained records and attributed pattern collections are listed below. The audit uses retained source comparisons dated 13-14 October 2026. Exact-pattern and background references are distinguished in the entries; citing a source is not a claim to have established its author’s first-discovery priority.',M,y,style='small')
        for r in REFS[part*4:(part+1)*4]:
            c.bookmarkPage('reference-'+str(r['number']),fit='XYZ',left=0,top=y+12,zoom=0)
            y=para(c,esc(f"[{r['number']}] ")+cited(r['text']),M,y,raw=True)
            y=para(c,f'<link href="{escape(r["url"])}" color="#087E83">{esc(r["url"])}</link>',M,y,style='small',raw=True)-13
        finish(y,'references-'+str(part))

def build(output):
    global c,page
    for name,file in [('Body','DejaVuSans.ttf'),('BodyBold','DejaVuSans-Bold.ttf'),('BodyItalic','DejaVuSans.ttf'),('Title','DejaVuSerif.ttf'),('TitleBold','DejaVuSerif-Bold.ttf'),('Mono','DejaVuSansMono.ttf')]:pdfmetrics.registerFont(TTFont(name,str(HERE/'fonts'/file)))
    pdfmetrics.registerFontFamily('Body',normal='Body',bold='BodyBold',italic='BodyItalic',boldItalic='BodyBold')
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='aperiodic-catalogue-') as tmp:
        body=Path(tmp)/'body.pdf';c=canvas.Canvas(str(body),pagesize=A4,pageCompression=1,invariant=1);page=0
        c.setTitle(f'Aperiodic Life {VERSION}: Complete preset catalogue');c.setAuthor(SOURCE['authorshipStatement'])
        render_front();render_entries();render_rule_register();render_end();c.save()
        data={**SOURCE,'narrative':PROSE,'snapshotSource':'geometry/diagrams.json','pageLog':PAGE_LOG}
        data['entries']=[{**e,'reproduction':{k:v for k,v in GEOM['entries'][e['id']].items() if k not in ['phases','verification']},'snapshotRecords':[{k:v for k,v in ph.items() if k not in ['polygons','neighbours']} for ph in GEOM['entries'][e['id']]['phases']]} for e in ENTRIES]
        raw=json.dumps(data,ensure_ascii=False,indent=2).encode('utf-8')
        (HERE/'catalogue-data.json').write_bytes(raw)
        writer=PdfWriter();writer.clone_document_from_reader(PdfReader(body));writer.add_attachment('catalogue-data.json',raw)
        writer.add_metadata({'/Title':f'Aperiodic Life {VERSION}: Complete preset catalogue','/Author':SOURCE['authorshipStatement'],'/Subject':'89 presets, 56 complete rules, 12 rule templates; evidence and explicit attribution; catalogue revision '+str(SOURCE.get('documentationRevision',1))})
        with output.open('wb') as f:writer.write(f)
    print(json.dumps({'pdf':str(output),'pages':page,'presets':len(ENTRIES),'rules':len(RULES),'templates':len(UI),'minimumBottom':min(p['bottom'] for p in PAGE_LOG),'bytes':output.stat().st_size}))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');parser.add_argument('--output',type=Path,default=HERE/'aperiodic-life-catalogue.pdf');args=parser.parse_args()
    validate()
    if args.check:print('Catalogue source checks passed: 89 presets, 56 rules, 12 templates.')
    else:build(args.output.resolve())
