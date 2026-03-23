
import { base44 } from '@/api/base44Client';

// Core entities
export const Contact = base44.entities.Contact;
export const Session = base44.entities.Session;
export const Task = base44.entities.Task;
export const Note = base44.entities.Note;

// Journey system
export const Journey = base44.entities.Journey;
export const JourneyStep = base44.entities.JourneyStep;
export const ContactJourney = base44.entities.ContactJourney;
export const ContactJourneyStep = base44.entities.ContactJourneyStep;

// Knowledge & AI
export const KnowledgeBase = base44.entities.KnowledgeBase;
export const AppliedReference = base44.entities.AppliedReference;
export const ContactRecommendation = base44.entities.ContactRecommendation;
export const Action = base44.entities.Action;

// Payments
export const Package = base44.entities.Package;
export const Invoice = base44.entities.Invoice;
export const InvoiceLineItem = base44.entities.InvoiceLineItem;
export const PaymentLink = base44.entities.PaymentLink;
export const PaymentRecord = base44.entities.PaymentRecord;

// Files & System
export const FileResource = base44.entities.FileResource;
export const APIUsageLog = base44.entities.APIUsageLog;

// Auth
export const User = base44.auth;
