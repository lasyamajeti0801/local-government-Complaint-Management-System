const assert = require('assert');
const { executeRagPipeline } = require('../rag/generation/generator');
const { vectorStore } = require('../rag/retrieval/vectorStore');

async function runTests() {
  console.log('🧪 Starting Centralized RAG Pipeline & Role Permission Test Suite...\n');
  await vectorStore.initialize();

  // Test 1: Citizen Query on Pothole SLA & Resolution Timelines
  console.log('Test 1: Citizen queries Pothole SLA...');
  const res1 = await executeRagPipeline({
    query: 'What is the SLA timeline for resolving a severe road pothole?',
    userId: 'usr_citizen_1',
    userRole: 'CITIZEN',
    assistantContext: 'CITIZEN_SERVICE'
  });

  console.log('Answer:', res1.answer.slice(0, 150) + '...');
  console.log('Sources cited:', res1.sources.map(s => `${s.document} (p.${s.page})`));
  assert(res1.sources.length > 0, 'Citizen must receive sources');
  assert(res1.sources.some(s => s.document.includes('Citizen Grievance Redressal Charter')), 'Must cite Citizen Charter');
  assert(res1.wasFallbackRefusal === false, 'Should not refuse authorized query');
  console.log('✅ Test 1 Passed: Citizen received accurate SLA citation from Citizen Charter.\n');

  // Test 2: Role Boundary Test - Citizen queries Admin Emergency Contingency Protocol
  console.log('Test 2: Citizen tries to query restricted Admin-Only Disaster Protocol...');
  const res2 = await executeRagPipeline({
    query: 'What are the emergency fund sanction powers for the Municipal Commissioner during floods?',
    userId: 'usr_citizen_1',
    userRole: 'CITIZEN', // Restricted!
    assistantContext: 'CITIZEN_SERVICE'
  });

  console.log('Answer:', res2.answer);
  assert(res2.wasFallbackRefusal === true || res2.sources.length === 0, 'Citizen must NOT access ADMIN_ONLY documents');
  assert(res2.answer.includes('I could not find this information in the authorized municipal knowledge base.'), 'Must refuse unauthorized content');
  console.log('✅ Test 2 Passed: Strict Role Boundary enforced - Citizen refused access to ADMIN_ONLY documents.\n');

  // Test 3: Admin Queries Admin Emergency Contingency Protocol
  console.log('Test 3: Commissioner queries Emergency Contingency Protocol...');
  const res3 = await executeRagPipeline({
    query: 'What are the emergency fund sanction powers for the Municipal Commissioner during floods?',
    userId: 'usr_commissioner',
    userRole: 'COMMISSIONER', // Authorized!
    assistantContext: 'MUNICIPAL_INTEL'
  });

  console.log('Answer:', res3.answer.slice(0, 150) + '...');
  console.log('Sources cited:', res3.sources.map(s => `${s.document} (p.${s.page})`));
  assert(res3.sources.length > 0, 'Commissioner must receive sources');
  assert(res3.sources.some(s => s.document.includes('Emergency Civic Contingency')), 'Must cite Emergency Protocol');
  console.log('✅ Test 3 Passed: Commissioner authorized and received Emergency Protocol citations.\n');

  // Test 4: Field Staff Queries Field SOP and Safety instructions
  console.log('Test 4: Field Staff queries safety cones and pothole compaction...');
  const res4 = await executeRagPipeline({
    query: 'How far should traffic safety cones be placed before road pothole repair?',
    userId: 'usr_field_ramesh',
    userRole: 'FIELD_STAFF',
    assistantContext: 'FIELD_WORK'
  });

  console.log('Answer:', res4.answer.slice(0, 150) + '...');
  console.log('Sources cited:', res4.sources.map(s => `${s.document} (p.${s.page})`));
  assert(res4.sources.some(s => s.document.includes('Pothole Repair, Cold-Mix')), 'Must cite Field SOP');
  console.log('✅ Test 4 Passed: Field Staff received Field SOP citations.\n');

  // Test 5: Out of Domain / Irrelevant query must strictly refuse
  console.log('Test 5: Querying completely unrelated topic (cryptocurrency bitcoin mining)...');
  const res5 = await executeRagPipeline({
    query: 'How do I mine cryptocurrency bitcoin using gpu algorithms?',
    userId: 'usr_citizen_1',
    userRole: 'CITIZEN'
  });

  console.log('Answer:', res5.answer);
  assert(res5.wasFallbackRefusal === true, 'Irrelevant query must trigger refusal');
  assert(res5.answer === 'I could not find this information in the authorized municipal knowledge base.', 'Exact refusal wording must match requirement');
  assert(res5.sources.length === 0, 'Must not fabricate sources');
  console.log('✅ Test 5 Passed: Strictly refused out-of-domain query with zero hallucinated sources.\n');

  console.log('🎉 ALL 5 CENTRAL RAG TESTS PASSED FLAWLESSLY!');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
