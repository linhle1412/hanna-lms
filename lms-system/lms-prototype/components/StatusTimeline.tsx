'use client'

import { useState, useMemo } from 'react'
import type { Course } from '@/lib/state'

export interface StatusHistory {
  status: string
  timestamp: string // ISO datetime string
  performedBy: string // User name and role, or "System"
  action?: string // Action description
  reason?: string // Reason for action (rejections, cancellations)
  previousStatus?: string
  isAutomatic?: boolean
}

interface StatusTimelineProps {
  course: Course
  statusHistory?: StatusHistory[]
}

interface StatusMilestone {
  status: string
  label: string
  description: string
  color: string
  completed: boolean
  current: boolean
  pending: boolean
  history?: StatusHistory
}

const STATUS_CONFIG: Record<string, { label: string; description: string; color: string }> = {
  NEW: { label: 'NEW', description: 'Course Created', color: '#FED141' },
  REGISTERED: { label: 'REGISTERED', description: 'Trainer Registered', color: '#DBDFE1' },
  APPROVED: { label: 'APPROVED', description: 'Course Approved', color: '#0097A9' },
  WAITING_APPROVAL_EDIT: { label: 'WAITING APPROVAL EDIT', description: 'Edit Pending', color: '#6ECEB2' },
  IN_PROGRESS: { label: 'IN_PROGRESS', description: 'Course Started (Auto)', color: '#FF6347' },
  FINISHED: { label: 'FINISHED', description: 'Course Completed', color: '#FF6347' },
  CANCEL: { label: 'CANCEL', description: 'Course Cancelled', color: '#0A3B32' },
  WAITING_APPROVAL_CANCEL: { label: 'WAITING APPROVAL CANCEL', description: 'Cancel Pending', color: '#6ECEB2' },
}

const MAIN_FLOW_STATUSES = ['NEW', 'REGISTERED', 'APPROVED', 'IN_PROGRESS', 'FINISHED']

