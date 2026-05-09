import React, { createContext, useState, useEffect } from 'react'

export const CartContext = createContext(null)

// Ensure sellerId is always a valid string or null (never an object)
const sanitizeSellerId = (raw) => {
  if (!raw) return null
  if (typeof raw === 'object') return String(raw._id || '') || null
  if (raw === '[object Object]') return null   // corrupted old data
  return String(raw)
}

const sanitizeCart = (items) =>
  items.map(item => ({ ...item, sellerId: sanitizeSellerId(item.sellerId) }))

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('homedify_cart')
      return saved ? sanitizeCart(JSON.parse(saved)) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('homedify_cart', JSON.stringify(items))
  }, [items])

  const add = (product, qty = 1) => {
    setItems(prev => {
      const id = product._id || product.id
      const found = prev.find(p => p.productId === id)
      if (found) return prev.map(p => p.productId === id ? { ...p, qty: p.qty + qty } : p)
      const img = (product.images && product.images[0]) || product.image || null
      // Extract sellerId as a plain string (never store full objects)
      const rawSeller = product.seller ?? product.sellerId ?? null
      const sellerId = rawSeller
        ? (typeof rawSeller === 'object' ? String(rawSeller._id || rawSeller) : String(rawSeller))
        : null
      return [{ productId: id, sellerId, name: product.name, price: product.price, image: img, qty }, ...prev]
    })
  }
  const remove = (productId) => setItems(prev => prev.filter(p => p.productId !== productId))
  const updateQty = (productId, qty) => {
    setItems(prev => {
      if (qty <= 0) return prev.filter(p => p.productId !== productId)
      return prev.map(p => p.productId === productId ? { ...p, qty } : p)
    })
  }
  const clear = () => setItems([])
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  return <CartContext.Provider value={{ items, add, remove, updateQty, clear, total }}>{children}</CartContext.Provider>
}
