#include <algorithm>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <numeric>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;
struct RNG { uint64_t s; uint64_t next(){s^=s>>12;s^=s<<25;s^=s>>27;return s*2685821657736338717ULL;} int n(int k){return next()%k;} double u(){return (next()>>11)*0x1.0p-53;} };
uint64_t mix(uint64_t x){x^=x>>30;x*=0xbf58476d1ce4e5b9ULL;x^=x>>27;x*=0x94d049bb133111ebULL;return x^(x>>31);}
struct Graph { int n,m;vector<double>x,y;vector<int>bound;vector<vector<int>>adj;Graph(string path){ifstream f(path);if(!(f>>n>>m))throw runtime_error("graph unavailable");x.resize(n);y.resize(n);bound.resize(n);adj.resize(n);for(int c=0;c<n;c++){int d;f>>x[c]>>y[c]>>bound[c]>>d;adj[c].resize(d);for(int&i:adj[c])f>>i;}}};
using State=vector<pair<int,int>>;
struct Result {State seed,final;double score=-1e30,displacement=0,maxRadius=0;int steps=0,maxActive=0,minBoundary=99999,period=0,transient=0;string outcome;};
struct Engine { Graph&g;vector<uint8_t>s,count,mark;vector<int>active,next,candidates;uint64_t totalSteps=0,highBirthEvents=0,highSurvivalEvents=0; Engine(Graph&g):g(g),s(g.n),count(g.n),mark(g.n){}
 Result run(State init,int B,int S,int C,int H,int cap,double radiusCap){for(int c:active)s[c]=0;active.clear();for(auto[c,v]:init){s[c]=v;active.push_back(c);}Result r;r.seed=init;double ix=0,iy=0;for(int c:active){ix+=g.x[c];iy+=g.y[c];}ix/=active.size();iy/=active.size();unordered_map<uint64_t,int>seen;seen.reserve(H+1);double far=0;
 for(int t=0;t<=H;t++){
 r.steps=t;if(active.empty()){r.outcome="extinct";break;}double x=0,y=0;uint64_t hash=0;for(int c:active){x+=g.x[c];y+=g.y[c];hash^=mix(uint64_t(c)*257+s[c]);r.minBoundary=min(r.minBoundary,g.bound[c]);}x/=active.size();y/=active.size();double rad=0;for(int c:active)rad=max(rad,hypot(g.x[c]-x,g.y[c]-y));double disp=hypot(x-ix,y-iy);r.maxRadius=max(r.maxRadius,rad);r.maxActive=max(r.maxActive,int(active.size()));far=max(far,disp);r.displacement=disp;
 auto it=seen.find(hash);if(it!=seen.end()){r.period=t-it->second;r.transient=it->second;r.outcome="cycle";break;}seen[hash]=t;
 if(int(active.size())>cap || rad>radiusCap){r.outcome="spread";break;}if(r.minBoundary<3){r.outcome="boundary";break;}if(t==H){r.outcome="horizon";break;}
 candidates.clear();for(int c:active){if(!mark[c]){mark[c]=1;candidates.push_back(c);}if(s[c]==1)for(int v:g.adj[c]){count[v]++;if(!mark[v]){mark[v]=1;candidates.push_back(v);}}}
 next.clear();for(int c:candidates){int old=s[c],v=0,k=count[c];if(k>=8){if(old==0&&((B>>k)&1))highBirthEvents++;if(old==1&&((S>>k)&1))highSurvivalEvents++;}if(!old)v=(B>>k)&1;else if(old==1)v=((S>>k)&1)?1:(C>2?2:0);else if(old+1<C)v=old+1;s[c]=v;if(v)next.push_back(c);count[c]=0;mark[c]=0;}active.swap(next);totalSteps++;
 }
 for(int c:active)r.final.push_back({c,s[c]});sort(r.final.begin(),r.final.end());
 r.score=30*max(0.0,far-r.maxRadius)+8*far/(1+r.maxRadius)+0.04*min(r.steps,256)-1.6*r.maxRadius-0.04*r.maxActive;
 if(r.outcome=="extinct")r.score-=10;if(r.outcome=="spread")r.score-=20;
 return r;
 }
};
string rule(int B,int S){auto clause=[](int mask){vector<int>counts;bool bracket=false;for(int i=0;i<=15;i++)if(mask>>i&1){counts.push_back(i);if(i>=10)bracket=true;}string out=bracket?"[":"";for(size_t i=0;i<counts.size();i++){if(bracket&&i)out+=",";out+=to_string(counts[i]);}if(bracket)out+="]";return out;};return "B"+clause(B)+"/S"+clause(S);}

