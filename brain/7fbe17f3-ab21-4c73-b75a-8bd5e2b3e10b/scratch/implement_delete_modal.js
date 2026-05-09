const fs = require('fs');
const path = 'e:\\Homedify\\frontend\\src\\pages\\AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add States
const stateTarget = "const [adminAccount, setAdminAccount] = useState('')";
const stateReplacement = `const [adminAccount, setAdminAccount] = useState('')
  
  // Deletion Modal States
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteType, setDeleteType] = useState(null) // 'seller' or 'user'
  const [deleteLoading, setDeleteLoading] = useState(false)`;

if (content.includes(stateTarget)) {
    content = content.replace(stateTarget, stateReplacement);
}

// 2. Replace handleDeleteSeller
const sellerFuncRegex = /const handleDeleteSeller = async \(id\) => \{[\s\S]*?toast\.error\('Failed to delete seller'\)\s*\}\s*\}/;
const sellerFuncReplacement = `const handleDeleteSeller = (id) => {
      setItemToDelete(id)
      setDeleteType('seller')
      setDeleteModalVisible(true)
    }

    const confirmDelete = async () => {
      setDeleteLoading(true)
      try {
        const endpoint = deleteType === 'seller' ? \`/api/v1/admin/sellers/\${itemToDelete}\` : \`/api/v1/admin/users/\${itemToDelete}\`
        await api.delete(endpoint)
        toast.success(\`\${deleteType === 'seller' ? 'Seller' : 'User'} deleted successfully\`)
        setDeleteModalVisible(false)
        fetchData()
        if (viewModalVisible) setViewModalVisible(false)
      } catch (err) {
        toast.error(\`Failed to delete \${deleteType}\`)
      } finally {
        setDeleteLoading(false)
      }
    }`;

content = content.replace(sellerFuncRegex, sellerFuncReplacement);

// 3. Replace handleDeleteUser
const userFuncRegex = /const handleDeleteUser = async \(id\) => \{[\s\S]*?toast\.error\('Failed to delete user'\)\s*\}\s*\}/;
const userFuncReplacement = `const handleDeleteUser = (id) => {
      setItemToDelete(id)
      setDeleteType('user')
      setDeleteModalVisible(true)
    }`;

content = content.replace(userFuncRegex, userFuncReplacement);

// 4. Update userColumns (Replace Popconfirm)
// We need to be careful here. Let's find the exact block.
const popconfirmRegex = /<Popconfirm[\s\S]*?okButtonProps=\{\{ danger: true \}\}\s*>\s*<Tooltip title="Delete Account">[\s\S]*?<\/Tooltip>\s*<\/Popconfirm>/;
const popconfirmReplacement = `          <Tooltip title="Delete Account">
            <Button 
              type="text" 
              shape="circle" 
              icon={<Trash2 size={18} className="text-[#FF6B6B]" />} 
              onClick={() => handleDeleteUser(record._id)}
              className="hover:bg-red-50 flex items-center justify-center transition-all"
            />
          </Tooltip>`;

content = content.replace(popconfirmRegex, popconfirmReplacement);

// 5. Add the Modal
const layoutEnd = "</Layout>";
const modalText = `        {/* Delete Confirmation Modal */}
        <Modal
          title={null}
          open={deleteModalVisible}
          onCancel={() => setDeleteModalVisible(false)}
          footer={null}
          centered
          width={400}
          styles={{ content: { borderRadius: 32, padding: 32 } }}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <Title level={4} className="m-0 font-black text-gray-900 tracking-tight uppercase">Delete Confirmation</Title>
            <Paragraph className="text-gray-400 text-xs font-medium mt-3 leading-relaxed">
              Are you sure you want to delete this <span className="text-red-500 font-bold">{deleteType}</span> account? 
              This action is <span className="text-gray-900 font-black underline">permanent</span> and cannot be undone.
            </Paragraph>

            <div className="grid grid-cols-2 gap-3 mt-8">
              <Button 
                onClick={() => setDeleteModalVisible(false)}
                className="h-12 rounded-xl font-bold text-gray-500 border-gray-100 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="primary"
                danger
                loading={deleteLoading}
                onClick={confirmDelete}
                className="h-12 rounded-xl font-black bg-red-500 border-none shadow-lg shadow-red-100 uppercase tracking-widest text-[10px]"
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      </Layout>`;

content = content.replace(layoutEnd, modalText);

fs.writeFileSync(path, content);
console.log('AdminDashboard updated successfully');
