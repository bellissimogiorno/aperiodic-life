#include <algorithm>
#include <array>
#include <chrono>
#include <cstdint>
#include <fstream>
#include <iostream>
#include <map>
#include <random>
#include <set>
#include <sstream>
#include <string>
#include <unordered_map>
#include <vector>
using namespace std;
constexpr int W=256, Z=128*W+128; int D[6]={W,1,1-W,-W,-1,W-1};
using Cells=vector<int>;
uint8_t live[W*W]={},cnt[W*W]={};
string norm(const Cells& a,int& ax,int& ay){
 ax=256;ay=256; for(int z:a){ax=min(ax,z/W);ay=min(ay,z%W);} vector<int> t; t.reserve(a.size()); for(int z:a)t.push_back((z/W-ax)*W+z%W-ay); sort(t.begin(),t.end()); string s;s.reserve(t.size()*2);for(int z:t){s.push_back(z/W);s.push_back(z%W);}return s;
}
string canon(const Cells&a){string best;for(int flip=0;flip<2;flip++)for(int rot=0;rot<6;rot++){Cells t;for(int z:a){int x=z/W-128,y=z%W-128;if(flip)swap(x,y);for(int k=0;k<rot;k++){int nx=-y; y=x+y;x=nx;}t.push_back((x+128)*W+y+128);}int x,y;string s=norm(t,x,y);if(best.empty()||s<best)best=s;}return best;}
struct Seen{int step,x,y;};
struct Rule {int b,s;string name;};
Rule rule(string s){int b=0,u=0;bool surv=false;for(char c:s){if(c=='S')surv=true;else if(c>='0'&&c<='6'){if(surv)u|=1<<(c-'0');else b|=1<<(c-'0');}}return {b,u,s};}
int main(int argc,char**argv){string out=argc>1?argv[1]:"results.jsonl";int trials=argc>2?stoi(argv[2]):10000;uint64_t seed=argc>3?stoull(argv[3]):20261011;int maxSteps=argc>4?stoi(argv[4]):500;string ruleArg=argc>5?argv[5]:"B2/S34,B2/S35,B245/S3,B3/S23,B2/S,B2/S2,B2/S23,B2/S24,B2/S3,B2/S4,B2/S5,B24/S2,B24/S35,B3/S2,B3/S3,B34/S2,B23/S2,B23/S3,B23/S23,B24/S3,B245/S35,B234/S3,B3/S234,B3/S24,B2/S234"; vector<Rule>rules;stringstream rs(ruleArg);string chunk;while(getline(rs,chunk,','))rules.push_back(rule(chunk));mt19937_64 rng(seed);ofstream f(out);map<string,int> counts;uint64_t totalSteps=0;auto started=chrono::steady_clock::now();
for(auto r:rules){set<string>unique; map<int,int> nperiod;int moving=0,found=0,extinct=0,exploded=0,horizon=0;int high=0;
for(int tr=0;tr<trials;tr++){
 set<int> init;int mode=tr%5;int size=3+rng()%25;init.insert(Z);
 if(mode==0||mode==4){for(int k=0;k<size*4 && (int)init.size()<size;k++){auto it=init.begin();advance(it,rng()%init.size());int z=*it+D[rng()%6];if(abs(z/W-128)<12&&abs(z%W-128)<12)init.insert(z);}}
 else {int rad=mode==3?4:3;for(int x=-rad;x<=rad;x++)for(int y=-rad;y<=rad;y++)if(abs(x+y)<=rad&&rng()%100<(mode==1?35:mode==2?55:20))init.insert(Z+x*W+y);if(mode==3){vector<int> cp(init.begin(),init.end());for(int z:cp){int x=z/W-128,y=z%W-128;init.insert(Z+y*W+x);}}}
 Cells initial(init.begin(),init.end()),a=initial,touched;for(int z:a)live[z]=1;unordered_map<string,Seen> seen;vector<Cells>hist;bool done=false;
 for(int t=0;t<=maxSteps;t++){
  if(a.empty()){extinct++;done=true;break;} if(a.size()>600){exploded++;done=true;break;}
  bool edge=false;for(int z:a)if(z/W<5||z/W>250||z%W<5||z%W>250){edge=true;break;}if(edge){exploded++;done=true;break;}
  int ax,ay;string key=norm(a,ax,ay);auto it=seen.find(key);
  if(it!=seen.end()){
   int p=t-it->second.step,dx=ax-it->second.x,dy=ay-it->second.y;
   if((dx||dy||p>=4)&&a.size()<=180){string ca;int bestp=0;for(int q=it->second.step;q<t;q++){string c=canon(hist[q]);if(ca.empty()||c<ca){ca=c;bestp=q;}}string uid=to_string(p)+":"+ca;
    if(unique.insert(uid).second){nperiod[p]++;high=max(high,p);bool save=dx||dy||nperiod[p]<=12||p>=10;if(save){found++;if(dx||dy)moving++;f<<"{\"rule\":\""<<r.name<<"\",\"seed\":"<<seed<<",\"trial\":"<<tr<<",\"mode\":"<<mode<<",\"transient\":"<<it->second.step<<",\"period\":"<<p<<",\"translation\":["<<dx<<","<<dy<<"],\"phasePopulations\":[";for(int q=bestp;q<bestp+p;q++){if(q>bestp)f<<",";f<<hist[it->second.step+(q-it->second.step)%p].size();}f<<","<<hist[bestp].size()<<"],\"coordinates\":[";bool first=true;for(int z:hist[bestp]){if(!first)f<<",";first=false;f<<"["<<z/W-128<<","<<z%W-128<<",1]";}f<<"],\"initial\":[";first=true;for(int z:initial){if(!first)f<<",";first=false;f<<"["<<z/W-128<<","<<z%W-128<<",1]";}f<<"]}"<<endl;}
    }
   } done=true;break;
  }
  if(t==maxSteps){horizon++;break;}seen.emplace(move(key),Seen{t,ax,ay});hist.push_back(a);
  touched.clear();for(int z:a){if(!cnt[z]){cnt[z]=8;touched.push_back(z);}for(int d:D){int q=z+d;if(!cnt[q]){cnt[q]=8;touched.push_back(q);}cnt[q]++;}}
  Cells b;b.reserve(touched.size()/2);for(int z:touched){int n=cnt[z]-8;if(((live[z]?r.s:r.b)>>n)&1)b.push_back(z);cnt[z]=0;}for(int z:a)live[z]=0;for(int z:b)live[z]=1;a.swap(b);totalSteps++;
 }
 for(int z:a)live[z]=0;
 if((tr+1)%10000==0)cerr<<r.name<<" "<<tr+1<<" found="<<found<<" move="<<moving<<" high="<<high<<" steps="<<totalSteps<<endl;
}
cerr<<"DONE "<<r.name<<" trials="<<trials<<" found="<<found<<" moving="<<moving<<" high="<<high<<" extinct="<<extinct<<" exploded="<<exploded<<" horizon="<<horizon<<" elapsed="<<chrono::duration<double>(chrono::steady_clock::now()-started).count()<<endl;
}
}
