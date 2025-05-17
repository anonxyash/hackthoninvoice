// Storage utilities for Mobile Shop Billing App

// Storage keys
const STORAGE_KEYS = {
  INVOICES: 'mobile_shop_invoices',
  SETTINGS: 'mobile_shop_settings'
};

// Save invoice to local storage
function saveInvoice(invoice) {
  return new Promise((resolve, reject) => {
    try {
      // Get existing invoices
      const existingInvoices = getInvoices();
      
      // Add new invoice
      existingInvoices.push({
        ...invoice,
        savedAt: new Date().toISOString()
      });
      
      // Save back to storage
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(existingInvoices));
      
      resolve(true);
    } catch (error) {
      console.error('Error saving invoice:', error);
      reject(error);
    }
  });
}

// Get all invoices from local storage
function getInvoices() {
  try {
    const invoices = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return invoices ? JSON.parse(invoices) : [];
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    return [];
  }
}

// Get specific invoice by invoice number
function getInvoiceByNumber(invoiceNumber) {
  try {
    const invoices = getInvoices();
    return invoices.find(inv => inv.invoiceNumber === invoiceNumber) || null;
  } catch (error) {
    console.error('Error retrieving invoice:', error);
    return null;
  }
}

// Delete invoice by invoice number
function deleteInvoice(invoiceNumber) {
  return new Promise((resolve, reject) => {
    try {
      // Get existing invoices
      let existingInvoices = getInvoices();
      
      // Filter out the invoice to delete
      existingInvoices = existingInvoices.filter(inv => inv.invoiceNumber !== invoiceNumber);
      
      // Save back to storage
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(existingInvoices));
      
      resolve(true);
    } catch (error) {
      console.error('Error deleting invoice:', error);
      reject(error);
    }
  });
}

// Save app settings
function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

// Get app settings
function getSettings() {
  try {
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return settings ? JSON.parse(settings) : getDefaultSettings();
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return getDefaultSettings();
  }
}

// Default app settings
function getDefaultSettings() {
  return {
    shopName: 'MobileShop',
    shopAddress: '123 Tech Street, Mobile City',
    shopPhone: '(123) 456-7890',
    shopEmail: 'support@mobileshop.com',
    taxRate: 0.18,
    currencySymbol: '₹',
    theme: 'dark'
  };
}

// Export storage utilities
window.invoiceStorage = {
  saveInvoice,
  getInvoices,
  getInvoiceByNumber,
  deleteInvoice,
  saveSettings,
  getSettings
}; 