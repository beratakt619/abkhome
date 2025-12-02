import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CartProvider } from "@/contexts/CartContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

import Layout from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Orders from "@/pages/Orders";
import Favorites from "@/pages/Favorites";
import Support from "@/pages/Support";
import Checkout from "@/pages/Checkout";
import LegalPage from "@/pages/LegalPage";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminInvoices from "@/pages/admin/AdminInvoices";
import AdminSupport from "@/pages/admin/AdminSupport";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminHeroBanners from "@/pages/admin/AdminHeroBanners";
import AdminTrendyol from "@/pages/admin/AdminTrendyol";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <TooltipProvider>
                <Toaster />
                <Switch>
                  {/* Admin Routes - Direct paths */}
                  <Route path="/admin">
                    {() => (
                      <AdminLayout>
                        <AdminDashboard />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/urunler">
                    {() => (
                      <AdminLayout>
                        <AdminProducts />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/kategoriler">
                    {() => (
                      <AdminLayout>
                        <AdminCategories />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/bannerler">
                    {() => (
                      <AdminLayout>
                        <AdminHeroBanners />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/trendyol">
                    {() => (
                      <AdminLayout>
                        <AdminTrendyol />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/siparisler">
                    {() => (
                      <AdminLayout>
                        <AdminOrders />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/musteriler">
                    {() => (
                      <AdminLayout>
                        <AdminCustomers />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/faturalar">
                    {() => (
                      <AdminLayout>
                        <AdminInvoices />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/destek/:id">
                    {() => (
                      <AdminLayout>
                        <AdminSupport />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/destek">
                    {() => (
                      <AdminLayout>
                        <AdminSupport />
                      </AdminLayout>
                    )}
                  </Route>
                  <Route path="/admin/ayarlar">
                    {() => (
                      <AdminLayout>
                        <AdminSettings />
                      </AdminLayout>
                    )}
                  </Route>

                  {/* Main Routes */}
                  <Route path="/">
                    {() => (
                      <Layout>
                        <Home />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/urunler">
                    {() => (
                      <Layout>
                        <Products />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/urun/:sku">
                    {() => (
                      <Layout>
                        <ProductDetail />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/giris">
                    {() => (
                      <Layout>
                        <Login />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/kayit">
                    {() => (
                      <Layout>
                        <Register />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/hesabim">
                    {() => (
                      <Layout>
                        <Account />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/siparislerim">
                    {() => (
                      <Layout>
                        <Orders />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/favorilerim">
                    {() => (
                      <Layout>
                        <Favorites />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/destek">
                    {() => (
                      <Layout>
                        <Support />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/odeme">
                    {() => (
                      <Layout>
                        <Checkout />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/gizlilik-politikasi">
                    {() => (
                      <Layout>
                        <LegalPage />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/kullanim-kosullari">
                    {() => (
                      <Layout>
                        <LegalPage />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/kvkk">
                    {() => (
                      <Layout>
                        <LegalPage />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/iade-politikasi">
                    {() => (
                      <Layout>
                        <LegalPage />
                      </Layout>
                    )}
                  </Route>
                  <Route path="/kargo-politikasi">
                    {() => (
                      <Layout>
                        <LegalPage />
                      </Layout>
                    )}
                  </Route>

                  {/* Fallback 404 */}
                  <Route>
                    {() => (
                      <Layout>
                        <NotFound />
                      </Layout>
                    )}
                  </Route>
                </Switch>
              </TooltipProvider>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
