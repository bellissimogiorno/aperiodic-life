#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;
struct Tile{double x,y;int boundary,shape;vector<int>touch,edge;};
vector<Tile> tiles;vector<unsigned char> statev,mark;vector<array<unsigned char,4>> counts;vector<int> active,candidates,future;
uint64_t mix(uint64_t x){x+=0x9e3779b97f4a7c15ULL;x=(x^(x>>30))*0xbf58476d1ce4e5b9ULL;x=(x^(x>>27))*0x94d049bb133111ebULL;return x^(x>>31);}
void initialise(int a,int sa,int b,int sb){for(int i:active)statev[i]=0;statev[a]=sa;statev[b]=sb;active={a,b};}
int transition(char rule,int s,const array<unsigned char,4>&n){
if(rule=='A')return s==0&&n[2]>=2?0:n[1]>=3?3:s==2&&n[1]>=1&&n[0]>=1?1:s==1&&n[2]>=1?3:s==0&&n[1]>=1?2:0;
if(rule=='B')return s==0&&n[1]>=2&&n[0]>=1?0:s==0&&n[0]>=2&&n[2]>=2?1:s==0&&n[0]>=2&&n[3]>=1?1:s==1&&n[3]>=1?3:0;
if(rule=='C')return n[2]>=1&&n[1]>=3?3:s==1&&n[2]>=1?2:s==3&&n[3]>=3?3:s==0&&n[3]>=2?1:n[2]>=1?1:0;
if(rule=='S')return s==0&&n[0]>=3&&n[1]>=1?3:s==3&&n[3]>=3?0:s==3&&n[1]>=1?1:0;
// D is the compressed three-state rule with empty-neighbour clauses removed.
return s==0&&n[1]<2&&n[2]>=1?1:s==1&&n[2]>=1?2:0;
}
void step(char rule){candidates.clear();for(int i:active){if(!mark[i]){mark[i]=1;candidates.push_back(i);}for(int j:tiles[i].touch){counts[j][statev[i]]++;if(!mark[j]){mark[j]=1;candidates.push_back(j);}}}future.clear();vector<pair<int,int>>updates;for(int i:candidates){auto&n=counts[i];n[0]=tiles[i].touch.size()-n[1]-n[2]-n[3];int v=transition(rule,statev[i],n);if(v){future.push_back(i);updates.push_back({i,v});}n={0,0,0,0};mark[i]=0;}for(int i:active)statev[i]=0;for(auto [i,s]:updates)statev[i]=s;active.swap(future);}
struct Result{int a,b,sa,sb,steps,peak=0,boundary=99999,period=0;double radius=0,distance=0;string outcome="horizon";};
Result run(char rule,int a,int b,int sa,int sb,int horizon){initialise(a,sa,b,sb);Result r;r.a=a;r.b=b;r.sa=sa;r.sb=sb;double x0=(tiles[a].x+tiles[b].x)/2,y0=(tiles[a].y+tiles[b].y)/2;unordered_map<uint64_t,int> seen;for(int t=0;t<=horizon;t++){r.steps=t;if(active.empty()){r.outcome="extinct";break;}r.peak=max(r.peak,(int)active.size());double x=0,y=0;uint64_t hash=0;for(int i:active){x+=tiles[i].x;y+=tiles[i].y;r.boundary=min(r.boundary,tiles[i].boundary);hash^=mix(((uint64_t)i<<8)|statev[i]);}x/=active.size();y/=active.size();r.distance=hypot(x-x0,y-y0);double radius=0;for(int i:active)radius=max(radius,hypot(tiles[i].x-x,tiles[i].y-y));r.radius=max(r.radius,radius);if(r.boundary<5){r.outcome="boundary";break;}if(r.peak>128){r.outcome="population";break;}if(seen.count(hash)){r.outcome="cycle";r.period=t-seen[hash];break;}seen[hash]=t;if(t==horizon)break;step(rule);}return r;}
void emit(const Result&r,char rule,string kind){cout<<"{\"kind\":\""<<kind<<"\",\"preset\":\""<<rule<<"\",\"cellStates\":[["<<r.a<<","<<r.sa<<"],["<<r.b<<","<<r.sb<<"]],\"steps\":"<<r.steps<<",\"outcome\":\""<<r.outcome<<"\",\"maxPopulation\":"<<r.peak<<",\"maxRadius\":"<<r.radius<<",\"displacement\":"<<r.distance<<",\"minimumBoundary\":"<<r.boundary<<",\"period\":"<<r.period<<"}"<<endl;}
pair<long long,bool> compareSimplification(int a,int b,int sa,int sb,int horizon){
initialise(a,sa,b,sb);vector<vector<pair<int,int>>>trace;
for(int t=0;t<=horizon;t++){vector<pair<int,int>>phase;int bd=99999;for(int i:active){phase.push_back({i,statev[i]==3?2:statev[i]});bd=min(bd,tiles[i].boundary);}sort(phase.begin(),phase.end());trace.push_back(phase);if(active.empty()||bd<5||active.size()>128||t==horizon)break;step('B');}
initialise(a,sa==3?2:sa,b,sb==3?2:sb);long long compared=0;for(const auto&expected:trace){vector<pair<int,int>>phase;for(int i:active)phase.push_back({i,statev[i]});sort(phase.begin(),phase.end());compared++;if(phase!=expected)return {compared,false};step('D');}return {compared,true};}
int main(int argc,char**argv){if(argc<6){cerr<<"touch.dat edge.dat rule minimumBoundary horizon [maximumTrials]\n";return 1;}ifstream tf(argv[1]),ef(argv[2]);int N,M;tf>>N;ef>>M;if(N!=M)return 2;tiles.resize(N);for(int i=0;i<N;i++){int n;auto&t=tiles[i];tf>>t.x>>t.y>>t.boundary>>t.shape>>n;t.touch.resize(n);for(int&j:t.touch)tf>>j;double x,y;int bd,shape;ef>>x>>y>>bd>>shape>>n;t.edge.resize(n);for(int&j:t.edge)ef>>j;}statev.resize(N);mark.resize(N);counts.resize(N);char rule=argv[3][0];int minimum=stoi(argv[4]),horizon=stoi(argv[5]),maximum=argc>6?stoi(argv[6]):100000000;int sa=rule=='A'||rule=='S'?1:rule=='C'||rule=='D'?2:3,sb=rule=='A'?2:rule=='S'?3:1;unordered_map<string,int>outcomes;long long totalSteps=0;int trials=0,compactBoundary=0,cycle=0;double best=0;
for(int a=0;a<N&&trials<maximum;a++){if(tiles[a].boundary<minimum)continue;for(int b:tiles[a].edge){if(b<=a||tiles[b].boundary<minimum)continue;for(int order=0;order<2&&trials<maximum;order++){if(rule=='E'){auto [steps,matched]=compareSimplification(a,b,order?1:3,order?3:1,horizon);trials++;totalSteps+=steps;outcomes[matched?"identical":"different"]++;if(trials%10000==0)cerr<<"compare "<<trials<<" states "<<totalSteps<<endl;continue;}auto r=run(rule,a,b,order?sb:sa,order?sa:sb,horizon);trials++;totalSteps+=r.steps;outcomes[r.outcome]++;if(r.outcome=="boundary"&&r.radius<12){compactBoundary++;if(r.distance>best){best=r.distance;emit(r,rule,"record");}}if(r.outcome=="cycle"&&r.period>20&&r.peak<40){cycle++;if(cycle<=20)emit(r,rule,"cycle");}if(trials%10000==0)cerr<<rule<<" trials "<<trials<<" steps "<<totalSteps<<" compact "<<compactBoundary<<endl;}}}
cout<<"{\"kind\":\"summary\",\"preset\":\""<<rule<<"\",\"trials\":"<<trials<<",\""<<(rule=='E'?"completeStateComparisons":"totalEvolutionSteps")<<"\":"<<totalSteps<<",\"minimumSeedBoundary\":"<<minimum<<",\"horizon\":"<<horizon<<",\"compactBoundaryArrivals\":"<<compactBoundary<<",\"outcomes\":{";bool first=true;for(auto [s,n]:outcomes){if(!first)cout<<",";first=false;cout<<"\""<<s<<"\":"<<n;}cout<<"}}"<<endl;
}
