// src/pages/CommunityPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  collection, addDoc, getDocs, query, orderBy,
  limit, serverTimestamp, updateDoc, deleteDoc, doc, increment
} from 'firebase/firestore'
import { db } from '../firebase/firebaseConfig'
import { formatRelative } from '../utils/dateUtils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'all',           label: '🌐 All' },
  { id: 'anxiety',       label: '😰 Anxiety' },
  { id: 'depression',    label: '💙 Depression' },
  { id: 'stress',        label: '😤 Stress' },
  { id: 'relationships', label: '❤️ Relationships' },
  { id: 'wins',          label: '🏆 Small Wins' },
  { id: 'advice',        label: '💡 Advice' },
]

const ANON_NAMES = [
  'Calm Panda 🐼', 'Gentle Deer 🦌', 'Brave Owl 🦉', 'Kind Fox 🦊',
  'Quiet Moon 🌙', 'Soft Cloud ☁️', 'Warm Star ⭐', 'Peaceful Tree 🌳',
  'Strong River 🌊', 'Kind Lotus 🪷', 'Mindful Bear 🐻', 'Hopeful Bird 🐦',
]

const getAnonName = (uid) => {
  if (!uid) return ANON_NAMES[0]
  const idx = uid.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % ANON_NAMES.length
  return ANON_NAMES[idx]
}

