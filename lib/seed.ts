// @ts-nocheck
/* Seed data: realistic, but all placeholder. Replace through the admin screens or a database import. */
import { mulberry, pad, uid, slug, ageOn } from "./util";
import { DEFAULT_PW_HASH } from "./defaultpw";
import type { DB, Content } from "./types";

const TODAY = new Date();
const TODAY_ISO = TODAY.toISOString().slice(0, 10);
const YEAR = TODAY.getFullYear();
const mk = mulberry;
const RN = mk(20260);
const pick = (a) => a[Math.floor(RN() * a.length)];
const ri = (a, b) => a + Math.floor(RN() * (b - a + 1));
const MALE=['Abin','Jibin','Shibin','Anish','Sanju','Joel','Alex','Binu','Renjith','Tom','Eldho','Jerin','Libin','Nevin','Rony','Sam','Jithin','Basil','Ebin','Midhun','Vishal','Bijil','Finny','Lijo','Justin','Aby','Noble','Jobin'];
const FEMALE=['Anju','Blessy','Neethu','Reshma','Sneha','Divya','Merin','Ancy','Jincy','Rincy','Elsa','Liya','Anna','Ruby','Sharon','Mariya','Teena','Betsy','Ashly','Jesna','Dona','Hanna','Evangelin','Neelu','Tija'];
const SUR=['Mathew','Thomas','George','Varghese','Samuel','Philip','Kurian','Abraham','Joseph','Chacko','John','Daniel','Cherian','Skaria','Alex','Paul','Koshy','Itty','Eapen','Zachariah','Neduvelil','Kunnel','Pulickal','Vattakunnel'];
const ZN=[['Thiruvananthapuram','TVM',['Nedumangad','Attingal','Neyyattinkara']],['Kollam','KLM',['Kottarakkara','Punalur','Karunagappally']],['Pathanamthitta','PTA',['Adoor','Tiruvalla','Ranni']],
 ['Kottayam','KTM',['Kottayam North','Kottayam South','Pampady']],['Idukki','IDK',['Thodupuzha','Kattappana','Munnar']],['Ernakulam','EKM',['Kochi','Muvattupuzha','Perumbavoor']],
 ['Thrissur','TCR',['Thrissur Town','Chalakudy','Irinjalakuda']],['Malabar','MLB',['Kozhikode','Malappuram','Kannur']]];
const CHURCH=['Ebenezer','Bethel','Salem','Hebron','Zion','Carmel','Sharon','Tabore','Bethany','Philadelphia'];
const FUNCS=['President','Vice-President','Secretary','Joint-Secretary','Treasurer','Publicity Convenor','Council Member'];
const DOM='@pypakerala.example';

