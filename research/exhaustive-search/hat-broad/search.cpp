// Bounded reproducible Einstein-hat searches. See README.md for limitations.
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <numeric>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
uint64_t rngState=0x68617462726f6164ULL;
uint64_t rnd(){rngState^=rngState>>12;rngState^=rngState<<25;rngState^=rngState>>27;return rngState*2685821657736338717ULL;}
int rr(int n){return rnd()%n;}
struct Graph{int n;vector<double>x,y;vector<int>bd,shape,offset,nei,starts;};
Graph readGraph(const string&path){ifstream in(path);Graph g;in>>g.n;g.x.resize(g.n);g.y.resize(g.n);g.bd.resize(g.n);g.shape.resize(g.n);g.offset.push_back(0);for(int i=0;i<g.n;i++){int degree;in>>g.x[i]>>g.y[i]>>g.bd[i]>>g.shape[i]>>degree;for(int k=0;k<degree;k++){int j;in>>j;g.nei.push_back(j);}g.offset.push_back(g.nei.size());if(g.bd[i]>=24)g.starts.push_back(i);}return g;}
string rule(int B,int S){string r="B";for(int i=0;i<16;i++)if(B>>i&1)r+=to_string(i);r+="/S";for(int i=0;i<16;i++)if(S>>i&1)r+=to_string(i);return r;}
using Entries=vector<pair<int,int>>;
void printEntries(ostream&o,const Entries&e){o<<"[";bool first=true;for(auto [i,s]:e){if(!first)o<<",";first=false;o<<"["<<i<<","<<s<<"]";}o<<"]";}
struct Spatial{double x=0,y=0,r=0;int bd=999,live=0;};
struct Snapshot{int gen;Spatial pos;Entries entries;double maxRadius;};
struct Candidate{int trial,B,S,C,from,to;double score;Spatial p,q;Entries initial,first,last;};
uint64_t hash64(uint64_t v){v=(v^(v>>30))*0xbf58476d1ce4e5b9ULL;v=(v^(v>>27))*0x94d049bb133111ebULL;return v^(v>>31);}
struct ShapeSnap{int gen,anchor;vector<array<int,4>>sig;};
int main(int argc,char**argv){
 if(argc<5){cerr<<"Usage: search GRAPH TRIALS PREFIX SEED [HORIZON] [POPULATION] [SMALL_SEEDS] [ENDPOINT_SCORE]\n";return 1;}
 Graph g=readGraph(argv[1]);int trials=stoi(argv[2]);string prefix=argv[3];rngState=stoull(argv[4]);uint64_t seed=rngState;int horizon=argc>5?stoi(argv[5]):800,maxPop=argc>6?stoi(argv[6]):350,focus=argc>7?stoi(argv[7]):0,endpoint=argc>8?stoi(argv[8]):0;
 vector<uint8_t>state(g.n),counts(g.n),mark(g.n);vector<int>active,next,cells;
 vector<Candidate>best;unordered_set<uint64_t>knownShapes;ofstream translated(prefix+"-translated.jsonl"),oscillators(prefix+"-cycles.jsonl");
 long long steps=0,updates=0;long long extinct=0,boundary=0,oversized=0,stationary=0,limited=0,translatedCount=0,cycleRecords=0;int globalMaxPeriod=0;
 auto begin=chrono::steady_clock::now();
 auto entries=[&](){Entries e;for(int i:active)e.push_back({i,state[i]});sort(e.begin(),e.end());return e;};
 auto spatial=[&](){Spatial p;for(int i:active){p.x+=g.x[i];p.y+=g.y[i];p.bd=min(p.bd,g.bd[i]);p.live+=state[i]==1;}p.x/=active.size();p.y/=active.size();for(int i:active)p.r=max(p.r,hypot(g.x[i]-p.x,g.y[i]-p.y));return p;};
 auto emitCandidate=[&](ostream&o,const Candidate&c){o<<"{\"tiling\":\"hat\",\"depth\":5,\"trial\":"<<c.trial<<",\"rule\":\""<<rule(c.B,c.S)<<"\",\"generations\":"<<c.C<<",\"from\":"<<c.from<<",\"to\":"<<c.to<<",\"score\":"<<c.score<<",\"netDistance\":"<<hypot(c.q.x-c.p.x,c.q.y-c.p.y)<<",\"radii\":["<<c.p.r<<","<<c.q.r<<"],\"minimumBoundaryAtEndpoints\":"<<min(c.p.bd,c.q.bd)<<",\"cellStates\":";printEntries(o,c.initial);o<<",\"fromCellStates\":";printEntries(o,c.first);o<<",\"toCellStates\":";printEntries(o,c.last);o<<"}";};
 for(int trial=0;trial<trials;trial++){
  int C;int choice=rr(100);if(choice<40)C=2;else if(choice<85)C=3+rr(6);else C=9+rr(24);
  // B0 is excluded: finite sparse quiescent-background searches cannot model it.
  int B=0,S=0;choice=rr(100);
  if(choice<40)B=4;else if(choice<70)B=8;else if(choice<83)B=12;else if(choice<90)B=2;else if(choice<95)B=16;else B=20;
  for(int n=2;n<=9;n++)if(rr(100)<20)B|=1<<n;
  for(int n=0;n<=9;n++)if(rr(100)<(n<6?35:12))S|=1<<n;
  if(rr(5)==0)S=0;
  int base=g.starts[rr(g.starts.size())],amount=2+rr(47);
  if(focus){const int births[]={4,12,20,28,36,44,60};B=births[rr(7)];S=rr(128);C=rr(4)==0?2:3+rr(14);amount=2+rr(10);}
  active.clear();active.push_back(base);state[base]=1;
  for(int k=0;k<amount*3&&active.size()<amount;k++){int from=active[rr(active.size())],j=g.nei[g.offset[from]+rr(g.offset[from+1]-g.offset[from])];if(!state[j]&&g.bd[j]>=16){state[j]=1;active.push_back(j);}}
  // Mixed refractory seeds supplement pure live soups; disconnected holes test shapes.
  if(rr(4)==0&&C>2)for(int i:active)state[i]=1+rr(C-1);
  if(rr(3)==0){next.clear();for(int i:active)if(rr(100)<70)next.push_back(i);else state[i]=0;active.swap(next);}
  Entries initial=entries();unordered_map<uint64_t,int>seen;unordered_map<uint64_t,vector<ShapeSnap>>shapes;vector<Snapshot>anchors;vector<Spatial>positions;double trialBest=0;Candidate candidate;bool finished=false;int minBoundary=999;
  for(int gen=0;gen<=horizon;gen++){
   steps++;if(active.empty()){extinct++;finished=true;break;}if(active.size()>maxPop){oversized++;finished=true;break;}
   uint64_t h=0;for(int i:active){h^=hash64((uint64_t(i)<<8)|state[i]);minBoundary=min(minBoundary,g.bd[i]);}if(minBoundary<5){boundary++;finished=true;break;}
   auto it=seen.find(h);if(it!=seen.end()){
    int period=gen-it->second;stationary++;finished=true;
    if(period>=64&&period>globalMaxPeriod){globalMaxPeriod=period;oscillators<<"{\"trial\":"<<trial<<",\"rule\":\""<<rule(B,S)<<"\",\"generations\":"<<C<<",\"transient\":"<<it->second<<",\"periodHashCandidate\":"<<period<<",\"minimumBoundary\":"<<minBoundary<<",\"cellStates\":";printEntries(oscillators,initial);oscillators<<"}\n";cycleRecords++;oscillators.flush();}
    break;
   }seen.emplace(h,gen);
   if(active.size()<=90&&gen<=400){
    int anchor=*min_element(active.begin(),active.end(),[&](int i,int j){return g.x[i]<g.x[j]||(g.x[i]==g.x[j]&&g.y[i]<g.y[j]);});
    vector<array<int,4>>sig;sig.reserve(active.size());for(int i:active)sig.push_back({int(llround((g.x[i]-g.x[anchor])*1000)),int(llround((g.y[i]-g.y[anchor])*1000)),state[i],g.shape[i]});sort(sig.begin(),sig.end());uint64_t sh=0x927430adULL;for(auto item:sig)for(int v:item)sh=hash64(sh^uint64_t(v));
    auto&bucket=shapes[sh];for(const auto&old:bucket)if(sig==old.sig&&hypot(g.x[anchor]-g.x[old.anchor],g.y[anchor]-g.y[old.anchor])>1){
      uint64_t key=sh^hash64((uint64_t(B)<<24)|(uint64_t(S)<<8)|C);if(knownShapes.insert(key).second&&active.size()>=2){translated<<"{\"trial\":"<<trial<<",\"rule\":\""<<rule(B,S)<<"\",\"generations\":"<<C<<",\"from\":"<<old.gen<<",\"to\":"<<gen<<",\"translation\":["<<g.x[anchor]-g.x[old.anchor]<<","<<g.y[anchor]-g.y[old.anchor]<<"],\"population\":"<<active.size()<<",\"minimumBoundary\":"<<minBoundary<<",\"cellStates\":";printEntries(translated,initial);translated<<"}\n";translatedCount++;translated.flush();}break;
     }if(bucket.empty())bucket.push_back({gen,anchor,move(sig)});
   }
   if(gen%8==0){
    Spatial p=spatial();positions.push_back(p);
    if(gen==0||gen==8||gen==16||gen==32||(endpoint?(gen==64||gen==128||gen==256):gen%64==0))anchors.push_back({gen,p,entries(),p.r});
    for(auto&a:anchors)a.maxRadius=max(a.maxRadius,p.r);
    if(gen>=24&&p.live>=2&&positions.size()>=3){Spatial recent=positions[positions.size()-3];double recentMove=hypot(p.x-recent.x,p.y-recent.y);
     if(recentMove>1.5)for(const auto&a:anchors)if(gen-a.gen>=24&&(endpoint||a.maxRadius<=25)){double dx=p.x-a.pos.x,dy=p.y-a.pos.y,dist=hypot(dx,dy),score=dist/(endpoint?(a.pos.r+p.r+4):(2*a.maxRadius+4));double progress=(dx*(p.x-recent.x)+dy*(p.y-recent.y))/(dist+1e-9);
      if(progress>0.8&&score>trialBest){trialBest=score;candidate={trial,B,S,C,a.gen,gen,score,a.pos,p,initial,a.entries,entries()};}
     }
    }
   }
   if(gen==horizon)break;
   cells.clear();for(int i:active){if(!mark[i]){mark[i]=1;cells.push_back(i);}if(state[i]==1)for(int k=g.offset[i];k<g.offset[i+1];k++){int j=g.nei[k];counts[j]++;if(!mark[j]){mark[j]=1;cells.push_back(j);}}}
   next.clear();updates+=cells.size();for(int i:cells){int old=state[i],n=counts[i],v=old==0?((B>>n)&1):old==1?((S>>n)&1?1:(C>2?2:0)):(old+1<C?old+1:0);state[i]=v;counts[i]=0;mark[i]=0;if(v)next.push_back(i);}active.swap(next);
  }
  if(!finished)limited++;
  if(trialBest>=0.35&&(best.size()<200||trialBest>best.back().score)){best.push_back(move(candidate));sort(best.begin(),best.end(),[](const auto&a,const auto&b){return a.score>b.score;});if(best.size()>200)best.resize(200);}
  for(int i:active)state[i]=0;
  if((trial+1)%10000==0||trial+1==trials){
   ofstream out(prefix+"-best.json");out<<"[\n";for(int i=0;i<best.size();i++){if(i)out<<",\n";emitCandidate(out,best[i]);}out<<"\n]\n";
   ofstream meta(prefix+"-campaign.json");meta<<"{\"seedDecimal\":\""<<seed<<"\",\"prng\":\"xorshift64star\",\"trialsCompleted\":"<<trial+1<<",\"trialsRequested\":"<<trials<<",\"statesExamined\":"<<steps<<",\"cellUpdates\":"<<updates<<",\"extinct\":"<<extinct<<",\"boundaryStopped\":"<<boundary<<",\"populationStopped\":"<<oversized<<",\"stationaryHashReturn\":"<<stationary<<",\"horizonStopped\":"<<limited<<",\"translatedCandidates\":"<<translatedCount<<",\"longCycleRecords\":"<<cycleRecords<<",\"horizon\":"<<horizon<<",\"maxPopulation\":"<<maxPop<<",\"bestMobilityScore\":"<<(best.empty()?0:best.front().score)<<",\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-begin).count()<<"}\n";
   cerr<<"trials="<<trial+1<<" steps="<<steps<<" translated="<<translatedCount<<" best="<<(best.empty()?0:best.front().score)<<" seconds="<<chrono::duration<double>(chrono::steady_clock::now()-begin).count()<<"\n";
  }
 }
}
