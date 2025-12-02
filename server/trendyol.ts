import axios from "axios";

const API_BASE_URL = "https://apigw.trendyol.com/sapigw";
const apiKey = process.env.TRENDYOL_API_KEY || "";
const apiSecret = process.env.TRENDYOL_API_SECRET || "";
const supplierId = process.env.TRENDYOL_SUPPLIER_ID || "";

let isInitialized = false;

function getAuthHeader() {
  const token = Buffer.from(`${apiKey}:${apiSecret}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

export function initTrendyol() {
  if (!apiKey || !apiSecret || !supplierId) {
    console.log("Trendyol API credentials not configured");
    return false;
  }

  isInitialized = true;
  console.log("Trendyol API initialized successfully");
  return true;
}

export function getTrendyolClient() {
  return isInitialized;
}

export async function getTrendyolProducts(options: {
  page?: number;
  size?: number;
  approved?: boolean;
  barcode?: string;
  onSale?: boolean;
} = {}) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    let url = `${API_BASE_URL}/suppliers/${supplierId}/products?page=${options.page || 0}&size=${options.size || 50}`;
    
    if (options.approved !== undefined) {
      url += `&approved=${options.approved}`;
    }
    if (options.barcode) {
      url += `&barcode=${options.barcode}`;
    }
    if (options.onSale !== undefined) {
      url += `&onSale=${options.onSale}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Cache-Control": "max-age=0"
      },
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status < 500, // Don't throw on 4xx errors
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching Trendyol products:", error.response?.data || error.message);
    
    // Provide specific error messages for common issues
    if (error.response?.status === 556) {
      throw new Error("IP adresi Trendyol tarafından whitelist'e eklenmemiş. Lütfen Trendyol ile iletişime geçin.");
    } else if (error.response?.status === 401) {
      throw new Error("API anahtarları geçersiz. Lütfen API Key ve Secret kontrol edin.");
    } else if (error.response?.status === 403) {
      throw new Error("API erişim yetkisi yok. Lütfen hesap durumunuzu kontrol edin.");
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error("Trendyol API sunucusuna ulaşılamadı. İnternet bağlantınızı kontrol edin.");
    }
    
    throw error;
  }
}

export async function getProductByBarcode(barcode: string) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/suppliers/${supplierId}/products?barcode=${barcode}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching product by barcode:", error.response?.data || error.message);
    throw error;
  }
}

export async function createTrendyolProduct(productData: {
  barcode: string;
  title: string;
  productMainId: string;
  brandId: number;
  categoryId: number;
  quantity: number;
  stockCode: string;
  dimensionalWeight: number;
  description: string;
  currencyType: string;
  listPrice: number;
  salePrice: number;
  vatRate: number;
  cargoCompanyId: number;
  images: { url: string }[];
  attributes: { attributeId: number; attributeValueId?: number; customAttributeValue?: string }[];
}) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/suppliers/${supplierId}/v2/products`;
    
    const response = await axios.post(
      url,
      { items: [productData] },
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error creating Trendyol product:", error.response?.data || error.message);
    throw error;
  }
}

export async function updateTrendyolStock(items: {
  barcode: string;
  quantity: number;
  salePrice?: number;
  listPrice?: number;
}[]) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/suppliers/${supplierId}/products/price-and-inventory`;
    
    const response = await axios.post(
      url,
      { items },
      {
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error updating Trendyol stock:", error.response?.data || error.message);
    throw error;
  }
}

export async function getTrendyolOrders(options: {
  page?: number;
  size?: number;
  status?: string;
  startDate?: number;
  endDate?: number;
} = {}) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    let url = `${API_BASE_URL}/suppliers/${supplierId}/orders?page=${options.page || 0}&size=${options.size || 50}`;
    
    if (options.status) {
      url += `&status=${options.status}`;
    }
    if (options.startDate) {
      url += `&startDate=${options.startDate}`;
    }
    if (options.endDate) {
      url += `&endDate=${options.endDate}`;
    }

    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching Trendyol orders:", error.response?.data || error.message);
    throw error;
  }
}

export async function getTrendyolCategories() {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/product-categories`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching Trendyol categories:", error.response?.data || error.message);
    throw error;
  }
}

export async function getTrendyolBrands(page: number = 0, size: number = 500) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/brands?page=${page}&size=${size}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching Trendyol brands:", error.response?.data || error.message);
    throw error;
  }
}

export async function getCategoryAttributes(categoryId: number) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/product-categories/${categoryId}/attributes`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching category attributes:", error.response?.data || error.message);
    throw error;
  }
}

export async function getCargoCompanies() {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/shipment-providers`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching cargo companies:", error.response?.data || error.message);
    throw error;
  }
}

export async function getBatchRequestResult(batchRequestId: string) {
  if (!isInitialized) {
    throw new Error("Trendyol API not initialized");
  }

  try {
    const url = `${API_BASE_URL}/suppliers/${supplierId}/products/batch-requests/${batchRequestId}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error("Error fetching batch request result:", error.response?.data || error.message);
    throw error;
  }
}