void stateOut(ostream&o,const State&s){o<<'[';bool first=true;for(auto[c,v]:s){if(!first)o<<',';first=false;o<<'['<<c<<','<<v<<']';}o<<']';}
void emit(ostream&o,Result&r,int B,int S,int C,int cfg,int trial,string graph){o<<"{\"graph\":\""<<graph<<"\",\"configuration\":"<<cfg<<",\"trial\":"<<trial<<",\"rule\":\""<<rule(B,S)<<"\",\"birthMask\":"<<B<<",\"survivalMask\":"<<S<<",\"generations\":"<<C<<",\"steps\":"<<r.steps<<",\"outcome\":\""<<r.outcome<<"\",\"displacement\":"<<r.displacement<<",\"maximumRadius\":"<<r.maxRadius<<",\"maximumActive\":"<<r.maxActive<<",\"minimumBoundaryDistance\":"<<r.minBoundary<<",\"period\":"<<r.period<<",\"transient\":"<<r.transient<<",\"score\":"<<r.score<<",\"cellStates\":";stateOut(o,r.seed);o<<",\"finalCellStates\":";stateOut(o,r.final);o<<"}\n";}
State soup(Graph&g,RNG&r,const vector<int>&starts,int C){int size=3+r.n(46);if(r.n(20)==0)size=49+r.n(48);vector<int>v{starts[r.n(starts.size())]};set<int>inc(v.begin(),v.end());int attempts=0;while(int(v.size())<size && attempts++<size*40){int c=v[r.n(v.size())];int n=g.adj[c][r.n(g.adj[c].size())];if(inc.insert(n).second)v.push_back(n);}State st;int mode=r.n(6);for(int i=0;i<int(v.size());i++){int phase=1;if(mode==0)phase=1+r.n(C-1);else if(mode==1)phase=1+i%(C-1);else if(mode==2&&r.n(3)==0)phase=1+r.n(C-1);else if(mode==3&&r.n(2)==0)phase=1+r.n(C-1);st.push_back({v[i],phase});}return st;}
State mutate(Graph&g,RNG&r,State st,int C){map<int,int>cells(st.begin(),st.end());int ops=1+r.n(6);for(int i=0;i<ops;i++){int k=r.n(cells.size());auto it=cells.begin();advance(it,k);int c=it->first;int action=r.n(5);if(action==0&&cells.size()>3)cells.erase(it);else if(action<3&&cells.size()<100){int v=g.adj[c][r.n(g.adj[c].size())];cells[v]=r.n(3)==0?1+r.n(C-1):1;}else cells[c]=1+r.n(C-1);}return State(cells.begin(),cells.end());}
int main(int argc,char**argv){if(argc<7){cerr<<"graph output seed configurations trials horizon [binary|high|broad]\n";return 2;}string graphPath=argv[1],outPath=argv[2],mode=argc>7?argv[7]:"broad";uint64_t seed=stoull(argv[3]);int configs=stoi(argv[4]),trials=stoi(argv[5]),horizon=stoi(argv[6]);Graph g(graphPath);RNG random{seed};Engine engine(g);vector<int>starts;for(int c=0;c<g.n;c++)if(g.bound[c]>=22)starts.push_back(c);ofstream out(outPath),account(outPath+".account.jsonl");uint64_t total=0;
 for(int cfg=0;cfg<configs;cfg++){
 int C=2+random.n(15);if(mode=="binary")C=2;else if(mode=="high")C=16+random.n(17);else if(random.n(5)==0)C=2;
 int B=0,S=0;int typ=cfg%6;
 if(typ==0){B=1<<2;for(int n=3;n<=7;n++)if(random.n(5)==0)B|=1<<n;for(int n=0;n<=6;n++)if(random.n(4)==0)S|=1<<n;}
 else if(typ==1){B=1<<3;for(int n=2;n<=7;n++)if(random.n(4)==0)B|=1<<n;for(int n=0;n<=7;n++)if(random.n(3)==0)S|=1<<n;}
 else if(typ==2){B=(1+random.n(63))<<1;S=random.n(128);}
 else if(typ==3){B=1<<(1+random.n(6));S=random.n(128);}
 else if(typ==4){B=(1<<2)|(1<<3);S=random.n(64);}
 else {B=(1+random.n(15))<<2;S=random.n(128);}
 if(mode=="grid-binary"){C=2;B=(1+cfg%127)<<1;S=(cfg/127)%128;}
 if(mode=="grid-high"){C=16+cfg%17;B=(1<<2)|(random.n(2)?0:1<<3);S=random.n(128);}
 vector<Result>pool;Result best,osc;int bestTrial=0,oscTrial=0;map<string,int>outcomes;uint64_t startSteps=engine.totalSteps;
 for(int trial=0;trial<trials;trial++){State init;if(!pool.empty()&&random.n(5)<3)init=mutate(g,random,pool[random.n(pool.size())].seed,C);else init=soup(g,random,starts,C);Result result=engine.run(init,B,S,C,horizon,350,40);total++;outcomes[result.outcome]++;if(result.score>best.score){best=result;bestTrial=trial;}if(result.period>osc.period && result.maxRadius<18 && result.maxActive<160){osc=result;oscTrial=trial;}pool.push_back(result);sort(pool.begin(),pool.end(),[](auto&a,auto&b){return a.score>b.score;});if(pool.size()>16)pool.resize(16);}
 if(best.displacement>7&&best.steps>=16)emit(out,best,B,S,C,cfg,bestTrial,graphPath);
 if(osc.period>=35)emit(out,osc,B,S,C,cfg,oscTrial,graphPath);
 account<<"{\"configuration\":"<<cfg<<",\"rule\":\""<<rule(B,S)<<"\",\"generations\":"<<C<<",\"trials\":"<<trials<<",\"steps\":"<<(engine.totalSteps-startSteps)<<",\"bestScore\":"<<best.score<<",\"maxDisplacement\":"<<best.displacement<<",\"outcomes\":{";bool first=true;for(auto&[k,v]:outcomes){if(!first)account<<',';first=false;account<<'\"'<<k<<"\":"<<v;}account<<"}}\n";
 if(cfg%10==9){out.flush();account.flush();cerr<<cfg+1<<"/"<<configs<<" trials="<<total<<" steps="<<engine.totalSteps<<" best="<<best.displacement<<" rule="<<rule(B,S)<<" C="<<C<<"\n";}
 }
 cerr<<"COMPLETE trials="<<total<<" steps="<<engine.totalSteps<<"\n";
 return 0;
}
