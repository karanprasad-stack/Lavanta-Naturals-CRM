import mongoose, { Types } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { UserModel } from '../models/User';
import { DocumentModel } from '../models/Document';
import { DocumentFolderModel } from '../models/DocumentFolder';
import { DocumentVersionModel } from '../models/DocumentVersion';
import { DocumentActivityModel } from '../models/DocumentActivity';
import { DocumentFavoriteModel } from '../models/DocumentFavorite';
import { TaskModel } from '../models/Task';
import { AnnouncementModel } from '../models/Announcement';
import { GoalModel } from '../models/Goal';
import { getStorageProvider } from '../services/storage';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lavanta_naturals';

export async function seedDocuments() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
      console.log('🌿 Connected to MongoDB for seeding documents...');
    }

    const founder = await UserModel.findOne({ role: 'FOUNDER' });
    if (!founder) {
      console.error('Founder user not found. Please run base seed first.');
      return;
    }
    const hr = (await UserModel.findOne({ role: 'HR' })) || founder;
    const manager = (await UserModel.findOne({ role: 'MANAGER' })) || founder;
    const employee = (await UserModel.findOne({ role: 'EMPLOYEE' })) || founder;

    // Clean existing documents collections
    await DocumentModel.deleteMany({});
    await DocumentFolderModel.deleteMany({});
    await DocumentVersionModel.deleteMany({});
    await DocumentActivityModel.deleteMany({});
    await DocumentFavoriteModel.deleteMany({});

    console.log('🌿 Cleared prior document collections.');

    // 1. Create Folders Hierarchy
    const companyFolder = await DocumentFolderModel.create({
      name: 'Company',
      description: 'Organization-wide foundational documents, values, and policies',
      parentFolderId: null,
      createdBy: founder._id,
      department: 'General',
      visibility: 'COMPANY',
      depth: 1
    });

    const policiesFolder = await DocumentFolderModel.create({
      name: 'Policies & Compliance',
      description: 'Formal company policies, safety protocols, and labor guidelines',
      parentFolderId: companyFolder._id,
      createdBy: founder._id,
      department: 'General',
      visibility: 'COMPANY',
      depth: 2
    });

    const hrFolder = await DocumentFolderModel.create({
      name: 'Human Resources',
      description: 'Employee onboarding, benefits, leave, and performance documentation',
      parentFolderId: null,
      createdBy: hr._id,
      department: 'Human Resources',
      visibility: 'COMPANY',
      depth: 1
    });

    const hrLeaveFolder = await DocumentFolderModel.create({
      name: 'Leave & Attendance',
      description: 'PTO policies, medical leave schedules, and attendance forms',
      parentFolderId: hrFolder._id,
      createdBy: hr._id,
      department: 'Human Resources',
      visibility: 'COMPANY',
      depth: 2
    });

    const opsFolder = await DocumentFolderModel.create({
      name: 'Operations & R&D',
      description: 'Botanical distillation SOPs, quality assurance benchmarks, and formulation guides',
      parentFolderId: null,
      createdBy: manager._id,
      department: 'Operations',
      visibility: 'COMPANY',
      depth: 1
    });

    const mktgFolder = await DocumentFolderModel.create({
      name: 'Marketing & Creative',
      description: 'Brand books, packaging guidelines, visual assets, and press kits',
      parentFolderId: null,
      createdBy: manager._id,
      department: 'Marketing',
      visibility: 'COMPANY',
      depth: 1
    });

    console.log('🌿 Created 6 Document Folders with multi-level hierarchy.');

    // Storage Provider
    const storage = getStorageProvider();

    // 2. Create Real Sample Document Buffers & Records
    const sampleDocs = [
      {
        title: 'Lavanta Naturals Employee Handbook 2026',
        description: 'Comprehensive guidelines covering workplace ethics, remote work policies, company history, sustainability principles, and benefits.',
        fileName: 'Lavanta_Employee_Handbook_2026.pdf',
        mimeType: 'application/pdf',
        fileContent: '%PDF-1.4\n% Lavanta Naturals Employee Handbook 2026\n1 0 obj << /Title (Employee Handbook 2026) /Author (Lavanta Naturals) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Size 1 >>\nstartxref\n100\n%%EOF',
        category: 'POLICY',
        folderId: policiesFolder._id,
        uploadedBy: hr._id,
        department: 'Human Resources',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: true,
        tags: ['handbook', 'policy', 'onboarding', 'ethics', '2026']
      },
      {
        title: 'Lavender Essential Oil Steam Distillation SOP (SOP-OPS-014)',
        description: 'Standard operating procedure for low-temperature vacuum steam distillation of Lavandula angustifolia flowers to maximize linalool yield.',
        fileName: 'SOP_OPS_014_Distillation_Process.pdf',
        mimeType: 'application/pdf',
        fileContent: '%PDF-1.4\n% Lavanta Naturals Distillation SOP-OPS-014\n1 0 obj << /Title (Distillation SOP) /Author (Lavanta R&D) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Size 1 >>\nstartxref\n100\n%%EOF',
        category: 'SOP',
        folderId: opsFolder._id,
        uploadedBy: manager._id,
        department: 'Operations',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: false,
        tags: ['sop', 'distillation', 'lavender', 'manufacturing', 'quality']
      },
      {
        title: 'Employee Leave & Attendance Policy 2026',
        description: 'Detailed entitlements for annual leave, medical emergency leave, maternity/paternity benefits, and public holiday calendar.',
        fileName: 'Lavanta_Leave_Policy_2026.pdf',
        mimeType: 'application/pdf',
        fileContent: '%PDF-1.4\n% Lavanta Naturals Leave Policy 2026\n1 0 obj << /Title (Leave Policy 2026) /Author (Lavanta HR) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Size 1 >>\nstartxref\n100\n%%EOF',
        category: 'POLICY',
        folderId: hrLeaveFolder._id,
        uploadedBy: hr._id,
        department: 'Human Resources',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: true,
        tags: ['leave', 'pto', 'attendance', 'hr', 'holidays']
      },
      {
        title: 'Organic Skincare Formulation Benchmarks & Standards',
        description: 'Active ingredient concentrations, stability testing protocol at 40°C, preservative efficacy testing guidelines, and pH specifications.',
        fileName: 'Skincare_Formulation_Benchmarks_v2.pdf',
        mimeType: 'application/pdf',
        fileContent: '%PDF-1.4\n% Lavanta Formulation Benchmarks v2\n1 0 obj << /Title (Formulation Benchmarks) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Size 1 >>\nstartxref\n100\n%%EOF',
        category: 'GUIDE',
        folderId: opsFolder._id,
        uploadedBy: founder._id,
        department: 'R&D',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: false,
        tags: ['formulation', 'skincare', 'botanical', 'r&d', 'safety']
      },
      {
        title: 'Brand Identity & Luxury Packaging Guidelines',
        description: 'Pantone color palette specifications (#69C43F Lavanta Green, Lavender Mist), typography usage, and eco-friendly recyclable packaging rules.',
        fileName: 'Lavanta_Brand_Book_2026.pdf',
        mimeType: 'application/pdf',
        fileContent: '%PDF-1.4\n% Lavanta Brand Book\n1 0 obj << /Title (Brand Book) >> endobj\nxref\n0 1\n0000000000 65535 f\ntrailer << /Size 1 >>\nstartxref\n100\n%%EOF',
        category: 'GUIDE',
        folderId: mktgFolder._id,
        uploadedBy: manager._id,
        department: 'Marketing',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: false,
        tags: ['brand', 'marketing', 'palette', 'packaging', 'design']
      },
      {
        title: 'Monthly Department Expense Report & Approval Template',
        description: 'Standard spreadsheet template for logging vendor invoices, shipping receipts, lab supplies, and managerial expenditure approvals.',
        fileName: 'Monthly_Expense_Report_Template.csv',
        mimeType: 'text/csv',
        fileContent: 'Date,Department,Vendor,Category,Amount,ApprovedBy,Notes\n2026-09-01,Operations,Botanical Glassworks,Packaging,45000,Manager,Bottles\n2026-09-05,R&D,AgriChem Labs,Testing,12500,Founder,GCMS Analysis\n',
        category: 'TEMPLATE',
        folderId: companyFolder._id,
        uploadedBy: founder._id,
        department: 'Finance',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: false,
        tags: ['finance', 'template', 'budget', 'expenses', 'invoices']
      },
      {
        title: 'Internal Data Protection & Confidentiality SOP',
        description: 'Security policies governing employee access credentials, NDA enforcement, customer privacy compliance, and proprietary extraction trade secrets.',
        fileName: 'Confidentiality_Data_Protection_SOP.txt',
        mimeType: 'text/plain',
        fileContent: 'LAVANTA NATURALS INTERNAL DATA PROTECTION POLICY\n\n1. All proprietary formulation recipes and batch distillation parameters are trade secrets.\n2. Access credentials must not be shared under any circumstance.\n3. Customer records and private test data must be handled in compliance with privacy regulations.\n',
        category: 'POLICY',
        folderId: policiesFolder._id,
        uploadedBy: founder._id,
        department: 'General',
        visibility: 'COMPANY',
        status: 'PUBLISHED',
        isPinned: true,
        tags: ['security', 'confidentiality', 'nda', 'compliance', 'privacy']
      }
    ];

    const createdDocIds: Types.ObjectId[] = [];

    for (const docData of sampleDocs) {
      const buf = Buffer.from(docData.fileContent, 'utf-8');
      const saved = await storage.saveFile(buf, docData.fileName, docData.mimeType, 'documents');

      const fileType = docData.mimeType === 'application/pdf'
        ? 'PDF'
        : docData.mimeType.startsWith('text/')
        ? 'TEXT'
        : 'OTHER';

      const doc = await DocumentModel.create({
        title: docData.title,
        description: docData.description,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        fileType,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageKey: saved.storageKey,
        category: docData.category,
        folderId: docData.folderId,
        uploadedBy: docData.uploadedBy,
        department: docData.department,
        visibility: docData.visibility,
        status: docData.status,
        version: 1,
        isPinned: docData.isPinned,
        pinnedAt: docData.isPinned ? new Date() : null,
        tags: docData.tags,
        viewsCount: Math.floor(Math.random() * 25) + 3,
        downloadsCount: Math.floor(Math.random() * 12) + 1
      });

      createdDocIds.push(doc._id);

      // Create initial version record
      await DocumentVersionModel.create({
        documentId: doc._id,
        version: 1,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageKey: saved.storageKey,
        changeNotes: 'Initial release published to company hub',
        uploadedBy: docData.uploadedBy
      });

      // Log initial activities
      await DocumentActivityModel.create({
        documentId: doc._id,
        userId: docData.uploadedBy,
        type: 'DOCUMENT_CREATED',
        metadata: { title: doc.title }
      });
      await DocumentActivityModel.create({
        documentId: doc._id,
        userId: docData.uploadedBy,
        type: 'DOCUMENT_PUBLISHED',
        metadata: { visibility: doc.visibility }
      });
    }

    console.log(`🌿 Seeded ${createdDocIds.length} authentic company documents with versioning and audit logs.`);

    // 3. Seed Favorite for Employee
    if (createdDocIds.length >= 2) {
      await DocumentFavoriteModel.create({
        userId: employee._id,
        documentId: createdDocIds[0] // Handbook
      });
      await DocumentFavoriteModel.create({
        userId: employee._id,
        documentId: createdDocIds[2] // Leave Policy
      });
      console.log('🌿 Seeded 2 favorite documents for Employee.');
    }

    // 4. Connect Document to an Announcement
    const announcement = await AnnouncementModel.findOne();
    if (announcement && createdDocIds.length > 0) {
      announcement.relatedDocumentId = createdDocIds[0];
      await announcement.save();
      console.log(`🌿 Linked Document (${createdDocIds[0]}) to Announcement "${announcement.title}".`);
    }

    // 5. Connect Document to a Task
    const task = await TaskModel.findOne();
    if (task && createdDocIds.length > 1) {
      task.relatedDocumentId = createdDocIds[1];
      await task.save();
      console.log(`🌿 Linked Document (${createdDocIds[1]}) to Task "${task.title}".`);
    }

    // 6. Connect Document to a Goal
    const goal = await GoalModel.findOne();
    if (goal && createdDocIds.length > 3) {
      goal.relatedDocumentIds = [createdDocIds[1], createdDocIds[3]];
      await goal.save();
      console.log(`🌿 Linked 2 Documents to Goal "${goal.title}".`);
    }

    console.log('🎉 Document & Knowledge System seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding documents:', error);
    throw error;
  }
}

// Auto-run when executed directly
if (process.argv[1]?.endsWith('seedDocuments.ts')) {
  seedDocuments().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}
