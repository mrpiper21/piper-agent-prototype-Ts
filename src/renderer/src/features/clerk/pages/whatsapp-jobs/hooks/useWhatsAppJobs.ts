import { useMemo } from 'react';
import type { SortOption, StatusFilter } from '../components/WhatsAppJobsFilters';

export interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  fileName?: string;
  artwork?: string;
  printerName?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  submittedAt?: string;
  clientId?: { fullName?: string } | string;
  metadata?: {
    whatsappContact?: string;
    whatsappMessageId?: string;
  };
  [key: string]: unknown;
}

export function useWhatsAppJobs(
  jobs: Job[] | undefined,
  searchQuery: string,
  statusFilter: StatusFilter,
  sortBy: SortOption
) {
  // Filter for WhatsApp jobs only
  const whatsappJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((job) => {
      const metadata = job.metadata || {};
      return !!(metadata.whatsappContact || metadata.whatsappMessageId);
    });
  }, [jobs]);

  // Filter and sort WhatsApp jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!whatsappJobs) return [];

    let filtered = [...whatsappJobs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) => {
        // Get client fullName from populated clientId
        const clientName =
          job.clientId && typeof job.clientId === 'object'
            ? job.clientId.fullName?.toLowerCase()
            : '';

        // Get WhatsApp contact from metadata
        const whatsappContact = (job.metadata?.whatsappContact || '').toLowerCase();

        return (
          clientName?.includes(query) ||
          job.fileName?.toLowerCase().includes(query) ||
          job.artwork?.toLowerCase().includes(query) ||
          job.printerName?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          whatsappContact.includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => {
        const status = job.status?.toLowerCase();
        if (statusFilter === 'pending') {
          return status === 'pending' || status === 'queued';
        }
        return status === statusFilter;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest': {
          const dateA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return dateB - dateA;
        }
        case 'oldest': {
          const dateA = new Date(a.createdAt || a.submittedAt || 0).getTime();
          const dateB = new Date(b.createdAt || b.submittedAt || 0).getTime();
          return dateA - dateB;
        }
        case 'status': {
          const statusOrder = ['pending', 'queued', 'processing', 'printing', 'completed', 'failed'];
          const aIndex = statusOrder.indexOf(a.status?.toLowerCase() || '');
          const bIndex = statusOrder.indexOf(b.status?.toLowerCase() || '');
          return aIndex - bIndex;
        }
        case 'filename': {
          const nameA = (a.fileName || '').toLowerCase();
          const nameB = (b.fileName || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [whatsappJobs, searchQuery, statusFilter, sortBy]);

  return {
    whatsappJobs,
    filteredAndSortedJobs,
  };
}

