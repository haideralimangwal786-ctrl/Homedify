import React, { createContext, useState, useEffect, useContext } from 'react'

export const WishlistContext = createContext(null)

export const WishlistProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('homedify_wishlist') || '[]')
    } catch {
      return []
    }
  })

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('homedify_wishlist', JSON.stringify(items))
    // Dispatch event so other tabs / components can react
    window.dispatchEvent(new Event('storage'))
  }, [items])

  const isWishlisted = (productId) => items.some(p => p._id === productId)

  const toggle = (product) => {
    const id = product._id || product.id
    setItems(prev => {
      const exists = prev.some(p => p._id === id)
      if (exists) return prev.filter(p => p._id !== id)
      // Store enough info to display in wishlist page
      return [...prev, {
        _id: id,
        name: product.name,
        price: product.price,
        images: product.images || [],
        countInStock: product.quantity ?? product.countInStock ?? 0,
        sellerId: product.sellerId,
      }]
    })
    return !isWishlisted(id)  // returns new state (true = added)
  }

  const remove = (productId) => setItems(prev => prev.filter(p => p._id !== productId))

  const clear = () => setItems([])

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggle, remove, clear, count: items.length }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
