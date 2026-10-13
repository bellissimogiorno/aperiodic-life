// Search finite defects in a uniform period-two background. This is a separate
// experimental search: it does not claim ordinary dead-background gliders.
#define main prior_quiescent_search_main
#include "../../exhaustive-search/hat-broad/search.cpp"
#undef main
#include <iomanip>

int main(int argc,char**argv){
 if(argc!=6){cerr<<"usage: search GRAPH PREFIX TRIALS SEED MIN_INTERIOR_DEGREE\n";return 1;}
 Graph g=readGraph(argv[1]);string prefix=argv[2];int trials=stoi(argv[3]);rngState=stoull(argv[4]);uint64_t seed=rngState;int minDegree=stoi(argv[5]),maxDegree=0;
 for(int i=0;i<g.n;i++)if(g.bd[i]>=5){int d=g.offset[i+1]-g.offset[i];if(d<minDegree){cerr<<"incorrect interior degree bound\n";return 2;}maxDegree=max(maxDegree,d);}
 vector<int>starts;for(int i=0;i<g.n;i++)if(g.bd[i]>=35)starts.push_back(i);
 vector<uint8_t>state(g.n),counts(g.n),mark(g.n);vector<int>active,next,cells;
 long long transitions=0,extinct=0,population=0,radius=0,boundary=0,cycle=0,horizon=0,records=0;
 double bestDistance=0;ofstream hits(prefix+"-candidates.jsonl");auto begun=chrono::steady_clock::now();
 auto entries=[&](){Entries e;for(int i:active)e.push_back({i,1});sort(e.begin(),e.end());return e;};
 for(int trial=0;trial<trials;trial++){
  int B=1|(rr(1<<maxDegree)<<1),S=rr(1<<minDegree),base=starts[rr(starts.size())],amount=1+rr(10);
  int bg=0;active={base};state[base]=1;
  for(int k=0;k<amount*8&&int(active.size())<amount;k++){int i=active[rr(active.size())];int j=g.nei[g.offset[i]+rr(g.offset[i+1]-g.offset[i])];if(!state[j]){state[j]=1;active.push_back(j);}}
  Entries initial=entries();unordered_map<uint64_t,int>seen;double ox=0,oy=0,maximumRadius=0,maximumDistance=0;int minimumBoundary=999,maxPopulation=0,stop=0,gen=0;
  for(;gen<=600;gen++){
   if(active.empty()){extinct++;stop=1;break;}
   if(active.size()>180){population++;stop=2;break;}
   double x=0,y=0;for(int i:active){x+=g.x[i];y+=g.y[i];minimumBoundary=min(minimumBoundary,g.bd[i]);}x/=active.size();y/=active.size();if(gen==0){ox=x;oy=y;}
   double r=0;for(int i:active)r=max(r,hypot(g.x[i]-x,g.y[i]-y));maximumRadius=max(maximumRadius,r);maximumDistance=max(maximumDistance,hypot(x-ox,y-oy));maxPopulation=max(maxPopulation,int(active.size()));
   if(minimumBoundary<6){boundary++;stop=3;break;}if(r>20){radius++;stop=4;break;}
   uint64_t h=hash64(bg);for(int i:active)h^=hash64(uint64_t(i)+0x932ULL);if(seen.count(h)){cycle++;stop=5;break;}seen.emplace(h,gen);
   if(gen>=40 && maximumDistance>=25 && maximumDistance>bestDistance){
    bestDistance=maximumDistance;hits<<setprecision(15)<<"{\"trial\":"<<trial<<",\"rule\":\""<<rule(B,S)<<"\",\"background\":\"uniform 0/1 alternation\",\"generation\":"<<gen<<",\"maximumCentroidDisplacement\":"<<maximumDistance<<",\"maximumRadiusEveryGeneration\":"<<maximumRadius<<",\"minimumBoundary\":"<<minimumBoundary<<",\"maxDefectPopulation\":"<<maxPopulation<<",\"initialDefects\":";printEntries(hits,initial);hits<<",\"finalDefects\":";printEntries(hits,entries());hits<<"}\n";hits.flush();records++;
   }
   if(gen==600){horizon++;stop=6;break;}
   cells.clear();for(int i:active){if(!mark[i]){mark[i]=1;cells.push_back(i);}for(int k=g.offset[i];k<g.offset[i+1];k++){int j=g.nei[k];counts[j]++;if(!mark[j]){mark[j]=1;cells.push_back(j);}}}
   next.clear();for(int i:cells){int d=g.offset[i+1]-g.offset[i],own=bg^state[i],live=bg?d-counts[i]:counts[i];int after=((own?S:B)>>live)&1;int defect=after^(1-bg);state[i]=defect;counts[i]=0;mark[i]=0;if(defect)next.push_back(i);}active.swap(next);bg=1-bg;transitions++;
  }
  for(int i:active)state[i]=0;
  if((trial+1)%10000==0||trial+1==trials){ofstream out(prefix+"-manifest.json");out<<"{\"requestedTrials\":"<<trials<<",\"completedTrials\":"<<trial+1<<",\"prng\":\"xorshift64star\",\"seed\":\""<<seed<<"\",\"minimumInteriorDegreeLowerBound\":"<<minDegree<<",\"maximumInteriorDegree\":"<<maxDegree<<",\"horizon\":600,\"populationCap\":180,\"radiusCap\":20,\"transitions\":"<<transitions<<",\"extinct\":"<<extinct<<",\"populationStopped\":"<<population<<",\"radiusStopped\":"<<radius<<",\"boundaryStopped\":"<<boundary<<",\"stationaryHashReturn\":"<<cycle<<",\"horizonStopped\":"<<horizon<<",\"recordCandidates\":"<<records<<",\"bestRecordedDisplacement\":"<<bestDistance<<",\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-begun).count()<<"}\n";cerr<<"trials="<<trial+1<<" transitions="<<transitions<<" best="<<bestDistance<<"\n";}
 }
}
