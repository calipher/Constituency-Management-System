import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';

export interface AuditLog {
  action: string;
  category: 'Citizens' | 'Cases' | 'Projects' | 'Events' | 'Users' | 'System' | 'Documents' | 'Communications';
  details: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
}

export const logAudit = async (log: Omit<AuditLog, 'createdAt'>) => {
  try {
    await addDoc(collection(db, 'auditLogs'), {
      ...log,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error writing audit log:", error);
  }
};
