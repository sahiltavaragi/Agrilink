import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Listen for profile changes (Realtime)
  useEffect(() => {
    let profileSubscription = null
    if (user?.id) {
      profileSubscription = supabase
        .channel(`public:users:id=eq.${user.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
          setProfile(payload.new)
        })
        .subscribe()
    }

    return () => {
      if (profileSubscription) profileSubscription.unsubscribe()
    }
  }, [user?.id])

  // Fallback: Refetch profile every 10s to ensure state is in sync
  useEffect(() => {
    if (!user?.id) return
    const interval = setInterval(() => {
      fetchProfile(user.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [user?.id])

  async function fetchProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // No profile row found — create one automatically
        const { data: authUser } = await supabase.auth.getUser()
        const { data: newProfile } = await supabase
          .from('users')
          .insert({
            id: userId,
            full_name: authUser?.user?.user_metadata?.full_name || authUser?.user?.email?.split('@')[0] || 'Farmer',
            role: 'buyer',
            is_approved_seller: false,
            wallet_balance: 0,
          })
          .select()
          .single()
        if (newProfile) setProfile(newProfile)
      } else if (!error) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Profile fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        full_name: fullName,
        role: 'buyer',
      })
    }
    return data
  }

  async function signIn(email, password) {
    let { data, error } = await supabase.auth.signInWithPassword({ email, password })
    
    // Auto-signup fallback for development/testing
    if (error && error.message === 'Invalid login credentials') {
      try {
        const { data: signUpData, error: signUpError } = await signUp(email, password, email.split('@')[0])
        if (!signUpError && signUpData.user) {
          // If signup requires email confirmation, signInWithPassword will still fail, 
          // but if it doesn't, we can try signing in again or just return the session if we got it.
          if (signUpData.session) {
            return signUpData
          } else {
            // Attempt one more sign in just in case, but if email confirmation is required, this will throw
             const retryData = await supabase.auth.signInWithPassword({ email, password })
             if (retryData.error) throw retryData.error
             return retryData.data
          }
        }
      } catch {
        // Ignore signup fallback error and throw original error
        throw error
      }
    } else if (error) {
      throw error
    }

    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  async function updateProfile(updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    return data
  }

  const isAdmin = profile?.role === 'admin'
  const isSeller = profile?.role === 'seller' && profile?.is_approved_seller
  const isBuyer = profile?.role === 'buyer' || !isSeller

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      signUp, signIn, signOut, updateProfile,
      isAdmin, isSeller, isBuyer,
      refetchProfile: () => user && fetchProfile(user.id),
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