const PostCard = ({ post, onLike, onReply, onDelete, currentUid }) => {
  const [showReplies, setShowReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleReply = async () => {
    if (!replyText.trim() || !currentUid) return
    setSubmitting(true)
    try {
      await onReply(post.id, replyText.trim())
      setReplyText('')
      toast.success('Reply posted 🌿')
    } catch { toast.error('Could not post reply') }
    setSubmitting(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    setDeleting(true)
    try {
      await onDelete(post.id)
      toast.success('Post deleted')
    } catch { toast.error('Could not delete post') }
    setDeleting(false)
  }

  const anonName = getAnonName(post.uid)
  const categoryObj = CATEGORIES.find(c => c.id === post.category)
  const isOwner = currentUid && post.uid === currentUid

  return (
    <div className="card hover:shadow-hover transition-all duration-200">
      {/* Post header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-violet-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {anonName[0]}
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-700">
              {anonName} {isOwner && <span className="text-xs text-sky-500 font-normal">(you)</span>}
            </div>
            <div className="text-xs text-slate-400">{formatRelative(post.timestamp)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {categoryObj && (
            <span className="badge bg-sky-50 text-sky-700 text-xs">{categoryObj.label}</span>
          )}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs text-slate-300 hover:text-rose-400 transition-colors p-1"
              title="Delete post"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {/* Post content */}
      <p className="text-slate-700 text-sm leading-relaxed mb-4">{post.text}</p>

      {/* Actions */}
      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={() => onLike(post.id)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-rose-500 transition-colors"
        >
          <span>🤍</span>
          <span>{post.likes || 0} Hugs</span>
        </button>
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="flex items-center gap-1.5 text-slate-400 hover:text-sky-500 transition-colors"
        >
          <span>💬</span>
          <span>{post.replyCount || 0} Replies</span>
        </button>
      </div>

      {/* Replies */}
      {showReplies && (
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-3 animate-slide-up">
          {(post.replies || []).map((reply, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 text-xs flex-shrink-0 mt-0.5">
                {getAnonName(reply.uid)[0]}
              </div>
              <div className="bg-slate-50 rounded-2xl rounded-tl-md px-3 py-2 flex-1">
                <div className="text-xs font-medium text-slate-600 mb-0.5">{getAnonName(reply.uid)}</div>
                <p className="text-sm text-slate-600">{reply.text}</p>
              </div>
            </div>
          ))}

          {currentUid ? (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Write a supportive reply..."
                className="input flex-1 text-sm py-2"
                onKeyDown={e => e.key === 'Enter' && handleReply()}
              />
              <button
                onClick={handleReply}
                disabled={!replyText.trim() || submitting}
                className="w-9 h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
              >
                {submitting ? '...' : '→'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">Sign in to reply</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [posts, setPosts]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [text, setText]                 = useState('')
  const [category, setCategory]         = useState('anxiety')
  const [activeCategory, setActiveCategory] = useState('all')
  const [submitting, setSubmitting]     = useState(false)
  const [charCount, setCharCount]       = useState(0)

  const MAX_CHARS = 400

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const q = query(collection(db, 'communityPosts'), orderBy('timestamp', 'desc'), limit(50))
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchPosts() }, [])

  const handlePost = async () => {
    if (!text.trim()) return
    if (!user) return toast.error('Please sign in to post')
    if (user.isAnonymous) return toast.error('Guest users cannot post. Please create an account.')
    if (text.length > MAX_CHARS) return toast.error(`Max ${MAX_CHARS} characters`)

    setSubmitting(true)
    try {
      const docRef = await addDoc(collection(db, 'communityPosts'), {
        uid: user.uid,
        text: text.trim(),
        category,
        likes: 0,
        replyCount: 0,
        replies: [],
        timestamp: serverTimestamp(),
      })
      setPosts(prev => [{
        id: docRef.id, uid: user.uid, text: text.trim(),
        category, likes: 0, replyCount: 0, replies: [],
        timestamp: { toDate: () => new Date() }
      }, ...prev])
      setText('')
      setCharCount(0)
      toast.success('Posted anonymously 🌿')
    } catch { toast.error('Could not post. Try again.') }
    setSubmitting(false)
  }

  const handleLike = async (postId) => {
    await updateDoc(doc(db, 'communityPosts', postId), { likes: increment(1) })
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: (p.likes || 0) + 1 } : p))
  }

  const handleReply = async (postId, replyText) => {
    const reply = { uid: user.uid, text: replyText, timestamp: new Date().toISOString() }
    const post = posts.find(p => p.id === postId)
    const newReplies = [...(post?.replies || []), reply]
    await updateDoc(doc(db, 'communityPosts', postId), {
      replies: newReplies,
      replyCount: increment(1)
    })
    setPosts(prev => prev.map(p => p.id === postId
      ? { ...p, replies: newReplies, replyCount: (p.replyCount || 0) + 1 }
      : p
    ))
  }

  const handleDelete = async (postId) => {
    await deleteDoc(doc(db, 'communityPosts', postId))
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const filtered = activeCategory === 'all' ? posts : posts.filter(p => p.category === activeCategory)

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-10 page-enter">
      <div className="max-w-2xl mx-auto px-4 space-y-6">

        {/* Header */}
        <div>
          <h1 className="font-display text-3xl text-slate-800">Community</h1>
          <p className="text-slate-500 text-sm mt-1">Share anonymously · Support each other 💙</p>
        </div>

        {/* Guidelines banner */}
        <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-sm text-sky-700">
          <p className="font-semibold mb-1">🌿 Community Guidelines</p>
          <p className="text-sky-600 text-xs leading-relaxed">
            Be kind and supportive. All posts are anonymous. Do not share personal contact details.
            For crisis support, please call iCall: 9152987821.
          </p>
        </div>

        {/* Compose */}
        <div className="card">
          <h2 className="font-display text-lg text-slate-800 mb-4">Share your thoughts</h2>

          <div className="flex gap-2 flex-wrap mb-3">
            {CATEGORIES.slice(1).map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                  category === cat.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-sky-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setCharCount(e.target.value.length) }}
            placeholder="What's on your mind? You're among friends here..."
            rows={3}
            maxLength={MAX_CHARS}
            className="input resize-none mb-2"
          />
          <div className="flex justify-between items-center">
            <span className={`text-xs ${charCount > MAX_CHARS * 0.9 ? 'text-rose-400' : 'text-slate-400'}`}>
              {charCount}/{MAX_CHARS}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">🔒 Posted anonymously</span>
              <button
                onClick={handlePost}
                disabled={!text.trim() || submitting || !user || user?.isAnonymous}
                className="btn-primary py-2 px-5 text-sm disabled:opacity-40"
              >
                {submitting ? '...' : 'Post'}
              </button>
            </div>
          </div>
          {!user && <p className="text-xs text-amber-600 mt-2">⚠️ Sign in to post and reply</p>}
          {user?.isAnonymous && <p className="text-xs text-amber-600 mt-2">⚠️ Guest users can't post — <a href="/profile" className="underline font-semibold">upgrade your account</a> to participate</p>}
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap text-xs px-3 py-2 rounded-xl font-medium transition-all flex-shrink-0 ${
                activeCategory === cat.id ? 'bg-sky-500 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-sky-50 shadow-card'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🌱</div>
            <p className="text-slate-500">No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onReply={handleReply}
                onDelete={handleDelete}
                currentUid={user?.uid}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
