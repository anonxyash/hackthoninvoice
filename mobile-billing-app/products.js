// Mobile Shop Product Catalog
const products = [
  // Phones
  { 
    id: 1, 
    name: 'iPhone 14 Pro', 
    category: 'Phone', 
    price: 999, 
    stock: 10,
    brand: 'Apple',
    specs: {
      display: '6.1-inch Super Retina XDR',
      processor: 'A16 Bionic',
      camera: '48MP + 12MP + 12MP',
      storage: '128GB',
      color: 'Deep Purple'
    }
  },
  { 
    id: 2, 
    name: 'Samsung Galaxy S23', 
    category: 'Phone', 
    price: 899, 
    stock: 15,
    brand: 'Samsung',
    specs: {
      display: '6.1-inch Dynamic AMOLED 2X',
      processor: 'Snapdragon 8 Gen 2',
      camera: '50MP + 12MP + 10MP',
      storage: '256GB',
      color: 'Phantom Black'
    }
  },
  { 
    id: 3, 
    name: 'Google Pixel 7', 
    category: 'Phone', 
    price: 799, 
    stock: 8,
    brand: 'Google',
    specs: {
      display: '6.3-inch OLED',
      processor: 'Google Tensor G2',
      camera: '50MP + 12MP',
      storage: '128GB',
      color: 'Snow'
    }
  },
  { 
    id: 4, 
    name: 'OnePlus 11', 
    category: 'Phone', 
    price: 849, 
    stock: 12,
    brand: 'OnePlus',
    specs: {
      display: '6.7-inch AMOLED',
      processor: 'Snapdragon 8 Gen 2',
      camera: '50MP + 48MP + 32MP',
      storage: '256GB',
      color: 'Eternal Green'
    }
  },
  { 
    id: 5, 
    name: 'Xiaomi 13 Pro', 
    category: 'Phone', 
    price: 799, 
    stock: 10,
    brand: 'Xiaomi',
    specs: {
      display: '6.73-inch AMOLED',
      processor: 'Snapdragon 8 Gen 2',
      camera: '50MP + 50MP + 50MP',
      storage: '256GB',
      color: 'Ceramic White'
    }
  },
  { 
    id: 6, 
    name: 'Nothing Phone (1)', 
    category: 'Phone', 
    price: 499, 
    stock: 15,
    brand: 'Nothing',
    specs: {
      display: '6.55-inch OLED',
      processor: 'Snapdragon 778G+',
      camera: '50MP + 50MP',
      storage: '128GB',
      color: 'Black'
    }
  },
  
  // Tablets
  { 
    id: 7, 
    name: 'iPad Pro 12.9"', 
    category: 'Tablet', 
    price: 1099, 
    stock: 7,
    brand: 'Apple',
    specs: {
      display: '12.9-inch Liquid Retina XDR',
      processor: 'M2 chip',
      camera: '12MP + 10MP',
      storage: '256GB',
      color: 'Space Gray'
    }
  },
  { 
    id: 8, 
    name: 'Samsung Galaxy Tab S8', 
    category: 'Tablet', 
    price: 699, 
    stock: 9,
    brand: 'Samsung',
    specs: {
      display: '11-inch TFT LCD',
      processor: 'Snapdragon 8 Gen 1',
      camera: '13MP + 6MP',
      storage: '128GB',
      color: 'Graphite'
    }
  },
  { 
    id: 9, 
    name: 'Lenovo Tab P12 Pro', 
    category: 'Tablet', 
    price: 699, 
    stock: 5,
    brand: 'Lenovo',
    specs: {
      display: '12.6-inch AMOLED',
      processor: 'Snapdragon 870',
      camera: '13MP + 5MP',
      storage: '256GB',
      color: 'Storm Grey'
    }
  },
  
  // Accessories
  { 
    id: 10, 
    name: 'AirPods Pro', 
    category: 'Accessories', 
    price: 249, 
    stock: 20,
    brand: 'Apple',
    specs: {
      type: 'Wireless Earbuds',
      features: 'Active Noise Cancellation, Spatial Audio',
      batteryLife: 'Up to 6 hours',
      color: 'White'
    }
  },
  { 
    id: 11, 
    name: 'Samsung Galaxy Watch 5', 
    category: 'Accessories', 
    price: 279, 
    stock: 12,
    brand: 'Samsung',
    specs: {
      display: '1.4-inch Super AMOLED',
      batteryLife: 'Up to 50 hours',
      sensors: 'Heart rate, ECG, Body composition',
      color: 'Silver'
    }
  },
  { 
    id: 12, 
    name: 'Phone Case (iPhone)', 
    category: 'Accessories', 
    price: 29, 
    stock: 50,
    brand: 'Spigen',
    specs: {
      material: 'TPU + Polycarbonate',
      compatibleWith: 'iPhone 14 Pro',
      features: 'Drop protection, wireless charging compatible',
      color: 'Matte Black'
    }
  },
  { 
    id: 13, 
    name: 'Phone Case (Samsung)', 
    category: 'Accessories', 
    price: 29, 
    stock: 45,
    brand: 'Otterbox',
    specs: {
      material: 'Synthetic rubber + Polycarbonate',
      compatibleWith: 'Samsung Galaxy S23',
      features: 'Military-grade drop protection',
      color: 'Blue'
    }
  },
  { 
    id: 14, 
    name: 'Screen Protector', 
    category: 'Accessories', 
    price: 19, 
    stock: 100,
    brand: 'Belkin',
    specs: {
      material: 'Tempered Glass',
      thickness: '0.3mm',
      features: 'Anti-fingerprint, 9H hardness',
      compatibleWith: 'Multiple phones'
    }
  },
  { 
    id: 15, 
    name: 'Wireless Charger', 
    category: 'Accessories', 
    price: 49, 
    stock: 30,
    brand: 'Anker',
    specs: {
      power: '15W',
      compatibility: 'Qi-enabled devices',
      features: 'LED indicator, foreign object detection',
      color: 'Black'
    }
  },
  { 
    id: 16, 
    name: 'Power Bank 10000mAh', 
    category: 'Accessories', 
    price: 59, 
    stock: 25,
    brand: 'RavPower',
    specs: {
      capacity: '10000mAh',
      ports: 'USB-C, USB-A',
      features: 'Fast charging, LED power indicator',
      color: 'White'
    }
  },
  { 
    id: 17, 
    name: 'Bluetooth Speaker', 
    category: 'Accessories', 
    price: 79, 
    stock: 18,
    brand: 'JBL',
    specs: {
      power: '20W',
      batteryLife: 'Up to 12 hours',
      features: 'Waterproof, Bluetooth 5.1',
      color: 'Red'
    }
  },
  { 
    id: 18, 
    name: 'USB-C Cable Pack', 
    category: 'Accessories', 
    price: 19, 
    stock: 60,
    brand: 'Amazon Basics',
    specs: {
      length: '3ft, 6ft, 10ft',
      durability: 'Braided nylon',
      features: 'Fast charging support',
      quantity: '3-pack'
    }
  }
];

// Export products for use in main app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { products };
} else {
  // For browser
  window.shopProducts = products;
} 