export function seed(): DB {
 const d={zones:[],centres:[],locals:[],members:[],council:[],users:[],notifs:[],activity:[],dues:[],letters:[],freezes:[],outbox:[],sms:[],transfers:[],runs:{age:null,dup:null},
  state:{id:'ST-KL',name:'Kerala State',contact:'+91 94470 00000',parent:'PYPA India',established:'1970-01-01',addr1:'PYPA Kerala State Office',addr2:'',city:'Kottayam',panchayat:'Kottayam Municipality',taluk:'Kottayam',pincode:'686001',admin:{name:'State Administrator',email:'state'+DOM,mobile:'+91 94470 00001'}},
  master:{idFormat:{prefix:'KL',useZone:true,digits:5,sep:'-'},fee:100,lists:{Country:['India','United Arab Emirates','Saudi Arabia','Kuwait','Qatar','Oman','Bahrain','United Kingdom','United States','Canada','Australia','Germany'],State:['Kerala','Tamil Nadu','Karnataka','Maharashtra','Delhi'],City:['Thiruvananthapuram','Kollam','Pathanamthitta','Kottayam','Idukki','Kochi','Thrissur','Kozhikode'],'Blood Group':['A+','A-','B+','B-','AB+','AB-','O+','O-']}},
  talent:{categories:[],events:[],entries:[],groups:[]}};
 const baseUnit=(id,name,parent,e)=>({id,name,parent,contact:'+91 9'+pad(ri(0,99999999),9).slice(0,9),established:`${ri(1985,2014)}-0${ri(1,9)}-1${ri(0,9)}`,addr1:name+' PYPA Office',addr2:'',city:e,panchayat:e+' Panchayat',taluk:e,pincode:'68'+pad(ri(1000,9999),4),status:'Active'});
 ZN.forEach((z,zi)=>{
  const zone={...baseUnit('Z'+(zi+1),z[0],'PYPA Kerala State',z[0]),code:z[1],admin:null};
  zone.status='Active';d.zones.push(zone);
  z[2].forEach((cn,ci)=>{
   const c={...baseUnit('C'+(zi*3+ci+1),cn,z[0]+' Zone',cn),zoneId:zone.id,admin:null};d.centres.push(c);
   [0,1,2].forEach(k=>{
    const reg=!(zi%3===1&&k===2)&&RN()<.72||(c.id==='C8'&&k!==2);
    const l={...baseUnit('L'+((zi*3+ci)*3+k+1),CHURCH[(ci*3+k+zi)%10]+' '+cn,cn+' Centre',cn),zoneId:zone.id,centreId:c.id,registered:c.id==='C8'?k!==2:reg,admin:null};
    if(l.id==='L'+((zi*3+ci)*3+3)&&zi===3)l.status='Active';
    d.locals.push(l);
   });
  });
 });
 const idFor=(zone,seq)=>{const f=d.master.idFormat;return f.prefix+(f.useZone?f.sep+zone.code:'')+f.sep+pad(seq,f.digits)};
 let seq=1;
 d.locals.forEach(l=>{
  const n=ri(5,11);
  for(let i=0;i<n;i++){
   const male=RN()<.52,age=Math.min(41,Math.max(15,Math.round(15+Math.pow(RN(),1.25)*26.6)));
   const by=YEAR-age,dob=`${by}-${pad(ri(1,12),2)}-${pad(ri(1,28),2)}`;
   const zone=d.zones.find(z=>z.id===l.zoneId),first=pick(male?MALE:FEMALE),last=pick(SUR);
   const from=ri(Math.max(by+14,YEAR-5),YEAR-(RN()<.3?0:1)),paid=[];
   for(let y=from;y<=YEAR;y++)if(RN()<(y===YEAR?.5:.9))paid.push(y);
   const edu=RN();
   const m={id:idFor(zone,seq++),name:`${first} ${last}`,gender:male?'Male':'Female',dob,blood:pick(d.master.lists['Blood Group']),govId:'XXXX-XXXX-'+pad(ri(0,9999),4),family:last+' Family',father:pick(MALE)+' '+last,mother:pick(FEMALE)+' '+last,marital:age>26&&RN()<.55?'Married':'Single',
    perm:`${last} House, ${l.city}, Kerala`,comm:`${last} House, ${l.city}, Kerala`,mobile:'9'+pad(ri(0,999999999),9).slice(0,9),email:(first+'.'+last+ri(1,99999)).toLowerCase()+'@mail.example',photo:null,
    zone:l.zoneId,centre:l.centreId,local:l.id,saved:`${Math.min(YEAR-1,by+ri(10,16))}-0${ri(1,9)}-1${ri(0,9)}`,baptism:`${Math.min(YEAR-1,by+ri(12,18))}-0${ri(1,9)}-2${ri(0,8)}`,from:String(from),
    tenth:'Kerala State Board',twelfth:age>17?'Kerala Higher Secondary':'',diploma:edu<.12?'Polytechnic Diploma':'',ug:age>20&&edu>.25&&edu<.85?pick(['B.Com','B.Sc','BA','B.Tech','BCA','B.Ed']):'',pg:age>23&&edu>.62&&edu<.9?pick(['M.Com','M.Sc','MA','MBA','MCA']):'',pgd:age>24&&edu>.9&&edu<.95?'PG Diploma in Counselling':'',phd:age>28&&edu>.95?'PhD':'',
    employed:age>20&&RN()<.64?'Employed':'Unemployed',occType:'',occOrg:'',residence:RN()<.88?'India':'Other Countries',country:'India',status:'Active',reason:'',paid};
   if(m.employed==='Employed'){m.occType=pick(['Teacher','Nurse','Software Engineer','Accountant','Driver','Entrepreneur','Pastor','Technician']);m.occOrg=pick(['Private firm','Govt. service','Self-employed','School','Hospital','Church ministry'])}
   if(m.residence!=='India')m.country=pick(d.master.lists.Country.slice(1));
   if(age>=41){m.status='Inactive';m.reason='Age Over'}else if(RN()<.03){m.status='Inactive';m.reason=pick(['Left','Relocated'])}
   d.members.push(m);
  }
 });
 /* planted duplicates for the duplicate-check demo */
 [3,150,310].forEach((ix,i)=>{const o=d.members[ix],l=d.locals.find(x=>x.id!==o.local&&x.centreId===o.centre)||d.locals.find(x=>x.id!==o.local);const z=d.zones.find(z=>z.id===l.zoneId);
  d.members.push({...o,id:idFor(z,seq++),zone:l.zoneId,centre:l.centreId,local:l.id,paid:[]})});
 const nameIn=(unitKind,id)=>d.members.filter(m=>m[unitKind]===id&&m.status==='Active');
 const today=TODAY_ISO,far=`${YEAR+1}-12-31`;
 const addCouncil=(unitType,unitId,ms)=>{
  const a=ms.slice(0,2);
  a.forEach((m,i)=>d.council.push({id:uid('co'),unitType,unitId,memberId:m.id,name:m.name,functionary:i?'Secretary':'President',termEnds:far}));
  if(ms[2])d.council.push({id:uid('co'),unitType,unitId,memberId:ms[2].id,name:ms[2].name,functionary:'Treasurer',termEnds:far});
  if(ms[3])d.council.push({id:uid('co'),unitType,unitId,memberId:ms[3].id,name:ms[3].name,functionary:'Past'===''?'':'Vice-President',termEnds:'2023-12-31'});
 };
 d.zones.forEach(z=>{const ms=nameIn('zone',z.id).filter(m=>ageOn(m.dob)>=24).slice(0,4);addCouncil('zone',z.id,ms);z.admin={name:ms[0].name,email:'zone.'+z.code.toLowerCase()+DOM,mobile:'+91 '+ms[0].mobile}});
 d.centres.forEach(c=>{const ms=nameIn('centre',c.id).filter(m=>ageOn(m.dob)>=22).slice(0,4);addCouncil('centre',c.id,ms);c.admin={name:ms[0].name,email:'centre.'+slug(c.name)+DOM,mobile:'+91 '+ms[0].mobile}});
 d.locals.forEach(l=>{const ms=nameIn('local',l.id).slice(0,4);if(ms.length<2)return;addCouncil('local',l.id,ms);l.admin={name:ms[0].name,email:'local.'+slug(l.name)+DOM,mobile:'+91 '+ms[0].mobile}});
 d.locals.forEach(l=>{if(!l.admin)l.admin={name:'—',email:'local.'+slug(l.name)+DOM,mobile:''}});
 [['Pr. Shibin Samuel','President',far],['Justin Neduvelil','Secretary',far],['Eldho Kunnel','Vice-President',far],['Merin Pulickal','Joint-Secretary',far],['Sam Chacko','Treasurer',far],['Anju Koshy','Publicity Convenor',far],['Tom Skaria','Council Member',far],['Reshma Itty','Council Member',far],['Pr. Binu Varghese','President','2023-12-31'],['Lijo Abraham','Secretary','2023-12-31']]
  .forEach(([n,f,t])=>d.council.push({id:uid('co'),unitType:'state',unitId:'ST-KL',memberId:null,name:n,functionary:f,termEnds:t}));
 /* users */
 const U=(email,role,unitId,name)=>d.users.push({id:uid('u'),email,role,unitId,name,pw:DEFAULT_PW_HASH,mustChange:false});
 U('admin'+DOM,'admin',null,'Portal Administrator');U('state'+DOM,'state','ST-KL','PYPA Kerala State');
 d.zones.forEach(z=>U(z.admin.email,'zone',z.id,z.name+' Zone'));d.centres.forEach(c=>U(c.admin.email,'centre',c.id,c.name+' Centre'));
 d.locals.filter(l=>l.registered).forEach(l=>U(l.admin.email,'local',l.id,l.name));
 /* notifications */
 const N=(to,title,body,days,extra={})=>d.notifs.push({id:uid('n'),to,title,body,date:new Date(Date.now()-days*864e5).toISOString(),readBy:[],...extra});
 N(['state'],'New member added','Jibin Mathew was added to '+d.locals[5].name+'.',0.2);N(['state'],'Centre details changed','Kottayam South Centre updated its contact number.',1);
 N(['state'],'Duplicate members found','The monthly check found 3 possible duplicates. Review them in Admin Panel.',2,{go:'/portal/admin?tab=dupes'});
 N(['state'],'Fee payment request','Kottayam South Centre submitted a dues payment for approval.',0.5,{go:'/portal/members/dues'});
 N(['zone:Z4','centre:C8','state'],'Local PYPA awaiting approval','A new local PYPA was added under Kottayam South and needs State approval.',3);
 N(['zone:Z4'],'Council updated','The Kottayam Zone council term was updated by State.',4);N(['centre:C8'],'Welcome','Your Centre account is ready. Review your Centre details.',6);N(['local:L'+((3*3+1)*3+1)],'Welcome','Your Local PYPA account is ready.',6);
 /* activity */
 const A=(role,uid2,zoneId,label,type,desc,days)=>d.activity.push({id:uid('a'),date:new Date(Date.now()-days*864e5-RN()*864e5).toISOString(),role,unitId:uid2,zoneId,user:label,type,desc});
 A('state','ST-KL',null,'PYPA Kerala State','Edit','Updated council term for Eldho Kunnel (Vice-President).',6);A('state','ST-KL',null,'PYPA Kerala State','Add','Added zone Malabar.',20);
 for(let i=0;i<22;i++){const m=pick(d.members),l=d.locals.find(x=>x.id===m.local),r=pick(['local','local','centre','zone']);
  const un=r==='local'?l:r==='centre'?d.centres.find(c=>c.id===m.centre):d.zones.find(z=>z.id===m.zone);
  A(r,un.id,m.zone,un.name+(r==='zone'?' Zone':r==='centre'?' Centre':''),i%3?'Edit':'Add',(i%3?'Edited details of ':'Added member ')+m.name+'.',ri(0,25))}
 d.activity.sort((a,b)=>b.date.localeCompare(a.date));
 /* dues */
 const mkDue=(role,u,mode,status,days,yrs)=>{const ms=d.members.filter(m=>m[role]===u.id&&m.status==='Active'),n=Math.min(ms.length,ri(3,8));
  d.dues.push({id:uid('d'),date:new Date(Date.now()-days*864e5).toISOString(),role,unitId:u.id,zone:u.zoneId||u.id,centre:u.centreId||(role==='centre'?u.id:''),local:role==='local'?u.id:'',paidBy:role==='zone'?'Zone':role==='centre'?'Centre':'Local',unitName:u.name,mode,years:yrs,count:n,amount:n*yrs.length*d.master.fee,status,remarks:status==='Rejected'?'Transaction reference missing.':''})};
 mkDue('centre',d.centres[7],'Offline','Pending',0.5,[YEAR-1,YEAR]);mkDue('local',d.locals[22],'Online','Pending',1,[YEAR]);mkDue('zone',d.zones[0],'Online','Approved',9,[YEAR-1]);
 mkDue('local',d.locals[40],'Offline','Rejected',12,[YEAR-1]);mkDue('centre',d.centres[2],'Online','Approved',20,[YEAR-2,YEAR-1]);mkDue('local',d.locals[10],'Online','Pending',2,[YEAR]);
 /* letters */
 const L=(from,fl,to,sub,body,days,att)=>d.letters.push({id:uid('l'),from,fromLabel:fl,to,subject:sub,body,date:new Date(Date.now()-days*864e5).toISOString(),attachment:att||null,sms:false});
 L('state','PYPA Kerala State',['all'],'Annual camp registration opens','Registration for the annual youth camp opens next week. Please share with all local PYPA units and collect names by the due date.',5,{name:'camp-circular.pdf',size:182000,date:new Date(Date.now()-5*864e5).toISOString()});
 L('state','PYPA Kerala State',['all'],'Talent test schedule','The talent test will be held zone-wise first. Zones will send entries to State after the centre rounds.',14);
 L('zone:Z4','Kottayam Zone',['state','centre:C7','centre:C8','centre:C9'],'Centre meeting on Saturday','Centre presidents and secretaries are requested to attend the zone meeting this Saturday.',3);
 L('centre:C8','Kottayam South Centre',['state','zone:Z4'],'Request for new local PYPA','We have registered a new local PYPA and request approval from State.',2);
 /* freezes: past entries only */
 d.freezes.push({id:uid('f'),start:'2023-01-15T08:00',end:'2023-02-15T17:00',remarks:'Year-end financial freeze',ended:true},{id:uid('f'),start:'2023-05-01T12:00',end:'2023-05-10T16:30',remarks:'Election',ended:true});
 /* talent config */
 const T=d.talent,yr=n=>YEAR-n;
 T.categories=[{id:'cat1',name:'Junior',from:`${yr(21)}-01-01`,to:`${yr(15)}-12-31`},{id:'cat2',name:'Intermediate',from:`${yr(30)}-01-01`,to:`${yr(22)}-12-31`},{id:'cat3',name:'Senior',from:`${yr(40)}-01-01`,to:`${yr(31)}-12-31`}];
 T.events=[{id:'ev1',name:'Solo - M',gender:'Male',type:'Individual',cats:['cat1','cat2','cat3'],n:1},{id:'ev2',name:'Solo - F',gender:'Female',type:'Individual',cats:['cat1','cat2','cat3'],n:1},{id:'ev3',name:'Speech',gender:'Both',type:'Individual',cats:['cat1','cat2','cat3'],n:1},
  {id:'ev4',name:'Bible Quiz',gender:'Both',type:'Individual',cats:['cat1','cat2'],n:1},{id:'ev5',name:'Classical',gender:'Both',type:'Individual',cats:['cat1','cat2','cat3'],n:1},{id:'ev6',name:'Scripture Recitation',gender:'Both',type:'Common',cats:['cat1','cat2','cat3'],n:1},{id:'ev7',name:'Group Song Vocal',gender:'Both',type:'Group',cats:['cat1','cat2','cat3'],n:6}];
 const catOf=m=>T.categories.find(c=>m.dob>=c.from&&m.dob<=c.to);
 d.members.filter(m=>m.status==='Active'&&m.zone==='Z4').slice(0,12).forEach(m=>{const c=catOf(m);if(!c)return;
  const evs=T.events.filter(e=>e.type==='Individual'&&e.cats.includes(c.id)&&(e.gender==='Both'||e.gender===m.gender));T.entries.push({id:uid('te'),memberId:m.id,category:c.id,events:[pick(evs).id],by:'zone:Z4'})});
 d.content = seedContent();
 return d;
}
/* ================= public content ================= */
function seedContent(): Content {
 return {
  home:{kicker:'Pentecostal Young People’s Association',headline1:'Saved',headline2:'to Serve.',sub:'India’s largest Pentecostal youth organisation. Young people across Kerala gathering for worship, service, learning and creative work.',subMl:'സേവനത്തിനായി രക്ഷിക്കപ്പെട്ടവർ',banner:null},
  about:{mission:'To help young people grow in faith, character and service, and to place their gifts at the disposal of the church and the wider community.',vision:'A generation of young people across Kerala who are saved to serve, rooted in the Word and visible in their neighbourhoods.',
   stands:'The Pentecostal Young People’s Association',pillars:[['Faith','Weekly fellowship, Bible study, prayer and camps that build a living relationship with Christ.'],['Service','Community visits, relief work and volunteer teams led by local PYPA units.'],['Talent','Talent tests, music, art and writing that give young people a stage and a voice.']],
   history:[['The beginning','Young believers in local churches began meeting as youth fellowships, organised around prayer, Bible study and mission.'],['Growing into a network','Fellowships joined into local PYPA units, centres and zones, forming one structure across Kerala.'],['The 2023–2027 term','The present State council leads programmes across zones, centres and local units, with a common member register.'],['The web portal','A single portal for membership, dues, letters, talent test entries and official communication, from local unit to State.']]},
  projects:[
   {id:'pr1',title:'Niravu',tag:'Gathering',status:'Ongoing',color:'#237B68',text:'A State-level youth gathering with worship, teaching and fellowship, planned in 2026 with zone and centre teams.',when:'Season 2026'},
   {id:'pr2',title:'ചുവട്',tag:'Leadership',status:'Ongoing',color:'#1E4FA0',text:'A leadership programme (Chuvadu) taking young people from local units into centre and zone responsibilities.',when:'Season 2026'},
   {id:'pr3',title:'Youth Camps',tag:'Camp',status:'Registration open',color:'#3E8E2B',text:'Residential camps held in Ernakulam and Thiruvananthapuram, with sessions on faith, career and service.',when:'Ernakulam · Thiruvananthapuram'},
   {id:'pr4',title:'Snehakoodu',tag:'Outreach',status:'Ongoing',color:'#B8560F',text:'A care and outreach project run by local PYPA units for families who need practical help.',when:'All zones'},
   {id:'pr5',title:'Enroute',tag:'Mission',status:'Planned',color:'#0F7C80',text:'Mission trips and street outreach organised through centres, with training before each journey.',when:'Next season'},
   {id:'pr6',title:'Talent Test',tag:'Competition',status:'Ongoing',color:'#6B4C9A',text:'Music, speech, quiz and group events across Junior, Intermediate and Senior categories, from local round to State.',when:'Local → Centre → Zone → State'}],
  leadership:{office:'PYPA Kerala State Office, Kottayam',phone:'+91 94470 00000',email:'contact'+DOM,note:'Leadership shown here follows the State council in the portal.',social:[['Instagram','https://www.instagram.com/pypakeralastate/'],['Facebook','https://www.facebook.com/'],['Threads','https://www.threads.net/@pypakeralastate']]},
  wall:[
   {id:'w1',title:'Morning Psalm',author:'Merin Pulickal',unit:'Kottayam Zone',type:'Poem',text:'Before the town wakes up,\nthe light finds the window first.\nI have nothing to bring\nbut a quiet heart and an open hand.',seed:3},
   {id:'w2',title:'Lamp in the Rain',author:'Jibin Mathew',unit:'Ernakulam Zone',type:'Painting',seed:11},
   {id:'w3',title:'Backwater Dawn',author:'Eldho Kunnel',unit:'Alappuzha side',type:'Photography',seed:21},
   {id:'w4',title:'സ്നേഹക്കൂട്',author:'Anju Koshy',unit:'Kollam Zone',type:'Poem',text:'സ്നേഹത്തിന്റെ കൂട്ടിൽ\nഎല്ലാവർക്കും ഇടമുണ്ട്.\nവരൂ, ഒരുമിച്ചിരിക്കാം.',seed:5},
   {id:'w5',title:'Sunday Choir, Take 3',author:'Sneha Thomas',unit:'Thrissur Zone',type:'Music',seed:31},
   {id:'w6',title:'The Last Bus to Munnar',author:'Sam Chacko',unit:'Idukki Zone',type:'Short story',text:'The conductor counted us twice. Nobody minded. By the third bend, the hymn book had gone round the whole bus.',seed:7},
   {id:'w7',title:'Red Earth, Green Hill',author:'Reshma Itty',unit:'Pathanamthitta Zone',type:'Painting',seed:41},
   {id:'w8',title:'Hands at Work',author:'Tom Skaria',unit:'Thiruvananthapuram Zone',type:'Photography',seed:51}],
  kahalam:[
   {id:'k1',title:'യുവജന കാഹളം',issue:'November 2026',color:'#237B68',headline:'Saved to Serve',lead:'This month: Niravu reports, camp dates and talent test rules.',pdf:null},
   {id:'k2',title:'യുവജന കാഹളം',issue:'October 2026',color:'#1B5E7A',headline:'Roots and Wings',lead:'Leadership notes, Chuvadu highlights and zone news.',pdf:null},
   {id:'k3',title:'യുവജന കാഹളം',issue:'September 2026',color:'#2F8F4E',headline:'Back to Fellowship',lead:'Local PYPA stories, Bible study guide and Snehakoodu updates.',pdf:null},
   {id:'k4',title:'യുവജന കാഹളം',issue:'August 2026',color:'#0F7C80',headline:'Heart for Service',lead:'Relief work reports and member testimonies.',pdf:null}],
  jobs:[
   {id:'j1',title:'Staff Nurse',org:'Church-run hospital, Kottayam',loc:'Kottayam',type:'Full-time',pay:'Per scale',date:'2026-10-28',deadline:'2026-11-30',text:'GNM or B.Sc Nursing with registration. Fresh graduates may apply.',contact:'hr@careers.example',status:'Approved'},
   {id:'j2',title:'Junior Accountant',org:'Auditing firm, Ernakulam',loc:'Kochi',type:'Full-time',pay:'₹18,000–₹24,000',date:'2026-10-30',deadline:'2026-12-05',text:'B.Com with Tally. One year experience preferred.',contact:'jobs@accounts.example',status:'Approved'},
   {id:'j3',title:'Primary School Teacher',org:'Pentecostal school, Thiruvalla',loc:'Thiruvalla',type:'Full-time',pay:'As per management',date:'2026-11-01',deadline:'2026-12-10',text:'B.Ed and KTET. Malayalam and English fluency required.',contact:'principal@school.example',status:'Approved'},
   {id:'j4',title:'Front-end Developer',org:'Software startup, Technopark',loc:'Thiruvananthapuram',type:'Full-time',pay:'₹30,000–₹55,000',date:'2026-11-02',deadline:'2026-12-15',text:'HTML, CSS, JavaScript and one framework. Portfolio link required.',contact:'dev@startup.example',status:'Approved'},
   {id:'j5',title:'Office Assistant',org:'Trading company, Kollam',loc:'Kollam',type:'Part-time',pay:'₹9,000',date:'2026-11-03',deadline:'2026-11-25',text:'Basic computer skills. Morning shift.',contact:'office@trade.example',status:'Approved'},
   {id:'j6',title:'Graphic Designer',org:'Media house, Kochi',loc:'Kochi',type:'Contract',pay:'Project based',date:'2026-11-04',deadline:'2026-12-01',text:'Poster, social and print design. Malayalam typography is a plus.',contact:'studio@media.example',status:'Approved'},
   {id:'j7',title:'Lab Technician',org:'Diagnostic centre, Thrissur',loc:'Thrissur',type:'Full-time',pay:'₹15,000–₹20,000',date:'2026-11-05',deadline:'2026-12-12',text:'DMLT with one year experience.',contact:'lab@diagnostics.example',status:'Approved'},
   {id:'j8',title:'Driver cum Helper',org:'Logistics firm, Kozhikode',loc:'Kozhikode',type:'Full-time',pay:'₹16,000',date:'2026-11-05',deadline:'2026-11-28',text:'Valid licence. Local knowledge of Malabar roads.',contact:'ops@logistics.example',status:'Approved'},
   {id:'j9',title:'Sales Executive',org:'Pending request',loc:'Kochi',type:'Full-time',pay:'₹15,000 + incentive',date:'2026-11-06',deadline:'2026-12-20',text:'Retail sales for electronics. Fresh graduates welcome.',contact:'sales@retail.example',status:'Pending'}]
 };
}
