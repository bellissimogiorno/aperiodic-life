#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
constexpr int W=512,N=W*W,Z=256*W+256;
const int D[]={W,1,1-W,-W,-1,W-1};
uint8_t st[N],ct[N],marked[N];
struct Seed {string id; int B=-1,S=-1,C=0;vector<array<int,3>> cells;};
struct Snap {int gen,q,r;vector<int> sig;};
struct Stats {long long trials=0,steps=0,extinct=0,boundary=0,population=0,periodic=0,moving=0,horizon=0,records=0;};
uint64_t hashvec(const vector<int>&v){uint64_t h=1469598103934665603ULL;for(int x:v){h^=x;h*=1099511628211ULL;}return h;}
string rulename(int b,int s){string out="B";for(int i=0;i<7;i++)if(b>>i&1)out+=char('0'+i);out+="/S";for(int i=0;i<7;i++)if(s>>i&1)out+=char('0'+i);return out;}
void cells(ostream&o,const vector<array<int,3>>&v){o<<"[";for(int i=0;i<v.size();i++){if(i)o<<",";o<<"["<<v[i][0]<<","<<v[i][1]<<","<<v[i][2]<<"]";}o<<"]";}
void stats(ostream&o,const Stats&s){o<<"{\"trials\":"<<s.trials<<",\"steps\":"<<s.steps<<",\"extinct\":"<<s.extinct<<",\"boundaryStopped\":"<<s.boundary<<",\"populationStopped\":"<<s.population<<",\"periodic\":"<<s.periodic<<",\"moving\":"<<s.moving<<",\"horizonStopped\":"<<s.horizon<<",\"records\":"<<s.records<<"}";}
int main(int argc,char**argv){
 string mode=argc>1?argv[1]:"exhaustive",inpath=argc>2?argv[2]:"small-seeds.txt",prefix=argc>3?argv[3]:"small";
 int maxSteps=argc>4?stoi(argv[4]):400,maxPopulation=argc>5?stoi(argv[5]):600,maxC=argc>6?stoi(argv[6]):6;
 ifstream input(inpath); vector<Seed> seeds;string line;while(getline(input,line)){if(line.empty())continue;istringstream is(line);Seed s;int size;is>>s.id;if(mode=="coloured")is>>s.C;else if(mode!="exhaustive")is>>s.B>>s.S>>s.C;is>>size;for(int i=0;i<size;i++){array<int,3>c;is>>c[0]>>c[1]>>c[2];s.cells.push_back(c);}seeds.push_back(s);}
 ofstream out(prefix+"-candidates.jsonl"),meta(prefix+"-manifest.json"),longout(prefix+"-unresolved.jsonl"),guns(prefix+"-gun-candidates.jsonl"); unordered_set<string> gunUnique;Stats total;vector<int>a,next,cand;unordered_set<string> unique;auto start=chrono::steady_clock::now();
 auto trial=[&](const Seed&seed,int B,int S,int C){
  total.trials++;a.clear();for(auto c:seed.cells){int k=Z+c[0]*W+c[1];if(st[k]){cerr<<"duplicate seed\n";exit(2);}st[k]=c[2];a.push_back(k);}unordered_map<uint64_t,vector<Snap>> seen; vector<int> core120,core180; int active120=0,active180=0;bool done=false;int mq=0,mr=0,xq=0,xr=0;
  for(int gen=0;gen<=maxSteps&&!done;gen++){
   if(a.empty()){total.extinct++;break;}if(a.size()>maxPopulation){total.population++;break;}mq=mr=W;xq=xr=0;for(int k:a){mq=min(mq,k/W);mr=min(mr,k%W);xq=max(xq,k/W);xr=max(xr,k%W);}if(mq<3||mr<3||xq>W-4||xr>W-4){total.boundary++;break;}
   if(gen==120||gen==180||gen==240){vector<int>core;for(int k:a){int q=k/W-256,r=k%W-256;if(max({abs(q),abs(r),abs(q+r)})<=12)core.push_back(k*32+st[k]);}sort(core.begin(),core.end());if(gen==120){core120=core;active120=a.size();}if(gen==180){core180=core;active180=a.size();}if(gen==240&&!core.empty()&&core==core120&&core==core180&&a.size()>active180&&active180>active120&&int(a.size())-active180==active180-active120){string gkey=to_string(B)+":"+to_string(S)+":"+to_string(C)+":"+to_string(hashvec(core));if(gunUnique.insert(gkey).second){vector<array<int,3>>final,engine;for(int k:a)final.push_back({k/W-256,k%W-256,st[k]});for(int v:core){int k=v/32;engine.push_back({k/W-256,k%W-256,v%32});}guns<<"{\"seedId\":\""<<seed.id<<"\",\"rule\":\""<<rulename(B,S)<<"\",\"generations\":"<<C<<",\"active120\":"<<active120<<",\"active180\":"<<active180<<",\"active240\":"<<a.size()<<",\"initial\":";cells(guns,seed.cells);guns<<",\"core\":";cells(guns,engine);guns<<",\"final\":";cells(guns,final);guns<<"}\n";guns.flush();}}}
   if(a.size()<=350){vector<int> sig;sig.reserve(a.size());for(int k:a)sig.push_back(((k/W-mq)*W+k%W-mr)*32+st[k]);sort(sig.begin(),sig.end());uint64_t h=hashvec(sig);auto&bucket=seen[h];for(auto&ss:bucket)if(sig==ss.sig){int p=gen-ss.gen,dq=mq-ss.q,dr=mr-ss.r;total.periodic++;if(dq||dr){total.moving++;string key=to_string(C)+":"+to_string(p)+":"+to_string(dq)+":"+to_string(dr)+":"+to_string(h);if(unique.insert(key).second){vector<array<int,3>>phase;for(int k:a)phase.push_back({k/W-mq,k%W-mr,st[k]});sort(phase.begin(),phase.end());out<<"{\"campaign\":\""<<mode<<"\",\"seedId\":\""<<seed.id<<"\",\"trial\":"<<total.trials-1<<",\"rule\":\""<<rulename(B,S)<<"\",\"generations\":"<<C<<",\"transient\":"<<ss.gen<<",\"period\":"<<p<<",\"translation\":["<<dq<<","<<dr<<"],\"active\":"<<a.size()<<",\"coordinateStates\":";cells(out,phase);out<<",\"initial\":";cells(out,seed.cells);out<<"}\n";out.flush();total.records++;}}done=true;break;}if(done)break;bucket.push_back({gen,mq,mr,move(sig)});}
   if(gen==maxSteps){total.horizon++;if(a.size()<250&&(xq-mq>20||xr-mr>20)){longout<<"{\"seedId\":\""<<seed.id<<"\",\"rule\":\""<<rulename(B,S)<<"\",\"generations\":"<<C<<",\"steps\":"<<gen<<",\"active\":"<<a.size()<<",\"bounds\":["<<mq-256<<","<<mr-256<<","<<xq-256<<","<<xr-256<<"],\"initial\":";cells(longout,seed.cells);longout<<"}\n";}break;}
   cand.clear();for(int k:a){if(!marked[k]){marked[k]=1;cand.push_back(k);}if(st[k]==1)for(int d:D){int j=k+d;ct[j]++;if(!marked[j]){marked[j]=1;cand.push_back(j);}}}next.clear();for(int k:cand){int old=st[k],v=old==0?((B>>ct[k])&1):old==1?((S>>ct[k])&1?1:(C>2?2:0)):(old+1<C?old+1:0);st[k]=v;ct[k]=0;marked[k]=0;if(v)next.push_back(k);}a.swap(next);total.steps++;
  }
  for(int k:a)st[k]=0;if(total.trials%10000==0){cerr<<"trials="<<total.trials<<" steps="<<total.steps<<" movers="<<total.moving<<" records="<<total.records<<" seconds="<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"\n";}
 };
 if(mode=="exhaustive"){for(int C=2;C<=maxC;C++)for(int B=0;B<128;B+=2)for(int S=0;S<128;S++)for(auto&s:seeds)trial(s,B,S,C);}else if(mode=="coloured"){for(int B=0;B<128;B+=2)for(int S=0;S<128;S++)for(auto&s:seeds)trial(s,B,S,s.C);}else for(auto&s:seeds)trial(s,s.B,s.S,s.C);
 meta<<"{\"mode\":\""<<mode<<"\",\"seedFile\":\""<<inpath<<"\",\"maxSteps\":"<<maxSteps<<",\"maxPopulation\":"<<maxPopulation<<",\"recurrencePopulationCap\":350,\"gridWidth\":512,\"seedCount\":"<<seeds.size()<<",\"maximumC\":"<<maxC<<",\"deduplication\":\"Complete-state normalised phase, period, translation and C; rule ignored to collapse inactive-clause variants. Full D6/orbit deduplication follows independently.\",\"counts\":";stats(meta,total);meta<<",\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"}\n";stats(cerr,total);cerr<<"\n";
}
