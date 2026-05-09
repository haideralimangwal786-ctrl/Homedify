import React, { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'

const SellerCategories = ()=>{
  const { token } = useContext(AuthContext)
  const [tree, setTree] = useState([])
  const [name, setName] = useState('')
  const [parent, setParent] = useState('')

  useEffect(()=>{
    axios.get('/api/categories/tree').then(r=>setTree(r.data)).catch(()=>{})
  },[])

  const create = async ()=>{
    try{
      const res = await axios.post('/api/categories', { name, parent: parent || null }, { headers: { Authorization: `Bearer ${token}` } })
      setName(''); setParent('');
      axios.get('/api/categories/tree').then(r=>setTree(r.data)).catch(()=>{})
    }catch(err){ console.error(err) }
  }

  const renderOptions = (nodes, prefix='')=>{
    return nodes.flatMap(n=>[
      <option key={n._id} value={n._id}>{prefix + n.name}</option>,
      ...(n.children && n.children.length? renderOptions(n.children, prefix + n.name + ' > ') : [])
    ])
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold">Manage Categories & Subcategories</h1>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-3 rounded">
          <h2 className="font-semibold">Create Category / Subcategory</h2>
          <input id="new-category-name" name="new-category-name" aria-label="New category name" className="border px-2 py-1 w-full mt-2" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
          <select className="border px-2 py-1 mt-2 w-full" value={parent} onChange={e=>setParent(e.target.value)}>
            <option value="">-- Create top-level category --</option>
            {renderOptions(tree)}
          </select>
          <div className="mt-3">
            <button className="bg-coral text-white px-3 py-1 rounded" onClick={create}>Create</button>
          </div>
        </div>
        <div className="border p-3 rounded">
          <h2 className="font-semibold">Category Tree</h2>
          <div className="mt-2 text-sm">
            {tree.map(node=> (
              <div key={node._id} className="mb-2">
                <div className="font-medium">{node.name}</div>
                <div className="ml-4 text-gray-600">{node.children.map(c=>c.name).join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
export default SellerCategories
