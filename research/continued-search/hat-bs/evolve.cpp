// Reproducible bounded evolutionary hat search; see README.md.
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
using Entries=vector<pair<int,int>>;
uint64_t rs;
uint64_t rnd(){rs^=rs>>12;rs^=rs<<25;rs^=rs>>27;return rs*2685821657736338717ULL;}
int ri(int n){return rnd()%n;}
uint64_t mix(uint64_t v){v=(v^(v>>30))*0xbf58476d1ce4e5b9ULL;v=(v^(v>>27))*0x94d049bb133111ebULL;return v^(v>>31);}
struct Graph {int n,maxDegree=0;vector<double>x,y;vector<int>bd,shape,offset,neighbours,starts;};
Graph readGraph(const string&path){ifstream f(path);Graph g;f>>g.n;g.x.resize(g.n);g.y.resize(g.n);g.bd.resize(g.n);g.shape.resize(g.n);g.offset.push_back(0);for(int i=0;i<g.n;i++){int d;f>>g.x[i]>>g.y[i]>>g.bd[i]>>g.shape[i]>>d;g.maxDegree=max(g.maxDegree,d);while(d--){int j;f>>j;g.neighbours.push_back(j);}g.offset.push_back(g.neighbours.size());if(g.bd[i]>=30)g.starts.push_back(i);}return g;}
struct Seed{int graph,B,S,C,parent=-1;Entries cells;};
struct Result{Seed seed;double score=0,travel=0,radius=0,originX=0,originY=0;int trial=0,at=0,stopped=0,peak=0,boundary=999,outcome=0;Entries endpoint;};
struct Shape{int gen,anchor;vector<array<int,4>>key;};
string rule(int B,int S){string out="B";for(int i=0;i<8;i++)if(B>>i&1)out+=char('0'+i);out+="/S";for(int i=0;i<8;i++)if(S>>i&1)out+=char('0'+i);return out;}
void entriesOut(ostream&f,const Entries&e){f<<"[";for(int i=0;i<e.size();i++){if(i)f<<",";f<<"["<<e[i].first<<","<<e[i].second<<"]";}f<<"]";}
void resultOut(ostream&f,const Result&r){f<<"{\"tiling\":\"hat\",\"depth\":5,\"neighborhood\":\""<<(r.seed.graph?"touch":"edge")<<"\",\"rule\":\""<<rule(r.seed.B,r.seed.S)<<"\",\"generations\":"<<r.seed.C<<",\"trial\":"<<r.trial<<",\"parentTrial\":"<<r.seed.parent<<",\"score\":"<<r.score<<",\"bestAt\":"<<r.at<<",\"stoppedAt\":"<<r.stopped<<",\"outcomeCode\":"<<r.outcome<<",\"netTravelAtBest\":"<<r.travel<<",\"maximumRadiusWholeRun\":"<<r.radius<<",\"maximumPopulationWholeRun\":"<<r.peak<<",\"minimumBoundaryWholeRun\":"<<r.boundary<<",\"cellStates\":";entriesOut(f,r.seed.cells);f<<",\"endpoint\":";entriesOut(f,r.endpoint);f<<"}";}
uint64_t seedHash(const Seed&s){uint64_t h=mix(s.B|(uint64_t(s.S)<<8)|(uint64_t(s.C)<<16)|(uint64_t(s.graph)<<24));for(auto[i,v]:s.cells)h=mix(h^((uint64_t(i)<<8)|v));return h;}
int main(int argc,char**argv){
 if(argc!=7){cerr<<"Usage: evolve EDGE_GRAPH TOUCH_GRAPH SEEDS TRIALS PREFIX RNG_SEED\n";return 1;}
 array<Graph,2> graphs={readGraph(argv[1]),readGraph(argv[2])};int limit=stoi(argv[4]);string prefix=argv[5];rs=stoull(argv[6]);uint64_t originalSeed=rs;
 vector<Seed> initial;{ifstream f(argv[3]);int n;f>>n;while(n--){Seed s;int len;f>>s.graph>>s.B>>s.S>>s.C>>len;while(len--){int c,v;f>>c>>v;s.cells.emplace_back(c,v);}sort(s.cells.begin(),s.cells.end());s.B&=(1<<(graphs[s.graph].maxDegree+1))-1;s.S&=(1<<(graphs[s.graph].maxDegree+1))-1;initial.push_back(move(s));}}
 vector<vector<Result>> pools(64);vector<Result> best;unordered_set<uint64_t> uniqueSeeds;long long attempts=0,duplicates=0,steps=0,updates=0,baseline=0,mutations=0,randomSoups=0;array<long long,7>outcomes{};
 vector<uint8_t>state(graphs[0].n),count(graphs[0].n),marked(graphs[0].n);vector<int>active,next,candidates;auto start=chrono::steady_clock::now();ofstream returns(prefix+"-returns.jsonl"),milestones(prefix+"-milestones.jsonl"),survivors(prefix+"-survivors.jsonl");unordered_set<uint64_t>returnKeys;
 auto randomSeed=[&](){Seed s;s.graph=ri(2);const auto&g=graphs[s.graph];const int bs[]={4,4,4,12,20,36};const int ss[]={2,4,6,12,34,36,44,50,52,0};s.B=bs[ri(6)];s.S=ss[ri(10)];s.C=ri(10)==0?2:3+ri(18);int n=2+ri(19),base=g.starts[ri(g.starts.size())];map<int,int>v;v[base]=1;for(int k=0;k<n*4&&v.size()<n;k++){auto p=v.begin();advance(p,ri(v.size()));int c=p->first,j=g.neighbours[g.offset[c]+ri(g.offset[c+1]-g.offset[c])];if(g.bd[j]>=24)v[j]=ri(3)==0?1+ri(s.C-1):1;}s.cells.assign(v.begin(),v.end());return s;};
 int trial=0;
 while(trial<limit){
  attempts++;Seed s;
  if(attempts<=initial.size()){s=initial[attempts-1];baseline++;}
  else if(ri(100)<85){
   int bucket=ri(pools.size());for(int k=0;k<64&&pools[bucket].empty();k++)bucket=(bucket+1)%pools.size();
   if(pools[bucket].empty()){s=randomSeed();randomSoups++;}
   else {const auto&pool=pools[bucket];int choice=ri(pool.size());for(int k=0;k<3;k++){int j=ri(pool.size());if(pool[j].score>pool[choice].score)choice=j;}const Result&parent=pool[choice];s=parent.seed;s.parent=parent.trial;
    if(ri(6)==0&&!parent.endpoint.empty()&&parent.endpoint.size()<=90)s.cells=parent.endpoint;
    auto&g=graphs[s.graph];map<int,int>v(s.cells.begin(),s.cells.end());int ops=1+ri(4);
    while(ops--&&!v.empty()){auto p=v.begin();advance(p,ri(v.size()));int cell=p->first,c=ri(100);if(c<25&&v.size()>2)v.erase(p);else if(c<55)p->second=1+ri(s.C-1);else if(v.size()<80){int dest=g.neighbours[g.offset[cell]+ri(g.offset[cell+1]-g.offset[cell])];if(g.bd[dest]>=12)v[dest]=ri(2)?1:1+ri(s.C-1);}}
    if(ri(9)==0){int k=ri(g.maxDegree+1);s.S^=1<<k;}
    if(ri(18)==0){int k=1+ri(g.maxDegree);s.B^=1<<k;if(!s.B)s.B=4;}
    if(ri(9)==0){s.C=clamp(s.C+(ri(2)?1:-1),2,32);for(auto&[i,vv]:v)vv=min(vv,s.C-1);}
    s.cells.assign(v.begin(),v.end());mutations++;
   }
  }else {s=randomSeed();randomSoups++;}
  uint64_t sh=seedHash(s);if(!uniqueSeeds.insert(sh).second){duplicates++;continue;}
  const auto&g=graphs[s.graph];active.clear();for(auto[i,v]:s.cells){state[i]=v;active.push_back(i);}Result r;r.seed=s;r.trial=trial;unordered_map<uint64_t,int>seen;unordered_map<uint64_t,vector<Shape>>shapeSeen;double maxRadius=0,bestMetric=0;int maxPopulation=0,minBoundary=999;vector<pair<double,double>>path;int outcome=6;
  for(int gen=0;gen<=4096;gen++){
   steps++;r.stopped=gen;if(active.empty()){outcome=0;break;}if(active.size()>180){outcome=1;break;}
   double x=0,y=0,radius=0;int live=0;uint64_t hash=0;for(int i:active){x+=g.x[i];y+=g.y[i];live+=state[i]==1;minBoundary=min(minBoundary,g.bd[i]);hash^=mix((uint64_t(i)<<8)|state[i]);}x/=active.size();y/=active.size();
   for(int i:active)radius=max(radius,hypot(g.x[i]-x,g.y[i]-y));maxRadius=max(maxRadius,radius);maxPopulation=max<int>(maxPopulation,active.size());if(gen==0){r.originX=x;r.originY=y;}
   if(minBoundary<6){outcome=2;break;}if(maxRadius>18){outcome=3;break;}
   if(seen.count(hash)){outcome=4;break;}seen.emplace(hash,gen);path.emplace_back(x,y);
   double travel=hypot(x-r.originX,y-r.originY),ratio=travel/(2*maxRadius+4);
   if(gen>=16&&live>=2&&gen<path.size()&&gen>=16){auto old=path[gen-16];double recent=hypot(x-old.first,y-old.second),forward=(x-r.originX)*(x-old.first)+(y-r.originY)*(y-old.second);
    if(recent>1&&forward>0){double metric=ratio*(1+0.002*min(gen,1000));if(metric>bestMetric){bestMetric=metric;r.score=metric;r.at=gen;r.travel=travel;r.endpoint.clear();for(int i:active)r.endpoint.emplace_back(i,state[i]);sort(r.endpoint.begin(),r.endpoint.end());}}
   }
   // Complete nonzero states and full polygon classes, not live centroids.
   if(gen%2==0&&active.size()<=80){int anchor=*min_element(active.begin(),active.end(),[&](int i,int j){return g.x[i]<g.x[j]||(g.x[i]==g.x[j]&&g.y[i]<g.y[j]);});vector<array<int,4>>key;for(int i:active)key.push_back({int(llround((g.x[i]-g.x[anchor])*1000)),int(llround((g.y[i]-g.y[anchor])*1000)),state[i],g.shape[i]});sort(key.begin(),key.end());uint64_t h=79;for(auto a:key)for(int v:a)h=mix(h^v);auto&bucket=shapeSeen[h];for(const auto&old:bucket)if(old.key==key&&hypot(g.x[anchor]-g.x[old.anchor],g.y[anchor]-g.y[old.anchor])>1){uint64_t rk=mix(h^s.B^(uint64_t(s.S)<<8)^(uint64_t(s.C)<<16)^(uint64_t(s.graph)<<24));if(returnKeys.insert(rk).second){returns<<"{\"tiling\":\"hat\",\"depth\":5,\"neighborhood\":\""<<(s.graph?"touch":"edge")<<"\",\"rule\":\""<<rule(s.B,s.S)<<"\",\"generations\":"<<s.C<<",\"trial\":"<<trial<<",\"from\":"<<old.gen<<",\"to\":"<<gen<<",\"translation\":["<<g.x[anchor]-g.x[old.anchor]<<","<<g.y[anchor]-g.y[old.anchor]<<"],\"maximumRadiusThroughReturn\":"<<maxRadius<<",\"cellStates\":";entriesOut(returns,s.cells);returns<<"}\n";returns.flush();}break;}if(bucket.empty())bucket.push_back({gen,anchor,move(key)});}
   if(gen==4096){outcome=5;break;}
   candidates.clear();for(int i:active){if(!marked[i]){marked[i]=1;candidates.push_back(i);}if(state[i]==1)for(int k=g.offset[i];k<g.offset[i+1];k++){int j=g.neighbours[k];count[j]++;if(!marked[j]){marked[j]=1;candidates.push_back(j);}}}
   next.clear();updates+=candidates.size();for(int i:candidates){int old=state[i],n=count[i],v=old==0?((s.B>>n)&1):old==1?((s.S>>n)&1?1:s.C>2?2:0):(old+1<s.C?old+1:0);state[i]=v;count[i]=0;marked[i]=0;if(v)next.push_back(i);}active.swap(next);
  }
  for(int i:active)state[i]=0;r.outcome=outcome;r.radius=maxRadius;r.peak=maxPopulation;r.boundary=minBoundary;outcomes[outcome]++;if(outcome==5){resultOut(survivors,r);survivors<<"\n";survivors.flush();}
  // A short-lived departure settling into a fixed oscillator is not a mover.
  if(outcome==4)r.score*=0.15;
  if(r.score>0.25){int bucket=s.graph*32+s.C-2;auto&pool=pools[bucket];pool.push_back(r);sort(pool.begin(),pool.end(),[](const auto&a,const auto&b){return a.score>b.score;});if(pool.size()>40)pool.resize(40);
   if(best.size()<80||r.score>best.back().score){bool record=best.empty()||r.score>best.front().score;best.push_back(r);sort(best.begin(),best.end(),[](const auto&a,const auto&b){return a.score>b.score;});if(best.size()>80)best.resize(80);if(record){resultOut(milestones,r);milestones<<"\n";milestones.flush();}}
  }
  trial++;
  if(trial%10000==0||trial==limit){ofstream f(prefix+"-best.json");f<<"[";for(int i=0;i<best.size();i++){if(i)f<<",";resultOut(f,best[i]);}f<<"]\n";ofstream m(prefix+"-campaign.json");m<<"{\"seed\":\""<<originalSeed<<"\",\"trials\":"<<trial<<",\"requested\":"<<limit<<",\"attempts\":"<<attempts<<",\"duplicateHashesSkipped\":"<<duplicates<<",\"baselineAttempts\":"<<baseline<<",\"mutationAttempts\":"<<mutations<<",\"randomSoupAttempts\":"<<randomSoups<<",\"statesExamined\":"<<steps<<",\"candidateUpdates\":"<<updates<<",\"returnRecords\":"<<returnKeys.size()<<",\"horizon\":4096,\"populationCap\":180,\"radiusCapEveryGeneration\":18,\"boundaryStopBelow\":6,\"outcomes\":[";for(int i=0;i<7;i++){if(i)m<<",";m<<outcomes[i];}m<<"],\"outcomeNames\":[\"extinct\",\"population\",\"boundary\",\"radius\",\"stationaryHash\",\"horizon\",\"unexpected\"],\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"}\n";cerr<<"trials="<<trial<<" steps="<<steps<<" best="<<(best.empty()?0:best.front().score)<<" at="<<(best.empty()?0:best.front().at)<<" returns="<<returnKeys.size()<<" sec="<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"\n";}
 }
}
