import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { electronAPI } from '../../../../lib';
import type { Job } from '../../pages/whatsapp-jobs/hooks/useWhatsAppJobs';
import { useDebounce } from '../../../../shared/hooks/useDebounce';
import type { TabType } from '../components/TabSwitcher';

export function useClerkLayout() {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedWhatsAppJob, setSelectedWhatsAppJob] = useState<Job | null>(null);
  const [jobSearchQuery, setJobSearchQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<
    'all' | 'pending' | 'processing' | 'completed' | 'failed'
  >('all');
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const debouncedSearchQuery = useDebounce(jobSearchQuery, 300);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = window.innerWidth * 0.5;
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: jobs } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => electronAPI.jobs.getAll(),
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: printers } = useQuery({
    queryKey: ['printers'],
    queryFn: () => electronAPI.agent.getPrinters(),
    staleTime: 30000,
    gcTime: 300000,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: whatsappConversations = [] } = useQuery({
    queryKey: ['whatsapp-conversations'],
    queryFn: async () => {
      try {
        if (!electronAPI.whatsapp?.getLocalMessages) {
          return [];
        }
        const messages = await electronAPI.whatsapp.getLocalMessages();
        // Group messages by contact to get conversations
        const conversationsMap = new Map<string, any[]>();
        (messages || []).forEach((msg: any) => {
          if (!msg.contact) return;
          if (!conversationsMap.has(msg.contact)) {
            conversationsMap.set(msg.contact, []);
          }
          conversationsMap.get(msg.contact)!.push(msg);
        });
        // Convert to conversation objects
        return Array.from(conversationsMap.entries()).map(([contact, msgs]) => {
          const latestMsg = msgs[msgs.length - 1];
          const contactName = msgs.find((m: any) => m.contactName && m.contactName !== contact)?.contactName 
            || latestMsg.contactName 
            || contact.split('@')[0];
          return {
            _id: `conversation-${contact}`,
            contact,
            contactName,
            messages: msgs,
            latestMessage: latestMsg,
            timestamp: latestMsg.timestamp || Date.now(),
            hasPrintCommand: msgs.some((m: any) => m.isPrintCommand),
          };
        });
      } catch (error) {
        console.error('Error fetching WhatsApp conversations:', error);
        return [];
      }
    },
    staleTime: 0,
    refetchInterval: false,
    refetchOnWindowFocus: true,
  });

  // Listen for real-time WhatsApp messages
  useEffect(() => {
    if (!electronAPI.whatsapp) return;

    const unsubscribe = electronAPI.whatsapp.onMessage(() => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    });

    const unsubscribeHistory = electronAPI.whatsapp.onHistoryLoaded(() => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    });

    return () => {
      unsubscribe();
      unsubscribeHistory();
    };
  }, [queryClient]);

  // Convert conversations to job-like format for compatibility with existing components
  // ONLY include conversations that have /print commands (this is for print jobs only)
  const whatsappJobs = useMemo(() => {
    return whatsappConversations
      .filter((conv: any) => {
        // Check if conversation has at least one /print command
        const hasPrintCommand = conv.messages?.some((m: any) => {
          const body = (m.body || '').trim();
          return m.isPrintCommand === true || body.toLowerCase().startsWith('/print');
        });
        return hasPrintCommand;
      })
      .map((conv: any) => ({
        _id: conv._id,
        printJobId: `conversation-${conv.contact}`,
        fileName: `WhatsApp Conversation - ${conv.contactName}`,
        description: conv.messages.map((m: any) => m.body).filter(Boolean).join('\n\n') || 'No messages',
        status: 'needs_quote',
        submittedAt: new Date(conv.timestamp).toISOString(),
        createdAt: new Date(conv.timestamp).toISOString(),
        metadata: {
          whatsappContact: conv.contact,
          contactName: conv.contactName,
          isLocalMessage: true,
          isConversation: true,
          messages: conv.messages,
          hasPrintCommand: true, // Mark as having print command
        },
      }));
  }, [whatsappConversations]);

  // Memoized counts
  const pendingCount = useMemo(() => {
    if (!jobs) return 0;
    return jobs.filter((job: Job) => job.status === 'pending' || job.status === 'queued').length;
  }, [jobs]);

  const whatsappJobsCount = useMemo(() => {
    // Count unread WhatsApp conversations that have /print commands
    // A conversation is "unread" if it has status "needs_quote" AND has a /print command
    // whatsappJobs is already filtered to only include conversations with /print commands
    if (!whatsappJobs || whatsappJobs.length === 0) return 0;
    
    // Count only conversations with status "needs_quote" (unread) that have /print commands
    // Double-check that they have print commands as a safeguard
    return whatsappJobs.filter((job: Job) => {
      const hasNeedsQuote = job.status?.toLowerCase() === 'needs_quote';
      const metadata = job.metadata as { hasPrintCommand?: boolean; messages?: Array<{ isPrintCommand?: boolean; body?: string }> } | undefined;
      const hasPrintCommand = metadata?.hasPrintCommand === true || 
        metadata?.messages?.some((m: any) => {
          const body = (m.body || '').trim();
          return m.isPrintCommand === true || body.toLowerCase().startsWith('/print');
        });
      
      return hasNeedsQuote && hasPrintCommand;
    }).length;
  }, [whatsappJobs]);

  const onlinePrintersCount = useMemo(() => {
    if (!printers) return 0;
    return printers.filter((p: any) => p.status === 'online').length;
  }, [printers]);

  const totalPrintersCount = useMemo(() => {
    return printers?.length || 0;
  }, [printers]);

  // Reset selected jobs when switching tabs
  useEffect(() => {
    if (activeTab === 'home') {
      setSelectedJob(null);
      setSelectedWhatsAppJob(null);
    } else if (activeTab === 'jobs') {
      setSelectedWhatsAppJob(null);
    } else if (activeTab === 'whatsapp') {
      setSelectedJob(null);
    }
  }, [activeTab, location.pathname]);

  // Job selection check
  const isJobSelected = useCallback(
    (job: Job): boolean => {
      if (!selectedJob) return false;
      const isSelected =
        (selectedJob.id && selectedJob.id === job.id) ||
        (selectedJob._id && selectedJob._id === job._id) ||
        (selectedJob.printJobId && selectedJob.printJobId === job.printJobId);
      return Boolean(isSelected);
    },
    [selectedJob]
  );

  // Filter jobs
  const filteredJobs = useMemo(() => {
    if (!jobs) return [];

    let filtered = [...jobs];

    // Apply status filter
    if (jobStatusFilter !== 'all') {
      filtered = filtered.filter((job: Job) => {
        const status = job.status?.toLowerCase();
        if (jobStatusFilter === 'pending') {
          return status === 'pending' || status === 'queued';
        }
        return status === jobStatusFilter;
      });
    }

    // Apply search query filter
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((job: Job) => {
        const clientName =
          job.clientId && typeof job.clientId === 'object'
            ? (job.clientId.fullName || '').toLowerCase()
            : '';
        const fileName = (job.fileName || '').toLowerCase();
        const artwork = (job.artwork || '').toLowerCase();
        const printerName = (job.printerName || '').toLowerCase();
        const status = (job.status || '').toLowerCase();
        const description = (job.description || '').toLowerCase();

        return (
          clientName.includes(query) ||
          fileName.includes(query) ||
          artwork.includes(query) ||
          printerName.includes(query) ||
          status.includes(query) ||
          description.includes(query)
        );
      });
    }

    return filtered;
  }, [jobs, debouncedSearchQuery, jobStatusFilter]);

  const isSettingsPage = location.pathname === '/clerk/settings';

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  return {
    // State
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    windowWidth,
    activeTab,
    setActiveTab,
    selectedJob,
    setSelectedJob,
    selectedWhatsAppJob,
    setSelectedWhatsAppJob,
    jobSearchQuery,
    setJobSearchQuery,
    jobStatusFilter,
    setJobStatusFilter,
    sidebarWidth,
    isResizing,
    currentTime,
    // Data
    jobs,
    printers,
    whatsappJobs,
    filteredJobs,
    // Counts
    pendingCount,
    whatsappJobsCount,
    onlinePrintersCount,
    totalPrintersCount,
    // Functions
    isJobSelected,
    isSettingsPage,
    handleResizeStart,
  };
}
