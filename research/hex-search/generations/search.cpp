#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>
using namespace std;
const int W=256,N=W*W;
uint64_t rngState=0x68657867656e2026ULL;
uint64_t rnd(){rngState^=rngState>>12;rngState^=rngState<<25;rngState^=rngState>>27;return rngState*2685821657736338717ULL;}
int rr(int n){return rnd()%n;}
const int dirs[]={W,W-1,-1,-W,-W+1,1};
uint8_t st[N],ct[N],mark[N];
struct Snap {int gen,q,r;vector<int> sig;};
uint64_t hashvec(const vector<int>&v){uint64_t h=1469598103934665603ULL;for(int x:v){h^=x;h*=1099511628211ULL;}return h;}
void coords(ostream&o,const vector<int>&a){o<<"[";for(int k=0;k<a.size();k++){int s=a[k]%32,qr=a[k]/32;if(k)o<<",";o<<"["<<qr/W<<","<<qr%W<<","<<s<<"]";}o<<"]";}
string rule(int b,int s){string out="B";for(int i=0;i<7;i++)if(b>>i&1)out+=char('0'+i);out+="/S";for(int i=0;i<7;i++)if(s>>i&1)out+=char('0'+i);return out;}
int main(int argc,char**argv){int trials=argc>1?stoi(argv[1]):200000;string prefix=argc>2?argv[2]:"run";if(argc>3)rngState=stoull(argv[3]);uint64_t seed=rngState;ofstream out(prefix+"-candidates.jsonl");vector<int>a,next,cand,seedCells;unordered_set<string> unique;long long totalSteps=0;int records=0,extinct=0,escaped=0,limited=0,periodic=0;auto start=chrono::steady_clock::now();for(int trial=0;trial<trials;trial++){
 int C=3+rr(6);if(rr(10)==0)C=9+rr(8);int B=4|(rr(32)<<2),S=rr(128);if(rr(3)==0)S&=~1;if(rr(10)==0)B=8|(rr(16)<<3);int radius=2+rr(4),density=15+rr(61);a.clear();seedCells.clear();for(int q=-radius;q<=radius;q++)for(int r=-radius;r<=radius;r++)if(abs(q+r)<=radius&&rr(100)<density){int k=(128+q)*W+128+r;int v=1;if(trial%5==0)v=1+rr(C-1);st[k]=v;a.push_back(k);seedCells.push_back((q+radius)*W*32+(r+radius)*32+v);}
 unordered_map<uint64_t,vector<Snap>> seen;bool done=false;for(int gen=0;gen<=700&&!done;gen++){totalSteps++;if(a.empty()){extinct++;break;}int mq=W,mr=W,xq=0,xr=0;for(int k:a){mq=min(mq,k/W);mr=min(mr,k%W);xq=max(xq,k/W);xr=max(xr,k%W);}if(mq<3||mr<3||xq>W-4||xr>W-4){escaped++;break;}if(a.size()>1400){limited++;break;}
 if(a.size()<=350){vector<int>sig;sig.reserve(a.size());for(int k:a)sig.push_back(((k/W-mq)*W+k%W-mr)*32+st[k]);sort(sig.begin(),sig.end());uint64_t h=hashvec(sig);auto&bucket=seen[h];for(auto &ss:bucket)if(sig==ss.sig){int p=gen-ss.gen,dq=mq-ss.q,dr=mr-ss.r;periodic++;bool moving=dq||dr;if((moving&&p>=1)||(!moving&&p>=7)){string key=to_string(C)+":"+to_string(p)+":"+to_string(dq)+":"+to_string(dr)+":"+to_string(h);if(unique.insert(key).second){out<<"{\"trial\":"<<trial<<",\"rule\":\""<<rule(B,S)<<"\",\"C\":"<<C<<",\"transient\":"<<ss.gen<<",\"period\":"<<p<<",\"translation\":["<<dq<<","<<dr<<"],\"population\":"<<a.size()<<",\"phase\":";coords(out,sig);out<<",\"seed\":";coords(out,seedCells);out<<"}\n";records++;}}done=true;break;}if(done)break;bucket.push_back({gen,mq,mr,move(sig)});}
 cand.clear();for(int k:a){if(!mark[k]){mark[k]=1;cand.push_back(k);}if(st[k]==1)for(int d:dirs){int j=k+d;ct[j]++;if(!mark[j]){mark[j]=1;cand.push_back(j);}}}next.clear();for(int k:cand){int old=st[k],v=old==0?((B>>ct[k])&1):old==1?((S>>ct[k])&1?1:2):(old+1<C?old+1:0);st[k]=v;ct[k]=0;mark[k]=0;if(v)next.push_back(k);}a.swap(next);
 }
 for(int k:a)st[k]=0;
 if((trial+1)%5000==0){out.flush();cerr<<"trials="<<trial+1<<" steps="<<totalSteps<<" records="<<records<<" seconds="<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"\n";}
 }
 ofstream meta(prefix+"-campaign.json");meta<<"{\"seedDecimal\":\""<<seed<<"\",\"prng\":\"xorshift64star\",\"trials\":"<<trials<<",\"steps\":"<<totalSteps<<",\"records\":"<<records<<",\"extinct\":"<<extinct<<",\"boundaryStopped\":"<<escaped<<",\"populationStopped\":"<<limited<<",\"periodic\":"<<periodic<<",\"maxStepsPerTrial\":700,\"maxPopulation\":1400,\"maximumRecurrencePopulation\":350,\"seconds\":"<<chrono::duration<double>(chrono::steady_clock::now()-start).count()<<"}\n";
}
