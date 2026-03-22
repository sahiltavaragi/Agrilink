import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Layout from '../components/Layout'
import { Heart, MessageCircle, Send, Image, Users, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CommunityPage() {
  const { user, profile } = useAuth()
  const qc = useQueryClient()
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [commentText, setCommentText] = useState('')

  const { data: posts, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30)
      if (error) throw error
      return data
    },
    refetchInterval: 15000,
  })

  const { data: comments } = useQuery({
    queryKey: ['comments', expandedPost],
    queryFn: async () => {
      if (!expandedPost) return []
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(full_name)')
        .eq('post_id', expandedPost)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!expandedPost,
  })

  // Following list
  const { data: followingList } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('follows').select('followed_id').eq('follower_id', user.id)
      if (error) throw error
      return data.map(d => d.followed_id)
    },
    enabled: !!user,
  })

  // Handle follow
  const followMutation = useMutation({
    mutationFn: async (targetUserId) => {
      const isFollowing = followingList?.includes(targetUserId)
      if (isFollowing) {
        const { error } = await supabase.from('follows').delete().eq('follower_id', user.id).eq('followed_id', targetUserId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id: targetUserId })
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['following'] })
      qc.invalidateQueries({ queryKey: ['profile-stats'] })
      toast.success('Updated following!')
    },
    onError: () => {
      toast.error('Failed to update following status')
    }
  })

  async function handlePost() {
    if (!newPost.trim() || !user) return
    setPosting(true)
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: newPost.trim(),
      })
      if (error) throw error
      setNewPost('')
      qc.invalidateQueries({ queryKey: ['community-posts'] })
      toast.success('Post shared! 🌱')
    } catch {
      toast.error('Failed to post')
    } finally {
      setPosting(false)
    }
  }

  async function handleLike(postId, currentLikes) {
    if (!user) { toast.error('Please sign in to like posts'); return }
    await supabase.from('posts').update({ likes_count: currentLikes + 1 }).eq('id', postId)
    qc.invalidateQueries({ queryKey: ['community-posts'] })
  }

  async function handleComment() {
    if (!commentText.trim() || !user || !expandedPost) return
    const { error } = await supabase.from('comments').insert({
      post_id: expandedPost, user_id: user.id, content: commentText.trim()
    })
    if (!error) {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['comments', expandedPost] })
      toast.success('Comment added!')
    }
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center shadow-glow-green">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Farmer Community</h1>
            <p className="text-gray-400 text-sm">Share tips, ask questions, connect with farmers</p>
          </div>
        </div>

        {/* New Post Box */}
        {user ? (
          <div className="card p-5 mb-6">
            <div className="flex gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {profile?.full_name?.[0] || 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  placeholder={`What's on your mind, ${profile?.full_name?.split(' ')[0] || 'Farmer'}? Share a tip or question...`}
                  rows={3}
                  className="input-field w-full resize-none text-sm"
                />
                <div className="flex justify-end mt-3">
                  <button onClick={handlePost} disabled={!newPost.trim() || posting}
                    className="btn-primary text-sm px-5 py-2 disabled:opacity-50">
                    {posting ? '...' : <><Send size={14} /> Share</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-5 mb-6 text-center">
            <p className="text-gray-400 text-sm">
              <a href="/login" className="text-primary-400 hover:underline">Sign in</a> to post and engage with the community
            </p>
          </div>
        )}

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({length:4}).map((_,i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="flex gap-3"><div className="skeleton w-9 h-9 rounded-xl" /><div className="skeleton h-4 w-32 rounded" /></div>
                <div className="skeleton h-16 rounded" />
              </div>
            ))}
          </div>
        ) : posts?.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => (
              <div key={post.id} className="card p-5 animate-fade-in">
                {/* Author */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 bg-gradient-to-br from-primary-700 to-primary-900 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {post.users?.full_name?.[0] || 'F'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium text-sm">{post.users?.full_name || 'Farmer'}</p>
                      {user && user.id !== post.user_id && (
                        <button
                          onClick={() => followMutation.mutate(post.user_id)}
                          disabled={followMutation.isPending}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                            followingList?.includes(post.user_id)
                              ? 'bg-dark-700 text-gray-400 border-white/10 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50'
                              : 'bg-primary-900/30 text-primary-400 border-primary-500/30 hover:bg-primary-600 hover:text-white'
                          }`}
                        >
                          {followingList?.includes(post.user_id) ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs">{timeAgo(post.created_at)}</p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <img src={post.image_url} alt="post" className="w-full rounded-xl object-cover max-h-80 mb-4" />
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 text-gray-500">
                  <button
                    onClick={() => handleLike(post.id, post.likes_count || 0)}
                    className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors group"
                  >
                    <Heart size={15} className="group-hover:fill-red-400 transition-all" />
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 text-xs hover:text-primary-400 transition-colors"
                  >
                    <MessageCircle size={15} />
                    <span>Comment</span>
                  </button>
                </div>

                {/* Comments Section */}
                {expandedPost === post.id && (
                  <div className="mt-4 pt-4 border-t border-white/5 animate-slide-up">
                    <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                      {comments?.map(c => (
                        <div key={c.id} className="flex gap-2.5">
                          <div className="w-7 h-7 bg-primary-900 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {c.users?.full_name?.[0] || 'F'}
                          </div>
                          <div className="flex-1 bg-dark-700/60 rounded-xl px-3 py-2">
                            <p className="text-white text-xs font-medium">{c.users?.full_name}</p>
                            <p className="text-gray-400 text-xs mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {user && (
                      <div className="flex gap-2">
                        <input
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleComment()}
                          placeholder="Write a comment..."
                          className="input-field flex-1 text-sm py-2"
                        />
                        <button onClick={handleComment} className="btn-primary px-4 py-2 text-sm">
                          <Send size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="text-5xl mb-4">🌾</div>
            <h3 className="font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400 text-sm">Be the first to share something with the community!</p>
          </div>
        )}
      </div>
    </Layout>
  )
}
