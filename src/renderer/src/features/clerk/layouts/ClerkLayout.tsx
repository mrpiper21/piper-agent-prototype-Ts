import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../auth/store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { useSettings } from '../../../context/SettingsContext';
import { lightStyles, darkStyles } from '../shared/clerkStyles';
import { useClerkLayout } from './hooks/useClerkLayout';
import {
  TabSwitcher,
  HomeSidebar,
  JobsSidebar,
  WhatsAppSidebar,
  MainHeader,
  MainContent,
  TaskBar,
  SidebarResizeHandle,
} from './components';

export default function ClerkLayout() {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { getFontSize, getSpacing, getIconSize } = useSettings();
  const queryClient = useQueryClient();

  const {
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
    jobs,
    whatsappJobs,
    filteredJobs,
    pendingCount,
    whatsappJobsCount,
    onlinePrintersCount,
    totalPrintersCount,
    isJobSelected,
    isSettingsPage,
    handleResizeStart,
  } = useClerkLayout();

  const themeStyles = useMemo(() => {
    return theme === 'dark' ? darkStyles : lightStyles;
  }, [theme]);

  const fontSize = getFontSize();
  const spacing = getSpacing();
  const iconSize = 16 * getIconSize();

  return (
    <div style={styles.wrapper}>
      <div style={styles.mainContainer}>
        <div
          style={{
            ...styles.sidebar,
            ...themeStyles.sidebar,
            width: isSidebarCollapsed
              ? '60px'
              : sidebarWidth !== null
                ? `${sidebarWidth}px`
                : `${Math.max(280, 280 * spacing)}px`,
            transition: isResizing ? 'none' : 'width 0.2s ease',
            position: windowWidth < 768 ? 'absolute' : 'relative',
            zIndex: windowWidth < 768 ? 1000 : 'auto',
            height: windowWidth < 768 ? '100%' : 'auto',
            boxShadow:
              windowWidth < 768 && !isSidebarCollapsed ? '2px 0 8px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <TabSwitcher
            themeStyles={themeStyles}
            theme={theme}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingCount}
            whatsappJobsCount={whatsappJobsCount}
            spacing={spacing}
            iconSize={iconSize}
          />

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'home' ? (
              <HomeSidebar
                themeStyles={themeStyles}
                isSidebarCollapsed={isSidebarCollapsed}
                spacing={spacing}
                iconSize={iconSize}
                userRole={user?.role}
              />
            ) : activeTab === 'jobs' ? (
              <JobsSidebar
                themeStyles={themeStyles}
                theme={theme}
                jobs={jobs}
                filteredJobs={filteredJobs}
                selectedJob={selectedJob}
                jobSearchQuery={jobSearchQuery}
                jobStatusFilter={jobStatusFilter}
                onSearchChange={setJobSearchQuery}
                onStatusFilterChange={setJobStatusFilter}
                onJobSelect={setSelectedJob}
                isJobSelected={isJobSelected}
                spacing={spacing}
                fontSize={fontSize}
                iconSize={iconSize}
              />
            ) : (
              <WhatsAppSidebar
                themeStyles={themeStyles}
                whatsappJobs={whatsappJobs}
                selectedJob={selectedWhatsAppJob}
                onJobSelect={setSelectedWhatsAppJob}
                spacing={spacing}
                fontSize={fontSize}
              />
            )}
          </div>
        </div>

        {!isSidebarCollapsed && windowWidth >= 768 && (
          <SidebarResizeHandle
            themeStyles={themeStyles}
            isResizing={isResizing}
            onMouseDown={handleResizeStart}
          />
        )}

        <div style={styles.main}>
          <MainHeader
            themeStyles={themeStyles}
            theme={theme}
            toggleTheme={toggleTheme}
            isSidebarCollapsed={isSidebarCollapsed}
            onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            userName={user?.name}
            onLogout={logout}
            spacing={spacing}
            fontSize={fontSize}
            iconSize={iconSize}
          />

          <MainContent
            themeStyles={themeStyles}
            isSettingsPage={isSettingsPage}
            activeTab={activeTab}
            selectedJob={selectedJob}
            selectedWhatsAppJob={selectedWhatsAppJob}
            onCloseJob={() => setSelectedJob(null)}
            onJobUpdate={() => {
              queryClient.invalidateQueries({ queryKey: ['jobs'] });
            }}
            spacing={spacing}
            fontSize={fontSize}
          />
        </div>
      </div>
      <TaskBar
        themeStyles={themeStyles}
        onlinePrintersCount={onlinePrintersCount}
        totalPrintersCount={totalPrintersCount}
        pendingCount={pendingCount}
        currentTime={currentTime}
      />
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    width: '100vw',
  },
  mainContainer: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minHeight: 0,
  },
  sidebar: {
    width: '200px',
    minWidth: '60px',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    flexShrink: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    overflowX: 'hidden' as const,
    minWidth: 0,
  },
};
