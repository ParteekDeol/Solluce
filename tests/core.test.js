import test from 'node:test';
import assert from 'node:assert/strict';
import { waterBudget, irrigationRuntime, GALLONS_PER_ACRE_MM } from '../shared/water.js';
import { AnalyzeSchema, ReportSchema, isValidImage } from '../shared/schema.js';
import { sampleAnalysis, sampleField } from '../src/lib/demo.js';
import { analyzeCrop } from '../server/analyze.js';
import { geocode, coordinatesLocation, forecast } from '../server/weather.js';
import { cropLabel, locationLabel, weatherQuery } from '../shared/location.js';
import analyzeHandler from '../api/analyze.js';
import healthHandler from '../api/health.js';

function mockEnv(t, key, value) {
  const previous = process.env[key];
  process.env[key] = value;
  t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
}

const photo = { mimeType: 'image/jpeg', data: Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(100)]).toString('base64') };
const validInput = { field: sampleField, quality: 'Some concerns', concerns: 'Lower leaves are yellowing on several plants.', photos: [photo], location: null };
const mockResponse = () => ({
  statusCode: 200, headers: {}, body: null,
  setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;},
});

test('water estimate subtracts useful rain, applies efficiency and converts acreage',()=>{
  const budget=waterBudget([{date:'2026-10-24',et0:5,precipitation:1}],2,.8,.9);
  assert.ok(Math.abs(budget.gross-3.2/.9)<1e-8);
  assert.ok(Math.abs(budget.gallons-3.2/.9*2*GALLONS_PER_ACRE_MM)<1e-6);
});
test('rain cannot produce negative watering; days do not carry artificial surplus',()=>{
  const budget=waterBudget([{et0:3,precipitation:20},{et0:3,precipitation:0}],1,1,1);
  assert.equal(budget.rows[0].gross,0);assert.equal(budget.rows[1].gross,3);
});
test('missing forecasts, missing values and invalid assumptions do not become fabricated estimates',()=>{
  for(const args of [[[],1,1,1],[[{et0:null,precipitation:0}],1,1,1],[[{et0:5,precipitation:0}],0,1,1],[[{et0:5,precipitation:0}],1,1,0],[[{et0:5,precipitation:0}],1,1,1.1]]){
    assert.equal(waterBudget(...args),null);
  }
});
test('water estimate scales linearly with field size and crop coefficient without rain',()=>{
  const a=waterBudget([{et0:4,precipitation:0}],1,.8,.9);
  const b=waterBudget([{et0:4,precipitation:0}],2,.8,.9);
  assert.equal(b.gallons,2*a.gallons);
  const c=waterBudget([{et0:4,precipitation:0}],1,.4,.9);
  assert.equal(c.gallons,a.gallons/2);
});
test('estimated run time needs measured positive whole-area flow',()=>{
  assert.equal(irrigationRuntime(9000,3000),3);
  assert.equal(irrigationRuntime(9000,0),null);
  assert.equal(irrigationRuntime(9000,Number.NaN),null);
  assert.equal(irrigationRuntime(undefined,3000),null);
});
test('photo input validates type and byte signature',()=>{
  assert.equal(isValidImage(photo),true);
  assert.equal(isValidImage({...photo,mimeType:'image/png'}),false);
  assert.equal(isValidImage({...photo,data:Buffer.from('this is not an image'.repeat(4)).toString('base64')}),false);
});
test('crop request accepts supported context and rejects missing photos, acreage, location or concerns',()=>{
  assert.equal(AnalyzeSchema.safeParse(validInput).success,true);
  for(const invalid of [{...validInput,photos:[]},{...validInput,field:{...sampleField,acres:-1}},{...validInput,concerns:'x'},{...validInput,location:{name:'NY',latitude:40,longitude:-74,precision:'city'}},{...validInput,photos:[{...photo,data:'invalid!base64'}]}]){
    assert.equal(AnalyzeSchema.safeParse(invalid).success,false);
  }
});
test('Other crop requires a specific name and preserves it for the report',()=>{
  const field={...sampleField,crop:'Other',customCrop:'Bell peppers'};
  assert.equal(AnalyzeSchema.safeParse({...validInput,field}).success,true);
  assert.equal(cropLabel(field),'Bell peppers');
  assert.equal(AnalyzeSchema.safeParse({...validInput,field:{...field,customCrop:''}}).success,false);
});
test('coordinate-only fields validate and produce a direct weather query',()=>{
  const coordinateField={...sampleField,address:'',latitude:37.7974,longitude:-121.216};
  assert.equal(AnalyzeSchema.safeParse({...validInput,field:coordinateField}).success,true);
  assert.equal(locationLabel(coordinateField),'37.7974, -121.2160');
  assert.equal(weatherQuery(coordinateField),'latitude=37.7974&longitude=-121.216');
  assert.equal(coordinatesLocation(37.7974,-121.216).precision,'coordinates');
  for(const bad of [{...coordinateField,latitude:undefined},{...coordinateField,longitude:-100},{...coordinateField,latitude:100}]){
    assert.equal(AnalyzeSchema.safeParse({...validInput,field:bad}).success,false);
  }
  assert.throws(()=>coordinatesLocation(100,-121.216),error=>error.status===400);
});
test('sample report obeys the same rendering contract as live reports',()=>{
  assert.equal(ReportSchema.safeParse(sampleAnalysis.report).success,true);
  assert.equal(ReportSchema.safeParse({...sampleAnalysis.report,timeline:[]}).success,false);
});
test('Gemini request contains images and validated output instructions; returned JSON is validated',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key-never-shipped');
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    assert.ok(url.startsWith('https://generativelanguage.googleapis.com/v1beta/models/'));
    const body=JSON.parse(options.body);
    assert.equal(body.contents[0].parts[1].inlineData.data,photo.data);
    assert.equal(body.generationConfig.responseMimeType,'application/json');
    assert.ok(body.generationConfig.responseJsonSchema.properties.issues);
    assert.ok(body.systemInstruction.parts[0].text.includes('untrusted'));
    return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sampleAnalysis.report)}]}}]})};
  });
  const result=await analyzeCrop(validInput,null);assert.equal(result.report.headline,sampleAnalysis.report.headline);
});
test('Spanish analysis passes language and custom crop to Gemini',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');
  const input=AnalyzeSchema.parse({...validInput,language:'es',field:{...sampleField,crop:'Other',customCrop:'Bell peppers'}});
  t.mock.method(globalThis,'fetch',async(_url,options)=>{
    const body=JSON.parse(options.body);
    const context=JSON.parse(body.contents[0].parts[0].text);
    assert.equal(context.language,'es');
    assert.equal(context.field.customCrop,'Bell peppers');
    assert.match(body.systemInstruction.parts[0].text,/Spanish/);
    return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sampleAnalysis.report)}]}}]})};
  });
  await analyzeCrop(input,null);
});
test('malformed and truncated Gemini responses fail rather than becoming fake reports',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'{}'}]}}]})}));
  await assert.rejects(()=>analyzeCrop(validInput,null),e=>e.code==='INVALID_AI_RESPONSE');
});
test('Gemini quota failures give a useful bounded error',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');
  t.mock.method(globalThis,'fetch',async()=>({ok:false,status:429}));
  await assert.rejects(()=>analyzeCrop(validInput,null),e=>e.code==='AI_QUOTA'&&e.status===429);
});
test('city resolution only chooses California matches',async t=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({results:[{name:'Fresno',country_code:'US',admin1:'Texas',latitude:29.5,longitude:-95.4},{name:'Fresno',country_code:'US',admin1:'California',latitude:36.74,longitude:-119.78}]})}));
  const match=await geocode('Fresno, CA');assert.equal(match.name,'Fresno, California');assert.equal(match.precision,'city');
});
test('street address resolution uses Census and preserves matched coordinates',async t=>{
  t.mock.method(globalThis,'fetch',async url=>{
    assert.ok(String(url).startsWith('https://geocoding.geo.census.gov/'));
    return {ok:true,json:async()=>({result:{addressMatches:[{matchedAddress:'1700 THOMAS ST, MANTECA, CA',addressComponents:{state:'CA'},coordinates:{y:37.79,x:-121.22}}]}})};
  });
  const match=await geocode('1700 Thomas St, Manteca, CA');assert.equal(match.precision,'address');assert.equal(match.latitude,37.79);
});
test('unmatched locations produce an error without substituting a different farm',async t=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({results:[]})}));
  await assert.rejects(()=>geocode('Not a town'),e=>e.status===404);
});
test('forecast normalizes metric rainfall, Fahrenheit temperature and sunshine seconds correctly',async t=>{
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({
    current:{temperature_2m:76,relative_humidity_2m:40,wind_speed_10m:5,weather_code:1,time:'2026-10-24T12:00'},
    daily:{time:['2026-10-24'],temperature_2m_max:[78],temperature_2m_min:[50],precipitation_sum:[2],precipitation_probability_max:[30],et0_fao_evapotranspiration:[3],sunshine_duration:[36000],wind_speed_10m_max:[7],weather_code:[1]},
  })}));
  const result=await forecast({name:'Manteca',latitude:37.79,longitude:-121.22,precision:'city'});
  assert.equal(result.days[0].sunshineHours,10);assert.equal(result.days[0].precipitation,2);assert.equal(result.current.temperature,76);assert.equal(result.sample,false);
});
test('analysis handler rejects unsupported methods and invalid payloads',async()=>{
  const get=mockResponse();await analyzeHandler({method:'GET',headers:{}},get);assert.equal(get.statusCode,405);assert.equal(get.headers.Allow,'POST');
  const invalid=mockResponse();await analyzeHandler({method:'POST',headers:{'x-real-ip':'test-invalid'},body:{}},invalid);assert.equal(invalid.statusCode,400);
});
test('missing Gemini configuration never silently substitutes a sample report',async t=>{
  mockEnv(t,'GEMINI_API_KEY','');
  const response=mockResponse();await analyzeHandler({method:'POST',headers:{'x-real-ip':'test-no-key'},body:validInput},response);
  assert.equal(response.statusCode,503);assert.equal(response.body.code,'AI_NOT_CONFIGURED');assert.equal(response.body.report,undefined);
});
test('health exposes capability flags without leaking API keys',t=>{
  mockEnv(t,'GEMINI_API_KEY','secret-placeholder');
  const response=mockResponse();healthHandler({method:'GET'},response);
  assert.equal(response.body.analysisConfigured,true);assert.equal(JSON.stringify(response.body).includes('secret-placeholder'),false);
});
test('syntactically valid but incomplete AI JSON cannot reach the renderer',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:'{"summary":"Incomplete"}'}]}}]})}));
  await assert.rejects(()=>analyzeCrop(validInput,null),e=>e.code==='INVALID_AI_RESPONSE');
});
test('successful guest analysis contains a real report identifier and excludes original photo data',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');mockEnv(t,'TURNSTILE_SECRET_KEY','');
  t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sampleAnalysis.report)}]}}]})}));
  const response=mockResponse();
  await analyzeHandler({method:'POST',url:'/api/analyze',headers:{'x-real-ip':'test-success'},body:validInput},response);
  assert.equal(response.statusCode,200);assert.equal(response.body.sample,false);assert.equal(response.body.photoCount,1);
  assert.ok(response.body.id);assert.equal(response.body.photos,undefined);assert.equal(response.body.weather,null);
  assert.ok(response.body.weatherWarning.includes('No confirmed location'));
});
test('weather failure is disclosed and does not prevent a photo-only report',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');mockEnv(t,'TURNSTILE_SECRET_KEY','');
  t.mock.method(globalThis,'fetch',async(url,options)=>{
    if(String(url).includes('open-meteo'))throw new Error('Simulated outage');
    const text=JSON.parse(JSON.parse(options.body).contents[0].parts[0].text);
    assert.equal(text.weather.status,'unavailable');
    return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(sampleAnalysis.report)}]}}]})};
  });
  const response=mockResponse();
  await analyzeHandler({method:'POST',url:'/api/analyze',headers:{'x-real-ip':'test-no-weather'},body:{...validInput,location:sampleAnalysis.location}},response);
  assert.equal(response.statusCode,200);assert.equal(response.body.weather,null);assert.ok(response.body.weatherWarning.includes('unavailable'));
});
test('configured challenge protection rejects unverified requests before calling Gemini',async t=>{
  mockEnv(t,'GEMINI_API_KEY','test-key');mockEnv(t,'TURNSTILE_SECRET_KEY','test-turnstile');
  t.mock.method(globalThis,'fetch',async url=>{
    assert.ok(String(url).includes('challenges.cloudflare.com'));
    return {json:async()=>({success:false})};
  });
  const response=mockResponse();
  await analyzeHandler({method:'POST',url:'/api/analyze',headers:{'x-real-ip':'test-challenge'},body:validInput},response);
  assert.equal(response.statusCode,403);assert.equal(response.body.code,'CHALLENGE_REQUIRED');
});
