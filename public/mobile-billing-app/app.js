// Mobile Shop Billing Software

// Initialize IndexedDB for product storage
let db;
const DB_NAME = 'VinayMobileShopDB';
const DB_VERSION = 5; // Updated to match version in product-manager.js
const STORE_NAME = 'products';
const INVOICE_STORE = 'invoices';
const GST_RECORDS_STORE = 'gstRecords'; // Store for GST records

// Initialize variable for note editing
window.currentEditingIndex = -1;

// Initialize the database
function initDatabase() {
  return new Promise((resolve, reject) => {
    // Check for IndexedDB support
    if (!window.indexedDB) {
      reject(new Error('Your browser does not support IndexedDB. Please use a modern browser.'));
      return;
    }
    
    // Use the consistent version number
    console.log(`Opening database ${DB_NAME} with version ${DB_VERSION}`);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
      
      // Create products store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('price', 'price', { unique: false });
        objectStore.createIndex('pieces', 'pieces', { unique: false });
        objectStore.createIndex('note', 'note', { unique: false });
        console.log(`Object store "${STORE_NAME}" created successfully.`);
      }
      
      // Create invoices store if it doesn't exist
      if (!db.objectStoreNames.contains(INVOICE_STORE)) {
        const invoiceStore = db.createObjectStore(INVOICE_STORE, { keyPath: 'invoiceNumber' });
        invoiceStore.createIndex('date', 'date', { unique: false });
        invoiceStore.createIndex('customer', 'customer.name', { unique: false });
        console.log(`Object store "${INVOICE_STORE}" created successfully.`);
      }
      
      // Check if GST records store exists and create with correct schema if needed
      if (!db.objectStoreNames.contains(GST_RECORDS_STORE)) {
        console.log(`Creating ${GST_RECORDS_STORE} with correct schema`);
        // Create GST records store correctly (allowing multiple records per invoice)
        const gstRecordsStore = db.createObjectStore(GST_RECORDS_STORE, { keyPath: 'id', autoIncrement: true });
        gstRecordsStore.createIndex('date', 'date', { unique: false });
        gstRecordsStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false }); // NOT unique
        gstRecordsStore.createIndex('customerName', 'customerName', { unique: false });
        console.log(`Object store "${GST_RECORDS_STORE}" created with correct schema.`);
      } else {
        console.log(`${GST_RECORDS_STORE} already exists, not modifying schema.`);
      }
    };
    
    request.onsuccess = (event) => {
      db = event.target.result;
      console.log(`Database "${DB_NAME}" opened successfully with version ${db.version}.`);
      resolve(db);
    };
    
    request.onerror = (event) => {
      console.error('Error opening database:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Get all products from the database
function getAllProducts() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Search products by name
function searchProducts(query) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    getAllProducts()
      .then(products => {
        if (!query || query.trim() === '') {
          resolve(products);
          return;
        }
        
        const lowercaseQuery = query.toLowerCase();
        const filteredProducts = products.filter(product => 
          product.name.toLowerCase().includes(lowercaseQuery)
        );
        
        resolve(filteredProducts);
      })
      .catch(error => reject(error));
  });
}

// Application settings
const appSettings = {
  shopName: "Invoice Generator",
  currencySymbol: "₹",
  taxRate: 0.18, // 18% (CGST 9% + SGST 9%)
  gstNumber: "XXXXXXXXXX",
  appVersion: "1.0.0",
  invoicePaths: {
    gst: "C:\\Invoices\\GST",
    nonGst: "C:\\Invoices\\NonGST"
  },
  bankDetails: {
    name: "XXXX",
    accountNumber: "XXXXXXX",
    branch: "XXXX",
    ifscCode: "XXXXXX"
  }
};

// Current invoice items
let currentInvoice = {
  customer: {
    name: '',
    phone: '',
    email: '',
    address: ''
  },
  items: [],
  tax: appSettings.taxRate || 0.18, // 18% GST
  discount: 0,
  invoiceNumber: generateInvoiceNumber(),
  date: new Date().toISOString().split('T')[0],
  isGstInvoice: true // Default to GST invoice
};

// Generate a unique invoice number
function generateInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  
  // Get the last invoice number from local storage
  let lastInvoiceNumber = localStorage.getItem('lastInvoiceNumber') || 0;
  
  // Increment the invoice number
  const invoiceNumber = parseInt(lastInvoiceNumber) + 1;
  
  // Save the new invoice number to local storage
  localStorage.setItem('lastInvoiceNumber', invoiceNumber);
  
  // Format: INV-001-2023
  const formattedInvoiceNumber = `INV-${invoiceNumber.toString().padStart(3, '0')}-${year}`;
  
  return formattedInvoiceNumber;
}

