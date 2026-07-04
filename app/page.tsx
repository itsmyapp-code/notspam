'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

interface MailTmDomain {
  id: string
  domain: string
}

interface MailTmAccount {
  id: string
  address: string
}

interface MailTmToken {
  token: string
}

interface MailTmMessageMeta {
  id: string
  from: { address: string; name: string }
  subject: string
  intro: string
  createdAt: string
  hasAttachments: boolean
}

interface MailTmMessageContent extends MailTmMessageMeta {
  html: string[]
  text: string
  attachments: { id: string; filename: string; size: number }[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://api.mail.tm'
const POLL_INTERVAL_MS = 10_000
const ADDRESS_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
const ADDRESS_LENGTH = 10
// We use a deterministic password based on the address so that bookmarking the ?id= in the URL 
// allows us to re-authenticate and fetch the token again without needing a database.
const getPasswordForAddress = (address: string) => `${address}-notspam-secure`

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateLocalPart(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(ADDRESS_LENGTH))
  return Array.from(bytes).map((b) => ADDRESS_CHARS[b % ADDRESS_CHARS.length]).join('')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    })
  } catch { return dateStr }
}

// ─── Pulse Dot ───────────────────────────────────────────────────────────────

function PulseDot({ color = '#10b981' }: { color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ backgroundColor: color }} />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  )
}

// ─── Inbox Empty State ────────────────────────────────────────────────────────

function EmptyInbox({ isPolling }: { isPolling: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-10">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Awaiting Emails</p>
        <p className="text-xs leading-relaxed max-w-[160px]" style={{ color: 'var(--color-text-secondary)' }}>
          {isPolling ? 'Your mailbox is live. Checking every 10 seconds.' : 'Polling paused. Tap Resume to watch for messages.'}
        </p>
      </div>
      {isPolling && (
        <div className="flex items-center gap-2">
          <PulseDot />
          <span className="text-xs font-medium" style={{ color: '#10b981' }}>Live</span>
        </div>
      )}
    </div>
  )
}

// ─── Reader Empty State ───────────────────────────────────────────────────────

