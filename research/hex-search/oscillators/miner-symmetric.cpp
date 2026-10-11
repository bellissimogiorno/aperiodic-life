#include <array>
#include <vector>
#include <map>
#include <unordered_map>
#include <set>
#include <algorithm>
#include <iostream>
#include <fstream>
#include <string>
#include <numeric>
#include <chrono>
using namespace std;
const int W=128, C=W*W; const int ds[6]={1,-1,W,-W,W-1,1-W};
uint64_t mix(uint64_t x){x+=0x9e3779b97f4a7c15ULL;x=(x^(x>>30))*0xbf58476d1ce4e5b9ULL;x=(x^(x>>27))*0x94d049bb133111ebULL;return x^(x>>31);}
struct Sim {array<unsigned char,C> st{},count{}; vector<int> v; int B,S; bool escaped=false;
 Sim(int b,int s):B(b),S(s){}
 void setv(const vector<int>& a){for(int i:v)st[i]=0;v=a;for(int i:v)st[i]=1;escaped=false;}
 void step(){vector<int> touched,nv; touched.reserve(v.size()*7); for(int i:v){if(count[i]==0){touched.push_back(i);count[i]=128;}for(int d:ds){int j=i+d;if(count[j]==0){touched.push_back(j);count[j]=128;}count[j]++;}}for(int i:touched){int n=count[i]&127;if(((st[i]?S:B)>>n)&1)nv.push_back(i);count[i]=0;}for(int i:v)st[i]=0;v.swap(nv);sort(v.begin(),v.end());for(int i:v){st[i]=1;int x=i%W,y=i/W;if(x<2||y<2||x>W-3||y>W-3)escaped=true;}}
 uint64_t hash(){uint64_t h=0;for(int i:v)h^=mix(i+1);return h;}
};
string canon(const vector<vector<int>>& phases){string best;bool first=true;for(auto &v:phases)for(int reflect=0;reflect<2;reflect++)for(int rot=0;rot<6;rot++){vector<pair<int,int>> a;int mx=999,my=999;for(int i:v){int x=i%W,y=i/W;if(reflect)swap(x,y);for(int k=0;k<rot;k++){int t=-y;y=x+y;x=t;}a.push_back({x,y});mx=min(mx,x);my=min(my,y);}sort(a.begin(),a.end());string out;for(auto [x,y]:a)out+=to_string(x-mx)+","+to_string(y-my)+";";if(first||out<best){best=out;first=false;}}return best;}
int main(int argc,char**argv){int B=stoi(argv[1]),S=stoi(argv[2]),N=stoi(argv[3]),limit=stoi(argv[4]),start=stoi(argv[5]);string name=argv[6]; string mode=argc>7?argv[7]:"soup"; ofstream out(name+".jsonl");long cycles=0,unresolved=0,escaped=0,exploded=0,components=0;map<int,int> periods;set<string> signatures;auto began=chrono::steady_clock::now();
for(int ii=0;ii<N;ii++){int seed=start+ii; uint64_t rng=mix(seed+0x123abcULL);int radius=(mode=="large"?10:4)+(seed%6);int density=18+7*((seed/6)%9);vector<int> v;for(int q=-radius;q<=radius;q++)for(int r=-radius;r<=radius;r++)if(abs(q+r)<=radius){rng=mix(rng);if(int(rng%100)<density)v.push_back((r+W/2)*W+q+W/2);}if(mode=="sym3"||mode=="sym6"){set<int> vv;for(int i:v){int x=i%W-W/2,y=i/W-W/2;for(int k=0;k<6;k++){if(mode=="sym6"||k%2==0)vv.insert((y+W/2)*W+x+W/2);int t=-y;y=x+y;x=t;}}v.assign(vv.begin(),vv.end());}sort(v.begin(),v.end());Sim sim(B,S);sim.setv(v);unordered_map<uint64_t,vector<int>> seen;vector<vector<int>> hist;int cycle=-1,gen=0;bool stopped=false;
for(gen=0;gen<=limit;gen++){auto h=sim.hash();if(seen.count(h))for(int at:seen[h])if(hist[at]==sim.v){cycle=at;break;}if(cycle>=0)break;if(sim.escaped){escaped++;stopped=true;break;}if(sim.v.size()>2500){exploded++;stopped=true;break;}seen[h].push_back(gen);hist.push_back(sim.v);sim.step();}
if(cycle<0){if(!stopped)unresolved++;continue;}cycles++;int p=gen-cycle;periods[p]++;if(p<4)continue;
array<unsigned char,C> support{},visited{};for(int t=cycle;t<gen;t++)for(int i:hist[t])support[i]=1;
for(int root=0;root<C;root++)if(support[root]&&!visited[root]){vector<int> comp{root};visited[root]=1;for(size_t j=0;j<comp.size();j++)for(int d:ds){int i=comp[j]+d;if(support[i]&&!visited[i]){visited[i]=1;comp.push_back(i);}}components++;array<unsigned char,C> mask{};for(int i:comp)mask[i]=1;vector<int> initial;for(int i:hist[cycle])if(mask[i])initial.push_back(i);if(initial.empty())continue;Sim iso(B,S);iso.setv(initial);vector<vector<int>> states;int ip=0;bool valid=true;for(int t=0;t<p;t++){states.push_back(iso.v);for(int i:iso.v)if(!mask[i])valid=false;if(!valid)break;iso.step();if(iso.v==initial){ip=t+1;break;}}if(ip<4||!valid)continue;
// Reject mere LCMs of small-period cells: demand a cell with period >= 4.
int maxCellP=1;for(int i:comp){for(int d=1;d<=ip;d++)if(ip%d==0){bool ok=true;for(int t=0;t<ip;t++)if(binary_search(states[t].begin(),states[t].end(),i)!=binary_search(states[(t+d)%ip].begin(),states[(t+d)%ip].end(),i)){ok=false;break;}if(ok){maxCellP=max(maxCellP,d);break;}}}if(maxCellP<4)continue;
string key=to_string(ip)+"|"+canon(states);if(!signatures.insert(key).second)continue;int best=0;for(int t=1;t<ip;t++)if(states[t].size()<states[best].size())best=t;auto a=states[best];int cx=0,cy=0;for(int i:a){cx+=i%W;cy+=i/W;}cx/=a.size();cy/=a.size();int lo=C,hi=0;for(auto &s:states){lo=min(lo,(int)s.size());hi=max(hi,(int)s.size());}
out<<"{\"B\":"<<B<<",\"S\":"<<S<<",\"seed\":"<<seed<<",\"radius\":"<<radius<<",\"densityPercent\":"<<density<<",\"soupTransient\":"<<cycle<<",\"soupPeriod\":"<<p<<",\"period\":"<<ip<<",\"maxCellPeriod\":"<<maxCellP<<",\"support\":"<<comp.size()<<",\"minPopulation\":"<<lo<<",\"maxPopulation\":"<<hi<<",\"phaseOffset\":"<<best<<",\"coordinateStates\":[";for(size_t k=0;k<a.size();k++){if(k)out<<",";out<<"["<<a[k]%W-cx<<","<<a[k]/W-cy<<",1]";}out<<"]}\n";out.flush();cerr<<"FOUND seed="<<seed<<" p="<<ip<<" support="<<comp.size()<<" pop="<<a.size()<<" maxcell="<<maxCellP<<"\n";
}
if((ii+1)%1000==0)cerr<<"PROGRESS "<<ii+1<<" cycles "<<cycles<<" unique "<<signatures.size()<<" sec "<<chrono::duration<double>(chrono::steady_clock::now()-began).count()<<"\n";
}
ofstream summary(name+"-summary.json");summary<<"{\"B\":"<<B<<",\"S\":"<<S<<",\"seedStart\":"<<start<<",\"seeds\":"<<N<<",\"generationLimit\":"<<limit<<",\"cycles\":"<<cycles<<",\"unresolved\":"<<unresolved<<",\"escaped\":"<<escaped<<",\"populationCutoff\":"<<exploded<<",\"components\":"<<components<<",\"unique\":"<<signatures.size()<<",\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-began).count()<<",\"periods\":{";bool f=true;for(auto [p,n]:periods){if(!f)summary<<",";f=false;summary<<"\""<<p<<"\":"<<n;}summary<<"}}\n";cerr<<"COMPLETE cycles="<<cycles<<" unique="<<signatures.size()<<"\n";}
