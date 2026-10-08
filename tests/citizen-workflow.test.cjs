const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const ts = require('typescript');

require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

class MemoryStorage {
  #items = new Map();

  getItem(key) {
    return this.#items.get(key) ?? null;
  }

  setItem(key, value) {
    this.#items.set(key, String(value));
  }

  removeItem(key) {
    this.#items.delete(key);
  }

  clear() {
    this.#items.clear();
  }
}

global.localStorage = new MemoryStorage();

const { citizenService } = require('../src/modules/citizen/citizenService.ts');
const {
  canReopen,
  getComplaintProgress,
  generateComplaintNumber,
  isOpenStatus,
  isPendingStatus,
  isResolvedStatus,
  normalizePhone,
  validateCitizenComplaint,
} = require('../src/modules/citizen/citizenRules.ts');
const { complaintRepository } = require('../src/modules/complaints/complaintRepository.ts');
const { COMPLAINT_STORAGE_KEY } = require('../src/modules/complaints/complaintConstants.ts');

function validInput(overrides = {}) {
  return {
    title: 'Broken streetlight on Lake Road',
    description: 'The streetlight outside our apartment has been out for three evenings.',
    category: 'Street Lighting',
    location: 'Lake Road, near the library',
    landmark: 'Opposite the public library',
    ward: 'Ward 12',
    priority: 'HIGH',
    contactName: 'Meera Iyer',
    contactPhone: '+91 9000000001',
    evidence: [{
      id: 'photo-1',
      fileName: 'streetlight.jpg',
      mimeType: 'image/jpeg',
      size: 120_000,
      uploadedAt: new Date().toISOString(),
    }],
    ...overrides,
  };
}

test.beforeEach(() => {
  localStorage.clear();
});

test('citizen submits a validated complaint with a sequential ID visible to the officer queue', () => {
  const before = citizenService.getMyComplaints();
  assert.equal(before.length, 3);

  const complaint = citizenService.createComplaint(validInput());

  assert.match(complaint.complaintNumber, /^NGC-\d{4}-\d{6}$/);
  assert.equal(complaint.complaintNumber.slice(-6), '001285');
  assert.equal(complaint.status, 'SUBMITTED');
  assert.equal(complaint.citizenPhone, '9000000001');
  assert.equal(complaint.timeline.at(-1).title, 'Complaint submitted');
  assert.equal(complaint.evidence.length, 1);
  assert.equal(normalizePhone('+91 9000000001'), '9000000001');
  assert.ok(citizenService.getMyComplaints().some((item) => item.id === complaint.id));
  const sharedRecords = complaintRepository.getAll();
  const sharedComplaintRecord = sharedRecords.find((item) => item.id === complaint.id);
  assert.equal(sharedComplaintRecord.status, 'SUBMITTED');
  complaintRepository.saveAll(sharedRecords.map((item) => item.id === complaint.id
    ? {
        ...item,
        status: 'ASSIGNED',
        assignedStaffId: 'field-01',
        assignedStaffName: 'Suresh Kumar',
        timeline: [...item.timeline, {
          id: 'officer-assignment-event',
          title: 'Assigned to Suresh Kumar',
          createdAt: new Date().toISOString(),
        }],
      }
    : item));
  const citizenView = citizenService.getMyComplaints().find((item) => item.id === complaint.id);
  assert.equal(citizenView.status, 'ASSIGNED');
  assert.equal(citizenView.assignedStaffName, 'Suresh Kumar');
  assert.equal(citizenView.timeline.at(-1).title, 'Assigned to Suresh Kumar');
  assert.ok(complaintRepository.getAll().some((item) => item.id === citizenView.id));
});

test('invalid complaint inputs are rejected before writing shared complaint storage', () => {
  assert.match(validateCitizenComplaint(validInput({ title: 'Bad' })), /title between 5 and 120/);
  assert.match(validateCitizenComplaint(validInput({ contactPhone: '123' })), /valid 10-digit/);
  assert.match(validateCitizenComplaint(validInput({ evidence: Array.from({ length: 5 }, (_, index) => ({
    id: String(index), fileName: `photo-${index}.jpg`, mimeType: 'image/jpeg', size: 5, uploadedAt: new Date().toISOString(),
  })) })), /up to 4/);
  assert.throws(() => citizenService.createComplaint(validInput({ category: 'Unrecognized category' })), /valid complaint category/);
  assert.equal(citizenService.getMyComplaints().length, 3);
});

test('citizen can rate a resolved complaint and reopen a closed complaint', () => {
  const resolved = citizenService.getMyComplaints().find((item) => item.id === 'demo-1228');
  const closed = citizenService.getMyComplaints().find((item) => item.id === 'demo-1220');
  assert.ok(resolved);
  assert.ok(closed);

  const withFeedback = citizenService.submitFeedback(resolved.id, 4, 'The repair was done well.');
  assert.equal(withFeedback.find((item) => item.id === resolved.id).feedback.rating, 4);
  assert.equal(withFeedback.find((item) => item.id === resolved.id).timeline.at(-1).title, 'Citizen feedback submitted');

  const reopened = citizenService.reopenComplaint(closed.id).find((item) => item.id === closed.id);
  assert.equal(reopened.status, 'REOPENED');
  assert.equal(reopened.timeline.at(-1).title, 'Complaint reopened by citizen');
  assert.throws(() => citizenService.reopenComplaint('demo-1284'), /Only a resolved or closed complaint/);
  assert.throws(() => citizenService.submitFeedback(resolved.id, 9, ''), /rating from 1 to 5/);
});

test('complaint filters and the complete citizen lifecycle use shared statuses', () => {
  const me = citizenService.getMyComplaints();
  assert.equal(me.filter((item) => isOpenStatus(item.status)).length, 1);
  assert.equal(me.filter((item) => isResolvedStatus(item.status)).length, 2);
  assert.equal(me.filter((item) => isPendingStatus(item.status)).length, 1);
  assert.equal(getComplaintProgress('IN_PROGRESS').length, 9);
  assert.equal(getComplaintProgress('IN_PROGRESS')[4].state, 'current');
  assert.equal(canReopen('CLOSED'), true);
  assert.equal(canReopen('ASSIGNED'), false);
  assert.equal(generateComplaintNumber([], new Date('2026-04-01T00:00:00Z')), 'NGC-2026-000001');
});

test('older officer demo records migrate into the shared citizen complaint shape', () => {
  localStorage.setItem(COMPLAINT_STORAGE_KEY, JSON.stringify([{
    id: 'legacy-meera',
    complaintNumber: 'NGC-2026-000041',
    citizenName: 'Meera Iyer',
    title: 'Old report',
    description: 'A legacy complaint created before the shared preview schema.',
    category: 'Drainage',
    department: 'Water Supply',
    location: 'Lake Road',
    ward: 'Ward 12',
    priority: 'LOW',
    status: 'SUBMITTED',
    createdAt: new Date().toISOString(),
    slaDeadline: new Date(Date.now() + 60_000).toISOString(),
    timeline: [],
    comments: [],
  }]));

  const migrated = citizenService.getMyComplaints();
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].citizenId, 'demo-citizen-meera');
  assert.equal(migrated[0].evidence.length, 0);
  assert.equal(JSON.parse(localStorage.getItem(COMPLAINT_STORAGE_KEY))[0].citizenId, 'demo-citizen-meera');
});
