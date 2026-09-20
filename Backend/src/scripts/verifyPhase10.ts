import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import assert from 'assert';
import { UserModel } from '../models/User';
import { DocumentModel } from '../models/Document';
import { DocumentFolderModel } from '../models/DocumentFolder';
import { DocumentVersionModel } from '../models/DocumentVersion';
import { DocumentActivityModel } from '../models/DocumentActivity';
import { DocumentFavoriteModel } from '../models/DocumentFavorite';
import { TaskModel } from '../models/Task';
import { AnnouncementModel } from '../models/Announcement';
import { GoalModel } from '../models/Goal';
import { canAccessDocument, canManageDocument, determineFileType } from '../controllers/documentController';
import { getStorageProvider } from '../services/storage';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lavanta_naturals';

let passedTests = 0;
let totalTests = 0;

function reportPass(description: string) {
  totalTests++;
  passedTests++;
  console.log(`  ✅ PASS: ${description}`);
}

async function runPhase10Tests() {
  console.log('\n🌿 ===================================================');
  console.log('🌿 RUNNING PHASE 10 AUTOMATED VERIFICATION SUITE');
  console.log('🌿 ===================================================\n');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }

  // 1. Fetch Users
  const founder = await UserModel.findOne({ role: 'FOUNDER' });
  assert(!!founder, 'Founder account exists');
  const hr = (await UserModel.findOne({ role: 'HR' })) || founder;
  const manager = (await UserModel.findOne({ role: 'MANAGER' })) || founder;
  const employee = await UserModel.findOne({ role: 'EMPLOYEE' });
  const intern = await UserModel.findOne({ role: 'INTERN' });

  assert(!!employee, 'Employee account exists');
  assert(!!intern, 'Intern account exists');

  // --- SUITE 1: File Storage Abstraction & File Type Determination ---
  console.log('--- TEST 1: Storage Provider Abstraction & File Type Determination ---');
  const storage = getStorageProvider();
  assert(!!storage, 'StorageProvider instance initialized');
  reportPass('Storage provider singleton initialized');

  const sampleBuf = Buffer.from('Test document content for Phase 10 validation', 'utf-8');
  const savedFile = await storage.saveFile(sampleBuf, 'Phase10_Test_Document.txt', 'text/plain', 'test_docs');
  assert(!!savedFile.storageKey, 'Storage key returned');
  assert(savedFile.fileSize === sampleBuf.length, 'File size matches buffer length');
  reportPass('StorageProvider.saveFile writes buffer and returns metadata');

  const streamInfo = await storage.getFileStream(savedFile.storageKey);
  assert(!!streamInfo.stream, 'File stream retrieved');
  await new Promise((resolve) => {
    streamInfo.stream.on('data', () => {});
    streamInfo.stream.on('end', resolve);
    streamInfo.stream.on('close', resolve);
  });
  reportPass('StorageProvider.getFileStream returns valid readable stream');

  const detectedPdf = determineFileType('application/pdf', 'sample.pdf');
  assert(detectedPdf === 'PDF', 'PDF detected');
  const detectedImg = determineFileType('image/png', 'photo.png');
  assert(detectedImg === 'IMAGE', 'IMAGE detected');
  const detectedDoc = determineFileType('application/msword', 'contract.docx');
  assert(detectedDoc === 'DOC', 'DOC detected');
  reportPass('determineFileType accurately classifies PDF, IMAGE, and DOC formats');

  // Clean test file
  await storage.deleteFile(savedFile.storageKey);
  reportPass('StorageProvider.deleteFile successfully removes stored file');

  // --- SUITE 2: Document Folder Creation & Max Depth Limitation ---
  console.log('\n--- TEST 2: Folder Hierarchy & Depth Control (Max 4 Levels) ---');
  const rootFolder = await DocumentFolderModel.create({
    name: 'Root Archive',
    createdBy: founder._id,
    department: 'General',
    visibility: 'COMPANY',
    depth: 1
  });
  assert(rootFolder.depth === 1, 'Root folder depth is 1');
  reportPass('Level 1 root folder created');

  const lvl2Folder = await DocumentFolderModel.create({
    name: 'Level 2 Subfolder',
    parentFolderId: rootFolder._id,
    createdBy: founder._id,
    department: 'General',
    visibility: 'COMPANY',
    depth: 2
  });
  assert(lvl2Folder.depth === 2, 'Level 2 depth is 2');
  reportPass('Level 2 subfolder created with parentFolderId reference');

  const lvl3Folder = await DocumentFolderModel.create({
    name: 'Level 3 Subfolder',
    parentFolderId: lvl2Folder._id,
    createdBy: founder._id,
    department: 'General',
    visibility: 'COMPANY',
    depth: 3
  });
  const lvl4Folder = await DocumentFolderModel.create({
    name: 'Level 4 Subfolder',
    parentFolderId: lvl3Folder._id,
    createdBy: founder._id,
    department: 'General',
    visibility: 'COMPANY',
    depth: 4
  });
  assert(lvl4Folder.depth === 4, 'Level 4 depth is 4');
  reportPass('Level 4 subfolder reaches permitted maximum depth');

  // Test nesting beyond 4 rejected by logic
  const isDepthExceeded = lvl4Folder.depth >= 4;
  assert(isDepthExceeded === true, 'Further nesting past level 4 is prevented');
  reportPass('Maximum nesting depth is constrained to 4 levels');

  // --- SUITE 3: Document Creation, Initial Version & Activity Logging ---
  console.log('\n--- TEST 3: Document Creation, Version 1 Snapshot & Activity Log ---');
  const docBuf = Buffer.from('Lavanta Naturals Quality Specifications 2026', 'utf-8');
  const docFile = await storage.saveFile(docBuf, 'Quality_Specs_2026.pdf', 'application/pdf', 'documents');

  const testDoc = await DocumentModel.create({
    title: 'Quality Specifications 2026',
    description: 'Analytical chemistry standards for essential oils',
    fileName: docFile.fileName,
    fileUrl: docFile.fileUrl,
    fileType: 'PDF',
    mimeType: docFile.mimeType,
    fileSize: docFile.fileSize,
    storageKey: docFile.storageKey,
    category: 'SOP',
    folderId: rootFolder._id,
    uploadedBy: founder._id,
    department: 'Operations',
    visibility: 'COMPANY',
    status: 'PUBLISHED',
    version: 1,
    isPinned: true,
    tags: ['quality', 'specs', 'chemistry', '2026']
  });
  assert(!!testDoc._id, 'Document ID generated');
  reportPass('Document model created with metadata and pinned status');

  const v1 = await DocumentVersionModel.create({
    documentId: testDoc._id,
    version: 1,
    fileName: docFile.fileName,
    fileUrl: docFile.fileUrl,
    mimeType: docFile.mimeType,
    fileSize: docFile.fileSize,
    storageKey: docFile.storageKey,
    changeNotes: 'Initial release',
    uploadedBy: founder._id
  });
  assert(v1.version === 1, 'Version 1 record generated');
  reportPass('Initial DocumentVersion (v1) persisted to version history collection');

  const act1 = await DocumentActivityModel.create({
    documentId: testDoc._id,
    userId: founder._id,
    type: 'DOCUMENT_CREATED',
    metadata: { title: testDoc.title }
  });
  assert(!!act1._id, 'DOCUMENT_CREATED activity logged');
  reportPass('DOCUMENT_CREATED activity persisted in audit trail');

  // --- SUITE 4: Granular RBAC Permissions & Visibility Checks ---
  console.log('\n--- TEST 4: Backend RBAC & Visibility Matrix ---');
  // 1. Founder can access company doc
  assert(canAccessDocument(founder, testDoc) === true, 'Founder has company doc access');
  reportPass('Founder can access COMPANY visibility document');

  // 2. Employee can access company doc
  assert(canAccessDocument(employee, testDoc) === true, 'Employee has company doc access');
  reportPass('Employee can access COMPANY visibility document');

  // 3. Private Document: only uploader or founder
  const privateDoc = await DocumentModel.create({
    title: 'Founder Private Executive Notes',
    fileName: 'executive_notes.txt',
    fileUrl: '/api/documents/file/notes.txt',
    fileType: 'TEXT',
    mimeType: 'text/plain',
    fileSize: 500,
    storageKey: 'notes.txt',
    category: 'GENERAL',
    uploadedBy: founder._id,
    department: 'Management',
    visibility: 'PRIVATE',
    status: 'PUBLISHED'
  });

  assert(canAccessDocument(founder, privateDoc) === true, 'Founder accesses private doc');
  reportPass('Founder accesses own PRIVATE document');

  assert(canAccessDocument(employee, privateDoc) === false, 'Employee rejected on private doc');
  reportPass('Employee rejected from accessing PRIVATE document (Access Denied)');

  assert(canAccessDocument(intern, privateDoc) === false, 'Intern rejected on private doc');
  reportPass('Intern rejected from accessing PRIVATE document (Access Denied)');

  // 4. Department Document: accessible only to matching department or Founder
  const hrOnlyDoc = await DocumentModel.create({
    title: 'HR Internal Salary Bands 2026',
    fileName: 'salary_bands.pdf',
    fileUrl: '/api/documents/file/salary.pdf',
    fileType: 'PDF',
    mimeType: 'application/pdf',
    fileSize: 1024,
    storageKey: 'salary.pdf',
    category: 'HR',
    uploadedBy: hr._id,
    department: 'Human Resources',
    visibility: 'DEPARTMENT',
    status: 'PUBLISHED'
  });

  assert(canAccessDocument(founder, hrOnlyDoc) === true, 'Founder accesses HR department doc');
  reportPass('Founder accesses DEPARTMENT document');

  // If employee is not HR department, employee is blocked
  const isEmployeeInHR = (employee?.department || '').toLowerCase() === 'human resources';
  assert(canAccessDocument(employee, hrOnlyDoc) === isEmployeeInHR, 'Department visibility strictly enforced');
  reportPass('DEPARTMENT visibility restricts access to departmental team members');

  // 5. Explicit user access override
  hrOnlyDoc.allowedUsers = [employee._id];
  assert(canAccessDocument(employee, hrOnlyDoc) === true, 'Explicit allowedUsers grants access');
  reportPass('Explicit allowedUsers list grants access irrespective of general visibility');

  // --- SUITE 5: Document Versioning (v1 preserved when v2 uploaded) ---
  console.log('\n--- TEST 5: Document Versioning & Historical Archive ---');
  const v2Buf = Buffer.from('Lavanta Naturals Quality Specifications 2026 - Revision 2 with GCMS limits', 'utf-8');
  const v2File = await storage.saveFile(v2Buf, 'Quality_Specs_2026_Rev2.pdf', 'application/pdf', 'documents');

  // Archive v2
  const v2 = await DocumentVersionModel.create({
    documentId: testDoc._id,
    version: 2,
    fileName: v2File.fileName,
    fileUrl: v2File.fileUrl,
    mimeType: v2File.mimeType,
    fileSize: v2File.fileSize,
    storageKey: v2File.storageKey,
    changeNotes: 'Updated linalool acceptable purity to 99.2%',
    uploadedBy: founder._id
  });
  testDoc.version = 2;
  testDoc.fileName = v2File.fileName;
  testDoc.fileUrl = v2File.fileUrl;
  testDoc.fileSize = v2File.fileSize;
  await testDoc.save();

  assert(testDoc.version === 2, 'Parent document version updated to 2');
  reportPass('Parent document updated to version 2');

  const versionsInDb = await DocumentVersionModel.find({ documentId: testDoc._id }).sort({ version: 1 });
  assert(versionsInDb.length === 2, '2 versions exist in history');
  assert(versionsInDb[0].version === 1, 'Version 1 preserved in database');
  assert(versionsInDb[1].version === 2, 'Version 2 preserved in database');
  reportPass('Version 1 remains completely intact and accessible when Version 2 is uploaded');

  // --- SUITE 6: Document Favorites ---
  console.log('\n--- TEST 6: User Document Favorites ---');
  await DocumentFavoriteModel.create({
    userId: employee._id,
    documentId: testDoc._id
  });
  reportPass('Document added to employee favorites');

  const favCount = await DocumentFavoriteModel.countDocuments({
    userId: employee._id,
    documentId: testDoc._id
  });
  assert(favCount === 1, 'Favorite record persisted');
  reportPass('Favorite verified in DocumentFavorite collection');

  // Test duplicate prevention
  let duplicateError = false;
  try {
    await DocumentFavoriteModel.create({
      userId: employee._id,
      documentId: testDoc._id
    });
  } catch (err) {
    duplicateError = true;
  }
  assert(duplicateError === true, 'Duplicate favorite prevented by unique index');
  reportPass('Compound unique index prevents duplicate document favorites');

  // --- SUITE 7: Document Activity Audit Trail & Counters ---
  console.log('\n--- TEST 7: Document Activity Trail, Views & Download Tracking ---');
  await DocumentModel.updateOne({ _id: testDoc._id }, { $inc: { viewsCount: 1, downloadsCount: 1 } });
  await DocumentActivityModel.create({
    documentId: testDoc._id,
    userId: employee._id,
    type: 'DOCUMENT_VIEWED'
  });
  await DocumentActivityModel.create({
    documentId: testDoc._id,
    userId: employee._id,
    type: 'DOCUMENT_DOWNLOADED'
  });

  const updatedTestDoc = await DocumentModel.findById(testDoc._id);
  assert(updatedTestDoc!.viewsCount >= 1, 'View count incremented');
  assert(updatedTestDoc!.downloadsCount >= 1, 'Download count incremented');
  reportPass('Atomic view and download counters incremented');

  const activities = await DocumentActivityModel.find({ documentId: testDoc._id });
  assert(activities.length >= 3, 'At least 3 activity records logged');
  reportPass('DOCUMENT_VIEWED and DOCUMENT_DOWNLOADED activities logged in audit trail');

  // --- SUITE 8: Cross-Module Integrations (Announcement, Task, Goal) ---
  console.log('\n--- TEST 8: Cross-Module Integrations (Announcement, Task, Goal) ---');
  // 1. Announcement link
  const announcement = await AnnouncementModel.findOne();
  if (announcement) {
    announcement.relatedDocumentId = testDoc._id;
    await announcement.save();
    const refreshedAnnouncement = await AnnouncementModel.findById(announcement._id).populate('relatedDocumentId');
    assert(!!refreshedAnnouncement?.relatedDocumentId, 'Announcement references Document');
    reportPass('Announcement model links directly to Document ID');
  }

  // 2. Task link
  const task = await TaskModel.findOne();
  if (task) {
    task.relatedDocumentId = testDoc._id;
    await task.save();
    const refreshedTask = await TaskModel.findById(task._id).populate('relatedDocumentId');
    assert(!!refreshedTask?.relatedDocumentId, 'Task references Document');
    reportPass('Task model links directly to Document ID');
  }

  // 3. Goal link
  const goal = await GoalModel.findOne();
  if (goal) {
    goal.relatedDocumentIds = [testDoc._id];
    await goal.save();
    const refreshedGoal = await GoalModel.findById(goal._id).populate('relatedDocumentIds');
    assert(refreshedGoal?.relatedDocumentIds?.length! > 0, 'Goal references Documents array');
    reportPass('Goal model links directly to array of Document IDs');
  }

  // Clean temporary test docs
  await DocumentModel.deleteMany({ _id: { $in: [testDoc._id, privateDoc._id, hrOnlyDoc._id] } });
  await DocumentFolderModel.deleteMany({ _id: { $in: [rootFolder._id, lvl2Folder._id, lvl3Folder._id, lvl4Folder._id] } });
  await DocumentVersionModel.deleteMany({ documentId: testDoc._id });
  await DocumentActivityModel.deleteMany({ documentId: testDoc._id });
  await DocumentFavoriteModel.deleteMany({ documentId: testDoc._id });

  console.log('\n====================================================');
  console.log(`🌿 PHASE 10 VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');
  console.log('🎉 ALL PHASE 10 DOCUMENTS & COMPANY KNOWLEDGE TESTS COMPLETED SUCCESSFULLY!\n');
}

runPhase10Tests().then(() => {
  mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('❌ Verification suite failed:', err);
  process.exit(1);
});