function EmptyReader() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
        <svg className="w-8 h-8 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Select a message</p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Choose an item from the inbox to read it here</p>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function CleanRoomPage() {
  const [address, setAddress] = useState<string>('')
  const [token, setToken] = useState<string>('')
  
  const [messages, setMessages] = useState<MailTmMessageMeta[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MailTmMessageContent | null>(null)
  
  const [isPolling, setIsPolling] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true) // true on boot while making account
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false)
  const [linkCopyFeedback, setLinkCopyFeedback] = useState<boolean>(false)
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set())
  const [mobileTab, setMobileTab] = useState<'inbox' | 'reader'>('inbox')

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  const prevMessageIdsRef = useRef<Set<string>>(new Set())

  // Write address into the URL so the page is bookmarkable
  const setAddressWithUrl = useCallback((newAddress: string) => {
    setAddress(newAddress)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('id', newAddress.split('@')[0])
      window.history.replaceState(null, '', url.toString())
    }
  }, [])

  // 1. Get Domain
  const getActiveDomain = async (): Promise<string> => {
    const res = await fetch(`${API_BASE}/domains`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch mail domains')
    const data = await res.json()
    if (!data['hydra:member'] || data['hydra:member'].length === 0) throw new Error('No domains available')
    return data['hydra:member'][0].domain
  }

  // 2. Auth (Create account or login)
  const authenticate = async (fullAddress: string): Promise<string> => {
    const password = getPasswordForAddress(fullAddress)
    
    // Try to get token (login)
    const tokenRes = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: fullAddress, password })
    })
    
    if (tokenRes.ok) {
      const { token } = await tokenRes.json()
      return token
    }
    
    // If login fails, try to create account
    const createRes = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: fullAddress, password })
    })
    
    if (!createRes.ok) {
      throw new Error('Failed to create or authenticate account')
    }
    
    // Try token again after creation
    const newTokenRes = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: fullAddress, password })
    })
    
    if (!newTokenRes.ok) throw new Error('Failed to acquire token after creation')
    const { token } = await newTokenRes.json()
    return token
  }

  // Boot or Generate New
  const setupAccount = useCallback(async (localPart?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const domain = await getActiveDomain()
      const lp = localPart || generateLocalPart()
      const fullAddress = `${lp}@${domain}`
      
      const jwt = await authenticate(fullAddress)
      setToken(jwt)
      setAddressWithUrl(fullAddress)
      
      setMessages([])
      setSelectedMessage(null)
      setLastChecked(null)
      setNewMessageIds(new Set())
      setMobileTab('inbox')
      prevMessageIdsRef.current = new Set()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }, [setAddressWithUrl])

  // Fetch Messages
  const fetchMessages = useCallback(async (jwt: string) => {
    if (isFetchingRef.current || !jwt) return
    isFetchingRef.current = true
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
      })
      if (!res.ok) throw new Error(`API status ${res.status}`)
      const data = await res.json()
      const msgs: MailTmMessageMeta[] = data['hydra:member'] || []
      
      const incomingIds = new Set(msgs.map((m) => m.id))
      const genuinelyNew = new Set<string>()
      for (const id of incomingIds) {
        if (!prevMessageIdsRef.current.has(id)) genuinelyNew.add(id)
      }
      prevMessageIdsRef.current = incomingIds
      setMessages(msgs)
      setLastChecked(new Date())
      if (genuinelyNew.size > 0) {
        setNewMessageIds(genuinelyNew)
        setTimeout(() => setNewMessageIds(new Set()), 3000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch inbox')
    } finally {
      isFetchingRef.current = false
    }
  }, [])

  // Read single message
  const fetchMessageContent = useCallback(async (jwt: string, id: string) => {
    setIsLoadingContent(true)
    setSelectedMessage(null)
    try {
      const res = await fetch(`${API_BASE}/messages/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: 'no-store'
      })
      if (!res.ok) throw new Error(`API status ${res.status}`)
      setSelectedMessage(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load message')
    } finally {
      setIsLoadingContent(false)
    }
  }, [])

  const handleMessageClick = useCallback((id: string) => {
    if (!token) return
    fetchMessageContent(token, id)
    setMobileTab('reader')
  }, [token, fetchMessageContent])

  const copyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
      .then(() => { setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000) })
      .catch(() => setError('Could not access clipboard.'))
  }, [address])

  const copyLink = useCallback(() => {
    if (!address) return
    const lp = address.split('@')[0]
    navigator.clipboard.writeText(`${window.location.origin}/?id=${lp}`)
      .then(() => { setLinkCopyFeedback(true); setTimeout(() => setLinkCopyFeedback(false), 2000) })
      .catch(() => setError('Could not access clipboard.'))
  }, [address])

  // Polling loop
  useEffect(() => {
    if (!token) return
    fetchMessages(token)
    if (isPolling) {
      pollingRef.current = setInterval(() => fetchMessages(token), POLL_INTERVAL_MS)
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null } }
  }, [token, isPolling, fetchMessages])

  // Boot sequence
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlId = new URLSearchParams(window.location.search).get('id')
      if (urlId && /^[a-z0-9]{10}$/.test(urlId)) {
        setupAccount(urlId)
      } else {
        setupAccount() // Generate random
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayAddress = address || '──────────'

  // ─── Message list (shared between desktop sidebar and mobile inbox tab) ──────

  const messageList = (
    <div className="flex-1 overflow-y-auto" role="list" aria-label="Email messages">
      {messages.length === 0 ? (
        <EmptyInbox isPolling={isPolling} />
      ) : (
        <div className="p-2 space-y-1">
          {messages.map((msg) => {
            const isNew = newMessageIds.has(msg.id)
            const isSelected = selectedMessage?.id === msg.id
            return (
              <button
                key={msg.id}
                role="listitem"
                onClick={() => handleMessageClick(msg.id)}
                className="w-full text-left px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-150"
                style={{
                  background: isSelected ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: isSelected ? '1px solid rgba(16,185,129,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                aria-label={`Email from ${msg.from.address}: ${msg.subject}`}
                aria-pressed={isSelected}
              >
                {isNew && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PulseDot />
                    <span className="text-[0.65rem] font-bold tracking-wider" style={{ color: '#10b981' }}>NEW</span>
                  </div>
                )}
                <p className="text-xs truncate mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>{msg.from.address}</p>
                <p className="text-sm font-medium truncate mb-1.5 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                  {msg.subject || '(no subject)'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs truncate" style={{ color: 'var(--color-text-muted)' }}>{formatDate(msg.createdAt)}</p>
                  {msg.hasAttachments && <span className="text-xs shrink-0" style={{ color: 'var(--color-cyan)' }}>📎</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  // ─── Message reader content (shared) ──────────────────────────────────────

  const readerContent = isLoadingContent ? (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#10b981', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading message…</p>
    </div>
  ) : !selectedMessage ? (
    <EmptyReader />
  ) : (
    <>
      {/* Message meta */}
      <div className="shrink-0 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-semibold mb-3 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
          {selectedMessage.subject || '(no subject)'}
        </h2>
        <div className="grid grid-cols-[48px_1fr] gap-x-3 gap-y-1 text-xs">
          <span style={{ color: 'var(--color-text-muted)' }}>From</span>
          <span className="truncate" style={{ color: 'var(--color-cyan)' }}>{selectedMessage.from.address}</span>
          <span style={{ color: 'var(--color-text-muted)' }}>To</span>
          <span className="truncate" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
            {address}
          </span>
          <span style={{ color: 'var(--color-text-muted)' }}>Date</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>{formatDate(selectedMessage.createdAt)}</span>
        </div>
        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedMessage.attachments.map((att, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                📎 <span className="truncate max-w-[120px]">{att.filename}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>({formatBytes(att.size)})</span>
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 overflow-hidden min-h-0">
        {selectedMessage.html && selectedMessage.html.length > 0 ? (
          <iframe
            title={`Email: ${selectedMessage.subject}`}
            srcDoc={selectedMessage.html[0]}
            sandbox="allow-same-origin"
            className="w-full h-full border-0 bg-white"
            aria-label="Email body content"
          />
        ) : (
          <div className="h-full overflow-y-auto p-5">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-jetbrains), monospace' }}>
              {selectedMessage.text || '(empty message body)'}
            </pre>
          </div>
        )}
      </div>
    </>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div className="flex flex-col gap-4 w-full max-w-[1200px] flex-1 max-h-[900px] h-full">

        {/* ── HEADER CARD ────────────────────────────────────────────────── */}
        <header
          className="shrink-0 flex items-center justify-between px-5 py-3 rounded-2xl"
          style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
        >
          {/* Desktop logo: full lockup */}
          <div className="hidden md:flex items-center gap-3">
            <Image
              src="/icons/notspam-full.png"
              alt="NOTSPAM.uk"
              width={200}
              height={44}
              priority
              style={{ objectFit: 'contain', filter: 'invert(1) hue-rotate(135deg) saturate(1.5) brightness(0.9)' }}
            />
          </div>
          {/* Mobile logo: shield icon only */}
          <div className="flex md:hidden items-center gap-2.5">
            <Image src="/icons/notspam.png" alt="NOTSPAM" width={32} height={32} priority style={{ objectFit: 'contain' }} />
            <span className="text-lg font-black tracking-tight" style={{ fontFamily: 'var(--font-montserrat)', color: '#10b981' }}>
              NOTSPAM<span style={{ color: '#8b949e', fontWeight: 400 }}>.uk</span>
            </span>
          </div>

          {/* Centre badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <PulseDot />
            <span className="text-xs font-semibold tracking-wider hidden sm:block" style={{ color: '#10b981' }}>ZERO-SERVER</span>
            <span className="text-xs font-semibold tracking-wider sm:hidden" style={{ color: '#10b981' }}>LIVE</span>
          </div>

          {/* New address */}
          <button
            id="new-address-btn"
            onClick={() => setupAccount()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => { if(!isLoading) { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.color = '#10b981' } }}
            onMouseLeave={(e) => { if(!isLoading) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' } }}
            aria-label="Generate a new email address"
          >
            {isLoading ? (
               <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-text-secondary)', borderTopColor: 'transparent' }} />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span className="hidden sm:inline">New Address</span>
          </button>
        </header>

        {/* ── ADDRESS CARD ───────────────────────────────────────────────── */}
        <div
          className="shrink-0 rounded-2xl px-5 py-4"
          style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
            Your Temporary Address
          </p>

          {/* Address row */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Address field */}
            <div
              className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl min-w-0"
              style={{ background: 'var(--color-bg-input)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <svg className="w-4 h-4 shrink-0" style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span
                id="active-address"
                className="flex-1 text-base font-medium tracking-tight truncate"
                style={{ fontFamily: 'var(--font-jetbrains), monospace' }}
                aria-label={`Active address: ${displayAddress}`}
              >
                <span style={{ color: '#10b981' }}>{displayAddress.split('@')[0]}</span>
                {displayAddress.includes('@') && <span style={{ color: 'var(--color-text-muted)' }}>@{displayAddress.split('@')[1]}</span>}
              </span>
              {/* Polling toggle pill */}
              <button
                id="toggle-polling-btn"
                onClick={() => setIsPolling((p) => !p)}
                className="text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-all duration-200 shrink-0"
                style={isPolling
                  ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                aria-label={isPolling ? 'Pause polling' : 'Resume polling'}
              >
                {isLoading ? '…' : isPolling ? '● Live' : '○ Paused'}
              </button>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 shrink-0">
              {/* Copy Address */}
              <button
                id="copy-address-btn"
                onClick={copyAddress}
                disabled={!address}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm cursor-pointer transition-all duration-200 disabled:opacity-40"
                style={copyFeedback
                  ? { background: '#059669', color: '#fff', boxShadow: '0 0 20px rgba(16,185,129,0.3)' }
                  : { background: '#10b981', color: '#0b0f1a', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}
                onMouseEnter={(e) => { if (!copyFeedback) e.currentTarget.style.background = '#059669' }}
                onMouseLeave={(e) => { if (!copyFeedback) e.currentTarget.style.background = '#10b981' }}
                aria-label="Copy email address"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {copyFeedback
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  }
                </svg>
                <span>{copyFeedback ? 'Copied!' : 'Copy'}</span>
              </button>

              {/* Copy Link */}
              <button
                id="copy-link-btn"
                onClick={copyLink}
                disabled={!address}
                title="Copy bookmarkable link to this inbox"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all duration-200 disabled:opacity-40"
                style={linkCopyFeedback
                  ? { background: 'rgba(34,211,238,0.15)', color: '#22d3ee', border: '1px solid rgba(34,211,238,0.4)' }
                  : { background: 'rgba(255,255,255,0.04)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
                onMouseEnter={(e) => { if (!linkCopyFeedback) { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = '#22d3ee' } }}
                onMouseLeave={(e) => { if (!linkCopyFeedback) { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-secondary)' } }}
                aria-label="Copy bookmarkable link"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  {linkCopyFeedback
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  }
                </svg>
                <span className="hidden sm:inline">{linkCopyFeedback ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div role="alert" className="mt-2.5 flex items-center justify-between gap-4 px-4 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149' }}>
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100 cursor-pointer" aria-label="Dismiss">✕</button>
            </div>
          )}
        </div>

        {/* ── INBOX + READER ─────────────────────────────────────────────── */}

        {/* Desktop: side-by-side panels */}
        <div className="hidden lg:flex flex-1 gap-3 min-h-0">
          {/* Sidebar */}
          <aside
            className="w-[300px] xl:w-[340px] shrink-0 flex flex-col rounded-2xl overflow-hidden"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
            aria-label="Inbox"
          >
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: '#10b981' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Inbox</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  {messages.length}
                </span>
              </div>
            </div>
            {messageList}
          </aside>

          {/* Reader */}
          <section
            className="flex-1 flex flex-col rounded-2xl overflow-hidden min-w-0"
            style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}
            aria-label="Message reader"
          >
            {readerContent}
          </section>
        </div>

        {/* Mobile: tabbed panels */}
        <div className="lg:hidden flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0" style={{ background: 'var(--color-bg-panel)', border: '1px solid var(--color-border)' }}>
          {/* Tabs */}
          <div className="shrink-0 flex" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium cursor-pointer transition-all duration-200"
              style={mobileTab === 'inbox'
                ? { color: '#10b981', borderBottom: '2px solid #10b981', background: 'rgba(16,185,129,0.05)' }
                : { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }}
              onClick={() => setMobileTab('inbox')}
              aria-selected={mobileTab === 'inbox'}
              role="tab"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              Inbox
              {messages.length > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                  {messages.length}
                </span>
              )}
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium cursor-pointer transition-all duration-200"
              style={mobileTab === 'reader'
                ? { color: '#10b981', borderBottom: '2px solid #10b981', background: 'rgba(16,185,129,0.05)' }
                : { color: 'var(--color-text-muted)', borderBottom: '2px solid transparent' }}
              onClick={() => setMobileTab('reader')}
              aria-selected={mobileTab === 'reader'}
              role="tab"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Message
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {mobileTab === 'inbox' ? messageList : readerContent}
          </div>
        </div>

      </div>
    </div>
  )
}
