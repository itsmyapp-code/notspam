'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
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

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function CleanRoomPage() {
  const [address, setAddress] = useState<string>('')
  const [token, setToken] = useState<string>('')
  
  const [messages, setMessages] = useState<MailTmMessageMeta[]>([])
  const [selectedMessage, setSelectedMessage] = useState<MailTmMessageContent | null>(null)
  
  const [isPolling, setIsPolling] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false)
  
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set())
  const [mobileTab, setMobileTab] = useState<'inbox' | 'reader'>('inbox')

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isFetchingRef = useRef<boolean>(false)
  const prevMessageIdsRef = useRef<Set<string>>(new Set())

  // Get active free domain from Mail.tm
  const getActiveDomain = async (): Promise<string> => {
    const res = await fetch(`${API_BASE}/domains`, { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to fetch mail domains')
    const data = await res.json()
    if (!data['hydra:member'] || data['hydra:member'].length === 0) throw new Error('No domains available')
    return data['hydra:member'][0].domain
  }

  // 1. Auth (Create anonymous ephemeral account)
  const setupAccount = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const domain = await getActiveDomain()
      const username = generateRandomString(ADDRESS_LENGTH)
      const password = generateRandomString(16) // Strong random password
      const fullAddress = `${username}@${domain}`
      
      const createRes = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress, password })
      })
      
      if (!createRes.ok) {
        throw new Error('Failed to create account on the Mail.tm network')
      }
      
      // Get JWT Token
      const tokenRes = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress, password })
      })
      
      if (!tokenRes.ok) throw new Error('Failed to acquire token after creation')
      const { token: jwt } = await tokenRes.json()
      
      // Set completely ephemeral state
      setToken(jwt)
      setAddress(fullAddress)
      setMessages([])
      setSelectedMessage(null)
      setNewMessageIds(new Set())
      setMobileTab('inbox')
      prevMessageIdsRef.current = new Set()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch Messages
  const fetchMessages = useCallback(async (jwt: string) => {
    if (isFetchingRef.current || !jwt) return
    isFetchingRef.current = true
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
      
      if (genuinelyNew.size > 0) {
        setNewMessageIds(genuinelyNew)
        setTimeout(() => setNewMessageIds(new Set()), 3000)
      }
    } catch (err) {
      console.error(err)
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
      console.error(err)
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

  // Polling loop
  useEffect(() => {
    if (!token) return
    fetchMessages(token)
    if (isPolling) {
      pollingRef.current = setInterval(() => fetchMessages(token), POLL_INTERVAL_MS)
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null } }
  }, [token, isPolling, fetchMessages])

  // Boot sequence (No URL persistence, pure ephemeral)
  useEffect(() => {
    setupAccount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayAddress = address || '──────────'

  // ─── UI Views ──────────────────────────────────────────────────────────────

  const messageList = (
    <div className="flex-1 overflow-y-auto" role="list">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6 py-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: '#f8fafc' }}>Awaiting Emails</p>
            <p className="text-xs leading-relaxed max-w-[160px]" style={{ color: '#94a3b8' }}>
              {isPolling ? 'Your mailbox is live. Checking every 10 seconds.' : 'Polling paused.'}
            </p>
          </div>
          {isPolling && (
            <div className="flex items-center gap-2">
              <PulseDot />
              <span className="text-xs font-medium text-emerald-500">Live</span>
            </div>
          )}
        </div>
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
              >
                {isNew && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <PulseDot />
                    <span className="text-[0.65rem] font-bold tracking-wider text-emerald-500">NEW</span>
                  </div>
                )}
                <p className="text-xs truncate mb-0.5 text-slate-400">{msg.from.address}</p>
                <p className="text-sm font-medium truncate mb-1.5 leading-tight text-slate-100">
                  {msg.subject || '(no subject)'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs truncate text-slate-500">{formatDate(msg.createdAt)}</p>
                  {msg.hasAttachments && <span className="text-xs shrink-0 text-cyan-400">📎</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  const readerContent = isLoadingContent ? (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin border-emerald-500" />
      <p className="text-sm text-slate-400">Loading message…</p>
    </div>
  ) : !selectedMessage ? (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800/50 border border-dashed border-slate-700">
        <svg className="w-8 h-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">Select a message</p>
        <p className="text-xs mt-1 text-slate-500">Choose an item from the inbox to read it here</p>
      </div>
    </div>
  ) : (
    <>
      <div className="shrink-0 px-5 py-4 border-b border-slate-800">
        <h2 className="text-base font-semibold mb-3 leading-tight text-slate-100">
          {selectedMessage.subject || '(no subject)'}
        </h2>
        <div className="grid grid-cols-[48px_1fr] gap-x-3 gap-y-1 text-xs">
          <span className="text-slate-500">From</span>
          <span className="truncate text-cyan-400">{selectedMessage.from.address}</span>
          <span className="text-slate-500">To</span>
          <span className="truncate text-slate-300 font-mono">{address}</span>
          <span className="text-slate-500">Date</span>
          <span className="text-slate-400">{formatDate(selectedMessage.createdAt)}</span>
        </div>
        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedMessage.attachments.map((att, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300">
                📎 <span className="truncate max-w-[120px]">{att.filename}</span>
                <span className="text-slate-500">({formatBytes(att.size)})</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden min-h-0 bg-white">
        {selectedMessage.html && selectedMessage.html.length > 0 ? (
          <iframe
            title="Message content"
            srcDoc={selectedMessage.html[0]}
            sandbox="allow-same-origin"
            className="w-full h-full border-0"
          />
        ) : (
          <div className="h-full overflow-y-auto p-5 bg-slate-950">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-slate-300">
              {selectedMessage.text || '(empty message body)'}
            </pre>
          </div>
        )}
      </div>
    </>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 bg-slate-900 text-slate-200">
      <div className="flex flex-col gap-4 w-full max-w-[1200px] flex-1 max-h-[900px] h-full">

        {/* HEADER */}
        <header className="shrink-0 flex items-center justify-between px-5 py-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <Image src="/icons/notspam.png" alt="NOTSPAM Shield" width={32} height={32} priority className="object-contain" />
            <h1 className="text-xl font-black tracking-tight">
              <span className="text-emerald-500">NOTSPAM</span>
              <span className="text-slate-400 font-normal">.uk</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <PulseDot />
            <span className="text-xs font-semibold tracking-wider text-emerald-500">VERIFIED ZERO-SERVER</span>
          </div>
        </header>

        {/* CONTROL DASHBOARD */}
        <div className="shrink-0 rounded-2xl px-5 py-4 bg-slate-950 border border-slate-800">
          <p className="text-[10px] font-semibold tracking-widest uppercase mb-2.5 text-slate-500">
            Your Temporary Address
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl min-w-0 bg-slate-900 border border-emerald-500/20">
              <svg className="w-4 h-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="flex-1 text-base font-medium tracking-tight truncate font-mono">
                <span className="text-emerald-500">{displayAddress.split('@')[0]}</span>
                {displayAddress.includes('@') && <span className="text-slate-500">@{displayAddress.split('@')[1]}</span>}
              </span>
              <button
                onClick={() => setIsPolling(!isPolling)}
                className={`text-xs font-medium px-2.5 py-1 rounded-full transition-all shrink-0 ${
                  isPolling ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {isLoading ? '…' : isPolling ? '● Live' : '○ Paused'}
              </button>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={copyAddress}
                disabled={!address || isLoading}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${
                  copyFeedback 
                    ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-emerald-500 text-slate-950 shadow-[0_4px_15px_rgba(16,185,129,0.2)] hover:bg-emerald-600'
                }`}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {copyFeedback 
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  }
                </svg>
                <span>{copyFeedback ? 'Copied!' : 'Copy Clean Address'}</span>
              </button>
              
              <button
                onClick={setupAccount}
                disabled={isLoading}
                className="flex items-center justify-center px-4 py-3 rounded-xl transition-all disabled:opacity-50 bg-slate-800 text-slate-300 hover:text-emerald-500 hover:border-emerald-500/40 border border-slate-700"
                aria-label="Generate New Address"
                title="Generate New Address"
              >
                {isLoading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin border-slate-400" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-center justify-between gap-4 px-4 py-2.5 rounded-xl text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-500">
              <span>⚠ {error}</span>
              <button onClick={() => setError(null)} className="opacity-70 hover:opacity-100">✕</button>
            </div>
          )}
        </div>

        {/* DUAL SPLIT PANE */}
        <div className="hidden lg:grid grid-cols-[1fr_2fr] gap-3 flex-1 min-h-0">
          <aside className="flex flex-col rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">Inbox</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                  {messages.length}
                </span>
              </div>
            </div>
            {messageList}
          </aside>

          <section className="flex flex-col rounded-2xl overflow-hidden bg-slate-950 border border-slate-800">
            {readerContent}
          </section>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden flex-1 flex flex-col rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 min-h-0">
          <div className="shrink-0 flex border-b border-slate-800">
            <button
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                mobileTab === 'inbox' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-slate-500 border-b-2 border-transparent'
              }`}
              onClick={() => setMobileTab('inbox')}
            >
              Inbox
            </button>
            <button
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                mobileTab === 'reader' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5' : 'text-slate-500 border-b-2 border-transparent'
              }`}
              onClick={() => setMobileTab('reader')}
            >
              Message
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {mobileTab === 'inbox' ? messageList : readerContent}
          </div>
        </div>

      </div>
    </div>
  )
}
