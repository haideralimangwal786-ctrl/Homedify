const fs = require('fs');
const path = 'e:\\Homedify\\frontend\\src\\pages\\AdminDashboard.jsx';
let content = fs.readFileSync(path, 'utf8');

// Check if modal already exists to avoid double addition
if (content.includes('Delete Confirmation Modal')) {
    console.log('Modal already exists');
} else {
    const layoutEnd = "</Layout>";
    const lastIndex = content.lastIndexOf(layoutEnd);
    
    if (lastIndex !== -1) {
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
        </Modal>\n      `;
        
        content = content.slice(0, lastIndex) + modalText + content.slice(lastIndex);
        fs.writeFileSync(path, content);
        console.log('Modal added at the end of the last Layout');
    } else {
        console.log('Could not find </Layout>');
    }
}