// Initialize app
function initApp() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="header">
      <div class="logo">${appSettings.shopName}</div>
      <div class="header-buttons">
        <button id="manageStockBtn" class="btn btn-secondary">Manage Stock</button>
        <button id="viewInvoicesBtn" class="btn">View Invoices</button>
        <button id="newInvoiceBtn" class="btn">New Invoice</button>
      </div>
    </div>
    
    <div class="container">
      <div class="billing-section">
        <div class="card glow">
          <h2>Customer Information</h2>
          <div class="input-group">
            <label for="customerName">Customer Name</label>
            <input type="text" id="customerName" placeholder="Enter customer name">
          </div>
          <div class="input-group">
            <label for="customerPhone">Phone Number</label>
            <input type="text" id="customerPhone" placeholder="Enter phone number">
          </div>
          <div class="input-group">
            <label for="customerGstin">GSTIN (Optional)</label>
            <input type="text" id="customerGstin" placeholder="Enter customer GSTIN">
          </div>
          <div class="input-group">
            <label for="customerAddress">Address (Optional)</label>
            <textarea id="customerAddress" placeholder="Enter address"></textarea>
          </div>
          <div class="input-group">
            <label for="invoiceNumber">Invoice Number</label>
            <div class="invoice-number-container" style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="invoiceNumber" value="${currentInvoice.invoiceNumber}" style="flex: 1;">
              <button id="resetInvoiceNumberBtn" class="btn btn-small">Reset</button>
            </div>
            <small style="display: block; margin-top: 5px; color: #666;">Change only if you need a custom invoice number</small>
          </div>
        </div>
        
        <div class="card glow">
          <h2>Add Items</h2>
          
          <div class="input-group">
            <label for="searchProduct">Search Product</label>
            <div class="search-container">
              <input type="text" id="searchProduct" placeholder="Search for products...">
              <button id="searchProductBtn" class="btn">Search</button>
            </div>
            <div id="searchResults" class="search-results"></div>
          </div>
          
          <div class="divider">OR</div>
          
          <h3>Add Item Manually</h3>
          <div class="manual-item-form">
            <div class="input-group">
              <label for="manualItemName">Item Name</label>
              <input type="text" id="manualItemName" placeholder="Enter item name">
            </div>
            <div class="input-group">
              <label for="manualItemPrice">Price</label>
              <input type="number" id="manualItemPrice" placeholder="Enter price" min="0" step="0.01">
            </div>
            <div class="input-group">
              <label for="manualItemQuantity">Quantity</label>
              <input type="number" id="manualItemQuantity" placeholder="Enter quantity" min="1" value="1">
            </div>
            <div class="input-group">
              <label for="manualItemNote">Note (IMEI No., Details, etc.)</label>
              <textarea id="manualItemNote" placeholder="Enter note, IMEI number, etc." rows="3" style="resize: vertical;"></textarea>
            </div>
            <button id="addManualItemBtn" class="btn btn-success">Add to Invoice</button>
          </div>
        </div>
        
        <div class="card glow">
          <h2>Invoice Items</h2>
          <div class="table-container">
            <table id="invoiceTable">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody id="invoiceItems">
                <tr id="emptyRow">
                  <td colspan="5" style="text-align: center;">No items added to invoice</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="invoice-summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span id="subtotal">${appSettings.currencySymbol}0.00</span>
            </div>
            <div class="summary-row">
              <span>GST Included (CGST 9% + SGST 9%):</span>
              <span id="tax">${appSettings.currencySymbol}0.00</span>
            </div>
            <div class="summary-row">
              <span>Discount:</span>
              <div>
                <input type="number" id="discountInput" min="0" max="100" value="0" style="width: 60px; text-align: right;"> %
              </div>
            </div>
            <div class="summary-row total">
              <span>Grand Total:</span>
              <span id="grandTotal">${appSettings.currencySymbol}0.00</span>
            </div>
          </div>
          
          <div class="invoice-options">
            <div class="invoice-gst-toggle">
              <span>Invoice Type:</span>
              <div class="toggle-container">
                <input type="checkbox" id="gstToggle" class="toggle-input" checked>
                <label for="gstToggle" class="toggle-label">
                  <span class="toggle-inner"></span>
                  <span class="toggle-switch"></span>
                </label>
                <span class="toggle-text" id="gstToggleText">GST Invoice</span>
              </div>
            </div>
            
            <button id="invoiceSettingsBtn" class="btn btn-small">
              <span class="settings-icon">⚙️</span> Settings
            </button>
          </div>
          
          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button id="generateInvoiceBtn" class="btn btn-success">Generate Invoice</button>
            <button id="saveInvoiceBtn" class="btn">Save Invoice</button>
            <button id="resetBtn" class="btn btn-danger">Reset</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice list modal (hidden by default) -->
    <div id="invoiceListModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Saved Invoices</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <div id="invoicesList">
            <!-- Invoices will be listed here -->
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice Settings Modal -->
    <div id="settingsModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Invoice Settings</h2>
          <span class="close-modal" id="closeSettingsModal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h3>Invoice Paths</h3>
            <p>Set custom folders for saving your invoices:</p>
            
            <div class="input-group">
              <label for="gstInvoicePath">GST Invoice Save Path:</label>
              <div class="path-input-container">
                <input type="text" id="gstInvoicePath" placeholder="C:\\Invoices\\GST" value="${appSettings.invoicePaths.gst}">
                <button id="browseGstPath" class="btn btn-small">Browse</button>
              </div>
            </div>
            
            <div class="input-group">
              <label for="nonGstInvoicePath">Non-GST Invoice Save Path:</label>
              <div class="path-input-container">
                <input type="text" id="nonGstInvoicePath" placeholder="C:\\Invoices\\NonGST" value="${appSettings.invoicePaths.nonGst}">
                <button id="browseNonGstPath" class="btn btn-small">Browse</button>
              </div>
            </div>
          </div>
          
          <div class="settings-actions">
            <button id="saveSettingsBtn" class="btn btn-success">Save Settings</button>
            <button id="cancelSettingsBtn" class="btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Note Edit Modal -->
    <div id="noteEditModal" class="modal" style="display: none;">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Edit Item Note</h2>
          <span class="close-modal" id="closeNoteModal">&times;</span>
        </div>
        <div class="modal-body">
          <div class="input-group">
            <label for="editNoteText">Note:</label>
            <textarea id="editNoteText" rows="5" style="width: 100%; resize: vertical;"></textarea>
          </div>
          <div class="settings-actions" style="margin-top: 15px;">
            <button id="saveNoteBtn" class="btn btn-success">Save Note</button>
            <button id="cancelNoteBtn" class="btn">Cancel</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Invoice template for printing (hidden by default) -->
    <div id="invoiceTemplate" style="display: none;">
      <div id="invoicePrint"></div>
    </div>
  `;
  
  // Initialize database
  initDatabase()
    .then(() => {
      console.log('Database initialized successfully');
      
      // Add event listeners
      initEventListeners();
      
      // Update the invoiceDate with today's date
      document.getElementById('invoiceDate').valueAsDate = new Date();
      
      // Setup search products functionality
      setupProductSearch();
      
      // Add the debug button
      setupDebugButton();
    })
    .catch(error => {
      console.error('Error initializing database:', error);
      
      // Still try to setup event listeners even if DB fails
      initEventListeners();
      
      // Show error notification
      showNotification(`Database Error: ${error.message}. Some features may not work.`, 'error');
    });
}

// Initialize event listeners
function initEventListeners() {
  // Product search button
  document.getElementById('searchProductBtn').addEventListener('click', handleProductSearch);
  
  // Add manual item button
  document.getElementById('addManualItemBtn').addEventListener('click', addManualItemToInvoice);
  
  // Generate invoice button
  document.getElementById('generateInvoiceBtn').addEventListener('click', generateInvoice);
  
  // Save invoice button
  document.getElementById('saveInvoiceBtn').addEventListener('click', saveCurrentInvoice);
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetInvoice);
  
  // Manage stock button
  document.getElementById('manageStockBtn').addEventListener('click', navigateToStockManager);
  
  // View invoices button
  document.getElementById('viewInvoicesBtn').addEventListener('click', showInvoiceListModal);
  
  // Close modal buttons
  document.querySelectorAll('.close-modal').forEach(button => {
    button.addEventListener('click', event => {
      const modal = event.target.closest('.modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // New invoice button
  document.getElementById('newInvoiceBtn').addEventListener('click', resetInvoice);
  
  // Search product input - trigger search on Enter key
  document.getElementById('searchProduct').addEventListener('keyup', event => {
    if (event.key === 'Enter') {
      handleProductSearch();
    }
  });
  
  // Discount input - update summary when changed
  document.getElementById('discountInput').addEventListener('input', updateInvoiceSummary);
  
  // GST toggle
  document.getElementById('gstToggle').addEventListener('change', handleGstToggle);
  
  // Invoice settings button
  document.getElementById('invoiceSettingsBtn').addEventListener('click', showSettingsModal);
  
  // Close settings modal
  document.getElementById('closeSettingsModal').addEventListener('click', hideSettingsModal);
  
  // Save settings button
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);
  
  // Browse buttons
  document.getElementById('browseGstPath').addEventListener('click', () => browseForFolder('gstInvoicePath'));
  document.getElementById('browseNonGstPath').addEventListener('click', () => browseForFolder('nonGstInvoicePath'));
  
  // Invoice number input - update current invoice when changed
  const invoiceNumberInput = document.getElementById('invoiceNumber');
  if (invoiceNumberInput) {
    invoiceNumberInput.addEventListener('change', () => {
      const newInvoiceNumber = invoiceNumberInput.value.trim();
      if (newInvoiceNumber) {
        currentInvoice.invoiceNumber = newInvoiceNumber;
        console.log(`Invoice number updated to: ${newInvoiceNumber}`);
      } else {
        // If empty, reset to auto-generated
        currentInvoice.invoiceNumber = generateInvoiceNumber();
        invoiceNumberInput.value = currentInvoice.invoiceNumber;
      }
    });
  }
  
  // Reset invoice number button
  const resetInvoiceNumberBtn = document.getElementById('resetInvoiceNumberBtn');
  if (resetInvoiceNumberBtn) {
    resetInvoiceNumberBtn.addEventListener('click', () => {
      currentInvoice.invoiceNumber = generateInvoiceNumber();
      document.getElementById('invoiceNumber').value = currentInvoice.invoiceNumber;
      console.log(`Invoice number reset to: ${currentInvoice.invoiceNumber}`);
    });
  }
}

// Browse for folder using file input as a workaround
function browseForFolder(targetInputId) {
  // Create a temporary file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.webkitdirectory = true; // For Chrome and Safari
  fileInput.directory = true; // For Firefox
  fileInput.multiple = true; // Required for directory selection
  
  // When files are selected
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files && fileInput.files.length > 0) {
      // Get the folder path from the first file
      const folderPath = fileInput.files[0].webkitRelativePath.split('/')[0];
      
      // On Windows, we need to add C:\ or appropriate drive letter
      // This is a limitation in browsers for security reasons
      // We'll use the default paths with the selected folder name
      let fullPath;
      
      if (targetInputId === 'gstInvoicePath') {
        fullPath = `C:\\Invoices\\${folderPath}`;
      } else {
        fullPath = `C:\\Invoices\\${folderPath}`;
      }
      
      // Set the input value
      document.getElementById(targetInputId).value = fullPath;
    }
  });
  
  // Trigger click to open file dialog
  fileInput.click();
}

// Handle GST toggle
function handleGstToggle(event) {
  const isGstInvoice = event.target.checked;
  currentInvoice.isGstInvoice = isGstInvoice;
  
  // Update the toggle text
  document.getElementById('gstToggleText').textContent = isGstInvoice ? 'GST Invoice' : 'Non-GST Invoice';
  
  // Update the invoice summary
  updateInvoiceSummary();
  
  // Hide/show GSTIN field based on invoice type
  const gstinField = document.getElementById('customerGstin');
  const gstinLabel = document.querySelector('label[for="customerGstin"]');
  
  if (isGstInvoice) {
    gstinField.style.display = 'block';
    gstinLabel.style.display = 'block';
  } else {
    gstinField.style.display = 'none';
    gstinLabel.style.display = 'none';
  }
}

// Show settings modal
function showSettingsModal() {
  document.getElementById('settingsModal').style.display = 'block';
}

// Hide settings modal
function hideSettingsModal() {
  document.getElementById('settingsModal').style.display = 'none';
}

// Save settings
function saveSettings() {
  // Get path values
  const gstPath = document.getElementById('gstInvoicePath').value.trim();
  const nonGstPath = document.getElementById('nonGstInvoicePath').value.trim();
  
  // Validate paths
  if (!gstPath) {
    alert('Please enter a valid path for GST invoices');
    return;
  }
  
  if (!nonGstPath) {
    alert('Please enter a valid path for Non-GST invoices');
    return;
  }
  
  // Save to app settings
  appSettings.invoicePaths.gst = gstPath;
  appSettings.invoicePaths.nonGst = nonGstPath;
  
  // Save to localStorage for persistence
  localStorage.setItem('invoicePaths', JSON.stringify(appSettings.invoicePaths));
  
  // Show success message and close modal
  alert('Settings saved successfully');
  hideSettingsModal();
}

// Navigate to stock manager page
function navigateToStockManager() {
  window.location.href = 'product-manager.html';
}

// Handle product search input
async function handleProductSearch() {
  try {
    const searchInput = document.getElementById('searchProduct');
    const searchValue = searchInput.value.trim();
    const searchResults = document.getElementById('searchResults');
    
    if (!searchValue) {
      searchResults.innerHTML = '';
      return;
    }
    
    // Get products from IndexedDB
    const products = await searchProducts(searchValue);
    
    if (products.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">No products found</div>';
      return;
    }
    
    // Display search results
    searchResults.innerHTML = '';
    products.forEach(product => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.innerHTML = `
        <div class="search-result-details">
          <span class="product-name">${product.name}</span>
          <span class="product-price">${appSettings.currencySymbol}${product.price.toFixed(2)}</span>
          <span class="product-stock">${product.pieces} in stock</span>
        </div>
        <button class="btn btn-small add-product-btn" data-id="${product.id}">Add</button>
      `;
      
      searchResults.appendChild(resultItem);
      
      // Add event listener for the add button
      const addButton = resultItem.querySelector('.add-product-btn');
      addButton.addEventListener('click', () => {
        addProductToInvoice(product);
        searchInput.value = '';
        searchResults.innerHTML = '';
      });
    });
  } catch (error) {
    console.error('Error searching products:', error);
  }
}

// Get product by ID from the database
function getProductById(id) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Add manual item to invoice
function addManualItemToInvoice() {
  const itemName = document.getElementById('manualItemName').value.trim();
  const itemPrice = parseFloat(document.getElementById('manualItemPrice').value);
  const itemQuantity = parseInt(document.getElementById('manualItemQuantity').value);
  const itemNote = document.getElementById('manualItemNote').value.trim();
  
  if (!itemName) {
    alert('Please enter item name');
    return;
  }
  
  if (isNaN(itemPrice) || itemPrice <= 0) {
    alert('Please enter a valid price');
    return;
  }
  
  if (isNaN(itemQuantity) || itemQuantity < 1) {
    alert('Please enter a valid quantity');
    return;
  }
  
  // Create a product object for the manual item
  const manualItem = {
    id: 'manual-' + Date.now(), // Generate a unique ID for manual items
    name: itemName,
    price: itemPrice,
    quantity: itemQuantity,
    note: itemNote // Add note field
  };
  
  // Add the item to the invoice
  addItemToInvoice(manualItem);
  
  // Clear the form
  document.getElementById('manualItemName').value = '';
  document.getElementById('manualItemPrice').value = '';
  document.getElementById('manualItemQuantity').value = '1';
  document.getElementById('manualItemNote').value = '';
}

// Add a product to the invoice
function addProductToInvoice(product) {
  // Create item with empty note first
  const item = {
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1, // Default quantity
    note: '' // Empty note field initially
  };
  
  // Add item to invoice
  addItemToInvoice(item);
  
  // Find the index of the newly added item
  const index = currentInvoice.items.findIndex(i => i.id === item.id);
  
  // Show note edit modal for the newly added item
  if (index !== -1) {
    // Get the modal elements
    const noteEditModal = document.getElementById('noteEditModal');
    const editNoteText = document.getElementById('editNoteText');
    
    // Set current editing item reference for the save button
    window.currentEditingIndex = index;
    
    // Clear the textarea
    if (editNoteText) {
      editNoteText.value = '';
    }
    
    // Show the modal
    if (noteEditModal) {
      noteEditModal.style.display = 'block';
    }
  }
}

// Add an item to the invoice
function addItemToInvoice(item) {
  // Check if the item already exists in the invoice
  const existingItemIndex = currentInvoice.items.findIndex(
    invoiceItem => invoiceItem.id === item.id
  );
  
  if (existingItemIndex !== -1) {
    // If item exists, update quantity
    currentInvoice.items[existingItemIndex].quantity += item.quantity;
  } else {
    // Otherwise, add as new item
    currentInvoice.items.push(item);
  }
  
  // Update the UI
  renderInvoiceItems();
  updateInvoiceSummary();
}

// Update customer information
function updateCustomerInfo() {
  // Get values from the form inputs
  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  const customerAddress = document.getElementById('customerAddress').value.trim();
  const customerGstin = document.getElementById('customerGstin').value.trim();
  
  console.log("Form values - Name:", customerName, "Phone:", customerPhone, "Address:", customerAddress, "GSTIN:", customerGstin);
  
  // Ensure the customer object exists in currentInvoice
  if (!currentInvoice.customer) {
    currentInvoice.customer = {};
  }
  
  // Update the currentInvoice object with customer info
  currentInvoice.customer.name = customerName;
  currentInvoice.customer.phone = customerPhone;
  currentInvoice.customer.address = customerAddress;
  currentInvoice.customer.gstin = customerGstin;
  
  console.log("Updated invoice customer details:", currentInvoice.customer);
}

// Render invoice items in the table
function renderInvoiceItems() {
  const invoiceItemsElement = document.getElementById('invoiceItems');
  const emptyRow = document.getElementById('emptyRow');
  
  if (!invoiceItemsElement) return;
  
  // Clear existing items
  invoiceItemsElement.innerHTML = '';
  
  if (currentInvoice.items.length === 0) {
    // Show empty row
    invoiceItemsElement.innerHTML = '<tr id="emptyRow"><td colspan="5" style="text-align: center;">No items added to invoice</td></tr>';
    return;
  }
  
  // Add each item to the table
  currentInvoice.items.forEach((item, index) => {
    const row = document.createElement('tr');
    const itemTotal = item.price * item.quantity;
    
    row.innerHTML = `
      <td>
        ${item.name}
        ${item.note ? `<div class="item-note"><small style="color: #666; font-style: italic; white-space: pre-line;">${item.note}</small></div>` : ''}
      </td>
      <td>${appSettings.currencySymbol}${item.price.toFixed(2)}</td>
      <td>
        <input type="number" class="qty-input" data-index="${index}" min="1" value="${item.quantity}">
      </td>
      <td>${appSettings.currencySymbol}${itemTotal.toFixed(2)}</td>
      <td>
        <button class="btn btn-small edit-note" data-index="${index}">Note</button>
        <button class="btn btn-danger btn-small remove-item" data-index="${index}">Remove</button>
      </td>
    `;
    
    invoiceItemsElement.appendChild(row);
  });
  
  // Add event listeners for quantity inputs and remove buttons
  addQuantityChangeListeners();
  addRemoveItemListeners();
  addEditNoteListeners();
}

// Event listeners for quantity inputs
function addQuantityChangeListeners() {
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      const newQuantity = parseInt(e.target.value);
      
      if (isNaN(newQuantity) || newQuantity < 1) {
        e.target.value = currentInvoice.items[index].quantity;
        return;
      }
      
      // Update quantity in the current invoice
      currentInvoice.items[index].quantity = newQuantity;
      
      // Update the row total
      const row = e.target.closest('tr');
      const totalCell = row.cells[3];
      const item = currentInvoice.items[index];
      const itemTotal = item.price * item.quantity;
      
      totalCell.textContent = `${appSettings.currencySymbol}${itemTotal.toFixed(2)}`;
      
      // Update invoice summary
      updateInvoiceSummary();
    });
  });
}

// Event listeners for remove buttons
function addRemoveItemListeners() {
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      removeInvoiceItem(index);
    });
  });
}

// Remove an item from the invoice
function removeInvoiceItem(index) {
  if (index < 0 || index >= currentInvoice.items.length) return;
  
  const removedItem = currentInvoice.items[index];
  currentInvoice.items.splice(index, 1);
  
  // Update the UI
  renderInvoiceItems();
  updateInvoiceSummary();
  
  // Show confirmation message
  const confirmationMessage = document.createElement('div');
  confirmationMessage.style.position = 'fixed';
  confirmationMessage.style.bottom = '20px';
  confirmationMessage.style.right = '20px';
  confirmationMessage.style.backgroundColor = 'var(--secondary-color)';
  confirmationMessage.style.color = 'white';
  confirmationMessage.style.padding = '10px 20px';
  confirmationMessage.style.borderRadius = '4px';
  confirmationMessage.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
  confirmationMessage.textContent = `Removed ${removedItem.name} from invoice`;
  
  document.body.appendChild(confirmationMessage);
  
  setTimeout(() => {
    document.body.removeChild(confirmationMessage);
  }, 2000);
}

// Update invoice summary
function updateInvoiceSummary() {
  const subtotalElement = document.getElementById('subtotal');
  const taxElement = document.getElementById('tax');
  const grandTotalElement = document.getElementById('grandTotal');
  const discountInput = document.getElementById('discountInput');
  
  // Calculate subtotal (including GST)
  const subtotal = currentInvoice.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Apply discount
  const discountPercentage = parseFloat(discountInput.value) || 0;
  const discountAmount = (subtotal * discountPercentage) / 100;
  
  // Calculate tax amount (GST that's already included in the price)
  let taxAmount = 0;
  let subtotalWithoutGst = subtotal;
  
  if (currentInvoice.isGstInvoice) {
    // GST is already included, so we're extracting what portion is GST
    // Formula: tax = total - (total / (1 + tax_rate))
    subtotalWithoutGst = subtotal / (1 + currentInvoice.tax);
    taxAmount = subtotal - subtotalWithoutGst;
  }
  
  // Calculate grand total (remains the same as it now includes GST already)
  const grandTotal = subtotal - discountAmount;
  
  // Update display
  if (subtotalElement) subtotalElement.textContent = `${appSettings.currencySymbol}${subtotal.toFixed(2)}`;
  if (taxElement) taxElement.textContent = `${appSettings.currencySymbol}${taxAmount.toFixed(2)}`;
  if (grandTotalElement) grandTotalElement.textContent = `${appSettings.currencySymbol}${grandTotal.toFixed(2)}`;
  
  // Update the current invoice
  currentInvoice.subtotal = subtotal;
  currentInvoice.subtotalWithoutGst = subtotalWithoutGst;
  currentInvoice.discount = discountPercentage;
  currentInvoice.discountAmount = discountAmount;
  currentInvoice.taxAmount = taxAmount;
  currentInvoice.grandTotal = grandTotal;
}

// Save current invoice to storage
async function saveCurrentInvoice() {
  const customerName = document.getElementById('customerName').value;
  const customerPhone = document.getElementById('customerPhone').value;
  
  // Basic validation
  if (!customerName || !customerPhone) {
    alert('Please enter customer name and phone number');
    return;
  }
  
  if (currentInvoice.items.length === 0) {
    alert('Please add at least one item to the invoice');
    return;
  }
  
  try {
    // Update customer info from form fields before saving
    updateCustomerInfo();
    
    // Calculate totals for saving
    const subtotal = currentInvoice.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );
    const discountAmount = subtotal * (currentInvoice.discount / 100);
    
    // Calculate taxable amount and tax amount
    let taxableAmount = subtotal;
    let taxAmount = 0;
    
    if (currentInvoice.isGstInvoice) {
      // Extract the base price (without GST) from the total
      taxableAmount = subtotal / (1 + currentInvoice.tax);
      taxAmount = subtotal - taxableAmount;
    }
    
    const grandTotal = subtotal - discountAmount;
    
    // Prepare invoice for saving with current date
    const invoiceToSave = {
      ...currentInvoice,
      subtotal,
      discountAmount,
      taxableAmount,
      taxAmount,
      grandTotal,
      date: new Date().toISOString(),
      savedAt: new Date().toISOString()
    };
    
    // Save invoice to IndexedDB
    await saveInvoiceToDb(invoiceToSave);
    
    // If this is a GST invoice, save to the GST records store
    if (currentInvoice.isGstInvoice) {
      console.log('This is a GST invoice, saving to GST records...');
      
      // Ensure the isGstInvoice flag is set
      const gstInvoice = {
        ...invoiceToSave,
        isGstInvoice: true
      };
      
      // Make sure we have all required fields for GST records
      if (!gstInvoice.customer || !gstInvoice.customer.name) {
        console.warn('Customer info missing in GST invoice, using empty values');
        gstInvoice.customer = gstInvoice.customer || {};
        gstInvoice.customer.name = gstInvoice.customer.name || 'Unknown Customer';
      }
      
      saveGstRecord(gstInvoice)
        .then(() => {
          console.log(`GST record saved for invoice ${invoiceToSave.invoiceNumber}`);
          
          // Signal that GST data has been updated for product manager
          signalGstDataRefresh();
          
          alert(`Invoice saved successfully with GST records. You can now generate the invoice or continue editing.`);
        })
        .catch(error => {
          console.error(`Failed to save GST record for invoice ${invoiceToSave.invoiceNumber}:`, error);
          alert(`Invoice saved but GST records could not be saved. Error: ${error.message}`);
        });
    } else {
      console.log('This is a non-GST invoice, skipping GST records');
      alert(`Invoice saved successfully. You can now generate the invoice or continue editing.`);
    }
    
    // Update product quantities in stock
    for (const item of currentInvoice.items) {
      // Only update database items (not manual items)
      if (!(typeof item.id === 'string' && item.id.startsWith('manual-'))) {
        try {
          await updateProductQuantity(item.id, item.quantity);
        } catch (error) {
          console.warn(`Could not update quantity for product ${item.id}: ${error.message}`);
        }
      }
    }
    
    // Update invoice number only without resetting the entire invoice
    currentInvoice.invoiceNumber = generateInvoiceNumber();
    
    // Update the invoice number displayed in the UI
    const invoiceNumberElement = document.getElementById('invoiceNumber');
    if (invoiceNumberElement) {
      invoiceNumberElement.textContent = currentInvoice.invoiceNumber;
    }
    
  } catch (error) {
    console.error('Failed to save invoice:', error);
    alert('Failed to save invoice. Please try again.');
  }
}

// Save GST invoice record to GST Records store
function saveGstRecord(invoice) {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error('Database not initialized when trying to save GST record');
      reject(new Error('Database not initialized. Please refresh the page and try again.'));
      return;
    }
    
    try {
      // Check if invoice is a GST invoice
      if (!invoice.isGstInvoice) {
        console.warn('Attempted to save non-GST invoice to GST records');
        resolve(); // Nothing to do for non-GST invoices
        return;
      }
      
      const invoiceNumber = invoice.invoiceNumber;
      console.log(`Saving GST record for invoice ${invoiceNumber}, isGstInvoice: ${invoice.isGstInvoice}`);
      console.log('Invoice details:', {
        number: invoiceNumber,
        date: invoice.date,
        customerName: invoice.customer?.name,
        items: invoice.items?.length || 0
      });
      
      // Parse the date from the invoice
      const invoiceDate = invoice.date || new Date().toISOString();
      
      // Make sure we have items to process
      if (!invoice.items || invoice.items.length === 0) {
        console.warn('No items in invoice, cannot save GST records');
        resolve();
        return;
      }

      // CRITICAL FIX: Re-open the database to ensure latest schema
      const dbRequest = indexedDB.open(DB_NAME);
      
      dbRequest.onerror = (event) => {
        console.error('Error reopening database for GST records:', event.target.error);
        reject(event.target.error);
      };
      
      dbRequest.onsuccess = (event) => {
        const tempDb = event.target.result;
        console.log(`Database reopened for GST record saving. Version: ${tempDb.version}`);
        
        // Verify GST_RECORDS_STORE exists
        if (!tempDb.objectStoreNames.contains(GST_RECORDS_STORE)) {
          console.error(`GST_RECORDS_STORE not found in database. Available stores: ${Array.from(tempDb.objectStoreNames).join(', ')}`);
          tempDb.close();
          reject(new Error('GST_RECORDS_STORE not found. Please restart the application.'));
          return;
        }
        
        try {
          // Use the freshly opened database for the transaction
          const writeTransaction = tempDb.transaction([GST_RECORDS_STORE], 'readwrite');
          const writeStore = writeTransaction.objectStore(GST_RECORDS_STORE);
          let recordCount = 0;
          let recordPromises = [];
          
          writeTransaction.oncomplete = () => {
            console.log(`Successfully saved ${recordCount} GST records for invoice ${invoiceNumber}`);
            tempDb.close();
            resolve();
          };
          
          writeTransaction.onerror = (event) => {
            console.error('Error in GST record transaction:', event.target.error);
            tempDb.close();
            reject(event.target.error);
          };
          
          writeTransaction.onabort = (event) => {
            console.error('GST record transaction aborted:', event.target.error);
            tempDb.close();
            reject(event.target.error || new Error('Transaction aborted'));
          };
          
          console.log(`Processing ${invoice.items.length} items for GST records`);
          
          // Add each item as a separate GST record
          invoice.items.forEach(item => {
            try {
              // GST calculation: extracting GST component from the total price (18% GST = 9% CGST + 9% SGST)
              const totalPrice = item.price * item.quantity;
              const taxableValue = totalPrice / 1.18; // Extract base price without GST
              const gstAmount = totalPrice - taxableValue;
              const cgst = gstAmount / 2; // Half of GST is CGST
              const sgst = gstAmount / 2; // Half of GST is SGST
              
              const gstRecord = {
                date: invoiceDate,
                invoiceNumber: invoiceNumber,
                customerName: invoice.customer?.name || 'Unknown',
                customerGstin: invoice.customer?.gstin || 'N/A',
                productName: item.name || 'Unknown product',
                price: item.price || 0,
                quantity: item.quantity || 0,
                subtotal: taxableValue,
                taxRate: 18, // 18% GST
                cgst: cgst,
                sgst: sgst,
                total: totalPrice
              };
              
              console.log(`Adding GST record for item: ${gstRecord.productName}, price: ${gstRecord.price}, qty: ${gstRecord.quantity}`);
              
              // Create a promise for this record addition
              const recordPromise = new Promise((resolveRecord, rejectRecord) => {
                const addRequest = writeStore.add(gstRecord);
                
                addRequest.onsuccess = (event) => {
                  recordCount++;
                  console.log(`Saved GST record ${recordCount} for item ${gstRecord.productName} in invoice ${invoiceNumber}, ID: ${event.target.result}`);
                  resolveRecord();
                };
                
                addRequest.onerror = (event) => {
                  console.error('Error saving GST record:', event.target.error);
                  rejectRecord(event.target.error);
                };
              });
              
              recordPromises.push(recordPromise);
            } catch (err) {
              console.error('Error processing GST record for item:', item, err);
              // Continue with other items
            }
          });
          
          // Wait for all records to be added
          Promise.all(recordPromises).catch(error => {
            console.error('Error in one of the record additions:', error);
            // Continue with the transaction
          });
        } catch (error) {
          console.error('Error creating transaction:', error);
          tempDb.close();
          reject(error);
        }
      };
    } catch (error) {
      console.error('Unexpected error in saveGstRecord:', error);
      reject(error);
    }
  });
}

// Get all GST records from IndexedDB
function getAllGstRecords() {
  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        console.error('Database not initialized when retrieving GST records');
        reject(new Error('Database not initialized. Please refresh the page and try again.'));
        return;
      }
      
      // Check if the GST_RECORDS_STORE exists
      if (!db.objectStoreNames.contains(GST_RECORDS_STORE)) {
        console.warn('GST Records store not found. Returning empty array.');
        resolve([]);
        return;
      }
      
      console.log('Retrieving all GST records from database...');
      
      const transaction = db.transaction([GST_RECORDS_STORE], 'readonly');
      const store = transaction.objectStore(GST_RECORDS_STORE);
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const records = event.target.result || [];
        console.log(`Retrieved ${records.length} GST records successfully.`, 
                    records.length > 0 ? 'First record: ' + JSON.stringify(records[0]) : 'No records found');
        resolve(records);
      };
      
      request.onerror = (event) => {
        console.error('Error retrieving GST records:', event.target.error);
        reject(event.target.error);
      };
      
      transaction.oncomplete = () => {
        console.log('GST records retrieval transaction completed');
      };
      
      transaction.onerror = (event) => {
        console.error('GST records transaction error:', event.target.error);
        // Don't reject here as the request.onerror will handle it
      };
    } catch (error) {
      console.error('Unexpected error getting GST records:', error);
      reject(error);
    }
  });
}

// Show the invoice list modal
async function showInvoiceListModal() {
  const modal = document.getElementById('invoiceListModal');
  const invoicesList = document.getElementById('invoicesList');
  
  // Clear previous content
  invoicesList.innerHTML = '<p>Loading invoices...</p>';
  
  try {
    // Show the modal first so the user sees something happening
    modal.style.display = 'block';
    
    // Get saved invoices from IndexedDB
    const savedInvoices = await getAllInvoices();
    
    // Clear the loading message
    invoicesList.innerHTML = '';
    
    if (savedInvoices.length === 0) {
      invoicesList.innerHTML = '<p style="text-align: center; padding: 1rem;">No saved invoices found</p>';
    } else {
      // Sort invoices by saved date (newest first)
      savedInvoices.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
      
      const invoicesTable = document.createElement('table');
      invoicesTable.className = 'invoices-table';
      
      // Table header
      invoicesTable.innerHTML = `
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Customer</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      `;
      
      const tableBody = invoicesTable.querySelector('tbody');
      
      // Add invoice rows
      savedInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        const invoiceDate = new Date(invoice.date).toLocaleDateString();
        
        row.innerHTML = `
          <td>${invoice.invoiceNumber}</td>
          <td>${invoiceDate}</td>
          <td>${invoice.customer.name}</td>
          <td>${appSettings.currencySymbol}${invoice.grandTotal.toFixed(2)}</td>
          <td>
            <button class="btn view-invoice" data-invoice-number="${invoice.invoiceNumber}" 
              style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">View</button>
            <button class="btn btn-danger delete-invoice" data-invoice-number="${invoice.invoiceNumber}" 
              style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">Delete</button>
          </td>
        `;
        
        tableBody.appendChild(row);
      });
      
      invoicesList.appendChild(invoicesTable);
      
      // Add event listeners for view and delete buttons
      document.querySelectorAll('.view-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
          const invoiceNumber = e.target.dataset.invoiceNumber;
          viewSavedInvoice(invoiceNumber);
        });
      });
      
      document.querySelectorAll('.delete-invoice').forEach(button => {
        button.addEventListener('click', (e) => {
          const invoiceNumber = e.target.dataset.invoiceNumber;
          deleteSavedInvoice(invoiceNumber);
        });
      });
    }
  } catch (error) {
    console.error('Error loading invoices:', error);
    invoicesList.innerHTML = '<p style="text-align: center; color: red; padding: 1rem;">Error loading invoices</p>';
  }
}

// View saved invoice
async function viewSavedInvoice(invoiceNumber) {
  try {
    const invoice = await getInvoiceByNumber(invoiceNumber);
    if (!invoice) {
      alert('Invoice not found');
      return;
    }
    
    // Hide the modal
    document.getElementById('invoiceListModal').style.display = 'none';
    
    // Fill in the invoice form with saved data
    currentInvoice = { ...invoice };
    
    // Update customer information fields
    document.getElementById('customerName').value = invoice.customer.name || '';
    document.getElementById('customerPhone').value = invoice.customer.phone || '';
    document.getElementById('customerGstin').value = invoice.customer.gstin || '';
    document.getElementById('customerAddress').value = invoice.customer.address || '';
    document.getElementById('discountInput').value = invoice.discount || 0;
    
    // Set invoice type
    const gstToggle = document.getElementById('gstToggle');
    gstToggle.checked = invoice.isGstInvoice;
    document.getElementById('gstToggleText').textContent = invoice.isGstInvoice ? 'GST Invoice' : 'Non-GST Invoice';
    
    // Update invoice items and summary
    renderInvoiceItems();
    updateInvoiceSummary();
  } catch (error) {
    console.error('Error viewing invoice:', error);
    alert('Error loading invoice. Please try again.');
  }
}

// Delete saved invoice
async function deleteSavedInvoice(invoiceNumber) {
  if (confirm('Are you sure you want to delete this invoice?')) {
    try {
      await deleteInvoice(invoiceNumber);
      // Refresh the invoices list
      showInvoiceListModal();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      alert('Failed to delete invoice. Please try again.');
    }
  }
}

// Reset current invoice
function resetInvoice() {
  // Create a brand new invoice object
  currentInvoice = {
    customer: {
      name: '',
      phone: '',
      email: '',
      address: ''
    },
    items: [],
    tax: appSettings.taxRate || 0.18,
    discount: 0,
    invoiceNumber: generateInvoiceNumber(),
    date: new Date().toISOString().split('T')[0],
    isGstInvoice: true
  };
  
  // Clear all form inputs
  document.getElementById('customerName').value = '';
  document.getElementById('customerPhone').value = '';
  document.getElementById('customerGstin').value = '';
  document.getElementById('customerAddress').value = '';
  document.getElementById('discountInput').value = '0';
  
  // Update the UI
  const invoiceItems = document.getElementById('invoiceItems');
  const emptyRow = document.getElementById('emptyRow');
  
  if (invoiceItems) {
    invoiceItems.innerHTML = '';
    if (emptyRow) {
      emptyRow.style.display = 'table-row';
    } else {
      invoiceItems.innerHTML = '<tr id="emptyRow"><td colspan="5" style="text-align: center;">No items added to invoice</td></tr>';
    }
  }
  
  // Update totals
  updateInvoiceSummary();
  
  console.log('Invoice reset complete');
}

// Generate invoice for printing
function generateInvoice() {
  // Ensure customer info is up-to-date from the form
  updateCustomerInfo();
  
  if (currentInvoice.items.length === 0) {
    alert('Please add at least one item to the invoice');
    return null;
  }
  
  // Check customer details with clearer logging
  console.log("Current invoice customer details:", currentInvoice.customer);
  
  // Verify customer details exist
  if (!currentInvoice.customer || !currentInvoice.customer.name || !currentInvoice.customer.phone) {
    let missingFields = [];
    if (!currentInvoice.customer) {
      missingFields.push("Customer object is missing");
    } else {
      if (!currentInvoice.customer.name) missingFields.push("name");
      if (!currentInvoice.customer.phone) missingFields.push("phone number");
    }
    alert(`Please enter customer ${missingFields.join(" and ")}`);
    return null;
  }
  
  // Ensure all calculations are updated
  updateInvoiceSummary();
  
  const date = new Date();
  const formattedDate = `${date.getDate()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  
  let invoiceContent = '';
  
  // Check if required values exist based on invoice type
  if (currentInvoice.isGstInvoice) {
    // For GST invoice, check tax amount
    if (!currentInvoice.subtotal || currentInvoice.taxAmount === undefined || !currentInvoice.grandTotal) {
      console.error("Missing required GST invoice values:", currentInvoice);
      alert("Error generating GST invoice: Missing required values. Please try again.");
      return null;
    }
  } else {
    // For non-GST invoice, we don't need taxAmount
    if (!currentInvoice.subtotal || !currentInvoice.grandTotal) {
      console.error("Missing required invoice values:", currentInvoice);
      alert("Error generating invoice: Missing required values. Please try again.");
      return null;
    }
  }
  
  if (currentInvoice.isGstInvoice) {
    // GST Invoice Format - Rajesh Electronics style (from image)
    invoiceContent = `
      <div class="invoice-print" style="width: 100%; font-family: Arial, sans-serif; font-size: 12px; color: #000; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 0;">
          TAX INVOICE
        </div>
        
        <!-- Header section with logo and details -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; margin: 0;">
          <tr>
            <td width="60%" style="vertical-align: top; border-right: 1px solid #000; padding: 5px;">
              <!-- Shop Details -->
              <div style="display: flex;">
                <div style="margin-right: 10px;">
                  <div style="font-size: 32px; line-height: 0.9; font-weight: bold; margin-bottom: 5px;">
                    <span style="color: #000;">V</span><span style="color: #FF0000;">M</span>
                  </div>
                </div>
                <div>
                  <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">INVOICE GENERATOR</div>
                  <div style="font-size: 10px;">SHOP NO. 20, Tirupati Complex,</div>
                  <div style="font-size: 10px;">WARD NO. 25, MANAV MANDIR CHOWK,</div>
                  <div style="font-size: 10px;">Rajnandgaon, Chhattisgarh</div>
                  <div style="font-size: 10px;">Phone: XXXX</div>
                  <div style="font-size: 10px;">GSTIN/UIN: XXXXXXXXXX</div>
                  <div style="font-size: 10px;">State Name: Chhattisgarh, Code: 22</div>
                </div>
              </div>
            </td>
            <td width="40%" style="vertical-align: top; padding: 0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0; font-size: 11px;">
                <tr>
                  <td width="40%" style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Invoice No.</td>
                  <td width="60%" style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${currentInvoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Dated</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Delivery Note</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Buyer's Order No.</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Dispatch Doc No.</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Delivery Note Date</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Dispatched through</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px;">Destination</td>
                  <td style="padding: 3px; border-left: 1px solid #000;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border-top: 1px solid #000; padding: 5px;">
              <!-- Buyer Details -->
              <div style="font-size: 11px;">
                <div style="font-weight: bold; font-size: 12px;">Buyer (Bill to)</div>
                <div style="font-weight: bold;">${currentInvoice.customer.name}</div>
                <div>${currentInvoice.customer.address || 'N/A'}</div>
                <div>Phone: ${currentInvoice.customer.phone}</div>
                <div style="margin-top: 2px;">
                  <div><span style="font-weight: bold;">GSTIN/UIN : </span>${currentInvoice.customer.gstin || 'N/A'}</div>
                  <div><span style="font-weight: bold;">State Name : </span>Chhattisgarh, Code : 22</div>
                </div>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Items Table -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 0; font-size: 11px;">
          <tr style="background-color: #f0f0f0; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #000; padding: 3px; width: 5%;">S#</th>
            <th style="border: 1px solid #000; padding: 3px; width: 45%;">Description of Goods</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">HSN/SAC</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">GST Rate</th>
            <th style="border: 1px solid #000; padding: 3px; width: 5%;">Quantity</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">Rate</th>
            <th style="border: 1px solid #000; padding: 3px; width: 5%;">Per</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">Amount</th>
          </tr>
          
          ${currentInvoice.items.map((item, index) => {
            // Calculate the taxable value (base price without GST)
            const taxableValue = item.price / 1.18;
            return `
          <tr style="text-align: center; height: 55px;">
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">${index + 1}</td>
            <td style="text-align: left; border: 1px solid #000; padding: 8px 3px; vertical-align: top;">
              ${item.name}
              ${item.note ? `<div style="font-size: 9px; font-style: italic; color: #444;">${item.note}</div>` : ''}
              <div style="height: 35px;"></div>
            </td>
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">85017900</td>
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">18%</td>
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">${item.quantity} PCS</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px; vertical-align: top;">${taxableValue.toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">PCS</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px; vertical-align: top;">${(taxableValue * item.quantity).toFixed(2)}</td>
          </tr>
          `;
          }).join('')}
          
          <!-- Empty row for spacing -->
          <tr style="height: 60px;">
            <td colspan="8" style="border: 1px solid #000; padding: 3px;">&nbsp;</td>
          </tr>
          
          <tr style="height: 20px;">
            <td colspan="5" style="border: 1px solid #000; padding: 3px;">
              <div style="text-align: center;">
                <div style="font-weight: bold;">CGST</div>
                <div style="font-weight: bold;">SGST</div>
              </div>
            </td>
            <td colspan="2" style="text-align: center; border: 1px solid #000; padding: 3px;">
              <div>9%</div>
              <div>9%</div>
            </td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">
              <div>${(currentInvoice.taxAmount / 2).toFixed(2)}</div>
              <div>${(currentInvoice.taxAmount / 2).toFixed(2)}</div>
            </td>
          </tr>
          
          <tr>
            <td colspan="7" style="text-align: right; font-weight: bold; border: 1px solid #000; padding: 3px;">Total</td>
            <td style="text-align: right; font-weight: bold; border: 1px solid #000; padding: 3px;">${currentInvoice.grandTotal.toFixed(2)}</td>
          </tr>
        </table>
        
        <!-- Amount in words -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; font-size: 11px;">
          <tr>
            <td style="padding: 3px; border-bottom: 1px solid #000;">
              <span style="font-weight: bold;">Amount Chargeable (in words):</span> Indian Rupees ${convertNumberToWords(currentInvoice.grandTotal)} Only
            </td>
          </tr>
        </table>
        
        <!-- Tax Summary Table -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 0; font-size: 11px;">
          <tr style="background-color: #f0f0f0; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">HSN/SAC</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">Taxable Value</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">CGST Rate</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">CGST Amount</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">SGST Rate</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">SGST Amount</th>
            <th style="border: 1px solid #000; padding: 3px; width: 10%;">Total Tax Amount</th>
          </tr>
          <tr style="text-align: center;">
            <td style="border: 1px solid #000; padding: 3px;">85017900</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">${currentInvoice.subtotalWithoutGst.toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 3px;">9%</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">${(currentInvoice.taxAmount / 2).toFixed(2)}</td>
            <td style="border: 1px solid #000; padding: 3px;">9%</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">${(currentInvoice.taxAmount / 2).toFixed(2)}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">${currentInvoice.taxAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="2" style="font-weight: bold; text-align: left; border: 1px solid #000; padding: 3px;">Tax Amount (in words):</td>
            <td colspan="5" style="text-align: right; border: 1px solid #000; padding: 3px;">
              Indian Rupees ${convertNumberToWords(currentInvoice.taxAmount)} Only
            </td>
          </tr>
        </table>
        
        <!-- Bank Details and Signature -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 0; font-size: 11px;">
          <tr>
            <td width="60%" style="vertical-align: top; padding: 5px; border-right: 1px solid #000;">
              <div>
                <div style="font-weight: bold;">Company's Bank Details:</div>
                <div><strong>Bank Name:</strong> ${appSettings.bankDetails.name}</div>
                <div><strong>A/C No.:</strong> ${appSettings.bankDetails.accountNumber}</div>
                <div><strong>Branch:</strong> ${appSettings.bankDetails.branch}</div>
                <div><strong>IFSC Code:</strong> ${appSettings.bankDetails.ifscCode}</div>
              </div>
            </td>
            <td width="40%" style="vertical-align: bottom; text-align: right; padding: 5px;">
              <div style="margin-top: 30px;">
                <div style="border-top: 1px solid #000; padding-top: 3px; text-align: center; margin-top: 20px; margin-right: 10px;">
                  For INVOICE GENERATOR<br>
                  Authorized Signatory
                </div>
              </div>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 5px; text-align: center; font-size: 9px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px;">
          <div>SUBJECT TO RAJNANDGAON JURISDICTION</div>
          <div>This is a Computer Generated Invoice</div>
        </div>
      </div>
    `;
  } else {
    // Non-GST Invoice Format
    invoiceContent = `
      <div class="invoice-print" style="width: 100%; font-family: Arial, sans-serif; font-size: 12px; color: #000; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; font-size: 14px; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 0;">
          INVOICE
        </div>
        
        <!-- Header section with logo and details -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; margin: 0;">
          <tr>
            <td width="60%" style="vertical-align: top; border-right: 1px solid #000; padding: 5px;">
              <!-- Shop Details -->
              <div style="display: flex;">
                <div style="margin-right: 10px;">
                  <div style="font-size: 32px; line-height: 0.9; font-weight: bold; margin-bottom: 5px;">
                    <span style="color: #000;">V</span><span style="color: #FF0000;">M</span>
                  </div>
                </div>
                <div>
                  <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">INVOICE GENERATOR</div>
                  <div style="font-size: 10px;">SHOP NO. 20, Tirupati Complex,</div>
                  <div style="font-size: 10px;">WARD NO. 25, MANAV MANDIR CHOWK,</div>
                  <div style="font-size: 10px;">Rajnandgaon, Chhattisgarh</div>
                  <div style="font-size: 10px;">Phone: XXXX</div>
                </div>
              </div>
            </td>
            <td width="40%" style="vertical-align: top; padding: 0;">
              <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0; font-size: 11px;">
                <tr>
                  <td width="40%" style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Invoice No.</td>
                  <td width="60%" style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${currentInvoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Dated</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Delivery Note</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px; border-bottom: 1px solid #000;">Buyer's Order No.</td>
                  <td style="padding: 3px; border-bottom: 1px solid #000; border-left: 1px solid #000;"></td>
                </tr>
                <tr>
                  <td style="font-weight: bold; padding: 3px;">Dated</td>
                  <td style="padding: 3px; border-left: 1px solid #000;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="border-top: 1px solid #000; padding: 5px;">
              <!-- Buyer Details -->
              <div style="font-size: 11px;">
                <div style="font-weight: bold; font-size: 12px;">Buyer (Bill to)</div>
                <div style="font-weight: bold;">${currentInvoice.customer.name}</div>
                <div>${currentInvoice.customer.address || 'N/A'}</div>
                <div>Phone: ${currentInvoice.customer.phone}</div>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Items Table -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 0; font-size: 11px;">
          <tr style="background-color: #f0f0f0; text-align: center; font-weight: bold;">
            <th style="border: 1px solid #000; padding: 3px; width: 5%;">S#</th>
            <th style="border: 1px solid #000; padding: 3px; width: 50%;">Description of Goods</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">Quantity</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">Rate</th>
            <th style="border: 1px solid #000; padding: 3px; width: 15%;">Amount</th>
          </tr>
          
          ${currentInvoice.items.map((item, index) => `
          <tr style="text-align: center; height: 55px;">
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">${index + 1}</td>
            <td style="text-align: left; border: 1px solid #000; padding: 8px 3px; vertical-align: top;">
              ${item.name}
              ${item.note ? `<div style="font-size: 9px; font-style: italic; color: #444;">${item.note}</div>` : ''}
              <div style="height: 35px;"></div>
            </td>
            <td style="border: 1px solid #000; padding: 3px; vertical-align: top;">${item.quantity} PCS</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px; vertical-align: top;">${item.price.toFixed(2)}</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px; vertical-align: top;">${(item.price * item.quantity).toFixed(2)}</td>
          </tr>
          `).join('')}
          
          <!-- Empty row for spacing -->
          <tr style="height: 60px;">
            <td colspan="5" style="border: 1px solid #000; padding: 3px;">&nbsp;</td>
          </tr>
          
          ${currentInvoice.discount > 0 ? `
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold; border: 1px solid #000; padding: 3px;">Discount (${currentInvoice.discount}%)</td>
            <td style="text-align: right; border: 1px solid #000; padding: 3px;">${currentInvoice.discountAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          
          <tr>
            <td colspan="4" style="text-align: right; font-weight: bold; border: 1px solid #000; padding: 3px;">Total</td>
            <td style="text-align: right; font-weight: bold; border: 1px solid #000; padding: 3px;">₹ ${currentInvoice.grandTotal.toFixed(2)}</td>
          </tr>
        </table>
        
        <!-- Amount in words -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; font-size: 11px;">
          <tr>
            <td style="padding: 3px; border-bottom: 1px solid #000;">
              <span style="font-weight: bold;">Amount Chargeable (in words):</span> Indian Rupees ${convertNumberToWords(currentInvoice.grandTotal)} Only
            </td>
          </tr>
        </table>
        
        <!-- Bank Details and Signature -->
        <table width="100%" cellspacing="0" cellpadding="3" style="border-collapse: collapse; border: 1px solid #000; border-top: none; margin-top: 0; font-size: 11px;">
          <tr>
            <td width="60%" style="vertical-align: top; padding: 5px; border-right: 1px solid #000;">
              <div>
                <div style="font-weight: bold;">Bank Details:</div>
                <div><strong>Bank Name:</strong> ${appSettings.bankDetails.name}</div>
                <div><strong>A/C No.:</strong> ${appSettings.bankDetails.accountNumber}</div>
                <div><strong>Branch:</strong> ${appSettings.bankDetails.branch}</div>
                <div><strong>IFSC Code:</strong> ${appSettings.bankDetails.ifscCode}</div>
              </div>
            </td>
            <td width="40%" style="vertical-align: bottom; text-align: right; padding: 5px;">
              <div style="margin-top: 30px;">
                <div style="border-top: 1px solid #000; padding-top: 3px; text-align: center; margin-top: 20px; margin-right: 10px;">
                  For INVOICE GENERATOR<br>
                  Authorized Signatory
                </div>
              </div>
            </td>
          </tr>
        </table>
        
        <div style="margin-top: 5px; text-align: center; font-size: 9px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px;">
          <div>SUBJECT TO RAJNANDGAON JURISDICTION</div>
          <div>This is a Computer Generated Invoice</div>
        </div>
      </div>
    `;
  }
  
  // Update the invoice preview
  const invoicePrint = document.getElementById('invoicePrint');
  if (invoicePrint) {
    invoicePrint.innerHTML = invoiceContent;
  }
  
  // Create a modal to display the invoice
  const existingModal = document.getElementById('invoiceDisplayModal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  const invoiceModal = document.createElement('div');
  invoiceModal.id = 'invoiceDisplayModal';
  invoiceModal.className = 'modal';
  invoiceModal.style.display = 'block';
  invoiceModal.innerHTML = `
    <div class="modal-content" style="width: 90%; max-width: 900px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
      <div class="modal-header" style="background-color: #f8f9fa; border-bottom: 2px solid #4CAF50; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
        <h2 style="margin: 0; color: #333; font-size: 20px;">Invoice Preview</h2>
        <span class="close-modal" id="closeInvoiceModal" style="font-size: 24px; cursor: pointer; color: #555;">&times;</span>
      </div>
      <div class="modal-body" style="max-height: 75vh; overflow-y: auto; background-color: white; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px; box-shadow: inset 0 0 5px rgba(0,0,0,0.05);">
        ${invoiceContent}
      </div>
      <div class="modal-footer" style="padding-top: 15px; text-align: right; display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;">
        <button id="downloadInvoiceBtn" class="btn btn-success" style="background-color: #4CAF50; color: white; padding: 8px 16px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold;">Download PDF</button>
        <button id="closePreviewBtn" class="btn" style="background-color: #f1f1f1; color: #333; padding: 8px 16px; border-radius: 4px; border: 1px solid #ddd; cursor: pointer;">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(invoiceModal);
  
  // Add event listeners to the new modal buttons
  document.getElementById('closeInvoiceModal').addEventListener('click', () => {
    document.getElementById('invoiceDisplayModal').style.display = 'none';
  });
  
  document.getElementById('closePreviewBtn').addEventListener('click', () => {
    document.getElementById('invoiceDisplayModal').style.display = 'none';
  });
  
  document.getElementById('downloadInvoiceBtn').addEventListener('click', () => {
    saveInvoiceToFile();
  });
  
  return invoiceContent;
}

// Save invoice to PDF file
function saveInvoiceToFile() {
  // Check if invoice has items
  if (currentInvoice.items.length === 0) {
    alert('Please add at least one item to the invoice');
    return;
  }
  
  // Get the invoice content
  generateInvoice();
  
  // Get the element to print
  const element = document.getElementById('invoicePrint');
  
  // Create filename
  const filename = `${currentInvoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  
  // Configure pdf options
  const opt = {
    margin: [10, 10, 10, 10],
    filename: filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  // Generate PDF
  html2pdf().set(opt).from(element).save().then(() => {
    console.log('PDF saved successfully');
    alert(`Invoice saved as PDF. Download started.`);
  }).catch(err => {
    console.error('Error saving PDF:', err);
    alert('Error saving PDF. Please try again.');
  });
}

// Convert number to words for invoice total
function convertNumberToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  // Round to 2 decimal places and separate whole and decimal parts
  const roundedAmount = Math.round(amount * 100) / 100;
  const wholeAmount = Math.floor(roundedAmount);
  const decimal = Math.round((roundedAmount - wholeAmount) * 100);
  
  // Function to convert a number less than 1000
  function convertLessThanOneThousand(num) {
    if (num === 0) return '';
    
    if (num < 20) {
      return ones[num];
    }
    
    if (num < 100) {
      return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    }
    
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convertLessThanOneThousand(num % 100) : '');
  }
  
  // Start conversion
  let result = '';
  
  if (wholeAmount === 0) {
    result = 'Zero';
  } else {
    // Crore
    const crore = Math.floor(wholeAmount / 10000000);
    if (crore > 0) {
      result += convertLessThanOneThousand(crore) + ' Crore ';
    }
    
    // Lakh
    const lakh = Math.floor((wholeAmount % 10000000) / 100000);
    if (lakh > 0) {
      result += convertLessThanOneThousand(lakh) + ' Lakh ';
    }
    
    // Thousand
    const thousand = Math.floor((wholeAmount % 100000) / 1000);
    if (thousand > 0) {
      result += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    
    // Hundred and remaining
    const remaining = wholeAmount % 1000;
    if (remaining > 0) {
      result += convertLessThanOneThousand(remaining);
    }
  }
  
  // Add decimal part if exists
  if (decimal > 0) {
    result += ' And ' + convertLessThanOneThousand(decimal) + ' Paise';
  }
  
  return result;
}

// Save invoice to file
function saveInvoiceToFile() {
  // Check if invoice has items
  if (currentInvoice.items.length === 0) {
    alert('Please add at least one item to the invoice');
    return;
  }
  
  // Get the invoice content
  generateInvoice();
  
  // Get the element to print
  const element = document.getElementById('invoicePrint');
  
  // Create filename
  const filename = `${currentInvoice.invoiceNumber.replace(/\//g, '-')}.pdf`;
  
  // Configure pdf options
  const opt = {
    margin: [5, 5, 5, 5],
    filename: filename,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  // Generate PDF
  html2pdf().set(opt).from(element).save().then(() => {
    console.log('PDF saved successfully');
    alert(`Invoice saved as PDF. Download started.`);
  }).catch(err => {
    console.error('Error saving PDF:', err);
    alert('Error saving PDF. Please try again.');
  });
}

// Save invoice to IndexedDB
function saveInvoiceToDb(invoice) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    // Check if the invoice store exists
    if (!db.objectStoreNames.contains(INVOICE_STORE)) {
      console.error('Invoice store not found. Attempting to recreate database...');
      // Close the current database
      db.close();
      db = null;
      
      // Initialize database again with a higher version
      initDatabase()
        .then(() => {
          // Try saving again after reinitializing
          saveInvoiceToDb(invoice)
            .then(resolve)
            .catch(reject);
        })
        .catch(error => {
          console.error('Failed to reinitialize database:', error);
          reject(new Error('Failed to create invoice store. Please refresh the page and try again.'));
        });
      return;
    }
    
    try {
      const transaction = db.transaction([INVOICE_STORE], 'readwrite');
      const store = transaction.objectStore(INVOICE_STORE);
      
      const request = store.put(invoice);
      
      request.onsuccess = () => {
        console.log(`Invoice ${invoice.invoiceNumber} saved successfully`);
        resolve();
      };
      
      request.onerror = (event) => {
        console.error('Error saving invoice:', event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
}

// Get all invoices from IndexedDB
function getAllInvoices() {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([INVOICE_STORE], 'readonly');
    const store = transaction.objectStore(INVOICE_STORE);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Get a specific invoice by its number
function getInvoiceByNumber(invoiceNumber) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([INVOICE_STORE], 'readonly');
    const store = transaction.objectStore(INVOICE_STORE);
    const request = store.get(invoiceNumber);
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Delete an invoice by its number
function deleteInvoice(invoiceNumber) {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    const transaction = db.transaction([INVOICE_STORE], 'readwrite');
    const store = transaction.objectStore(INVOICE_STORE);
    const request = store.delete(invoiceNumber);
    
    request.onsuccess = () => {
      console.log(`Invoice ${invoiceNumber} deleted successfully`);
      resolve();
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Update product quantity in the database
function updateProductQuantity(productId, quantityChange) {
  return new Promise(async (resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    try {
      // Skip updating for manual items (they don't exist in the database)
      if (typeof productId === 'string' && productId.startsWith('manual-')) {
        resolve();
        return;
      }
      
      // Get the product first
      const product = await getProductById(productId);
      
      if (!product) {
        reject(new Error(`Product with ID ${productId} not found`));
        return;
      }
      
      // Calculate new quantity
      const newQuantity = Math.max(0, product.pieces - quantityChange);
      
      // Update the product
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      product.pieces = newQuantity;
      const request = store.put(product);
      
      request.onsuccess = () => {
        console.log(`Updated quantity for ${product.name}: ${product.pieces}`);
        resolve();
      };
      
      request.onerror = (event) => {
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initDatabase();
    initApp();
  } catch (error) {
    console.error('Error initializing app:', error);
    alert('Failed to initialize the app. Please refresh the page and try again.');
  }
}); 

// Add event listeners for remove item buttons
function addRemoveItemListeners() {
  document.querySelectorAll('.remove-item').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      currentInvoice.items.splice(index, 1);
      renderInvoiceItems();
      updateInvoiceSummary();
    });
  });
}

// Event listeners for edit note buttons
function addEditNoteListeners() {
  // Get the modal elements once
  const noteEditModal = document.getElementById('noteEditModal');
  const editNoteText = document.getElementById('editNoteText');
  const saveNoteBtn = document.getElementById('saveNoteBtn');
  const cancelNoteBtn = document.getElementById('cancelNoteBtn');
  const closeNoteModal = document.getElementById('closeNoteModal');
  
  // Define close modal function
  const closeModal = function() {
    if (noteEditModal) {
      noteEditModal.style.display = 'none';
    }
  };
  
  // Set up event handlers for the modal
  if (closeNoteModal) {
    closeNoteModal.onclick = closeModal;
  }
  
  if (cancelNoteBtn) {
    cancelNoteBtn.onclick = closeModal;
  }
  
  // Save button event handler
  if (saveNoteBtn) {
    // Remove any existing event listeners
    saveNoteBtn.onclick = null;
    
    // Add new event listener
    saveNoteBtn.onclick = function() {
      const editingIndex = window.currentEditingIndex;
      
      if (editingIndex !== undefined && editingIndex >= 0 && 
          editingIndex < currentInvoice.items.length && editNoteText) {
        // Update the note
        currentInvoice.items[editingIndex].note = editNoteText.value;
        
        // Update the display
        renderInvoiceItems();
        
        // Close the modal
        closeModal();
        
        console.log('Note saved for item at index:', editingIndex);
      } else {
        console.error('Invalid editing index:', editingIndex);
      }
    };
  }
  
  // Add click listeners to edit note buttons
  document.querySelectorAll('.edit-note').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      
      // Skip if index is invalid
      if (isNaN(index) || index < 0 || index >= currentInvoice.items.length) {
        console.error('Invalid item index for note editing:', index);
        return;
      }
      
      // Get the item
      const item = currentInvoice.items[index];
      
      if (!noteEditModal || !editNoteText) {
        console.error('Note edit modal elements not found');
        return;
      }
      
      // Set current editing index
      window.currentEditingIndex = index;
      
      // Set textarea value
      editNoteText.value = item.note || '';
      
      // Show the modal
      noteEditModal.style.display = 'block';
    });
  });
}

// Debug function to check GST records status (available in the app.js file)
function debugGstRecordsApp() {
  try {
    console.log("Debugging GST Records in app.js...");
    
    if (!db) {
      console.error("Database not initialized");
      alert("Database not initialized. Please refresh the page and try again.");
      return;
    }
    
    // First, check if the GST_RECORDS_STORE exists in the database
    const storeNames = Array.from(db.objectStoreNames);
    console.log("Available stores in database:", storeNames);
    
    // Check if the GST_RECORDS_STORE exists
    const hasGstStore = storeNames.includes(GST_RECORDS_STORE);
    console.log(`GST_RECORDS_STORE exists: ${hasGstStore}`);
    
    if (!hasGstStore) {
      alert("GST Records store does not exist in the database. Try creating a GST invoice first.");
      return;
    }
    
    // Get all GST records
    const transaction = db.transaction([GST_RECORDS_STORE], 'readonly');
    const store = transaction.objectStore(GST_RECORDS_STORE);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const records = event.target.result || [];
      console.log(`Found ${records.length} GST records:`, records);
      
      // Count unique invoice numbers
      const uniqueInvoices = new Set();
      records.forEach(record => {
        uniqueInvoices.add(record.invoiceNumber);
      });
      
      console.log(`Unique invoice numbers: ${uniqueInvoices.size}`);
      console.log("Invoice numbers:", Array.from(uniqueInvoices));
      
      if (records.length === 0) {
        alert("No GST records found in the database. Try creating a GST invoice first.");
      } else {
        alert(`Found ${records.length} GST records for ${uniqueInvoices.size} invoices. Check console for details.`);
      }
    };
    
    request.onerror = (event) => {
      console.error("Error retrieving GST records:", event.target.error);
      alert(`Error retrieving GST records: ${event.target.error.message}`);
    };
    
  } catch (error) {
    console.error("Debug error:", error);
    alert(`Debug error: ${error.message}`);
  }
}

// Add debug button event listener
function setupDebugButton() {
  // Add a small debug button in the corner
  const debugButton = document.createElement('button');
  debugButton.textContent = 'Debug GST';
  debugButton.style.position = 'fixed';
  debugButton.style.bottom = '10px';
  debugButton.style.right = '10px';
  debugButton.style.padding = '5px 10px';
  debugButton.style.fontSize = '12px';
  debugButton.style.backgroundColor = '#555';
  debugButton.style.color = 'white';
  debugButton.style.border = 'none';
  debugButton.style.borderRadius = '4px';
  debugButton.style.cursor = 'pointer';
  debugButton.style.zIndex = '9999';
  debugButton.onclick = debugGstRecordsApp;
  
  document.body.appendChild(debugButton);
}

// Function to signal product manager to refresh GST data
function signalGstDataRefresh() {
  try {
    // Store a timestamp in localStorage to signal that GST data has changed
    const timestamp = new Date().toISOString();
    localStorage.setItem('gstDataUpdated', timestamp);
    console.log(`Set gstDataUpdated flag in localStorage: ${timestamp}`);
  } catch (error) {
    console.error('Error setting GST data refresh signal:', error);
  }
}