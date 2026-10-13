#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <random>
#include <set>
#include <string>
#include <vector>
using namespace std;
struct Tile { double x,y; int boundary; vector<int> touch,edge; };
vector<Tile> tiles;vector<unsigned char> statev,mark;vector<array<unsigned char,4>> counts;
vector<int> active,candidates,future;using Phase=vector<pair<int,int>>;
int nextValue(char rule,int s,const array<unsigned char,4>&n){
 if(rule=='A')return s==0&&n[2]>=2?0:n[1]>=3?3:s==2&&n[1]>=1&&n[0]>=1?1:s==1&&n[2]>=1?3:s==0&&n[1]>=1?2:0;
 if(rule=='B')return s==0&&n[1]>=2&&n[0]>=1?0:s==0&&n[0]>=2&&n[2]>=2?1:s==0&&n[0]>=2&&n[3]>=1?1:s==1&&n[3]>=1?3:0;
 if(rule=='C')return n[2]>=1&&n[1]>=3?3:s==1&&n[2]>=1?2:s==3&&n[3]>=3?3:s==0&&n[3]>=2?1:n[2]>=1?1:0;
 return s==0&&n[1]<2&&n[2]>=1?1:s==1&&n[2]>=1?2:0;
}
void init(const Phase&p){for(int i:active)statev[i]=0;active.clear();for(auto [i,s]:p){active.push_back(i);statev[i]=s;}}
Phase snapshot(){Phase p;for(int i:active)p.push_back({i,statev[i]});sort(p.begin(),p.end());return p;}
void step(char rule){candidates.clear();for(int i:active){if(!mark[i]){mark[i]=1;candidates.push_back(i);}for(int j:tiles[i].touch){counts[j][statev[i]]++;if(!mark[j]){mark[j]=1;candidates.push_back(j);}}}Phase updates;for(int i:candidates){auto&n=counts[i];n[0]=tiles[i].touch.size()-n[1]-n[2]-n[3];int value=nextValue(rule,statev[i],n);if(value)updates.push_back({i,value});n={0,0,0,0};mark[i]=0;}init(updates);}
struct Cluster{Phase cells;double x=0,y=0,radius=0;};
vector<Cluster> cluster(const Phase&p){vector<bool>seen(p.size(),false);vector<Cluster>out;for(int i=0;i<(int)p.size();i++){if(seen[i])continue;Cluster c;vector<int>todo={i};seen[i]=true;for(int k=0;k<(int)todo.size();k++){int a=p[todo[k]].first;for(int j=0;j<(int)p.size();j++){int b=p[j].first;if(!seen[j]&&hypot(tiles[a].x-tiles[b].x,tiles[a].y-tiles[b].y)<11){seen[j]=true;todo.push_back(j);}}}for(int j:todo){int a=p[j].first;c.cells.push_back(p[j]);c.x+=tiles[a].x;c.y+=tiles[a].y;}c.x/=todo.size();c.y/=todo.size();for(auto [a,s]:c.cells)c.radius=max(c.radius,hypot(tiles[a].x-c.x,tiles[a].y-c.y));sort(c.cells.begin(),c.cells.end());out.push_back(c);}return out;}
void printPhase(const Phase&p){cout<<"[";for(int k=0;k<(int)p.size();k++){if(k)cout<<",";cout<<"["<<p[k].first<<","<<p[k].second<<"]";}cout<<"]";}
bool connected(const Phase&p){if(p.empty())return false;set<int>remaining;for(auto [i,s]:p)remaining.insert(i);vector<int>q={*remaining.begin()};remaining.erase(q[0]);for(int k=0;k<(int)q.size();k++)for(int j:tiles[q[k]].touch)if(remaining.erase(j))q.push_back(j);return remaining.empty();}
int main(int argc,char**argv){if(argc<4){cerr<<"touch.dat edge.dat trialsPerRule [rules] [rngSeed] [sourceMode]\n";return 1;}ifstream tf(argv[1]),ef(argv[2]);int N,M;tf>>N;ef>>M;if(N!=M)return 2;tiles.resize(N);for(int i=0;i<N;i++){auto&t=tiles[i];int degree,shape,bd;double x,y;tf>>t.x>>t.y>>t.boundary>>shape>>degree;t.touch.resize(degree);for(int&j:t.touch)tf>>j;ef>>x>>y>>bd>>shape>>degree;t.edge.resize(degree);for(int&j:t.edge)ef>>j;}statev.resize(N);mark.resize(N);counts.resize(N);int trials=stoi(argv[3]);string rules=argc>4?argv[4]:"CABD";unsigned rngSeed=argc>5?stoul(argv[5]):3721301;bool sourceMode=argc>6&&stoi(argv[6]);mt19937 rng(rngSeed);vector<int>starts;for(int i=0;i<N;i++)if(tiles[i].boundary>=75)starts.push_back(i);sort(starts.begin(),starts.end(),[](int a,int b){return tiles[a].boundary>tiles[b].boundary;});if(starts.size()>3000)starts.resize(3000);if(starts.empty())return 3;long long totalSteps=0;
for(char rule:rules){map<string,long long>outcomes;map<int,int>multiplicities;vector<Phase>elites;int retained=0,best=0,sourceSignals=0;long long stepsForRule=0;for(int trial=0;trial<trials;trial++){
 Phase seed;int target=3+rng()%4;
 if(!elites.empty() && rng()%100<65){seed=elites[rng()%elites.size()];for(int k=0,n=1+rng()%3;k<n;k++){int j=rng()%seed.size(),cell=seed[j].first;if(rng()%3==0)seed[j].second=1+rng()%(rule=='D'?2:3);else if(seed.size()<6){const auto&nb=tiles[cell].touch;int other=nb[rng()%nb.size()];if(none_of(seed.begin(),seed.end(),[&](auto p){return p.first==other;}))seed.push_back({other,1+(int)(rng()%(rule=='D'?2:3))});}else if(seed.size()>3){Phase smaller=seed;smaller.erase(smaller.begin()+j);if(connected(smaller))seed=smaller;}}}
 else {int start=starts[rng()%starts.size()];seed={{start,1+(int)(rng()%(rule=='D'?2:3))}};while((int)seed.size()<target){int base=seed[rng()%seed.size()].first;const auto&nb=(trial%2?tiles[base].touch:tiles[base].edge);int cell=nb[rng()%nb.size()];if(none_of(seed.begin(),seed.end(),[&](auto p){return p.first==cell;}))seed.push_back({cell,1+(int)(rng()%(rule=='D'?2:3))});}}
 sort(seed.begin(),seed.end());init(seed);vector<Phase>checkpoints,localPhases;int peak=0,boundary=99999;string outcome="horizon";int performed=0;double x0=0,y0=0;for(auto [i,s]:seed){x0+=tiles[i].x;y0+=tiles[i].y;}x0/=seed.size();y0/=seed.size();
 for(int t=0;t<=180;t++){performed=t;if(active.empty()){outcome="extinct";break;}peak=max(peak,(int)active.size());if(peak>160){outcome="population";break;}for(int i:active)boundary=min(boundary,tiles[i].boundary);if(boundary<6){outcome="boundary";break;}if(t==100||t==140||t==180)checkpoints.push_back(snapshot());if(sourceMode&&t>=60){Phase local;for(int i:active)if(hypot(tiles[i].x-x0,tiles[i].y-y0)<20)local.push_back({i,statev[i]});sort(local.begin(),local.end());localPhases.push_back(local);}if(t<180)step(rule);}
 totalSteps+=performed;stepsForRule+=performed;outcomes[outcome]++;if(outcome!="horizon")continue;
 if(sourceMode){int period=0;for(int p=1;p<=40;p++){bool ok=true;for(int t=121-max(3*p,40);t<121;t++)if(localPhases[t].empty()||(t>=p&&localPhases[t]!=localPhases[t-p])){ok=false;break;}if(ok){period=p;break;}}int exterior=0;double distance=0;for(int i:active){double d=hypot(tiles[i].x-x0,tiles[i].y-y0);distance=max(distance,d);if(d>=35)exterior++;}if(period&&exterior>=8&&distance>=60){sourceSignals++;if(elites.size()<100)elites.push_back(seed);if(sourceSignals<=400){retained++;cout<<"{\"kind\":\"periodic-core-signal\",\"preset\":\""<<rule<<"\",\"depth\":5,\"neighborhood\":\"touch\",\"rngSeed\":"<<rngSeed<<",\"trial\":"<<trial<<",\"cellStates\":";printPhase(seed);cout<<",\"horizon\":180,\"localPeriod\":"<<period<<",\"cropRadius\":20,\"maxPopulation\":"<<peak<<",\"minimumBoundary\":"<<boundary<<",\"exteriorActiveAt180\":"<<exterior<<",\"checkpoints\":[";for(int k=0;k<3;k++){if(k)cout<<",";cout<<"{\"generation\":"<<100+40*k<<",\"cells\":";printPhase(checkpoints[k]);cout<<"}";}cout<<"]}"<<endl;cerr<<rule<<" local source trial="<<trial<<" period="<<period<<" exterior="<<exterior<<" seed="<<seed.size()<<endl;}}if((trial+1)%10000==0)cerr<<rule<<" source trial="<<trial+1<<" steps="<<stepsForRule<<" signals="<<sourceSignals<<endl;continue;}
 vector<vector<Cluster>>cs;for(const auto&p:checkpoints)cs.push_back(cluster(p));int number=cs.back().size();bool compact=true;for(const auto&groups:cs)for(const auto&g:groups)if(g.cells.size()<3||g.radius>9)compact=false;
 bool stableCount=cs[0].size()==cs[1].size()&&cs[1].size()==cs[2].size();int moving=0,stationary=0;
 if(compact && stableCount){for(const auto&g:cs[2]){double displacement=1e9;for(const auto&prev:cs[1])displacement=min(displacement,hypot(g.x-prev.x,g.y-prev.y));if(displacement>24)moving++;else if(displacement<5)stationary++;}}
 bool launcher=compact&&stableCount&&moving>=4&&stationary==0;
 bool source=compact&&number>=3&&stationary==1&&moving>=2;
 if(launcher || source){multiplicities[moving]++;if(source)sourceSignals++;if(launcher && elites.size()<100)elites.push_back(seed);bool save=(launcher&&(moving>best||retained<150))||(source&&sourceSignals<=50);if(save){retained++;best=max(best,moving);cout<<"{\"kind\":\""<<(source?"source-signal":"launcher-signal")<<"\",\"preset\":\""<<rule<<"\",\"depth\":5,\"neighborhood\":\"touch\",\"rngSeed\":"<<rngSeed<<",\"trial\":"<<trial<<",\"cellStates\":";printPhase(seed);cout<<",\"horizon\":180,\"movingClusters\":"<<moving<<",\"stationaryClusters\":"<<stationary<<",\"maxPopulation\":"<<peak<<",\"minimumBoundary\":"<<boundary<<",\"checkpoints\":[";for(int k=0;k<3;k++){if(k)cout<<",";cout<<"{\"generation\":"<<100+40*k<<",\"cells\":";printPhase(checkpoints[k]);cout<<"}";}cout<<"]}"<<endl;cerr<<rule<<" retained trial="<<trial<<" moving="<<moving<<" stationary="<<stationary<<" seed="<<seed.size()<<" boundary="<<boundary<<endl;}}
 if((trial+1)%10000==0)cerr<<rule<<" trial="<<trial+1<<" steps="<<stepsForRule<<" retained="<<retained<<endl;
 }
 cout<<"{\"kind\":\"summary\",\"preset\":\""<<rule<<"\",\"rngSeed\":"<<rngSeed<<",\"trials\":"<<trials<<",\"steps\":"<<stepsForRule<<",\"retained\":"<<retained<<",\"sourceSignals\":"<<sourceSignals<<",\"launcherSignalsByMultiplicity\":{";bool first=true;for(auto [n,k]:multiplicities){if(!first)cout<<",";first=false;cout<<"\""<<n<<"\":"<<k;}cout<<"},\"outcomes\":{";first=true;for(auto [s,n]:outcomes){if(!first)cout<<",";first=false;cout<<"\""<<s<<"\":"<<n;}cout<<"}}"<<endl;
}
cout<<"{\"kind\":\"complete\",\"rngSeed\":"<<rngSeed<<",\"rules\":\""<<rules<<"\",\"trialsPerRule\":"<<trials<<",\"sourceMode\":"<<(sourceMode?"true":"false")<<",\"totalSteps\":"<<totalSteps<<",\"eligibleStartCells\":"<<starts.size()<<"}"<<endl;
}
