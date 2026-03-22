import { createContext, useContext, useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const CartContext = createContext({})

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('agrilink_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('agrilink_cart', JSON.stringify(items))
  }, [items])

  function addItem(product, quantity = 1) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...product, quantity }]
    })
    const existing = items.find(i => i.id === product.id)
    if (existing) {
      toast.success(`Updated quantity in cart`)
    } else {
      toast.success(`${product.title} added to cart 🛒`)
    }
  }

  function removeItem(productId) {
    setItems(prev => prev.filter(i => i.id !== productId))
    toast('Item removed from cart', { icon: '🗑️' })
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) { removeItem(productId); return }
    setItems(prev => prev.map(i => i.id === productId ? { ...i, quantity } : i))
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      totalItems, totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
