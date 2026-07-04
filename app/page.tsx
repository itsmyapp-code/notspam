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

const getPasswordForAddress = (address: string) => `${address}-notspam-secure-2026`

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

  // Write address into the URL so the page is bookmarkable
  const setAddressWithUrl = useCallback((newAddress: string) => {
    setAddress(newAddress)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('id', newAddress.split('@')[0])
      window.history.replaceState(null, '', url.toString())
    }
  }, [])

  // 1. Auth (Create or login to ephemeral account)
  const setupAccount = useCallback(async (existingId?: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const domain = await getActiveDomain()
      const username = existingId || generateRandomString(ADDRESS_LENGTH)
      const fullAddress = `${username}@${domain}`
      const password = getPasswordForAddress(fullAddress)
      
      // Try to login first (if returning)
      const loginRes = await fetch(`${API_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: fullAddress, password })
      })

      let jwt = ''
      if (loginRes.ok) {
        const data = await loginRes.json()
        jwt = data.token
      } else {
        // If login fails, create the account
        const createRes = await fetch(`${API_BASE}/accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullAddress, password })
        })
        
        if (!createRes.ok) {
          throw new Error('Failed to create account on the Mail.tm network')
        }
        
        // Get JWT Token after creation
        const tokenRes = await fetch(`${API_BASE}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: fullAddress, password })
        })
        
        if (!tokenRes.ok) throw new Error('Failed to acquire token after creation')
        const data = await tokenRes.json()
        jwt = data.token
      }
      
      // Set state
      setToken(jwt)
      setAddressWithUrl(fullAddress)
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
  }, [setAddressWithUrl])

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
      const msgData = await res.json()
      
      // Load inline images (CIDs)
      let htmlContent = msgData.html && msgData.html.length > 0 ? msgData.html[0] : ''
      if (htmlContent && msgData.attachments && msgData.attachments.length > 0) {
        // Process all attachments in case images were sent as octet-stream
        if (msgData.attachments.length > 0) {
          const imageBlobs = new Map<string, string>()
          
          for (const att of msgData.attachments) {
            try {
              const urlPath = att.downloadUrl || `/messages/${msgData.id}/attachment/${att.id}`
              const attRes = await fetch(`${API_BASE}${urlPath}`, { 
                headers: { Authorization: `Bearer ${jwt}` } 
              })
              if (attRes.ok) {
                const arrayBuffer = await attRes.arrayBuffer()
                let binary = ''
                const bytes = new Uint8Array(arrayBuffer)
                for (let i = 0; i < bytes.byteLength; i++) {
                  binary += String.fromCharCode(bytes[i])
                }
                const base64 = window.btoa(binary)
                const dataUrl = `data:${att.contentType || 'image/png'};base64,${base64}`
                
                imageBlobs.set(att.id, dataUrl)
                if (att.filename) imageBlobs.set(att.filename, dataUrl)
                if (att.contentId) imageBlobs.set(att.contentId.replace(/[<>]/g, ''), dataUrl)
              }
            } catch (e) {
              console.error('Failed to load inline image', e)
            }
          }
          
          if (imageBlobs.size > 0) {
            // Aggressively replace ANY src attribute or cid: tag
            htmlContent = htmlContent.replace(/cid:([^"'\s>]+)/gi, (match: string, cid: string) => {
              const cleanCid = cid.replace(/[<>]/g, '')
              if (imageBlobs.has(cleanCid)) return imageBlobs.get(cleanCid)!
              return Array.from(imageBlobs.values())[0] || match
            })
            htmlContent = htmlContent.replace(/src=["'](?:cid:)?([^"']+)["']/gi, (match: string, cid: string) => {
              if (match.toLowerCase().includes('http') || match.toLowerCase().includes('data:')) return match;
              const cleanCid = cid.replace(/[<>]/g, '')
              if (imageBlobs.has(cleanCid)) return `src="${imageBlobs.get(cleanCid)}"`
              return `src="${Array.from(imageBlobs.values())[0]}"`
            })
          }
        }
        msgData.html[0] = htmlContent
      }
      
      setSelectedMessage(msgData)
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

  const downloadAttachment = useCallback(async (jwt: string, msgId: string, att: any) => {
    try {
      const urlPath = att.downloadUrl || `/messages/${msgId}/attachment/${att.id}`
      const attRes = await fetch(`${API_BASE}${urlPath}`, { 
        headers: { Authorization: `Bearer ${jwt}` } 
      })
      if (!attRes.ok) throw new Error('Download failed')
      const blob = await attRes.blob()
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = att.filename || 'attachment'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Failed to securely download attachment.')
    }
  }, [])

  const deleteMessage = useCallback(async (jwt: string, msgId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/messages/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` }
      })
      if (!res.ok) throw new Error('Failed to delete message')
      
      setMessages(prev => prev.filter(m => m.id !== msgId))
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null)
      }
    } catch (err) {
      setError('Failed to delete the message.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMessage])

  const handlePrint = useCallback(() => {
    if (!selectedMessage) return
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Email - NOTSPAM.uk</title>
            <style>
              body { font-family: sans-serif; padding: 20px; color: #000; background: #fff; margin: 0; }
              .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px; page-break-after: avoid; break-after: avoid; }
              .header h2 { margin: 0 0 10px 0; font-size: 24px; }
              .header p { margin: 4px 0; color: #333; font-size: 14px; }
              .content { font-size: 14px; line-height: 1.5; page-break-before: avoid; break-before: avoid; }
              /* Aggressively strip heights from email HTML to prevent multi-page blank gaps */
              .content, .content * { max-height: none !important; height: auto !important; min-height: 0 !important; }
              img { max-width: 100%; height: auto !important; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${selectedMessage.subject || '(no subject)'}</h2>
              <p><strong>From:</strong> ${selectedMessage.from.address}</p>
              <p><strong>To:</strong> ${address}</p>
              <p><strong>Date:</strong> ${formatDate(selectedMessage.createdAt)}</p>
            </div>
            <div class="content">${selectedMessage.html[0]}</div>
            <script>
              window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
            </script>
          </body>
        </html>
      `)
      printWindow.document.close()
    } else {
      window.print() // Fallback if popup blocked
    }
  }, [selectedMessage, address])

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

  // Boot sequence (Check for ?id= URL parameter)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlId = new URLSearchParams(window.location.search).get('id')
      if (urlId && /^[a-z0-9]{10}$/.test(urlId)) {
        setupAccount(urlId)
      } else {
        setupAccount() // Generate new
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayAddress = address || '──────────'

  // ─── UI Views ──────────────────────────────────────────────────────────────

  const messageList = (
    <div className="flex-1 overflow-y-auto" role="list" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
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
    <div className="flex flex-col items-center justify-center h-full gap-4 print:hidden">
      <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin border-emerald-500" />
      <p className="text-sm text-slate-400">Loading message…</p>
    </div>
  ) : !selectedMessage ? (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8 print:hidden">
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
      <div className="shrink-0 py-4 border-b border-slate-800 print:border-b-0 print:p-0 print:mb-4" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-base font-semibold leading-tight text-slate-100">
            {selectedMessage.subject || '(no subject)'}
          </h2>
          <div className="print:hidden shrink-0 flex items-center gap-2">
            <button
              onClick={() => deleteMessage(token, selectedMessage.id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50"
              title="Delete Email"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Delete</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-emerald-500 hover:bg-slate-800 transition-colors border border-slate-700"
              title="Print to PDF"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-[48px_1fr] gap-x-3 gap-y-1 text-xs print:text-sm">
          <span className="text-slate-500">From</span>
          <span className="truncate text-cyan-400 print:text-blue-600">{selectedMessage.from.address}</span>
          <span className="text-slate-500">To</span>
          <span className="truncate text-slate-300 font-mono print:text-black">{address}</span>
          <span className="text-slate-500">Date</span>
          <span className="text-slate-400 print:text-black">{formatDate(selectedMessage.createdAt)}</span>
        </div>
        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 print:hidden">
            {selectedMessage.attachments.map((att, idx) => (
              <button 
                key={idx} 
                onClick={() => downloadAttachment(token, selectedMessage.id, att)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/50 cursor-pointer transition-colors shadow-sm"
                title="Download Attachment securely"
              >
                📎 <span className="truncate max-w-[120px]">{att.filename}</span>
                <span className="text-slate-500">({formatBytes(att.size)})</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden min-h-0 bg-white">
        {selectedMessage.html && selectedMessage.html.length > 0 ? (
          <iframe
            title="Message content"
            srcDoc={selectedMessage.html[0]}
            sandbox="allow-same-origin allow-scripts allow-popups"
            className="w-full h-full border-0 print:hidden"
          />
        ) : (
          <div className="h-full overflow-y-auto p-5 bg-slate-950 print:bg-white print:overflow-visible">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-mono text-slate-300 print:text-black">
              {selectedMessage.text || '(empty message body)'}
            </pre>
          </div>
        )}
      </div>
    </>
  )

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12 sm:p-6 sm:pt-20 lg:p-12 lg:pt-32 bg-slate-900 text-slate-200">
      <div className="flex flex-col gap-4 w-full max-w-[1200px] h-[calc(100vh-160px)] min-h-[600px] max-h-[900px]">

        {/* HEADER */}
        <header className="shrink-0 flex items-center justify-between px-8 py-6 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-6">
            <Image src="/icons/notspam.png" alt="NOTSPAM Shield" width={128} height={128} priority className="object-contain" />
            <h1 className="text-6xl font-black tracking-tight">
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
                onClick={() => setupAccount()}
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
            <div className="shrink-0 flex items-center justify-between py-5 border-b border-slate-800" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-100">Inbox</span>
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