export default function StatusTimeline({ course, statusHistory = [] }: StatusTimelineProps) {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [showApprovalWorkflows, setShowApprovalWorkflows] = useState(false)
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null)

  // Calculate progress for IN_PROGRESS status
  const progress = useMemo(() => {
    if (course.status !== 'IN_PROGRESS' || !course.startDate || !course.endDate) {
      return null
    }

    const now = new Date()
    const start = new Date(course.startDate)
    const end = new Date(course.endDate)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const percentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)))

    return {
      percentage,
      daysElapsed: Math.min(daysElapsed, totalDays),
      totalDays
    }
  }, [course.status, course.startDate, course.endDate])

  // Build status milestones
  const milestones = useMemo(() => {
    const result: StatusMilestone[] = []
    const currentStatus = course.status

    // Track completed statuses from history
    const completedStatuses = new Set<string>()
    statusHistory.forEach(h => completedStatuses.add(h.status))

    // Determine status progression based on current status
    let lastCompletedIndex = -1
    MAIN_FLOW_STATUSES.forEach((status, index) => {
      if (completedStatuses.has(status) || status === currentStatus) {
        lastCompletedIndex = index
      }
    })

    // Add main flow statuses
    MAIN_FLOW_STATUSES.forEach((status, index) => {
      const config = STATUS_CONFIG[status]
      if (!config) return

      const hasHistory = completedStatuses.has(status)
      const isCompleted = hasHistory || (index <= lastCompletedIndex && currentStatus !== 'NEW')
      const isCurrent = status === currentStatus
      const isPending = status === currentStatus && !hasHistory && index > lastCompletedIndex

      const history = statusHistory.find(h => h.status === status)

      result.push({
        status,
        label: config.label,
        description: config.description,
        color: config.color,
        completed: isCompleted || isCurrent,
        current: isCurrent,
        pending: isPending,
        history
      })
    })

    // Add approval workflows if applicable
    if (showApprovalWorkflows) {
      const approvalStatuses = ['WAITING_APPROVAL_EDIT', 'WAITING_APPROVAL_CANCEL']
      approvalStatuses.forEach(status => {
        if (completedStatuses.has(status) || status === currentStatus) {
          const config = STATUS_CONFIG[status]
          if (!config) return

          const history = statusHistory.find(h => h.status === status)
          // Insert chronologically based on timestamp
          if (history) {
            const insertIndex = result.findIndex(r => {
              if (!r.history) return false
              return new Date(r.history.timestamp) > new Date(history.timestamp)
            })
            result.splice(insertIndex >= 0 ? insertIndex : result.length, 0, {
              status,
              label: config.label,
              description: config.description,
              color: config.color,
              completed: completedStatuses.has(status),
              current: status === currentStatus,
              pending: status === currentStatus && !completedStatuses.has(status),
              history
            })
          }
        }
      })
    }

    // Always show CANCEL if course is cancelled (append at end)
    if (currentStatus === 'CANCEL' || completedStatuses.has('CANCEL')) {
      const config = STATUS_CONFIG.CANCEL
      const history = statusHistory.find(h => h.status === 'CANCEL')
      result.push({
        status: 'CANCEL',
        label: config.label,
        description: config.description,
        color: config.color,
        completed: completedStatuses.has('CANCEL'),
        current: currentStatus === 'CANCEL',
        pending: false,
        history
      })
    }

    return result
  }, [course.status, statusHistory, showApprovalWorkflows])

  // Format date and time
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return {
      date: date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  }

  // Generate default history if not provided
  const defaultHistory: StatusHistory[] = useMemo(() => {
    if (statusHistory.length > 0) return statusHistory

    const history: StatusHistory[] = []
    
    // Always have NEW status
    history.push({
      status: 'NEW',
      timestamp: course.createdAt || new Date().toISOString(),
      performedBy: course.createdBy || 'LMS Admin Cloudair',
      action: 'Course Created',
      isAutomatic: false
    })

    // Add intermediate statuses if current status is beyond NEW
    const currentStatus = course.status
    const statusFlow = ['NEW', 'REGISTERED', 'APPROVED', 'IN_PROGRESS', 'FINISHED']
    const currentIndex = statusFlow.indexOf(currentStatus)

    if (currentIndex > 0) {
      // Add intermediate statuses with sequential timestamps
      for (let i = 1; i <= currentIndex; i++) {
        const prevTimestamp = i === 1 ? 
          (course.createdAt || new Date().toISOString()) :
          history[i - 1].timestamp
        
        const timestamp = new Date(new Date(prevTimestamp).getTime() + (i * 3600000)).toISOString()
        const status = statusFlow[i]
        
        history.push({
          status,
          timestamp,
          performedBy: status === 'IN_PROGRESS' ? 'System' : course.createdBy || 'LMS Admin Cloudair',
          action: status === 'IN_PROGRESS' ? 'Course Started (Automatic)' : 
                  status === 'APPROVED' ? 'Course Approved' :
                  status === 'REGISTERED' ? 'Trainer Registered' :
                  'Status changed to ' + status,
          isAutomatic: status === 'IN_PROGRESS',
          previousStatus: statusFlow[i - 1]
        })
      }
    }

    return history
  }, [statusHistory, course])

  const milestonesWithHistory = useMemo(() => {
    // Use defaultHistory if no statusHistory provided
    const effectiveHistory = statusHistory.length > 0 ? statusHistory : defaultHistory
    
    return milestones.map(m => ({
      ...m,
      history: m.history || effectiveHistory.find(h => h.status === m.status)
    }))
  }, [milestones, statusHistory, defaultHistory])

  return (
    <div className="status-timeline-container">
      <div className="status-timeline-header">
        <h3>📊 COURSE STATUS TIMELINE</h3>
        <div className="status-timeline-actions">
          <button 
            className="btn-secondary btn-sm"
            onClick={() => setShowApprovalWorkflows(!showApprovalWorkflows)}
          >
            {showApprovalWorkflows ? 'Hide' : 'Show'} Approval Workflows
          </button>
          <button className="btn-secondary btn-sm">Export Timeline</button>
        </div>
      </div>

      {/* Horizontal Timeline (Desktop) */}
      <div className="status-timeline-horizontal">
        <div className="status-timeline-track">
          {milestonesWithHistory.map((milestone, index) => {
            const isCompleted = milestone.completed && !milestone.current
            const isCurrent = milestone.current
            const isPending = milestone.pending || (!milestone.completed && !milestone.current)

            // Determine connector color - green if previous milestone is completed or current
            const prevMilestone = index > 0 ? milestonesWithHistory[index - 1] : null
            const connectorIsCompleted = prevMilestone && (prevMilestone.completed || prevMilestone.current)

            return (
              <div 
                key={milestone.status} 
                className={`status-timeline-item-wrapper ${hoveredMilestone === milestone.status ? 'active' : ''}`}
                onMouseEnter={() => setHoveredMilestone(milestone.status)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Connecting line before milestone (except first) */}
                {index > 0 && (
                  <div 
                    className={`milestone-connector ${connectorIsCompleted ? 'completed' : 'pending'}`}
                  />
                )}

                {/* Milestone Circle */}
                <div 
                  className={`status-milestone-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isPending ? 'pending' : ''} ${hoveredMilestone === milestone.status ? 'active' : ''}`}
                  onClick={() => setExpandedMilestone(expandedMilestone === milestone.status ? null : milestone.status)}
                  onMouseEnter={() => setHoveredMilestone(milestone.status)}
                  onMouseLeave={() => setHoveredMilestone(null)}
                >
                  {isCompleted && (
                    <div className="milestone-checkmark">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="10" fill="#28a745"/>
                        <path d="M6 10L8 12L14 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="milestone-current">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="11" fill="white" stroke="var(--color-primary)" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="6" fill="var(--color-primary)"/>
                        <circle cx="12" cy="12" r="3" fill="white"/>
                      </svg>
                    </div>
                  )}
                  {isPending && (
                    <div className="milestone-pending">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="9" fill="white" stroke="#d0d0d0" strokeWidth="2"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Milestone Label */}
                <div className="milestone-label-text">{milestone.label}</div>

                {/* Milestone Details - Show on hover/click */}
                {milestone.history && (
                  <div className="milestone-details-hover">
                    <div className="milestone-details-content">
                      <div className="milestone-detail-row">
                        <span className="milestone-detail-label">Status:</span>
                        <span className="milestone-detail-value">{milestone.label}</span>
                      </div>
                      <div className="milestone-detail-row">
                        <span className="milestone-detail-label">Date & Time:</span>
                        <span className="milestone-detail-value">
                          {formatDateTime(milestone.history.timestamp).date} {formatDateTime(milestone.history.timestamp).time}
                        </span>
                      </div>
                      <div className="milestone-detail-row">
                        <span className="milestone-detail-label">Performed By:</span>
                        <span className="milestone-detail-value">{milestone.history.performedBy}</span>
                      </div>
                      {milestone.history.action && (
                        <div className="milestone-detail-row">
                          <span className="milestone-detail-label">Action:</span>
                          <span className="milestone-detail-value">{milestone.history.action}</span>
                        </div>
                      )}
                      {milestone.history.previousStatus && (
                        <div className="milestone-detail-row">
                          <span className="milestone-detail-label">Previous Status:</span>
                          <span className="milestone-detail-value">{milestone.history.previousStatus}</span>
                        </div>
                      )}
                      {milestone.history.reason && (
                        <div className="milestone-detail-row">
                          <span className="milestone-detail-label">Reason:</span>
                          <span className="milestone-detail-value">{milestone.history.reason}</span>
                        </div>
                      )}
                      <div className="milestone-detail-row">
                        <span className="milestone-detail-label">Type:</span>
                        <span className="milestone-detail-value">{milestone.history.isAutomatic ? 'Automatic' : 'Manual'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current Status Info */}
      {progress && (
        <div className="current-status-info">
          <div className="current-status-label">Current Status: {course.status}</div>
          <div className="current-status-details">
            Course is currently running since {course.startDate ? formatDateTime(course.startDate).date : 'N/A'}
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-label">
              Progress: {progress.percentage}% (Day {progress.daysElapsed} of {progress.totalDays} days)
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
          {course.endDate && (
            <div className="expected-completion">
              Expected completion: {formatDateTime(new Date(course.endDate).toISOString()).date}
            </div>
          )}
        </div>
      )}

      {/* Expanded Milestone Details */}
      {expandedMilestone && milestonesWithHistory.find(m => m.status === expandedMilestone)?.history && (
        <div className="milestone-details-expanded">
          {(() => {
            const milestone = milestonesWithHistory.find(m => m.status === expandedMilestone)!
            const history = milestone.history!
            const dt = formatDateTime(history.timestamp)

            return (
              <div className="milestone-details-card">
                <div className="milestone-details-header">
                  <span>{milestone.label} - {milestone.description}</span>
                  <button 
                    className="btn-close"
                    onClick={() => setExpandedMilestone(null)}
                  >
                    ▼
                  </button>
                </div>
                <div className="milestone-details-body">
                  <div><strong>Status:</strong> {milestone.label}</div>
                  <div><strong>Date & Time:</strong> {dt.date} {dt.time}</div>
                  <div><strong>Performed By:</strong> {history.performedBy}</div>
                  {history.action && <div><strong>Action:</strong> {history.action}</div>}
                  {history.previousStatus && <div><strong>Previous Status:</strong> {history.previousStatus}</div>}
                  {history.reason && <div><strong>Reason:</strong> {history.reason}</div>}
                  <div><strong>Type:</strong> {history.isAutomatic ? 'Automatic' : 'Manual'}</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Vertical Timeline (Mobile/Tablet) - Hidden on desktop */}
      <div className="status-timeline-vertical">
        {milestonesWithHistory.map((milestone) => {
          if (!milestone.history) return null

          const dt = formatDateTime(milestone.history.timestamp)
          const isCompleted = milestone.completed
          const isCurrent = milestone.current

          return (
            <div key={milestone.status} className="vertical-milestone-item">
              <div className="vertical-milestone-line">
                <div 
                  className={`vertical-milestone-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                  style={{ backgroundColor: isCompleted ? milestone.color : '#d0d0d0' }}
                >
                  {isCompleted && <span className="milestone-icon-small">✓</span>}
                  {isCurrent && <span className="milestone-icon-small current-pulse">●</span>}
                </div>
                <div className={`vertical-connector ${isCompleted ? 'completed' : 'pending'}`} />
              </div>
              <div className="vertical-milestone-content">
                <div className="vertical-milestone-status">
                  {isCompleted && <span>✓</span>}
                  {isCurrent && <span className="current-indicator">🟢</span>}
                  {milestone.label}
                </div>
                <div className="vertical-milestone-datetime">{dt.date}</div>
                <div className="vertical-milestone-description">{milestone.description}</div>
                <div className="vertical-milestone-time">{dt.time}</div>
                <div className="vertical-milestone-user">by: {milestone.history.performedBy}</div>
                {progress && milestone.status === 'IN_PROGRESS' && (
                  <div className="vertical-progress">
                    Progress: {progress.percentage}% (Day {progress.daysElapsed} of {progress.totalDays})
                  </div>
                )}
                <div className="vertical-milestone-divider">──────────────────────────────────────────</div>
              </div>
            </div>
          )
        })}
      </div>

      <style jsx>{`
        .status-timeline-container {
          background: white;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .status-timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e0e0e0;
        }

        .status-timeline-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: bold;
          color: #333;
        }

        .status-timeline-actions {
          display: flex;
          gap: 12px;
        }

        .btn-secondary.btn-sm {
          padding: 6px 12px;
          font-size: 12px;
          background: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-secondary.btn-sm:hover {
          background: #e9e9e9;
        }

        /* Horizontal Timeline */
        .status-timeline-horizontal {
          display: block;
        }

        @media (max-width: 768px) {
          .status-timeline-horizontal {
            display: none;
          }
        }

        .status-timeline-track {
          display: flex;
          align-items: flex-start;
          gap: 0;
          margin-bottom: 8px;
          position: relative;
          overflow-x: auto;
          padding: 12px 0 32px 0;
          justify-content: space-between;
          width: 100%;
        }

        .status-timeline-item-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          min-width: 0;
          position: relative;
          padding: 0 12px;
        }

        .status-timeline-item-wrapper.active .milestone-details-hover {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .milestone-connector {
          position: absolute;
          left: calc(-50% - 50px);
          top: 10px;
          width: calc(100% + 100px);
          height: 2px;
          z-index: 0;
          background: #d0d0d0;
        }

        .milestone-connector.completed {
          background: #28a745;
        }

        .milestone-connector.pending {
          background: #d0d0d0;
        }

        .status-milestone-circle {
          position: relative;
          z-index: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          background: transparent;
        }

        .status-milestone-circle:hover {
          transform: scale(1.1);
        }

        .milestone-checkmark {
          display: flex;
          align-items: center;
          justify-content: center;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .milestone-checkmark svg {
          display: block;
        }

        .milestone-current {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .milestone-pending {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .milestone-label-text {
          margin-top: 6px;
          font-size: 11px;
          font-weight: 400;
          color: #333;
          text-align: center;
          line-height: 1.2;
          max-width: 110px;
          word-wrap: break-word;
        }

        .milestone-details-hover {
          position: absolute;
          top: calc(100% + 30px);
          left: 50%;
          transform: translateX(-50%);
          width: 240px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          padding: 10px;
          z-index: 10;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
        }

        .status-timeline-item-wrapper:hover .milestone-details-hover,
        .status-timeline-item-wrapper.active .milestone-details-hover {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }

        .milestone-details-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .milestone-detail-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .milestone-detail-label {
          font-size: 11px;
          font-weight: 600;
          color: #666;
        }

        .milestone-detail-value {
          font-size: 12px;
          color: #333;
          word-wrap: break-word;
        }

        .current-status-info {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 12px;
          margin-top: 12px;
        }

        .current-status-label {
          font-weight: bold;
          font-size: 13px;
          margin-bottom: 6px;
          color: #333;
        }

        .current-status-details {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .progress-bar-container {
          margin-bottom: 8px;
        }

        .progress-bar-label {
          font-size: 11px;
          color: #666;
          margin-bottom: 4px;
        }

        .progress-bar {
          height: 16px;
          background: #e0e0e0;
          border-radius: 8px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #0097A9, #FF6347);
          transition: width 0.3s ease;
        }

        .expected-completion {
          font-size: 11px;
          color: #666;
          margin-top: 6px;
        }

        .milestone-details-expanded {
          margin-top: 24px;
        }

        .milestone-details-card {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
        }

        .milestone-details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          font-weight: bold;
        }

        .btn-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          color: #666;
        }

        .milestone-details-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
        }

        .milestone-details-body strong {
          color: #555;
        }

        /* Vertical Timeline (Mobile) */
        .status-timeline-vertical {
          display: none;
        }

        @media (max-width: 768px) {
          .status-timeline-vertical {
            display: block;
          }
        }

        .vertical-milestone-item {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .vertical-milestone-line {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .vertical-milestone-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .vertical-milestone-dot.current {
          border-color: #333;
          animation: pulse 2s infinite;
        }

        .milestone-icon-small {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
        }

        .milestone-icon-small.current-pulse {
          animation: pulse-dot 1.5s infinite;
        }

        .vertical-connector {
          width: 2px;
          flex: 1;
          margin: 4px 0;
        }

        .vertical-connector.completed {
          background: #d0d0d0;
        }

        .vertical-connector.pending {
          background: #e0e0e0;
          border-left: 2px dashed #d0d0d0;
        }

        .vertical-milestone-content {
          flex: 1;
          padding-left: 8px;
        }

        .vertical-milestone-status {
          font-weight: bold;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .current-indicator {
          margin-right: 4px;
        }

        .vertical-milestone-datetime {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }

        .vertical-milestone-description {
          font-size: 13px;
          color: #333;
          margin-bottom: 4px;
        }

        .vertical-milestone-time {
          font-size: 12px;
          color: #888;
          margin-bottom: 4px;
        }

        .vertical-milestone-user {
          font-size: 11px;
          color: #888;
          margin-bottom: 8px;
        }

        .vertical-progress {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }

        .vertical-milestone-divider {
          color: #e0e0e0;
          margin-top: 8px;
        }
      `}</style>
    </div>
  )
}

